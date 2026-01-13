# Plugins Feature - Implemented Features

This document describes the completed plugin system functionality.

## Overview

The Multiforum plugin system allows server administrators to extend platform functionality through installable plugins. Plugins can process file uploads, scan for security threats, auto-label content, and more.

## Architecture

### Plugin Lifecycle

1. **Registry** - Plugins are published to a registry (HTTP URL or GCS bucket)
2. **Allow** - Server admin allows a plugin for use on their server
3. **Install** - A specific version is installed
4. **Configure** - Secrets and settings are configured
5. **Enable** - Plugin is activated and runs in pipelines
6. **Execute** - Plugin runs when triggered by events

### Event-Driven Execution

Plugins execute in response to events:
- `downloadableFile.created` - When a file is uploaded
- `downloadableFile.updated` - When a file is modified

Plugins run in configurable pipelines with ordering, conditions, and error handling.

---

## Backend Features (gennit-backend)

### Plugin CRUD Operations
- Install plugins from registry
- Enable/disable plugins per server
- Configure plugin secrets with AES-256-GCM encryption
- Configure plugin settings via JSON

### Plugin Registry Support
- HTTP-based registries
- GCS (Google Cloud Storage) registries
- Registry JSON format with plugin metadata and versions
- SHA256 integrity verification for plugin tarballs

### Pipeline Execution Engine
- GitHub Actions-style pipeline configuration
- Conditional execution: `ALWAYS`, `PREVIOUS_SUCCEEDED`, `PREVIOUS_FAILED`
- Pipeline-level `stopOnFirstFailure` option
- Step-level `continueOnError` option
- Fallback to running all enabled plugins if no pipeline defined

### Execution Tracking
- `PluginRun` records for each execution
- Status tracking: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `SKIPPED`
- Pipeline grouping via `pipelineId`
- Execution order tracking
- Skip reason recording
- Duration tracking in milliseconds

### GraphQL API

**Queries:**
- `getAvailablePlugins` - List plugins from registry
- `getInstalledPlugins` - List installed plugins with enabled status
- `getPipelineRuns` - Get execution history for a target
- `getServerPluginSecrets` - Get secret validation status

**Mutations:**
- `allowServerPlugin` - Allow a plugin for use
- `disallowServerPlugin` - Remove plugin from allowed list
- `installServerPluginVersion` - Install specific version
- `enableServerPlugin` - Enable with settings
- `disableServerPlugin` - Disable plugin
- `setServerPluginSecret` - Store encrypted secret
- `validateServerPluginSecret` - Test secret validity
- `updatePluginPipelines` - Configure pipeline execution order

---

## Frontend Features (multiforum-nuxt)

### Plugin Management Page (`/admin/settings/plugins`)

**Plugin List:**
- View all available, allowed, and installed plugins
- Search/filter by name, description, or ID
- Status filter (all/available/allowed/installed/enabled)
- Sort by name or status with direction toggle
- Per-button loading states for allow/disallow actions
- Description preview in list view
- Empty state with getting started instructions

**Actions:**
- Allow/disallow plugins for server use
- Navigate to plugin detail for configuration

### Plugin Detail Page (`/admin/settings/plugins/[pluginId]`)

**Plugin Information:**
- Display name, version, description
- Author name with link to author URL
- Homepage link
- License badge
- Tags as chips
- README markdown rendering
- "View Source" link to repository

**Configuration:**
- Enable/disable toggle (only shown when installed)
- Secret configuration with validation
- Dynamic settings form generated from plugin schema

**Secret Management:**
- Password input with show/hide toggle
- Validation status indicator (Not Set, Set (untested), Valid, Invalid)
- "Validate" button with loading spinner
- Error message display from validation
- Last validated timestamp

### Dynamic Forms (Phase 4)

**Form Generation:**
- Automatic form generation from plugin's `ui.forms` schema
- Support for field types: text, textarea, number, boolean, select, secret
- Validation based on schema: min/max, minLength/maxLength, pattern, required
- Default value handling from schema
- Dark mode support

**Components:**
- `PluginSettingsForm.vue` - Main form container
- `PluginTextField.vue` - Text/textarea inputs
- `PluginNumberField.vue` - Number input with range hints
- `PluginBooleanField.vue` - Toggle switch
- `PluginSelectField.vue` - Dropdown select
- `PluginSecretField.vue` - Password with validation status

### Pipeline View (Phase 3)

**Pipeline Display:**
- Shows each plugin as a pipeline stage
- Status icons: pending (gray), running (spinner), success (green check), failed (red X), skipped (gray)
- Duration display for completed stages
- Auto-refreshing while pipeline is running (polling)
- Expandable stages for details

**Components:**
- `PluginPipeline.vue` - Main pipeline display
- `PluginPipelineStage.vue` - Individual stage
- `usePluginPipeline.ts` - Data fetching composable with polling

**Integration:**
- Pipeline section in download sidebar
- Shows pipeline progress after file upload
- View logs button for execution details

### Pipeline Logs Modal

**Features:**
- Modal showing detailed logs for a pipeline run
- Syntax highlighting for JSON payloads
- Timestamp for each log entry
- Copy button for logs
- Filter by log level (info, warn, error)

### Pipeline Configuration UI (Phase 7)

**Hybrid YAML/Visual Editor:**
- Mode toggle between YAML and Visual editing
- Bidirectional conversion preserves data

**YAML Mode (Primary):**
- Monaco editor with YAML syntax highlighting
- JSON Schema validation with error hints
- Plugin ID autocomplete
- Dark mode support
- Parse error display
- Available plugins reference panel
- Available events reference panel

**Visual Mode (Alternative):**
- Drag-and-drop step reordering
- Plugin dropdown selection
- Condition selector per step
- Toggle switches for options
- Add/remove step buttons
- Empty state guidance

**Pipeline Configuration Page (`/admin/settings/plugins/pipelines`):**
- Load current pipeline config from ServerConfig
- Save validation before submission
- Info banner explaining pipeline concepts
- Link from plugin management index page

---

## Plugins Repository (multiforum-plugins)

### Available Plugins

1. **hello-world** - Demo plugin for testing
2. **security-attachment-scan** - VirusTotal integration for malware scanning

### CI/CD Pipeline
- GitHub Actions workflow for building and publishing
- Automatic registry generation
- GCS deployment for plugin artifacts
- Deterministic tarball bundling
- SHA256 integrity hashes

---

## Unit Tests

### Phase 3 - Pipeline View
- `composables/usePluginPipeline.spec.ts` - 17 tests
- `components/plugins/PluginPipeline.spec.ts` - 14 tests
- `components/plugins/PluginPipelineStage.spec.ts` - 12 tests
- `components/plugins/PluginLogsModal.spec.ts` - 13 tests

### Phase 4 - Dynamic Forms
- `components/plugins/fields/pluginFields.spec.ts` - 27 tests

### Phase 6 - UI Polish
- `pages/admin/settings/plugins/index.spec.ts` - 19 tests
- `pages/admin/settings/plugins/pluginDetail.spec.ts` - 17 tests

### Phase 7 - Pipeline Configuration
- `components/plugins/pipelineEditor.spec.ts` - 36 tests

---

## Configuration Examples

### Pipeline YAML Configuration

```yaml
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
```

### Plugin Manifest UI Schema

```json
{
  "ui": {
    "forms": {
      "server": [
        {
          "title": "API Configuration",
          "fields": [
            {
              "key": "scanTimeoutMs",
              "type": "number",
              "label": "Scan Timeout (ms)",
              "default": 45000,
              "validation": { "min": 5000, "max": 120000 }
            }
          ]
        }
      ]
    }
  }
}
```
