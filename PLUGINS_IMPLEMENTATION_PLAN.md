# Plugins Feature Implementation Plan

This document outlines the work required to complete the Multiforum plugins feature, organized into phases with specific tasks.

## Current State Summary

### What Exists

**Backend (gennit-backend) - ~85% Complete**
- Plugin CRUD operations (install, enable, configure secrets)
- Plugin registry handling (HTTP and GCS sources)
- Secret management with AES-256-GCM encryption
- Plugin execution for `downloadableFile.*` events
- PluginRun records for execution history
- Comprehensive documentation (PLUGIN_REQUIREMENTS.md)
- **[NEW]** GitHub Actions-style pipeline configuration (`pluginPipelines` on ServerConfig)
- **[NEW]** Pipeline status tracking (pipelineId, executionOrder, skippedReason)
- **[NEW]** Conditional execution (ALWAYS, PREVIOUS_SUCCEEDED, PREVIOUS_FAILED)
- **[NEW]** `getPipelineRuns` query for execution history
- **[NEW]** `updatePluginPipelines` mutation for pipeline configuration
- **[FIXED]** `getInstalledPlugins` now returns correct enabled/settingsJson values

**Frontend (multiforum-nuxt) - ~70% Complete**
- Server-level plugin management UI (list, install, enable/disable)
- Server-level secret configuration with validation
- Basic plugin status display
- **[NEW]** Plugin detail page with metadata display (author, homepage, license, tags)
- **[NEW]** README markdown rendering on plugin detail page
- **[NEW]** View Source link to plugin repository
- **[NEW]** Pipeline/CI-CD view showing plugin execution status
- **[NEW]** Auto-refreshing pipeline with polling while running
- **[NEW]** Pipeline logs modal with copy functionality

**Plugins Repository (multiforum-plugins) - Functional**
- Two working plugins: hello-world (demo), security-attachment-scan (VirusTotal)
- Full CI/CD pipeline via GitHub Actions → GCS
- Deterministic tarball bundling with SHA256 integrity
- Registry generation scripts

### What's Missing

1. **Dynamic Forms** - No form generation from plugin's `ui.forms` schema
2. **Plugin Ordering UI** - Backend supports pipelines, but no UI to configure them
3. **Version Updates** - No UI to update outdated plugins
6. **UI Polish** - Per-button loading states, toast notifications

---

## Phase 1: Backend Fixes & Foundation ✅ COMPLETE

**Goal**: Fix existing bugs and ensure solid foundation for frontend work.

### 1.1 Fix getInstalledPlugins Query ✅

**File**: `gennit-backend/customResolvers/queries/getInstalledPlugins.ts`

**Problem**: Returned hardcoded `enabled: false` and `settingsJson: {}` for all plugins.

**Solution**: Used Neo4j GraphQL Connection pattern (`InstalledVersionsConnection.edges.edge`) to access relationship properties.

**Completed**:
- [x] Updated resolver to use Connection pattern
- [x] Frontend now receives correct enabled/settings values

### 1.2 Add Plugin Pipeline Configuration ✅

**Approach Changed**: Instead of simple `executionOrder` on each plugin installation, implemented GitHub Actions-style pipeline configuration.

**Schema Changes**:
```graphql
# Pipeline condition for step execution
enum PipelineCondition {
  ALWAYS
  PREVIOUS_SUCCEEDED
  PREVIOUS_FAILED
}

# Input types for mutation
input PipelineStepInput {
  pluginId: String!
  continueOnError: Boolean
  condition: PipelineCondition
}

input EventPipelineInput {
  event: String!
  steps: [PipelineStepInput!]!
  stopOnFirstFailure: Boolean
}

# ServerConfig now has pipeline configuration
type ServerConfig {
  # ... existing fields
  pluginPipelines: JSON  # Stores array of EventPipelineInput
}

type Mutation {
  updatePluginPipelines(pipelines: [EventPipelineInput!]!): JSON!
}
```

**Files Created/Modified**:
- [x] `typeDefs.ts` - Added pipeline types and `pluginPipelines` field
- [x] `customResolvers/mutations/updatePluginPipelines.ts` - New mutation
- [x] `services/pluginRunner.ts` - Pipeline execution logic

### 1.3 Add Pipeline Status Tracking ✅

**Files Modified**:
- `gennit-backend/typeDefs.ts` - Extended PluginRun
- `gennit-backend/services/pluginRunner.ts` - Track pipeline stages

**PluginRun now includes**:
```graphql
type PluginRun {
  # Existing fields...
  pluginName: String      # Display name for UI
  pipelineId: String      # Groups runs for same event trigger
  executionOrder: Int     # Order within pipeline
  skippedReason: String   # Why plugin was skipped (if applicable)
}
```

**Completed**:
- [x] Added pipelineId, executionOrder, skippedReason to PluginRun schema
- [x] Generate unique pipelineId when event triggers
- [x] Create PENDING records for all plugins before execution starts
- [x] Update status to RUNNING → SUCCEEDED/FAILED as each runs
- [x] SKIPPED status for plugins that don't run
- [x] Created `getPipelineRuns` query

### 1.4 Add Conditional Execution Support ✅

**File**: `gennit-backend/services/pluginRunner.ts`

**Completed**:
- [x] Pipeline-level `stopOnFirstFailure` option
- [x] Step-level `continueOnError` option
- [x] Step conditions: ALWAYS, PREVIOUS_SUCCEEDED, PREVIOUS_FAILED
- [x] Store skippedReason when plugins are skipped
- [x] Falls back to running all enabled plugins if no pipeline defined

---

## Phase 2: Plugin Details & README Display ✅ COMPLETE

**Goal**: Show plugin information from manifest on detail page.

### 2.1 Backend: Expose Plugin Metadata ✅

**Files**:
- `gennit-backend/customResolvers/queries/` - New or updated queries

**Tasks**:
- [x] Ensure `getInstalledPlugins` returns full manifest including:
  - `metadata.author` (name and URL)
  - `metadata.homepage`
  - `metadata.license`
  - `metadata.tags`
  - `documentation.readmePath`
- [x] Add query to fetch README content by plugin version ID
- [x] Consider caching README content in database on install

**Note**: The backend schema already supported all these fields. Frontend queries were updated to request them.

### 2.2 Frontend: Plugin Detail Page Enhancements ✅

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [x] Display plugin author with link to author URL
- [x] Display homepage link
- [x] Display license badge
- [x] Display tags as chips
- [x] Render README markdown content (use existing markdown renderer)
- [x] Add "View Source" link to repository

**Queries Updated**:
- `GET_AVAILABLE_PLUGINS` - Added displayName, description, authorName, authorUrl, homepage, license, tags
- `GET_INSTALLED_PLUGINS` - Added full plugin metadata, readmeMarkdown, manifest
- `GET_PLUGIN_MANAGEMENT_DATA` - Added metadata fields
- `GET_PLUGIN_DETAIL` - New query for full plugin detail with README

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Security Attachment Scan                    v0.2.0  │
│ by Multiforum Team • MIT License                    │
│ [Homepage] [View Source]                            │
├─────────────────────────────────────────────────────┤
│ Tags: [security] [scanning] [virustotal]            │
├─────────────────────────────────────────────────────┤
│ ┌─ Configuration ──────────────────────────────────┐│
│ │ [Enabled Toggle]                                 ││
│ │ API Key: ●●●●●●●● [Validated ✓]                 ││
│ │ Settings...                                      ││
│ └──────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│ ## README                                           │
│ This plugin scans uploaded files using VirusTotal..│
└─────────────────────────────────────────────────────┘
```

---

## Phase 3: Pipeline/CI-CD View ✅ COMPLETE

**Goal**: Give maintainers visibility into plugin execution with a pipeline-like UI.

### 3.1 Design Pipeline Data Model ✅ (Backend Complete)

**Concept**: When a file is uploaded, all enabled plugins form a "pipeline" that runs in order.

```
Pipeline for "game-mod.zip" upload
├── [1] Security Scan      ✓ Passed (1.2s)
├── [2] Auto-Labeler       ✓ Passed (0.3s)
└── [3] Thumbnail Gen      ⏳ Running...
```

**Data Flow**:
1. File uploaded → triggers `downloadableFile.created` event
2. Backend creates PluginRun records with status=PENDING for all plugins in pipeline
3. Each plugin runs in order, updating status to RUNNING → SUCCEEDED/FAILED
4. Frontend polls or subscribes for updates
5. User sees pipeline progress in real-time

### 3.2 Backend: Pipeline Query ✅ COMPLETE

**File**: `gennit-backend/customResolvers/queries/getPipelineRuns.ts`

**Query**:
```graphql
query GetPipelineRuns($targetId: ID!, $targetType: String!) {
  getPipelineRuns(targetId: $targetId, targetType: $targetType) {
    id
    pipelineId
    pluginId
    pluginName
    version
    status
    message
    durationMs
    executionOrder
    skippedReason
    createdAt
    updatedAt
  }
}
```

### 3.3 Frontend: Pipeline Component ✅ COMPLETE

**New Files**:
- `components/plugins/PluginPipeline.vue` - Main pipeline display
- `components/plugins/PluginPipelineStage.vue` - Individual stage
- `composables/usePluginPipeline.ts` - Data fetching and polling

**Pipeline Component Features**:
- Shows each plugin as a stage with status icon
- Pending: gray circle
- Running: spinning loader
- Success: green checkmark
- Failed: red X
- Skipped: gray skip icon
- Expandable to show logs/details
- Shows duration for completed stages
- Auto-refreshes while any stage is PENDING or RUNNING

**Tasks**:
- [x] Create `PluginPipeline.vue` component
- [x] Create `PluginPipelineStage.vue` component
- [x] Create `usePluginPipeline` composable with polling
- [x] Add GraphQL query `GET_PIPELINE_RUNS`
- [x] Style with Tailwind (match CI/CD aesthetic)

### 3.4 Frontend: Integrate Pipeline into Download Detail ✅ COMPLETE

**File**: `components/channel/DownloadSidebar.vue`

**Tasks**:
- [x] Add "Plugin Pipeline" section to download detail view
- [x] Show pipeline for the download's file
- [x] For uploaders: show immediately after upload
- [x] For viewers: show scan status (passed/failed)
- [x] Add loading state while pipeline is incomplete

**UI Mockup**:
```
┌─ Plugin Pipeline ────────────────────────────────────┐
│                                                      │
│  ● Security Scan ──────────────── ✓ Passed (1.2s)   │
│  │                                                   │
│  ● Auto-Labeler ───────────────── ✓ Passed (0.3s)   │
│  │                                                   │
│  ○ Thumbnail Generator ────────── ⏳ Running...      │
│                                                      │
│  [View Logs]                                         │
└──────────────────────────────────────────────────────┘
```

### 3.5 Frontend: Pipeline Logs Modal ✅ COMPLETE

**New File**: `components/plugins/PluginLogsModal.vue`

**Features**:
- Modal showing detailed logs for a pipeline run
- Syntax highlighting for JSON payloads
- Timestamp for each log entry
- Copy button for logs
- Filter by log level (info, warn, error)

**Tasks**:
- [x] Create modal component
- [x] Fetch logs from PluginRun.payload
- [x] Format and display logs
- [x] Add to pipeline stage (click to expand)

---

## Phase 4: Dynamic Forms from Plugin UI Schema

**Goal**: Generate configuration forms from plugin's `ui.forms` definition.

### 4.1 Understand UI Schema Format

From the plugins repo, the `ui.forms` structure is:

```json
{
  "ui": {
    "forms": {
      "server": [
        {
          "title": "API Configuration",
          "description": "Configure the VirusTotal API connection",
          "fields": [
            {
              "key": "scanTimeoutMs",
              "type": "number",
              "label": "Scan Timeout (ms)",
              "description": "How long to wait for VirusTotal response",
              "default": 45000,
              "validation": {
                "min": 5000,
                "max": 120000
              }
            },
            {
              "key": "quarantineOnDetection",
              "type": "boolean",
              "label": "Quarantine Infected Files",
              "default": true
            }
          ]
        }
      ],
      "channel": []
    }
  }
}
```

### 4.2 Create Dynamic Form Components

**New Files**:
- `components/plugins/PluginSettingsForm.vue` - Main form container
- `components/plugins/fields/PluginTextField.vue`
- `components/plugins/fields/PluginNumberField.vue`
- `components/plugins/fields/PluginBooleanField.vue`
- `components/plugins/fields/PluginSelectField.vue`
- `components/plugins/fields/PluginSecretField.vue`

**Tasks**:
- [ ] Create form container that iterates over sections
- [ ] Create field components for each type
- [ ] Implement validation based on `validation` object
- [ ] Handle defaults from schema
- [ ] Emit changes for parent to save
- [ ] Style consistently with existing forms

### 4.3 Integrate Dynamic Forms into Plugin Detail

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [ ] Replace hardcoded settings UI with dynamic form
- [ ] Load `ui.forms.server` from plugin manifest
- [ ] Pass current settings values to form
- [ ] Save settings via `enableServerPlugin` mutation
- [ ] Show validation errors inline

### 4.4 Secret Fields with Validation Status

**Features**:
- Password input with show/hide toggle
- Validation status indicator (Not Set, Testing, Valid, Invalid)
- "Validate" button to test credentials
- Error message display

**Tasks**:
- [ ] Create `PluginSecretField.vue` component
- [ ] Integrate with `setServerPluginSecret` mutation
- [ ] Show validation status from `getServerPluginSecrets`
- [ ] Add loading state during validation

---

## Phase 5: Plugin Version Management

**Goal**: Allow updating outdated plugins and managing versions.

### 5.1 Backend: Version Comparison

**Tasks**:
- [ ] Add query to check for newer versions in registry
- [ ] Compare installed version with available versions
- [ ] Return update availability status

**Query**:
```graphql
type InstalledPlugin {
  # Existing fields...
  hasUpdate: Boolean
  latestVersion: String
}
```

### 5.2 Frontend: Update Available Indicator

**File**: `pages/admin/settings/plugins/index.vue`

**Tasks**:
- [ ] Show "Update Available" badge on outdated plugins
- [ ] Show current vs latest version
- [ ] Add "Update" button that opens detail page

### 5.3 Frontend: Update Flow on Detail Page

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [ ] Show version dropdown with available versions
- [ ] Highlight currently installed version
- [ ] Show "Update to vX.Y.Z" button when newer version exists
- [ ] Confirm before updating (settings may reset)
- [ ] Show changelog if available in README

---

## Phase 6: UI Polish & Bug Fixes ✅ COMPLETE

**Goal**: Fix remaining issues and improve UX.

### 6.1 Toast Notifications ✅

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [x] Import/create toast notification composable
- [x] Replace console.log with toast.success()
- [x] Replace console.error with toast.error()
- [x] Add toast for: install, enable, disable, secret set, secret validated

### 6.2 Per-Button Loading States ✅

**File**: `pages/admin/settings/plugins/index.vue`

**Solution**: Track loading state per plugin ID using Sets.

**Tasks**:
- [x] Track loading state per plugin using `Set<string>` for allow/disallow
- [x] Set loading state for specific plugin ID on click
- [x] Clear loading state for that ID when complete

### 6.3 Disable Enable Switch if Not Installed ✅

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [x] Enable toggle is only shown when plugin is installed (v-if="isInstalled")
- [x] Section is hidden entirely when not installed

### 6.4 Plugin List Improvements ✅

**Tasks**:
- [x] Add search/filter for plugins (by name, description, or ID)
- [x] Add status filter dropdown (all/available/allowed/installed/enabled)
- [x] Add sorting (name, status) with direction toggle
- [x] Show plugin description in list view
- [x] Improve empty state with getting started instructions
- [x] Show filtered results count when filtering

---

## Phase 7: Plugin Pipeline Configuration UI

**Goal**: Allow admins to configure plugin execution pipelines via UI.

### 7.1 Backend: Pipeline Mutation ✅ COMPLETE

Already implemented in Phase 1:
- `updatePluginPipelines` mutation accepts pipeline configuration
- Supports conditions, stopOnFirstFailure, continueOnError

### 7.2 Frontend: Pipeline Configuration UI

**New File**: `components/plugins/PluginPipelineEditor.vue`

**Features**:
- Visual editor for pipeline configuration
- Drag-and-drop to reorder plugins within a pipeline
- Add/remove steps
- Configure conditions per step (ALWAYS, PREVIOUS_SUCCEEDED, PREVIOUS_FAILED)
- Toggle continueOnError per step
- Toggle stopOnFirstFailure per pipeline
- Select which event triggers the pipeline

**Tasks**:
- [ ] Install drag-and-drop library (vuedraggable or similar)
- [ ] Create pipeline editor component
- [ ] Integrate with `updatePluginPipelines` mutation
- [ ] Add to plugin settings page or separate pipeline config page
- [ ] Add validation (at least one step, valid plugin IDs)

**UI Mockup**:
```
┌─ Pipeline: downloadableFile.created ─────────────────┐
│ ☑ Stop on first failure                             │
│                                                      │
│  ≡ [1] security-attachment-scan                      │
│      Condition: ALWAYS  ☐ Continue on error         │
│                                                      │
│  ≡ [2] auto-labeler                                  │
│      Condition: PREVIOUS_SUCCEEDED  ☐ Continue on error│
│                                                      │
│  [+ Add Step]                                        │
│                                                      │
│  [Save Pipeline]                                     │
└──────────────────────────────────────────────────────┘
```

---

## Phase 8: Documentation & Testing

**Goal**: Complete documentation and add test coverage.

### 8.1 In-App Documentation

**New File**: `pages/admin/settings/plugins/docs.vue`

**Content**:
- How to set up a plugin registry
- Registry JSON format
- How to create a plugin (link to PLUGIN_REQUIREMENTS.md)
- Troubleshooting common issues

**Tasks**:
- [ ] Create documentation page
- [ ] Add link from plugin management page
- [ ] Include examples and code snippets

### 8.2 E2E Tests

**New File**: `tests/cypress/e2e/plugins/pluginManagement.spec.cy.ts`

**Test Cases**:
- [ ] View available plugins
- [ ] Allow a plugin
- [ ] Install a plugin version
- [ ] Configure plugin secrets
- [ ] Enable/disable plugin
- [ ] View plugin pipeline for a download
- [ ] Update plugin to newer version

### 8.3 Unit Tests ✅ PARTIALLY COMPLETE

**Files Created**:
- `composables/usePluginPipeline.spec.ts` - 17 tests
- `components/plugins/PluginPipeline.spec.ts` - 14 tests
- `components/plugins/PluginPipelineStage.spec.ts` - 12 tests
- `components/plugins/PluginLogsModal.spec.ts` - 13 tests
- `pages/admin/settings/plugins/index.spec.ts` - 19 tests (Phase 6)
- `pages/admin/settings/plugins/pluginDetail.spec.ts` - 17 tests (Phase 6)

**Test Cases**:
- [x] PluginPipeline renders stages correctly
- [x] usePluginPipeline composable logic (formatDuration, getStatusInfo, computed properties)
- [x] PluginPipelineStage displays status, duration, messages
- [x] PluginLogsModal displays execution details
- [x] Plugin list filtering by name, description, ID (Phase 6)
- [x] Plugin list status filtering (Phase 6)
- [x] Plugin list sorting by name and status (Phase 6)
- [x] Per-button loading states (Phase 6)
- [x] Toast notification integration (Phase 6)
- [x] Enable switch visibility logic (Phase 6)
- [x] Secret status display helpers (Phase 6)
- [ ] PluginSettingsForm generates fields from schema (Phase 4)
- [ ] PluginSecretField shows validation status (Phase 4)
- [ ] Version comparison logic (Phase 5)

---

## Implementation Order Recommendation

Based on dependencies and value delivery:

1. **Phase 1** (Backend Fixes) - ✅ COMPLETE
2. **Phase 2** (Plugin Details) - ✅ COMPLETE
3. **Phase 3** (Pipeline View) - ✅ COMPLETE
4. **Phase 6** (UI Polish) - Quick fixes, improves UX
5. **Phase 4** (Dynamic Forms) - Enables proper plugin configuration
6. **Phase 7** (Pipeline Config UI) - Enables full pipeline customization
7. **Phase 5** (Version Management) - Nice to have
8. **Phase 8** (Documentation & Testing) - Ongoing

---

## Estimated Scope

| Phase | Tasks | Complexity | Status |
|-------|-------|------------|--------|
| Phase 1: Backend Fixes | 12 | Medium | ✅ Complete |
| Phase 2: Plugin Details | 8 | Low | ✅ Complete |
| Phase 3: Pipeline View | 15 | High | ✅ Complete |
| Phase 4: Dynamic Forms | 10 | Medium | Not Started |
| Phase 5: Version Management | 6 | Low | Not Started |
| Phase 6: UI Polish | 8 | Low | ✅ Complete |
| Phase 7: Pipeline Config UI | 5 | Medium | Backend Complete |
| Phase 8: Docs & Testing | 10 | Medium | Unit Tests Partial ✅ |

---

## Files to Create

### Frontend (multiforum-nuxt)
- ✅ `components/plugins/PluginPipeline.vue`
- ✅ `components/plugins/PluginPipelineStage.vue`
- ✅ `components/plugins/PluginLogsModal.vue`
- `components/plugins/PluginSettingsForm.vue`
- `components/plugins/PluginPipelineEditor.vue`
- `components/plugins/fields/PluginTextField.vue`
- `components/plugins/fields/PluginNumberField.vue`
- `components/plugins/fields/PluginBooleanField.vue`
- `components/plugins/fields/PluginSelectField.vue`
- `components/plugins/fields/PluginSecretField.vue`
- ✅ `composables/usePluginPipeline.ts`
- ✅ `graphQLData/admin/queries.js` (GET_PIPELINE_RUNS added)
- `pages/admin/settings/plugins/docs.vue`
- `tests/cypress/e2e/plugins/pluginManagement.spec.cy.ts`
- ✅ `composables/usePluginPipeline.spec.ts`
- ✅ `components/plugins/PluginPipeline.spec.ts`
- ✅ `components/plugins/PluginPipelineStage.spec.ts`
- ✅ `components/plugins/PluginLogsModal.spec.ts`
- ✅ `pages/admin/settings/plugins/index.spec.ts` (Phase 6 tests)
- ✅ `pages/admin/settings/plugins/pluginDetail.spec.ts` (Phase 6 tests)

### Backend (gennit-backend) - ✅ Complete
- ✅ Updated `customResolvers/queries/getInstalledPlugins.ts`
- ✅ Created `customResolvers/queries/getPipelineRuns.ts`
- ✅ Created `customResolvers/mutations/updatePluginPipelines.ts`
- ✅ Updated `services/pluginRunner.ts`
- ✅ Updated `typeDefs.ts`

---

## Notes

- Channel-level plugin configuration is explicitly deferred per user request
- The security-attachment-scan plugin already exists and is functional
- The pipeline view is the highest-value missing feature for maintainer visibility
- Consider WebSocket/subscription for real-time pipeline updates (future enhancement)
- Phase 1 used GitHub Actions-style pipelines instead of simple executionOrder for more flexibility
