---
name: apollo-data
description: Wire GraphQL data with Apollo in Vue components/composables. Use whenever adding or editing a useQuery or useMutation call, handling loading/error/onDone/onResult, typing query variables or mutation inputs, or shaping response types. Enforces using the hook's built-in state (no hand-written shadow refs) and the generated GraphQL types for every input and response.
---

# Apollo data in Vue/Nuxt (this repo)

Two rules, both of which AI-generated PRs here have violated in the past:

1. **Use the hook's built-in state — never hand-roll it.**
2. **Type every input and response from `@/__generated__/graphql` — never `any`.**

`no-explicit-any` is an **error** in application source (relaxed only in `*.spec.ts`),
so untyped GraphQL data will fail lint.

## Rule 1 — use `useQuery` / `useMutation` state directly

`useQuery` returns `result`, `loading`, `error`, `onResult`, `onError`.
`useMutation` returns `mutate`, `loading`, `error`, `onDone`, `onError`.
Bind the UI to these refs. Do **not** create parallel `const loading = ref(false)` /
`const errorMessage = ref('')` and drive them by hand — that's the messy antipattern.

```vue
<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable';

// ✅ query: consume result/loading/error; react via onResult, not a watcher+ref
const { result: tagsResult, loading: tagsLoading, error: tagsError, onResult } = useQuery(GET_TAGS, variables);
const tags = computed(() => tagsResult.value?.tags ?? []);
onResult(({ data }) => { /* side effects only when needed */ });

// ✅ mutation: consume loading/error; run side effects in onDone/onError
const { mutate: createTag, loading: createLoading, error: createError, onDone, onError } = useMutation(CREATE_TAG);
onDone(({ data }) => { /* e.g. close modal, emit */ });
</script>

<template>
  <!-- bind straight to the hook's refs -->
  <BaseButton :loading="tagsLoading || createLoading" :disabled="createLoading" />
  <ErrorBanner v-if="tagsError" :error="tagsError" />
</template>
```

```vue
<!-- ❌ don't do this -->
const loading = ref(false);
const errorMessage = ref('');
async function load() {
  loading.value = true;
  try { /* ... */ } catch (e) { errorMessage.value = String(e); }
  finally { loading.value = false; }
}
```

Existing good references: `components/TagPicker.vue`, `components/mod/IssueDetail.vue`,
`composables/useCommentPermissions.ts` (query `result`/`loading`), and the
`onDone`-driven mutations in `composables/useCommentCrudMutations.ts`.

## Rule 2 — generated types for inputs AND responses

The generated schema in `@/__generated__/graphql` has a type for essentially everything:
`XxxQueryVariables`, `XxxMutationVariables`, entity types (`Discussion`, `Comment`,
`Event`, `User`, …), and `…Input` / `…Where` / `…CreateInput` shapes.

- **Variables / inputs:** type them with the generated `…QueryVariables` /
  `…MutationVariables` / `…Input` type — not an inline `{ id: string }` and never `any`.
- **Responses:** rely on the generated result type (`useQuery`'s `result` is already typed
  from the document); when you pass data around, annotate with the generated entity type.
- **Subsets:** when a function/prop needs only part of an entity, use `Pick` (or `Omit`)
  on the generated type rather than redefining a partial interface or widening to `any`:

```ts
import type {
  Discussion,
  GetDiscussionQueryVariables,
  UpdateDiscussionMutationVariables,
} from '@/__generated__/graphql';

// subset instead of a hand-written interface or `any`
type DiscussionCardData = Pick<Discussion, 'id' | 'title' | 'createdAt'>;

const variables: GetDiscussionQueryVariables = { id };
const { result } = useQuery(GET_DISCUSSION, variables);
```

- Only reach for `any` as a genuine last resort for **untyped third-party interop**
  (e.g. Three.js in `StlViewer.vue`), and then with a targeted
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + a reason — never for
  GraphQL data, which is always typed.
- For the known GraphQL-error `as any` cast used in some templates, see CLAUDE.md
  (Error Type Handling) — prefer the generated/`ApolloError` type where possible.

## Before finishing
`pnpm run lint` (no-explicit-any is now an error) and `pnpm run tsc` must pass. Test
components that use Apollo by mocking it at the module level — see
[write-unit-test](../write-unit-test/SKILL.md).
