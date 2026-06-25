# Plugins Feature Documentation

The plugins feature documentation has been split into two documents:

## [PLUGINS_IMPLEMENTED.md](./PLUGINS_IMPLEMENTED.md)

Documents all completed plugin system functionality:
- Backend plugin management (CRUD, registry, secrets, execution)
- Frontend plugin management UI
- Dynamic forms from plugin schemas
- Pipeline view and execution tracking
- Pipeline configuration UI (YAML/Visual editor)
- Unit test coverage

## [PLUGINS_ROADMAP.md](./PLUGINS_ROADMAP.md)

Documents remaining work:
- **Server-Scoped vs Channel-Scoped Pipelines** - Architecture explanation
- **Phase 9: Channel-Scoped Pipeline Configuration** - Primary remaining work
  - Channel pipeline events (`discussionChannel.created`)
  - Channel-level pipeline configuration UI
  - Auto-labeling for channel-specific download filters
- **Phase 5: Plugin Version Management** - Update outdated plugins
- **Phase 8: Documentation & E2E Testing** - Polish

---

## Quick Reference

### Current Status

| Component | Status |
|-----------|--------|
| Backend - Server Plugin Management | ✅ Complete |
| Backend - Server Pipeline Execution | ✅ Complete |
| Backend - Channel Pipeline Support | ❌ Not Started |
| Frontend - Plugin Management UI | ✅ Complete |
| Frontend - Pipeline Configuration | ✅ Complete (Server-scoped) |
| Frontend - Channel Pipeline Config | ❌ Not Started |
| Auto-Labeler Plugin | ❌ Needs Channel Context |

### Pipeline Execution Flow

```
File Upload
    ↓
Server Pipeline (downloadableFile.created)
  • Security scan
  • Thumbnail generation
    ↓
Submit to Channel
    ↓
Channel Pipeline (discussionChannel.created)
  • Auto-labeling for channel filters
    ↓
Download Available with Labels
```

### Key Files

**Server Pipeline Config:**
- Page: `/admin/settings/plugins/pipelines`
- Storage: `ServerConfig.pluginPipelines`

**Channel Pipeline Config (planned):**
- Page: `/c/[channelUniqueName]/settings/plugins/pipelines`
- Storage: `Channel.pluginPipelines`
