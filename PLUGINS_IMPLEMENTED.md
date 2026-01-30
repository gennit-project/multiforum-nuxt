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

Plugins execute in response to events at two scopes:

**Server-Scoped Events** (configured by server admin):
- `downloadableFile.created` - When a file is uploaded
- `downloadableFile.updated` - When a file is modified

**Channel-Scoped Events** (configured by channel admin):
- `discussionChannel.created` - When a discussion with download is submitted to a channel

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
- Scope tracking: `SERVER` or `CHANNEL`

### Channel-Scoped Pipeline Support (Phase 9.1-9.4, 9.8)
- Channel admins can configure pipelines for `discussionChannel.created` event
- Pipelines stored in `Channel.pluginPipelines` JSON field
- Only server-enabled plugins can be used in channel pipelines
- Automatic trigger when discussion with download is submitted to channel
- Pipeline errors logged but don't fail discussion creation
- Plugin context includes channel metadata:
  - `uniqueName` - Channel's unique identifier
  - `displayName` - Channel's display name
  - `tags` - Channel's tags
  - `filterGroups` - Channel's filter configuration with options (for auto-labeling)

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
- `updatePluginPipelines` - Configure server-level pipeline execution order
- `updateChannelPluginPipelines` - Configure channel-level pipeline execution order

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

**Server Pipeline Configuration Page (`/admin/settings/plugins/pipelines`):**
- Load current pipeline config from ServerConfig
- Save validation before submission
- Info banner explaining pipeline concepts
- Link from plugin management index page

### Channel Pipeline Configuration UI (Phase 9.5-9.6)

**Channel Pipeline Page (`/forums/[forumId]/edit/pipelines`):**
- Integrated into forum settings navigation as "Pipelines" tab
- Reuses `PluginPipelineEditor` with `scope="channel"` prop
- Shows only channel-relevant events (`discussionChannel.created`)
- Loads/saves from Channel's `pluginPipelines` field
- Info banner explaining channel pipeline behavior
- Warning if no server plugins are enabled

**Schema Updates:**
- Added `PipelineScope` type ('server' | 'channel')
- Added `scope` property to `PIPELINE_EVENTS`
- Added `getEventsForScope()` helper function
- Added `getDefaultPipelineYaml(scope)` for scope-specific defaults
- Added `getPipelineJsonSchema(scope)` for Monaco validation
- Updated `validatePipelineConfig()` to accept scope parameter

**Component Updates:**
- `PluginPipelineEditor.vue` - Added `scope` prop, uses scoped events/defaults
- `PipelineVisualEditor.vue` - Added `events` prop for scope-filtered display

### Channel Pipeline View (Phase 9.7)

**New Component**: `ScopedPipelineView.vue`

Displays both server and channel pipeline results in the download sidebar:
- Queries server pipelines (file-level) and channel pipelines (discussion-level)
- Shows pipelines in separate sections with scope indicators
- Server pipelines show with server icon
- Channel pipelines show with hashtag icon and channel name
- Combined status indicator in header
- Auto-polling while any pipeline is active

**Updated Files:**
- `composables/usePluginPipeline.ts` - Added `scope`, `channelId`, `eventType` to PipelineRun and PipelineGroup interfaces
- `graphQLData/admin/queries.js` - Added `scope`, `channelId`, `eventType` to GET_PIPELINE_RUNS query
- `components/channel/DownloadSidebar.vue` - Uses ScopedPipelineView instead of PluginPipeline

### Plugin Version Management (Phase 5)

**Goal**: Allow server admins to see when plugin updates are available and easily update to newer versions.

**Backend Changes** (`gennit-backend`):
- Updated `getInstalledPlugins` resolver to fetch plugin registry
- Added semver-style version comparison logic
- New fields on `InstalledPlugin` type:
  - `hasUpdate: Boolean` - True when a newer version exists in registry
  - `latestVersion: String` - The newest available version
  - `availableVersions: [String!]` - All versions from registry, sorted newest first

**Frontend - Plugin List Page** (`pages/admin/settings/plugins/index.vue`):
- "Update Available" badge next to version when `hasUpdate` is true
- Shows latest available version in the badge
- "Update" button appears for plugins with available updates
- Clicking "Update" navigates to detail page with `?update=true` param

**Frontend - Plugin Detail Page** (`pages/admin/settings/plugins/[pluginId].vue`):
- Prominent "Update Available" banner when newer version exists
- Shows installed vs latest version comparison
- "Update to vX.Y.Z" button for one-click updates
- Version dropdown marks versions as "(Installed)" or "(Latest)"
- Auto-selects latest version when accessing with `?update=true` query param
- Number of available registry versions shown in update banner

**Version Comparison Logic**:
- Handles semver-style versions (major.minor.patch)
- Supports 'v' prefix (e.g., "v1.0.0" treated same as "1.0.0")
- Gracefully handles non-standard version strings

### Channel Pipeline Unit Tests (Phase 9.9)

**New Test Files**:
- `utils/pipelineSchema.spec.ts` - 36 tests
- `pages/forums/[forumId]/edit/pipelines.spec.ts` - 12 tests

**Test Coverage**:
- Pipeline events (server vs channel scope)
- `getEventsForScope()` filtering
- `SERVER_PIPELINE_EVENTS` and `CHANNEL_PIPELINE_EVENTS` constants
- Pipeline conditions (ALWAYS, PREVIOUS_SUCCEEDED, PREVIOUS_FAILED)
- JSON Schema generation for different scopes
- Default YAML templates per scope
- `validatePipelineConfig()` with scope-aware event validation
- Channel pipeline page loading/error states
- Available plugins filtering (only enabled server plugins)
- Scope configuration passed to editor
- Pipeline execution order documentation

### Documentation & E2E Tests (Phase 8)

**In-App Documentation Page** (`pages/admin/settings/plugins/docs.vue`):
- Comprehensive plugin system documentation
- Table of contents with anchor links
- Sections covering:
  - Overview and plugin lifecycle
  - Setting up a plugin registry (with JSON format examples)
  - Creating a plugin (tarball structure, manifest format, entry point)
  - Configuring pipelines (server vs channel, YAML examples)
  - Troubleshooting common issues
- Documentation link added to plugin management page

**E2E Tests** (`tests/cypress/e2e/plugins/pluginManagement.spec.cy.ts`):
- Plugin management page loading and navigation
- Documentation page content verification
- Pipeline configuration page access
- Plugin detail page navigation
- Update flow indicators
- Search and filter controls
- Back navigation links

**Updated Files**:
- `pages/admin/settings/plugins/index.vue` - Added "Documentation" link
- `tests/cypress/e2e/constants.ts` - Added plugin-related URL constants

---

## Plugins Repository (multiforum-plugins)

### Release Model (Plugin-Scoped)

- Each plugin is versioned independently via its `plugin.json.version`.
- Releases are tagged per plugin (recommended: `<plugin-id>@<version>`).
- Registries may host any subset of plugins and should preserve older versions.

### Available Plugins

1. **hello-world** - Demo plugin for testing
2. **security-attachment-scan** - VirusTotal integration for malware scanning
3. **auto-labeler** - Stub plugin for channel-scoped auto-labeling (Phase 9.8)
   - Receives `discussionChannel.created` events
   - Logs available filter groups from channel context
   - Returns error with filter summary for debugging
   - Ready for implementation of actual labeling logic

### CI/CD Pipeline
- GitHub Actions workflow for building and publishing (plugin-scoped releases)
- Registry merging (preserves existing plugins and older versions)
- GCS deployment for plugin artifacts
- Deterministic tarball bundling
- SHA256 integrity hashes

---

## Unit Tests

### Frontend (multiforum-nuxt)

#### Phase 3 - Pipeline View
- `composables/usePluginPipeline.spec.ts` - 17 tests
- `components/plugins/PluginPipeline.spec.ts` - 14 tests
- `components/plugins/PluginPipelineStage.spec.ts` - 12 tests
- `components/plugins/PluginLogsModal.spec.ts` - 13 tests

#### Phase 4 - Dynamic Forms
- `components/plugins/fields/pluginFields.spec.ts` - 27 tests

#### Phase 6 - UI Polish
- `pages/admin/settings/plugins/index.spec.ts` - 19 tests
- `pages/admin/settings/plugins/pluginDetail.spec.ts` - 17 tests

#### Phase 7 - Pipeline Configuration
- `components/plugins/pipelineEditor.spec.ts` - 72 tests

#### Phase 9.9 - Channel Pipeline Unit Tests
- `utils/pipelineSchema.spec.ts` - 36 tests
- `pages/forums/[forumId]/edit/pipelines.spec.ts` - 12 tests

### Backend (gennit-backend)

#### Phase 7 - Server Pipeline Configuration
- `customResolvers/mutations/updatePluginPipelines.test.ts` - Pipeline validation tests

#### Phase 9.1-9.4 - Channel Pipeline Support
- `customResolvers/mutations/updateChannelPluginPipelines.test.ts` - 10 tests
  - Channel event validation
  - Server event rejection for channel pipelines
  - Structure validation
- `services/pluginRunner.test.ts` - 11 tests
  - `shouldRunStep()` condition logic
  - `generatePipelineId()` format and uniqueness
  - `isSupportedEvent()` server event detection
  - `isChannelEvent()` channel event detection

---

## Configuration Examples

### Server Pipeline YAML Configuration

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

### Channel Pipeline YAML Configuration

```yaml
pipelines:
  - event: discussionChannel.created
    stopOnFirstFailure: true
    steps:
      - plugin: auto-labeler
        condition: ALWAYS
        continueOnError: false
```

Note: Channel pipelines can only use the `discussionChannel.created` event and can only reference plugins that are enabled at the server level.

### Channel Plugin Event Payload

When a channel pipeline is triggered, plugins receive this context:

```json
{
  "type": "discussionChannel.created",
  "payload": {
    "discussionId": "abc123",
    "discussionTitle": "Awesome Mod v1.2",
    "discussionBody": "Check out this mod!",
    "downloadableFileId": "file123",
    "fileName": "awesome-mod-v1.2.zip",
    "fileSize": 2468421632,
    "fileUrl": "https://storage.example.com/...",
    "channel": {
      "uniqueName": "gaming-mods",
      "displayName": "Gaming Mods",
      "tags": ["gaming", "mods"],
      "filterGroups": [
        {
          "id": "fg1",
          "key": "platform",
          "displayName": "Platform",
          "mode": "SINGLE",
          "order": 0,
          "options": [
            { "id": "opt1", "value": "windows", "displayName": "Windows", "order": 0 },
            { "id": "opt2", "value": "linux", "displayName": "Linux", "order": 1 }
          ]
        }
      ]
    }
  }
}
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
