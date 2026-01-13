# Plugins Feature - Roadmap

This document describes remaining work for the Multiforum plugin system.

---

## Server-Scoped vs Channel-Scoped Pipelines

### Concept Overview

The plugin system supports two scopes of pipeline configuration:

| Scope | Configured By | Stored On | Triggered By | Use Case |
|-------|--------------|-----------|--------------|----------|
| **Server** | Server Admin | `ServerConfig.pluginPipelines` | File events (`downloadableFile.*`) | Security scanning, virus detection |
| **Channel** | Channel Admin | `Channel.pluginPipelines` | Channel events (`discussionChannel.created`) | Auto-labeling for channel-specific filters |

### Pipeline Execution Flow

When a video game mod is uploaded and submitted to a channel:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FILE UPLOAD                                                   │
│    User uploads game-mod.zip                                     │
│    ↓                                                             │
│ 2. SERVER-SCOPED PIPELINE (downloadableFile.created)            │
│    Triggered automatically on file upload                        │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ [1] Security Scan ──────── ✓ Passed (virus check)       │  │
│    │ [2] Thumbnail Gen ──────── ✓ Passed (preview image)     │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ↓                                                             │
│ 3. USER SUBMITS TO CHANNEL                                       │
│    Discussion with download is connected to a channel            │
│    Creates DiscussionChannel relationship                        │
│    ↓                                                             │
│ 4. CHANNEL-SCOPED PIPELINE (discussionChannel.created)          │
│    Triggered when DiscussionChannel is created                   │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ [1] Auto-Labeler ──────── ✓ Passed                       │  │
│    │     • Detected: Unity game, Windows, 2.3GB               │  │
│    │     • Applied labels: [unity] [windows] [large-file]     │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ↓                                                             │
│ 5. DOWNLOAD AVAILABLE                                            │
│    Labels enable channel's download filters to work              │
│    Users can filter by: game engine, platform, file size, etc.   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Scopes?

**Server-scoped pipelines** handle universal concerns:
- Security scanning (all uploads should be virus-checked)
- Content moderation (detect prohibited content)
- File processing (generate thumbnails, extract metadata)

**Channel-scoped pipelines** handle channel-specific concerns:
- Auto-labeling based on channel's taxonomy (game engines, platforms, genres)
- Channel-specific validation rules
- Custom metadata extraction based on channel focus

### Key Difference: Trigger Events

| Event | Scope | When Triggered | Context Available |
|-------|-------|----------------|-------------------|
| `downloadableFile.created` | Server | File is uploaded | File metadata, uploader |
| `downloadableFile.updated` | Server | File is modified | File metadata, uploader |
| `discussionChannel.created` | Channel | Discussion connected to channel | Discussion, file, channel config |

The `discussionChannel.created` event provides the channel context needed for channel-specific labeling.

---

## Phase 9: Channel-Scoped Pipeline Configuration

**Goal**: Allow channel admins to configure plugins that run when content is submitted to their channel.

### 9.1 Backend: New Event Type

**Event**: `discussionChannel.created`

**Trigger Conditions**:
- A DiscussionChannel relationship is created
- The Discussion has `hasDownload: true`
- The Channel has `pluginPipelines` configured

**Files to Modify**:
- [ ] `typeDefs.ts` - Add `pluginPipelines: JSON` to Channel type
- [ ] `services/pluginRunner.ts` - Handle new event type
- [ ] Create trigger in discussion submission flow

**Schema Changes**:
```graphql
type Channel {
  # ... existing fields
  pluginPipelines: JSON  # Channel-scoped pipeline configuration
}

input EventPipelineInput {
  event: String!  # Now supports: downloadableFile.*, discussionChannel.created
  steps: [PipelineStepInput!]!
  stopOnFirstFailure: Boolean
}
```

### 9.2 Backend: Channel Pipeline Mutation

**New Mutation**: `updateChannelPluginPipelines`

```graphql
type Mutation {
  updateChannelPluginPipelines(
    channelUniqueName: String!
    pipelines: [EventPipelineInput!]!
  ): JSON!
}
```

**File**: `customResolvers/mutations/updateChannelPluginPipelines.ts`

**Tasks**:
- [ ] Create mutation resolver
- [ ] Validate channel admin permissions
- [ ] Validate pipeline configuration
- [ ] Store on Channel node

### 9.3 Backend: Pipeline Execution for Channel Events

**File**: `services/pluginRunner.ts`

**Tasks**:
- [ ] Add `runChannelPipeline` function
- [ ] Load pipeline config from Channel node
- [ ] Execute plugins with channel context
- [ ] Track PluginRun records with channel reference

**Context Passed to Plugins**:
```typescript
interface ChannelPipelineContext {
  event: 'discussionChannel.created';
  discussion: {
    id: string;
    title: string;
    body: string;
  };
  downloadableFile: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
  channel: {
    uniqueName: string;
    displayName: string;
    // Channel's label taxonomy for auto-labeling
    availableLabels: Label[];
  };
}
```

### 9.4 Backend: Trigger Channel Pipeline

**File**: `customResolvers/mutations/createDiscussionChannel.ts` (or equivalent)

**Tasks**:
- [ ] After DiscussionChannel is created, check if Discussion has download
- [ ] If yes, check if Channel has `pluginPipelines` for `discussionChannel.created`
- [ ] If yes, trigger channel pipeline execution
- [ ] Ensure server pipeline completed first (if applicable)

### 9.5 Frontend: Channel Pipeline Configuration Page

**New File**: `pages/c/[channelUniqueName]/settings/plugins/pipelines.vue`

**Features**:
- Reuse `PluginPipelineEditor` component from server-level
- Filter events to show only channel-relevant events
- Load/save from Channel's `pluginPipelines` field
- Channel admin permission check

**Tasks**:
- [ ] Create channel settings page for pipeline configuration
- [ ] Add navigation from channel settings menu
- [ ] Adapt `PluginPipelineEditor` for channel context
- [ ] Add `GET_CHANNEL_PLUGIN_PIPELINES` query
- [ ] Add `UPDATE_CHANNEL_PLUGIN_PIPELINES` mutation

### 9.6 Frontend: Update Pipeline Schema

**File**: `utils/pipelineSchema.ts`

**Tasks**:
- [ ] Add `discussionChannel.created` to `PIPELINE_EVENTS`
- [ ] Update event descriptions for clarity
- [ ] Add scope indicator to events (server vs channel)

```typescript
export const PIPELINE_EVENTS = [
  // Server-scoped events
  {
    value: 'downloadableFile.created',
    label: 'File Upload',
    description: 'Triggered when a downloadable file is uploaded',
    scope: 'server',
  },
  {
    value: 'downloadableFile.updated',
    label: 'File Updated',
    description: 'Triggered when a downloadable file is modified',
    scope: 'server',
  },
  // Channel-scoped events
  {
    value: 'discussionChannel.created',
    label: 'Content Submitted to Channel',
    description: 'Triggered when a discussion with download is submitted to this channel',
    scope: 'channel',
  },
] as const;
```

### 9.7 Frontend: Channel Pipeline View

**File**: `components/channel/DownloadSidebar.vue` (or similar)

**Tasks**:
- [ ] Show both server and channel pipeline results
- [ ] Distinguish between pipeline scopes in UI
- [ ] Show auto-applied labels from channel pipeline

**UI Mockup**:
```
┌─ Plugin Pipelines ───────────────────────────────────────────────┐
│                                                                   │
│  Server Pipeline                                                  │
│  ● Security Scan ──────────────── ✓ Passed (1.2s)                │
│  ● Thumbnail Generator ────────── ✓ Passed (0.8s)                │
│                                                                   │
│  Channel Pipeline (Gaming Mods)                                   │
│  ● Auto-Labeler ───────────────── ✓ Passed (0.5s)                │
│    Applied: [unity] [windows] [large-file]                       │
│                                                                   │
│  [View Logs]                                                      │
└───────────────────────────────────────────────────────────────────┘
```

### 9.8 Auto-Labeler Plugin Enhancement

**Repository**: `multiforum-plugins`

**Tasks**:
- [ ] Update auto-labeler plugin to accept channel context
- [ ] Read channel's available labels
- [ ] Analyze file metadata to determine applicable labels
- [ ] Return applied labels in plugin output
- [ ] Backend applies returned labels to discussion

**Plugin Input Context**:
```json
{
  "event": "discussionChannel.created",
  "file": {
    "fileName": "awesome-mod-v1.2.zip",
    "fileSize": 2468421632,
    "mimeType": "application/zip"
  },
  "channel": {
    "availableLabels": [
      { "name": "unity", "category": "engine" },
      { "name": "unreal", "category": "engine" },
      { "name": "windows", "category": "platform" },
      { "name": "linux", "category": "platform" },
      { "name": "small-file", "category": "size" },
      { "name": "large-file", "category": "size" }
    ]
  }
}
```

**Plugin Output**:
```json
{
  "success": true,
  "appliedLabels": ["unity", "windows", "large-file"],
  "confidence": {
    "unity": 0.95,
    "windows": 0.99,
    "large-file": 1.0
  }
}
```

### 9.9 Unit Tests

**Files to Create**:
- [ ] `utils/pipelineSchema.spec.ts` - Test channel events
- [ ] `pages/c/[channelUniqueName]/settings/plugins/pipelines.spec.ts`

**Test Cases**:
- [ ] Channel pipeline configuration validation
- [ ] Event filtering by scope
- [ ] Channel admin permission checks
- [ ] Pipeline execution order (server before channel)

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

## Phase 8: Documentation & E2E Testing

**Goal**: Complete documentation and add E2E test coverage.

### 8.1 In-App Documentation

**New File**: `pages/admin/settings/plugins/docs.vue`

**Content**:
- How to set up a plugin registry
- Registry JSON format
- How to create a plugin (link to PLUGIN_REQUIREMENTS.md)
- Troubleshooting common issues
- Server vs Channel pipeline configuration

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
- [ ] Configure server pipeline
- [ ] Configure channel pipeline
- [ ] Verify auto-labeling on channel submission

---

## Implementation Priority

Based on the use case of video game mod uploads with channel-specific auto-labeling:

| Priority | Phase | Description | Reason |
|----------|-------|-------------|--------|
| 1 | **Phase 9.1-9.4** | Backend channel pipeline support | Core functionality needed |
| 2 | **Phase 9.5-9.6** | Frontend channel pipeline config UI | Enables channel admins to configure |
| 3 | **Phase 9.8** | Auto-labeler plugin enhancement | Implements the auto-labeling feature |
| 4 | **Phase 9.7** | Channel pipeline view | Shows results to users |
| 5 | **Phase 5** | Version management | Nice to have |
| 6 | **Phase 8** | Documentation & E2E tests | Polish |

---

## Technical Considerations

### Permission Model

**Server Pipeline Configuration**:
- Requires server admin role
- Stored on `ServerConfig` node

**Channel Pipeline Configuration**:
- Requires channel admin role (user in `Channel.Admins`)
- Stored on `Channel` node
- Only plugins allowed at server level can be used

### Pipeline Execution Order

1. Server pipelines always run first (on file upload)
2. Channel pipelines run after (on channel submission)
3. If server pipeline fails with `stopOnFirstFailure`, channel submission may be blocked

### Plugin Availability for Channels

Channels can only use plugins that are:
1. Allowed at server level
2. Installed at server level
3. Enabled at server level

Channel admins configure *which* enabled plugins run and *in what order* for their channel, but cannot enable plugins that the server admin hasn't approved.

### Label Application

When auto-labeler plugin returns `appliedLabels`:
1. Backend validates labels exist in channel's taxonomy
2. Backend creates `DiscussionLabel` relationships
3. Labels become available for channel's download filters

---

## Files Summary

### Backend (gennit-backend)

**To Create**:
- `customResolvers/mutations/updateChannelPluginPipelines.ts`
- `customResolvers/queries/getChannelPluginPipelines.ts`

**To Modify**:
- `typeDefs.ts` - Add `pluginPipelines` to Channel
- `services/pluginRunner.ts` - Add channel pipeline execution
- Discussion submission flow - Trigger channel pipeline

### Frontend (multiforum-nuxt)

**To Create**:
- `pages/c/[channelUniqueName]/settings/plugins/pipelines.vue`
- `graphQLData/channel/queries.js` - Add channel pipeline queries
- `graphQLData/channel/mutations.js` - Add channel pipeline mutations

**To Modify**:
- `utils/pipelineSchema.ts` - Add channel events
- `components/channel/DownloadSidebar.vue` - Show both pipeline scopes
- `components/plugins/PluginPipelineEditor.vue` - Support channel context

### Plugins Repository (multiforum-plugins)

**To Modify**:
- `auto-labeler/` - Add channel context handling, label application logic
