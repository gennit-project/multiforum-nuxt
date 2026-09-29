# AI image-text suggestion spike

This spike adds an optional **Suggest text with AI** control to images in the
album editor. It generates separate drafts for alt text and captions. Neither
draft is saved until the author chooses **Use alt text** or **Use caption**.

## Configure locally

Set these server environment variables before starting Nuxt:

```sh
AI_GATEWAY_API_KEY=...
NUXT_AI_IMAGE_TEXT_MODEL=openai/gpt-5.4
NUXT_PUBLIC_AI_IMAGE_TEXT_SUGGESTIONS_ENABLED=true
```

`AI_GATEWAY_API_KEY` and `NUXT_AI_IMAGE_TEXT_MODEL` are server-only.
`NUXT_PUBLIC_AI_IMAGE_TEXT_SUGGESTIONS_ENABLED` exposes only the availability
of the UI control.

The selected model must accept image input and structured object output.

## Spike boundaries

- Requests require an authenticated Multiforum session.
- The endpoint accepts only HTTPS images in the instance's configured Google
  Cloud Storage bucket. URL-added and third-party images are rejected.
- Existing alt text and captions are never overwritten automatically.
- Suggestions are not treated as accessibility validation. Authors are told to
  review them before saving.
- Discussion text is not sent to the model. Image metadata is stored on the
  reusable `Image` node, so discussion-specific copy could become misleading
  when the same image is reused in another album.
- The image and its current alt text and caption are shared with the configured
  AI provider only after the author presses the suggestion button.

## Questions for the spike

Track suggestion latency, provider cost, acceptance rate, and how substantially
authors edit accepted text. Before moving beyond the spike, decide whether image
metadata should remain global or move to the album-image relationship so that
context-specific alt text can be represented safely.
