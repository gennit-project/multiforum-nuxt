# Image Performance Plan

This document is the execution plan for fixing image-related Core Web Vitals
regressions in `multiforum-nuxt`.

It complements [core-web-vitals-plan.md](./core-web-vitals-plan.md) and narrows
the work specifically to image delivery, sizing, and rendering behavior.

## Summary

The current public UI still sends too many raw image URLs directly to `<img>`
elements.

That creates three recurring problems:

1. small list and avatar surfaces can download oversized originals
2. many image surfaces do not declare width, height, or `sizes`
3. the browser has too little guidance about lazy loading, decoding, and fetch priority

## Current High-Impact Surfaces

### Public list surfaces

- [components/discussion/list/SitewideDiscussionListItem.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/discussion/list/SitewideDiscussionListItem.vue)
- [components/discussion/list/ChannelDiscussionListItem.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/discussion/list/ChannelDiscussionListItem.vue)
- [components/event/list/EventListItem.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/event/list/EventListItem.vue)
- [components/image/ImageListItem.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/image/ImageListItem.vue)

### Avatar surfaces

- [components/AvatarComponent.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/AvatarComponent.vue)
- [components/user/PhotoAvatar.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/user/PhotoAvatar.vue)

### Detail and gallery surfaces

- [components/discussion/detail/DiscussionAlbum.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/discussion/detail/DiscussionAlbum.vue)
- [components/discussion/detail/ImageLightbox.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/discussion/detail/ImageLightbox.vue)
- [components/discussion/detail/LightboxImagePanel.vue](/Users/catherineluse/.codex/worktrees/720d/multiforum-nuxt/components/discussion/detail/LightboxImagePanel.vue)

## Constraints

There is not yet a proper generated-thumbnail pipeline in storage/backend.

That means the image work needs two phases:

1. immediate frontend delivery improvements using the existing Nuxt image stack
2. true generated variants once backend/storage can emit canonical thumbnail URLs

## Goals

### Phase 1

- stop sending raw original URLs to the highest-traffic public list surfaces
- add explicit dimensions or stable aspect ratios
- apply `sizes`, `loading`, `decoding`, and selective `fetchpriority`
- centralize the optimization decision so every component does not invent its own rules

### Phase 2

- generate durable storage variants for avatars, list thumbnails, and detail media
- expose those variants through GraphQL
- prevent regressions by making thumbnail surfaces reject raw originals

## Proposed Architecture

### 1. Shared optimization helper

Add a small helper that decides whether a URL can safely go through the current
Nuxt image pipeline.

Initially this should optimize only URLs already supported by the current image
configuration, especially:

- same-origin paths
- `storage.googleapis.com`

Arbitrary external markdown images should continue to fall back to plain `<img>`
until the optimization rules can be widened safely.

### 2. Shared wrapper component

Add one wrapper component that:

- renders `NuxtImg` when the source is eligible for optimization
- falls back to `<img>` when it is not
- preserves width, height, `sizes`, `loading`, `decoding`, `fetchpriority`, and classes

This provides a single migration point for Phase 1.

### 3. Surface policies

#### Avatars

- target sizes: `32`, `48`, `64`, `96`
- default to `loading="lazy"` and `decoding="async"` outside clearly critical shells
- always declare width and height when the component controls them

#### Public list thumbnails

- discussion list thumb: `80x80`
- desktop event card thumb: `128x128`
- mobile event cover image: larger responsive width with `sizes`
- list surfaces should not request original full-width assets when optimization is available

#### Detail galleries

- thumbnail strips should use thumbnail-sized variants
- main visible image should use a medium/large variant
- lightbox can continue to use large assets until generated variants exist

## Delivery Order

### Slice 1: Avatars and public list thumbnails

Start with:

- `AvatarComponent`
- `PhotoAvatar`
- `SitewideDiscussionListItem`
- `EventListItem`

These are common, public, visually small, and highly likely to be overserved today.

### Slice 2: Forum discussion list and image list cards

- `ChannelDiscussionListItem`
- `ImageListItem`
- album index and library thumbnails

### Slice 3: Discussion album thumbnail surfaces

- `DiscussionAlbum`
- `CarouselThumbnail`
- `LightgalleryAlbum`

### Slice 4: Detail-page main media

- main discussion album image
- event detail cover images
- other above-the-fold detail media

### Slice 5: Markdown image rendering

Markdown should be last because it is the least controlled image source and may
include arbitrary external URLs.

## Backend Follow-up

When thumbnail generation becomes available, the system should evolve to:

1. generate avatar/list/detail variants at upload time
2. store intrinsic width and height for originals and variants
3. expose variants through GraphQL
4. move list surfaces from best-effort optimization to hard thumbnail requirements

Suggested variant families:

- avatar: `32`, `48`, `64`, `96`
- list/card: `80`, `160`, `320`
- detail content: `640`, `960`, `1280`

## Verification

For each slice:

1. verify targeted surfaces no longer render raw originals when optimization is available
2. confirm `loading`, `decoding`, and `sizes` are present where expected
3. compare transferred image bytes in DevTools before and after
4. verify no layout regressions or broken external-image fallbacks

## Progress

### August 8, 2026

Started Phase 1 Slice 1:

- introduce a shared optimized-image wrapper and URL eligibility helper
- migrate avatar surfaces
- migrate the sitewide discussion list thumbnail
- migrate event list cover images
