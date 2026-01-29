<script setup lang="ts">
import FormRow from '@/components/FormRow.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  layout: 'default',
});

// Documentation content sections
const overviewContent = `
The Multiforum plugin system allows server administrators to extend platform functionality through installable plugins. Plugins can process file uploads, scan for security threats, auto-label content, and more.

### Plugin Lifecycle

1. **Registry** - Plugins are published to a registry (HTTP URL or GCS bucket)
2. **Allow** - Server admin allows a plugin for use on their server
3. **Install** - A specific version is installed
4. **Configure** - Secrets and settings are configured
5. **Enable** - Plugin is activated and runs in pipelines
6. **Execute** - Plugin runs when triggered by events
`;

const registryContent = `
### Setting Up a Plugin Registry

A plugin registry is a JSON file hosted at an HTTP URL or Google Cloud Storage bucket. Configure your registry URL in the "Registries" tab of the plugins area.

**Example registry URLs:**
- \`https://example.com/plugins/registry.json\`
- \`gs://my-bucket/plugins/registry.json\`

### Registry JSON Format

\`\`\`json
{
  "updatedAt": "2024-01-15T10:30:00Z",
  "plugins": [
    {
      "id": "security-attachment-scan",
      "name": "Security Attachment Scan",
      "displayName": "Security Scanner",
      "description": "Scans uploaded files for malware using VirusTotal",
      "authorName": "Your Organization",
      "authorUrl": "https://example.com",
      "homepage": "https://github.com/example/security-scan",
      "license": "MIT",
      "tags": ["security", "scanning", "malware"],
      "versions": [
        {
          "version": "1.0.0",
          "tarballUrl": "https://example.com/plugins/security-scan-1.0.0.tar.gz",
          "integritySha256": "abc123..."
        },
        {
          "version": "1.1.0",
          "tarballUrl": "https://example.com/plugins/security-scan-1.1.0.tar.gz",
          "integritySha256": "def456..."
        }
      ]
    }
  ]
}
\`\`\`

### Registry Fields

| Field | Required | Description |
|-------|----------|-------------|
| \`updatedAt\` | Yes | ISO 8601 timestamp of last registry update |
| \`plugins\` | Yes | Array of plugin definitions |
| \`plugins[].id\` | Yes | Unique plugin identifier (used in pipelines) |
| \`plugins[].name\` | Yes | Plugin name |
| \`plugins[].versions\` | Yes | Array of available versions |
| \`versions[].version\` | Yes | Semantic version string |
| \`versions[].tarballUrl\` | Yes | URL to download plugin tarball |
| \`versions[].integritySha256\` | Yes | SHA256 hash for integrity verification |
`;

const pluginStructureContent = `
### Plugin Tarball Structure

Plugins are distributed as \`.tar.gz\` archives with the following structure:

\`\`\`
my-plugin/
├── plugin.json        # Plugin manifest (required)
├── dist/
│   └── index.js       # Compiled JavaScript entry point
├── src/
│   └── index.ts       # TypeScript source (optional)
├── README.md          # Documentation (optional, displayed in UI)
└── package.json       # Node.js package file
\`\`\`

### Plugin Manifest (plugin.json)

\`\`\`json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Plugin",
  "description": "Does something useful",
  "author": {
    "name": "Your Name",
    "url": "https://example.com"
  },
  "homepage": "https://github.com/example/my-plugin",
  "license": "MIT",
  "main": "dist/index.js",
  "secrets": ["API_KEY"],
  "ui": {
    "forms": {
      "server": [
        {
          "title": "Configuration",
          "fields": [
            {
              "key": "timeout",
              "type": "number",
              "label": "Timeout (ms)",
              "default": 30000,
              "validation": { "min": 1000, "max": 120000 }
            }
          ]
        }
      ]
    }
  }
}
\`\`\`

### Plugin Entry Point

The plugin's main JavaScript file must export a default async function:

\`\`\`javascript
export default async function(context) {
  const { type, payload, secrets, settings } = context;

  // type: Event type (e.g., "downloadableFile.created")
  // payload: Event data (file info, channel info, etc.)
  // secrets: Configured secrets (e.g., API keys)
  // settings: User-configured settings

  // Do your processing here...

  return {
    success: true,
    message: "Processing complete",
    // Additional output fields as needed
  };
}
\`\`\`
`;

const pipelinesContent = `
### Server vs Channel Pipelines

The plugin system supports two scopes of pipeline configuration:

| Scope | Configured By | Triggered By | Use Case |
|-------|--------------|--------------|----------|
| **Server** | Server Admin | File events (\`downloadableFile.*\`) | Security scanning, virus detection |
| **Channel** | Channel Admin | Channel events (\`discussionChannel.created\`) | Auto-labeling for channel filters |

### Pipeline Execution Order

1. **Server pipelines run first** - When a file is uploaded
2. **Channel pipelines run after** - When content is submitted to a channel

This ensures security scanning happens before content is made available.

### Pipeline YAML Configuration

\`\`\`yaml
pipelines:
  - event: downloadableFile.created
    stopOnFirstFailure: false
    steps:
      - plugin: security-attachment-scan
        condition: ALWAYS
        continueOnError: false
      - plugin: auto-labeler
        condition: PREVIOUS_SUCCEEDED
        continueOnError: true
\`\`\`

### Step Conditions

| Condition | Description |
|-----------|-------------|
| \`ALWAYS\` | Always run this step |
| \`PREVIOUS_SUCCEEDED\` | Only run if the previous step succeeded |
| \`PREVIOUS_FAILED\` | Only run if the previous step failed |

### Channel Pipeline Restrictions

Channel admins can only use plugins that are:
1. Allowed at server level
2. Installed at server level
3. Enabled at server level

Channel admins configure *which* enabled plugins run for their channel, but cannot enable plugins the server admin hasn't approved.
`;

const troubleshootingContent = `
### Common Issues

**Plugin not appearing after adding registry:**
- Click "Refresh Plugins" to fetch the latest registry data
- Verify the registry URL is accessible
- Check that the registry JSON is valid

**Plugin installation fails:**
- Verify the tarball URL is accessible
- Check that the SHA256 hash matches the tarball
- Ensure the tarball contains a valid \`plugin.json\`

**Plugin won't enable:**
- Configure all required secrets first
- Validate secrets using the "Test" button
- Check for validation errors in the settings form

**Pipeline not running:**
- Verify the plugin is enabled (not just installed)
- Check that the pipeline is configured for the correct event
- Look for error messages in the pipeline run logs

**Channel pipeline not triggering:**
- Ensure the plugin is enabled at server level
- Verify the channel has a pipeline configured
- Check that the discussion has a downloadable file

### Viewing Pipeline Logs

After a pipeline runs, you can view detailed logs:
1. Navigate to a download's detail page
2. Find the "Plugin Pipelines" section in the sidebar
3. Click on a pipeline stage to view logs

Logs include:
- Execution timestamps
- Input payload sent to the plugin
- Plugin output and error messages
- Duration of each step
`;
</script>

<template>
  <div class="px-8">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Plugin Documentation
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Learn how to set up registries, create plugins, and configure pipelines
        </p>
      </div>
      <NuxtLink
        to="/admin/plugins"
        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <i class="fa-solid fa-arrow-left mr-2" />
        Back to Plugins
      </NuxtLink>
    </div>

    <!-- Table of Contents -->
    <div class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
        Contents
      </h2>
      <ul class="space-y-1 text-sm">
        <li>
          <a
            href="#overview"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            Overview
          </a>
        </li>
        <li>
          <a
            href="#registry"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            Setting Up a Plugin Registry
          </a>
        </li>
        <li>
          <a
            href="#plugin-structure"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            Creating a Plugin
          </a>
        </li>
        <li>
          <a
            href="#pipelines"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            Configuring Pipelines
          </a>
        </li>
        <li>
          <a
            href="#troubleshooting"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            Troubleshooting
          </a>
        </li>
      </ul>
    </div>

    <!-- Documentation Sections -->
    <div class="space-y-8">
      <!-- Overview -->
      <FormRow
        id="overview"
        section-title="Overview"
      >
        <template #content>
          <div class="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer
              :text="overviewContent"
              font-size="small"
            />
          </div>
        </template>
      </FormRow>

      <!-- Registry Setup -->
      <FormRow
        id="registry"
        section-title="Setting Up a Plugin Registry"
      >
        <template #content>
          <div class="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer
              :text="registryContent"
              font-size="small"
            />
          </div>
        </template>
      </FormRow>

      <!-- Plugin Structure -->
      <FormRow
        id="plugin-structure"
        section-title="Creating a Plugin"
      >
        <template #content>
          <div class="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer
              :text="pluginStructureContent"
              font-size="small"
            />
          </div>
        </template>
      </FormRow>

      <!-- Pipelines -->
      <FormRow
        id="pipelines"
        section-title="Configuring Pipelines"
      >
        <template #content>
          <div class="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer
              :text="pipelinesContent"
              font-size="small"
            />
          </div>
        </template>
      </FormRow>

      <!-- Troubleshooting -->
      <FormRow
        id="troubleshooting"
        section-title="Troubleshooting"
      >
        <template #content>
          <div class="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer
              :text="troubleshootingContent"
              font-size="small"
            />
          </div>
        </template>
      </FormRow>
    </div>
  </div>
</template>
