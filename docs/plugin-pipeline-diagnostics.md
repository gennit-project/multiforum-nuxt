# Public plugin pipeline diagnostics

Pipeline diagnostics are deliberately public when the download itself is
public. They are intended to be safe to paste into a support discussion and
must never contain credentials, signed storage URLs, private object names,
request headers, stack traces, or raw provider responses.

## Stable codes

Codes are uppercase identifiers containing letters, numbers, and underscores.
Once published, a code keeps the same meaning. Plugins may add fields to
`details`, but consumers must not require undocumented fields.

| Code | Meaning | Typical next step |
| --- | --- | --- |
| `SCAN_COMPLETE` | The provider completed its scan. | No action is needed. |
| `SCAN_PROVIDER_ERROR` | The scan provider could not complete the request. | Retry later; ask an administrator if it repeats. |
| `ARCHIVE_CONTAINS_EXECUTABLE` | An archive contains an executable file. | Remove the executable or explain why it is required. |
| `PLUGIN_VERSION_REQUIRES_NEWER_SERVER` | The installed plugin requires a newer server. | Ask an administrator to update the server. |
| `PLUGIN_API_VERSION_UNSUPPORTED` | The plugin uses an unsupported API contract. | Install a compatible plugin version. |

Plugin-specific codes should be documented by the plugin and linked through
`helpUrl`. The public Pipelines tab also offers **Ask the community**, which
opens a discussion carrying the attempt ID and diagnostic code.

## Sharing

Each attempt has a stable URL based on its immutable `pipelineId`. **Copy
diagnostics** copies only the public projection. **Share this attempt** shares
that stable URL and never exposes the internal payload or logs.
