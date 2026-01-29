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

---

## Phase 9.8: Auto-Labeler Plugin (Remaining Work)

**Repository**: `multiforum-plugins` (local: `/gennit/plugins/auto-labeler`)

**Completed**:
- ✅ Backend passes `filterGroups` in channel context to plugins
- ✅ Created stubbed auto-labeler plugin that logs available filters

**Remaining Tasks**:
- [ ] Analyze file metadata to determine applicable labels
- [ ] Return applied labels in plugin output
- [ ] Backend applies returned labels to discussion
- [ ] Publish plugin to registry

**Plugin Output** (target format):
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

---

## Implementation Priority

| Priority | Phase | Description | Status |
|----------|-------|-------------|--------|
| 1 | **Phase 9.8** | Auto-labeler plugin (remaining) | 🔄 IN PROGRESS |

---

## Technical Considerations

### Registry Publishing Model (Plugin-Scoped)

- Each plugin release is versioned independently in its own `plugin.json`.
- Registries should merge new versions without removing other plugins or older versions.
- Multiple registries are supported; servers may point to different registries for different plugin catalogs.

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

## Files to Create/Modify

### Backend (gennit-backend)

**Phase 9.8 (remaining)**:
- [ ] Apply labels returned by auto-labeler plugin to discussions

### Plugins Repository (multiforum-plugins)

**Phase 9.8 (remaining)**:
- [ ] `auto-labeler/` - Implement actual labeling logic based on file metadata
