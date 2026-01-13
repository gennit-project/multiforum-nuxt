# Plugins Feature Implementation Plan

This document outlines the work required to complete the Multiforum plugins feature, organized into phases with specific tasks.

## Current State Summary

### What Exists

**Backend (gennit-backend) - ~70% Complete**
- Plugin CRUD operations (install, enable, configure secrets)
- Plugin registry handling (HTTP and GCS sources)
- Secret management with AES-256-GCM encryption
- Plugin execution for `downloadableFile.*` events
- PluginRun records for execution history
- Comprehensive documentation (PLUGIN_REQUIREMENTS.md)

**Frontend (multiforum-nuxt) - ~40% Complete**
- Server-level plugin management UI (list, install, enable/disable)
- Server-level secret configuration with validation
- Basic plugin status display

**Plugins Repository (multiforum-plugins) - Functional**
- Two working plugins: hello-world (demo), security-attachment-scan (VirusTotal)
- Full CI/CD pipeline via GitHub Actions → GCS
- Deterministic tarball bundling with SHA256 integrity
- Registry generation scripts

### What's Missing

1. **Pipeline/CI-CD View** - No visibility into plugin execution status
2. **Plugin Details** - README, author, homepage not displayed
3. **Dynamic Forms** - No form generation from plugin's `ui.forms` schema
4. **Plugin Ordering** - No way to control execution order of multiple plugins
5. **Version Updates** - No UI to update outdated plugins
6. **Backend Bug** - `getInstalledPlugins` returns hardcoded defaults
7. **UI Polish** - Per-button loading states, toast notifications

---

## Phase 1: Backend Fixes & Foundation

**Goal**: Fix existing bugs and ensure solid foundation for frontend work.

### 1.1 Fix getInstalledPlugins Query

**File**: `gennit-backend/customResolvers/queries/getInstalledPlugins.ts`

**Problem**: Returns hardcoded `enabled: false` and `settingsJson: {}` for all plugins because Neo4j OGM doesn't expose relationship properties in selection sets.

**Solution**: Use raw Cypher query to fetch relationship properties:

```cypher
MATCH (sc:ServerConfig)-[r:INSTALLED]->(pv:PluginVersion)-[:BELONGS_TO]->(p:Plugin)
RETURN p.id as pluginId, p.name as pluginName,
       pv.version as version, pv.manifest as manifest,
       r.enabled as enabled, r.settingsJson as settingsJson
```

**Tasks**:
- [ ] Write raw Cypher query to fetch installation properties
- [ ] Update resolver to use Cypher instead of OGM
- [ ] Add unit tests for the resolver
- [ ] Verify frontend receives correct enabled/settings values

### 1.2 Add Plugin Execution Order Support

**Files**:
- `gennit-backend/typeDefs.ts` - Add order field
- `gennit-backend/services/pluginRunner.ts` - Sort by order

**Schema Changes**:
```graphql
# Add to InstallationProperties
type InstallationProperties @relationshipProperties {
  enabled: Boolean!
  settingsJson: JSON
  executionOrder: Int  # New field - lower numbers run first
}

# Add mutation
type Mutation {
  setPluginExecutionOrder(pluginVersionId: ID!, order: Int!): InstalledPlugin
}
```

**Tasks**:
- [ ] Add `executionOrder` to InstallationProperties in schema
- [ ] Update pluginRunner to sort plugins by executionOrder before running
- [ ] Create `setPluginExecutionOrder` mutation
- [ ] Add migration script to set default order (0) for existing installations

### 1.3 Add Pipeline Status Tracking

**Files**:
- `gennit-backend/typeDefs.ts` - Extend PluginRun
- `gennit-backend/services/pluginRunner.ts` - Track pipeline stages

**Schema Changes**:
```graphql
enum PluginRunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  SKIPPED
}

type PluginRun {
  # Existing fields...
  status: PluginRunStatus!
  pipelineId: String  # Groups runs for same event
  order: Int          # Execution order in pipeline
  skippedReason: String  # If SKIPPED, why
}

type Query {
  getPipelineRuns(targetId: ID!, targetType: String!): [PluginRun!]!
}
```

**Tasks**:
- [ ] Add status enum and pipelineId to PluginRun schema
- [ ] Generate unique pipelineId when event triggers
- [ ] Create PENDING records for all plugins before execution starts
- [ ] Update status to RUNNING → SUCCESS/FAILED as each runs
- [ ] Add SKIPPED status for plugins that don't run (e.g., previous failed)
- [ ] Create `getPipelineRuns` query

### 1.4 Add Conditional Execution Support

**File**: `gennit-backend/services/pluginRunner.ts`

**Logic**:
- If a plugin fails and subsequent plugins depend on it, mark them SKIPPED
- Track dependencies in manifest (optional future enhancement)
- For now: simple "stop on first failure" mode as a plugin setting

**Tasks**:
- [ ] Add `stopPipelineOnFailure` server setting
- [ ] When enabled, mark remaining plugins as SKIPPED after first failure
- [ ] Store skippedReason: "Previous plugin failed"

---

## Phase 2: Plugin Details & README Display

**Goal**: Show plugin information from manifest on detail page.

### 2.1 Backend: Expose Plugin Metadata

**Files**:
- `gennit-backend/customResolvers/queries/` - New or updated queries

**Tasks**:
- [ ] Ensure `getInstalledPlugins` returns full manifest including:
  - `metadata.author` (name and URL)
  - `metadata.homepage`
  - `metadata.license`
  - `metadata.tags`
  - `documentation.readmePath`
- [ ] Add query to fetch README content by plugin version ID
- [ ] Consider caching README content in database on install

### 2.2 Frontend: Plugin Detail Page Enhancements

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [ ] Display plugin author with link to author URL
- [ ] Display homepage link
- [ ] Display license badge
- [ ] Display tags as chips
- [ ] Render README markdown content (use existing markdown renderer)
- [ ] Add "View Source" link to repository

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

## Phase 3: Pipeline/CI-CD View

**Goal**: Give maintainers visibility into plugin execution with a pipeline-like UI.

### 3.1 Design Pipeline Data Model

**Concept**: When a file is uploaded, all enabled plugins form a "pipeline" that runs in order.

```
Pipeline for "game-mod.zip" upload
├── [1] Security Scan      ✓ Passed (1.2s)
├── [2] Auto-Labeler       ✓ Passed (0.3s)
└── [3] Thumbnail Gen      ⏳ Running...
```

**Data Flow**:
1. File uploaded → triggers `downloadableFile.created` event
2. Backend creates PluginRun records with status=PENDING for all enabled plugins
3. Each plugin runs in order, updating status to RUNNING → SUCCESS/FAILED
4. Frontend polls or subscribes for updates
5. User sees pipeline progress in real-time

### 3.2 Backend: Pipeline Query

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
    order
    skippedReason
    createdAt
    updatedAt
  }
}
```

**Tasks**:
- [ ] Create resolver that fetches PluginRun records by targetId
- [ ] Group by pipelineId (for multiple runs over time)
- [ ] Sort by order within each pipeline
- [ ] Include plugin display name from manifest

### 3.3 Frontend: Pipeline Component

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
- [ ] Create `PluginPipeline.vue` component
- [ ] Create `PluginPipelineStage.vue` component
- [ ] Create `usePluginPipeline` composable with polling
- [ ] Add GraphQL query `GET_PIPELINE_RUNS`
- [ ] Style with Tailwind (match CI/CD aesthetic)

### 3.4 Frontend: Integrate Pipeline into Download Detail

**File**: `components/discussion/detail/DownloadDetailContent.vue` (or similar)

**Tasks**:
- [ ] Add "Plugin Pipeline" section to download detail view
- [ ] Show pipeline for the download's file
- [ ] For uploaders: show immediately after upload
- [ ] For viewers: show scan status (passed/failed)
- [ ] Add loading state while pipeline is incomplete

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

### 3.5 Frontend: Pipeline Logs Modal

**New File**: `components/plugins/PluginLogsModal.vue`

**Features**:
- Modal showing detailed logs for a pipeline run
- Syntax highlighting for JSON payloads
- Timestamp for each log entry
- Copy button for logs
- Filter by log level (info, warn, error)

**Tasks**:
- [ ] Create modal component
- [ ] Fetch logs from PluginRun.payload
- [ ] Format and display logs
- [ ] Add to pipeline stage (click to expand)

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

## Phase 6: UI Polish & Bug Fixes

**Goal**: Fix remaining issues and improve UX.

### 6.1 Toast Notifications

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Current State**: Uses `console.log` as placeholder.

**Tasks**:
- [ ] Import/create toast notification composable
- [ ] Replace console.log with toast.success()
- [ ] Replace console.error with toast.error()
- [ ] Add toast for: install, enable, disable, secret set, secret validated

### 6.2 Per-Button Loading States

**File**: `pages/admin/settings/plugins/index.vue`

**Problem**: Clicking one "Allow" button causes all buttons to show loading.

**Solution**: Track loading state per plugin ID.

**Tasks**:
- [ ] Change `loading` from boolean to `Map<string, boolean>` or object
- [ ] Set loading state for specific plugin ID on click
- [ ] Clear loading state for that ID when complete

### 6.3 Disable Enable Switch if Not Installed

**File**: `pages/admin/settings/plugins/[pluginId].vue`

**Tasks**:
- [ ] Check if plugin is installed before showing enable toggle
- [ ] If not installed, show disabled toggle with tooltip
- [ ] Or hide toggle entirely and show "Install to enable" message

### 6.4 Plugin List Improvements

**Tasks**:
- [ ] Add search/filter for plugins
- [ ] Add sorting (name, status, recently updated)
- [ ] Show plugin description in list view
- [ ] Improve empty state when no plugins available

---

## Phase 7: Plugin Ordering UI

**Goal**: Allow admins to control the order plugins run in.

### 7.1 Backend: Ordering Mutation

Already covered in Phase 1.2.

### 7.2 Frontend: Drag-and-Drop Ordering

**New File**: `components/plugins/PluginOrderList.vue`

**Features**:
- Draggable list of enabled plugins
- Visual feedback during drag
- Save order on drop
- Show current order numbers

**Tasks**:
- [ ] Install drag-and-drop library (vuedraggable or similar)
- [ ] Create ordering component
- [ ] Integrate with plugin settings page
- [ ] Add section header explaining ordering

**UI Mockup**:
```
┌─ Plugin Execution Order ─────────────────────────────┐
│ Drag to reorder. Plugins run top to bottom.         │
│                                                      │
│  ≡ [1] Security Attachment Scan                      │
│  ≡ [2] Auto-Labeler                                  │
│  ≡ [3] Thumbnail Generator                           │
│                                                      │
│  [Save Order]                                        │
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

### 8.3 Unit Tests

**New Files**: `tests/unit/components/plugins/*.spec.ts`

**Test Cases**:
- [ ] PluginPipeline renders stages correctly
- [ ] PluginSettingsForm generates fields from schema
- [ ] PluginSecretField shows validation status
- [ ] Version comparison logic

---

## Implementation Order Recommendation

Based on dependencies and value delivery:

1. **Phase 1** (Backend Fixes) - Required foundation
2. **Phase 2** (Plugin Details) - Quick win, improves existing UI
3. **Phase 6** (UI Polish) - Quick fixes, improves UX
4. **Phase 3** (Pipeline View) - Major feature, high value
5. **Phase 4** (Dynamic Forms) - Enables proper plugin configuration
6. **Phase 5** (Version Management) - Nice to have
7. **Phase 7** (Plugin Ordering) - Advanced feature
8. **Phase 8** (Documentation & Testing) - Ongoing

---

## Estimated Scope

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1: Backend Fixes | 12 | Medium |
| Phase 2: Plugin Details | 8 | Low |
| Phase 3: Pipeline View | 15 | High |
| Phase 4: Dynamic Forms | 10 | Medium |
| Phase 5: Version Management | 6 | Low |
| Phase 6: UI Polish | 8 | Low |
| Phase 7: Plugin Ordering | 5 | Medium |
| Phase 8: Docs & Testing | 10 | Medium |

---

## Files to Create

### Frontend (multiforum-nuxt)
- `components/plugins/PluginPipeline.vue`
- `components/plugins/PluginPipelineStage.vue`
- `components/plugins/PluginLogsModal.vue`
- `components/plugins/PluginSettingsForm.vue`
- `components/plugins/PluginOrderList.vue`
- `components/plugins/fields/PluginTextField.vue`
- `components/plugins/fields/PluginNumberField.vue`
- `components/plugins/fields/PluginBooleanField.vue`
- `components/plugins/fields/PluginSelectField.vue`
- `components/plugins/fields/PluginSecretField.vue`
- `composables/usePluginPipeline.ts`
- `graphQLData/plugins/queries.ts` (or add to admin/queries.js)
- `pages/admin/settings/plugins/docs.vue`
- `tests/cypress/e2e/plugins/pluginManagement.spec.cy.ts`
- `tests/unit/components/plugins/*.spec.ts`

### Backend (gennit-backend)
- Update `customResolvers/queries/getInstalledPlugins.ts`
- Create `customResolvers/queries/getPipelineRuns.ts`
- Create `customResolvers/mutations/setPluginExecutionOrder.ts`
- Update `services/pluginRunner.ts`
- Update `typeDefs.ts`

---

## Notes

- Channel-level plugin configuration is explicitly deferred per user request
- The security-attachment-scan plugin already exists and is functional
- The pipeline view is the highest-value missing feature for maintainer visibility
- Consider WebSocket/subscription for real-time pipeline updates (future enhancement)
