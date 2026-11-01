import assert from 'node:assert/strict';
import test from 'node:test';
import {
  auditConsumers,
  enforcementFailures,
} from './typed-operation-consumers.mjs';

const mapping = {
  'graphQLData/queries.ts#ONE': {
    operations: [{ document: 'OneDocument' }],
    fragments: [],
  },
  'graphQLData/queries.ts#TWO': {
    operations: [{ document: 'TwoDocument' }],
    fragments: [],
  },
};
const audit = (files) => auditConsumers('/fixture', { files, mapping });
const imports = `import { OneDocument as ONE, TwoDocument as TWO } from '@/__generated__/operations';`;

test('counts generated aliases at actual hook/cache/server consumption boundaries', () => {
  const result = audit({
    'app.ts': `${imports}
    import { useQuery as queryHook } from '@vue/apollo-composable';
    queryHook(ONE); client.query({query: ONE}); cache.readQuery({query: TWO});
    cache.writeFragment({fragment: ONE, data: {}}); requestGraphql('/graphql', TWO, {});`,
  });
  assert.deepEqual(
    result.boundaries.map((item) => [item.kind, item.status]),
    [
      ['useQuery', 'generated'],
      ['query', 'generated'],
      ['readQuery', 'generated'],
      ['writeFragment', 'generated'],
      ['requestGraphql', 'generated'],
    ]
  );
});

test('generated exports without consumers do not inflate migration progress', () => {
  assert.equal(audit({ 'app.ts': imports }).summary.boundaries, 0);
});

test('raw canonical imports remain raw even when their source has generated output', () => {
  const result = audit({
    'app.ts': `import {ONE} from './graphQLData/queries'; useQuery(ONE);`,
    'graphQLData/queries.ts': 'export const ONE = gql`query One { id }`;',
  });
  assert.equal(result.boundaries[0].status, 'raw');
});

test('resolves imported reexports and namespace hook aliases', () => {
  const result = audit({
    'app.ts': `import * as apollo from '@vue/apollo-composable'; import {ALIAS} from './docs'; apollo.useMutation(ALIAS);`,
    'docs.ts': `export {OneDocument as ALIAS} from '@/__generated__/operations';`,
  });
  assert.equal(result.boundaries[0].documents[0].symbol, 'OneDocument');
});

test('follows every branch of computed document maps and factories', () => {
  const result = audit({
    'app.ts': `${imports}
    const selected = computed(() => { const map = {first: ONE, second: TWO}; return map[choice]; });
    useQuery(selected);`,
  });
  assert.deepEqual(
    result.boundaries[0].documents.map((item) => item.symbol),
    ['OneDocument', 'TwoDocument']
  );
});

test('one raw branch prevents a runtime-selected hook being counted migrated', () => {
  const result = audit({
    'app.ts': `${imports} const LEGACY = gql\`query Legacy { id }\`; useQuery(() => flag ? ONE : LEGACY);`,
  });
  assert.equal(result.boundaries[0].status, 'raw');
});

test('resolves destructured factory return helpers through imports', () => {
  const result = audit({
    'app.ts': `import {useQueries} from './factory'; const {getQuery} = useQueries(kind); useQuery(getQuery());`,
    'factory.ts': `${imports} export function useQueries(kind) { const getQuery = () => { const queries = {one: ONE, two: TWO}; return queries[kind]; }; return {getQuery}; }`,
  });
  assert.deepEqual(
    result.boundaries[0].documents.map((item) => item.symbol),
    ['OneDocument', 'TwoDocument']
  );
});

test('preserves lexical scope when separate factories use the same local name', () => {
  const result = audit({
    'app.ts': `${imports} function first() { const doc = ONE; useQuery(doc); } function second() { const doc = TWO; useQuery(doc); }`,
  });
  assert.deepEqual(
    result.boundaries.map((item) => item.documents[0].symbol),
    ['OneDocument', 'TwoDocument']
  );
});

test('traces explicit Vue document prop bindings and defaults', () => {
  const result = audit({
    'Parent.vue': `<script setup>${imports} import Child from './Child.vue';</script><template><Child :query="TWO" /></template>`,
    'Child.vue': `<script setup>${imports} const props = defineProps({ query: { default: () => ONE } }); useQuery(props.query);</script><template><div /></template>`,
  });
  assert.deepEqual(
    result.boundaries[0].documents.map((item) => item.symbol).sort(),
    ['OneDocument', 'TwoDocument']
  );
});

test('untyped document-valued props are not counted migrated merely from generated origins', () => {
  const result = audit({
    'Child.vue': `<script setup>${imports} const props = defineProps({ query: {type: Object as PropType<DocumentNode>, default: () => ONE} }); useQuery(props.query);</script>`,
  });
  assert.equal(result.boundaries[0].status, 'typed-with-override');
});

test('generic result overrides and document casts remain explicit review failures', () => {
  const result = audit({
    'app.ts': `${imports} useQuery<SchemaEntity>(ONE); useMutation(ONE as TypedDocumentNode<SchemaEntity, any>);`,
  });
  assert.deepEqual(
    result.boundaries.map((item) => item.status),
    ['typed-with-override', 'typed-with-override']
  );
});

test('resolves indirect client options rather than omitting the boundary', () => {
  const result = audit({
    'app.ts': `${imports} const options = {query: ONE}; client.query(options);`,
  });
  assert.equal(result.boundaries[0].status, 'generated');
});

test('unsupported dynamic document flows fail closed with a location', () => {
  const result = audit({ 'app.ts': 'client.query(optionsFromNetwork);' });
  assert.deepEqual(
    result.boundaries.map((item) => ({
      file: item.file,
      line: item.line,
      status: item.status,
    })),
    [{ file: 'app.ts', line: 1, status: 'unresolved' }]
  );
});

test('records string refetches and schema assertions as supplementary review evidence', () => {
  const result = audit({
    'app.ts': `${imports} import type {User} from '@/__generated__/graphql'; useMutation(ONE, {refetchQueries: ['User']}); const data = result as User;`,
  });
  assert.deepEqual(
    {
      refetch: result.supplementary[0].kind,
      assertion: result.assertions[0].type,
      status: result.boundaries[0].status,
    },
    { refetch: 'refetchQueries-option', assertion: 'User', status: 'generated' }
  );
});

test('exceptions must identify an exact boundary and carry ownership and a resolution', () => {
  const report = audit({ 'app.ts': 'useQuery(unknownDocument);' });
  const boundary = report.boundaries[0];
  const exception = {
    id: boundary.id,
    expression: boundary.expression,
    status: boundary.status,
    contractFingerprint: boundary.contractFingerprint,
    owner: 'frontend maintainers',
    reason: 'Dynamic external wrapper pending migration',
    resolution: 'Replace wrapper with typed discriminated input',
    tracking: '#700',
  };
  assert.deepEqual(
    [
      enforcementFailures(report).length,
      enforcementFailures(report, [exception]).length,
      enforcementFailures(report, [{ ...exception, owner: '' }]).length,
    ],
    [1, 0, 1]
  );
});

test('an approved exception cannot allow a new raw path or silently become stale', () => {
  const initial = audit({ 'app.ts': 'useQuery(unknownDocument);' });
  const boundary = initial.boundaries[0];
  const exception = {
    id: boundary.id,
    expression: boundary.expression,
    status: boundary.status,
    contractFingerprint: boundary.contractFingerprint,
    owner: 'frontend',
    reason: 'Pending',
    resolution: 'Migrate',
    tracking: '#700',
  };
  const expanded = audit({
    'app.ts': 'useQuery(unknownDocument); useMutation(newUnknownDocument);',
  });
  const resolved = audit({ 'app.ts': `${imports} useQuery(ONE);` });
  assert.deepEqual(
    [
      enforcementFailures(expanded, [exception]).map((item) => item.id),
      enforcementFailures(resolved, [exception]).map((item) => item.status),
    ],
    [['app.ts#useMutation:1'], ['stale-exception']]
  );
});

test('traces imported wrapper parameters to all real call sites', () => {
  const result = audit({
    'app.ts': `${imports} import {run} from './wrapper'; run(ONE); run(TWO);`,
    'wrapper.ts': 'export function run(document) { useQuery(document); }',
  });
  assert.deepEqual(
    result.boundaries[0].documents.map((item) => item.symbol),
    ['OneDocument', 'TwoDocument']
  );
});

test('an authored raw HTTP query is an untyped primary boundary', () => {
  const result = audit({
    'server.ts': `$fetch('/graphql', {body: {query: 'query One { id }', variables: {}}});`,
  });
  assert.deepEqual(
    result.boundaries.map((item) => [item.kind, item.status]),
    [['http-query', 'raw']]
  );
});

test('changing an override invalidates an otherwise identical reviewed exception', () => {
  const before = audit({ 'app.ts': `${imports} useQuery<OldResult>(ONE);` });
  const boundary = before.boundaries[0];
  const exception = {
    ...boundary,
    owner: 'frontend',
    reason: 'Pending',
    resolution: 'Migrate',
    tracking: '#700',
  };
  const after = audit({ 'app.ts': `${imports} useQuery<any>(ONE);` });
  assert.equal(
    enforcementFailures(after, [exception]).some(
      (item) => item.status === 'typed-with-override'
    ),
    true
  );
});

test('printing an untyped HTTP document cannot hide it from enforcement', () => {
  const result = audit({
    'server.ts': `import {print} from 'graphql'; const document = gql\`query One { id }\`; $fetch('/graphql', {body: {query: print(document)}});`,
  });
  assert.equal(result.boundaries[0].status, 'raw');
});

const typedTransportSource = `import {print} from 'graphql';
import type {TypedDocumentNode} from '@graphql-typed-document-node/core';
type GraphqlResponse<T> = { data?: T | null; errors?: {message: string}[] };
export function requestGraphql<Result, Variables>(url: string, document: TypedDocumentNode<Result, Variables>, variables: Variables): Promise<GraphqlResponse<Result>> {
  return $fetch<GraphqlResponse<Result>>(url, {body: {query: print(document), variables}});
}`;

test('records linked typed HTTP implementation as supplementary and counts authored callers', () => {
  const result = audit({
    'app.ts': `${imports} import {requestGraphql} from './transport'; requestGraphql('/graphql', ONE, {});`,
    'transport.ts': typedTransportSource,
  });
  assert.deepEqual(
    {
      boundaries: result.boundaries.map((item) => [item.kind, item.status]),
      transport: result.supplementary.some(
        (item) => item.kind === 'typed-http-transport'
      ),
    },
    { boundaries: [['requestGraphql', 'generated']], transport: true }
  );
});

test('an HTTP envelope whose data is not the document result fails the transport exemption', () => {
  const result = audit({
    'app.ts': `${imports} import {requestGraphql} from './transport'; requestGraphql('/graphql', ONE, {});`,
    'transport.ts': typedTransportSource.replace(
      'data?: T | null',
      'data?: FullSchemaEntity'
    ),
  });
  assert.equal(
    result.boundaries.some(
      (item) =>
        item.kind === 'http-query' && item.status === 'typed-with-override'
    ),
    true
  );
});

test('a spread-only options object cannot hide an untyped client document', () => {
  const result = audit({ 'app.ts': 'client.query({...unknownOptions});' });
  assert.equal(result.boundaries[0].status, 'unresolved');
});

test('raw refetch documents cannot bypass enforcement through mutation options', () => {
  const report = audit({
    'app.ts': `${imports} const LEGACY = gql\`query Legacy { id }\`; useMutation(ONE, {refetchQueries: [{query: LEGACY}]});`,
  });
  assert.deepEqual(
    enforcementFailures(report).map((item) => [item.kind, item.status]),
    [['refetchDocument', 'raw']]
  );
});

test('client refetch includes trace generated aliases without counting another authored operation', () => {
  const result = audit({
    'app.ts': `${imports} client.refetchQueries({include: [ONE]});`,
  });
  assert.deepEqual(
    {
      primary: result.boundaries.length,
      refetch: result.refetchDocuments.map((item) => item.status),
    },
    { primary: 0, refetch: ['generated'] }
  );
});

test('unknown named refetches fail while known names map to source operations', () => {
  const report = auditConsumers('/fixture', {
    files: {
      'app.ts': `${imports} useMutation(ONE, {refetchQueries: ['One', 'Typo']});`,
    },
    mapping: {
      ...mapping,
      'graphQLData/queries.ts#ONE': {
        operations: [{ name: 'One', document: 'OneDocument' }],
        fragments: [],
      },
    },
  });
  assert.deepEqual(
    report.refetchDocuments.map((item) => item.status),
    ['named-refetch', 'unresolved']
  );
});

test('a wrapper return annotation cannot erase the generated document contract silently', () => {
  const report = audit({
    'app.ts': `${imports} function query(): DocumentNode {return ONE;} useQuery(query());`,
  });
  assert.equal(report.boundaries[0].status, 'typed-with-override');
});

test('reviewed exception fingerprints include referenced ReturnType payload bodies', () => {
  const make = (flag) =>
    audit({
      'app.ts': `const DOC = gql\`mutation Save { id }\`; const variables = () => ({input: {${flag}: true}}); useMutation<SaveMutation, ReturnType<typeof variables>>(DOC);`,
    });
  const before = make('original');
  const boundary = before.boundaries[0];
  const exception = {
    ...boundary,
    owner: 'frontend',
    reason: 'Pin gap',
    resolution: 'Backend contract',
    tracking: '#413',
  };
  assert.equal(
    enforcementFailures(make('newUnsupportedField'), [exception]).some(
      (item) => item.status === 'raw'
    ),
    true
  );
});

test('payload fingerprints include typeof computed input bodies', () => {
  const make = (value) =>
    audit({
      'app.ts': `const DOC = gql\`mutation Save { id }\`; const input = computed(() => ({${value}: true})); useMutation<SaveMutation, {input: typeof input.value}>(DOC);`,
    });
  assert.notEqual(
    make('original').boundaries[0].contractFingerprint,
    make('changed').boundaries[0].contractFingerprint
  );
});

test('payload fingerprints follow imported utility helpers transitively', () => {
  const make = (flag) =>
    audit({
      'app.ts': `import {variables} from './utils/payload'; const DOC = gql\`mutation Save { id }\`; useMutation<SaveMutation, ReturnType<typeof variables>>(DOC);`,
      'utils/payload.ts': `const node = () => ({${flag}: true}); export const variables = () => ({input: node()});`,
    });
  assert.notEqual(
    make('original').boundaries[0].contractFingerprint,
    make('changed').boundaries[0].contractFingerprint
  );
});

test('formatting-only payload changes do not require a new exception review', () => {
  const before = audit({
    'app.ts':
      'const DOC = gql`mutation Save { id }`; const variables = () => ({input: true}); useMutation<SaveMutation, ReturnType<typeof variables>>(DOC);',
  });
  const after = audit({
    'app.ts':
      'const DOC = gql`mutation Save { id }`; const variables = () => ( { input: true } ); useMutation<SaveMutation, ReturnType<typeof variables>>(DOC);',
  });
  assert.equal(
    before.boundaries[0].contractFingerprint,
    after.boundaries[0].contractFingerprint
  );
});

test('raw document changes beyond display previews invalidate reviewed exceptions', () => {
  const make = (field) =>
    audit({
      'app.ts': `const DOC = gql\`mutation Save { ${'longField '.repeat(20)} ${field} }\`; useMutation<Result, Variables>(DOC);`,
    });
  assert.notEqual(
    make('original').boundaries[0].contractFingerprint,
    make('changed').boundaries[0].contractFingerprint
  );
});

test('repinning the backend contract requires legacy exceptions to be reviewed again', () => {
  const files = {
    'app.ts':
      'const DOC = gql`mutation Save { id }`; useMutation<Result, Variables>(DOC);',
  };
  const before = auditConsumers('/fixture', {
    files,
    mapping,
    schemaContractFingerprint: 'old-pin',
  });
  const after = auditConsumers('/fixture', {
    files,
    mapping,
    schemaContractFingerprint: 'new-pin',
  });
  assert.notEqual(
    before.boundaries[0].contractFingerprint,
    after.boundaries[0].contractFingerprint
  );
});

test('local hook aliases cannot hide raw operation consumption', () => {
  const report = audit({
    'app.ts': `import {useQuery} from '@vue/apollo-composable'; const query = useQuery; const DOC = gql\`query Legacy { id }\`; query(DOC);`,
  });
  assert.deepEqual(
    report.boundaries.map((item) => [item.kind, item.status]),
    [['useQuery', 'raw']]
  );
});

test('destructured namespace hooks cannot hide raw operation consumption', () => {
  const report = audit({
    'app.ts': `import * as apollo from '@vue/apollo-composable'; const {useMutation: mutate} = apollo; const DOC = gql\`mutation Legacy { id }\`; mutate(DOC);`,
  });
  assert.deepEqual(
    report.boundaries.map((item) => [item.kind, item.status]),
    [['useMutation', 'raw']]
  );
});

test('calling a hook-returned mutate function is not another authored document boundary', () => {
  const report = audit({
    'app.ts': `${imports} const {mutate} = useMutation(ONE); mutate({id: 'one'});`,
  });
  assert.deepEqual(
    report.boundaries.map((item) => item.kind),
    ['useMutation']
  );
});
