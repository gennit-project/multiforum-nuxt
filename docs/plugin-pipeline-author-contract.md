# Plugin pipeline author contract

Third-party plugins can emit structured public diagnostics through the
pipeline runtime diagnostic callback. A diagnostic has:

```ts
type PublicDiagnostic = {
  level: "INFO" | "WARNING" | "ERROR";
  code: string;
  message: string;
  details?: unknown;
  helpUrl?: string;
};
```

Authors must:

- use a stable uppercase `code`;
- write a concise, non-technical `message`;
- keep `details` bounded, JSON-serializable, and safe for anonymous visitors;
- use an HTTPS `helpUrl`;
- avoid secrets, tokens, signed URLs, storage paths, private user data, raw
  request/response bodies, and stack traces;
- report the actionable cause, not transient implementation details.

The host validates, bounds, and redacts diagnostics before storage. Invalid
entries are discarded. Private debugging information belongs in the internal
plugin log and is visible only to administrators with plugin-management
permission.

First-party plugins follow this same contract. Their published codes are
catalogued in [plugin-pipeline-diagnostics.md](./plugin-pipeline-diagnostics.md).
