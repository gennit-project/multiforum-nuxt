import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { buildSchema } from 'graphql';
import {
  compareBaseline,
  discoverOperationSources,
  inventoryOperations,
  validationEntries,
} from './graphql-operations.mjs';

const schema = buildSchema(`
  type Query { user: User users(where: UserWhere): [User!]! hello(value: String): String }
  type Mutation { updateUser(name: String!): User }
  type User { id: ID! username: String! name: String }
  input UserWhere { username: StringFilter }
  input StringFilter { eq: String }
`);
function workspace(t, files) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'graphql-operations-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), text);
  }
  return root;
}
const extract = (t, files) => inventoryOperations(workspace(t, files), schema);
const errors = (report) => report.documents.flatMap((doc) => doc.diagnostics);
const baselineFor = (report) => ({
  formatVersion: 1,
  schemaHash: 'schema',
  errors: validationEntries(report),
});

test('discovers all production source groups and standalone operations; skips generated and test files', (t) => {
  const root = workspace(t, {
    'graphQLData/q.js': 'const Q=gql`{ user { id } }`;',
    'components/A.vue': '<script setup>const Q=gql`{ user { id } }`;</script>',
    'plugins/q.ts': 'const Q=gql`{ user { id } }`;',
    'middleware/q.ts': 'const Q=gql`{ user { id } }`;',
    'server/q.ts': 'const Q=gql`{ user { id } }`;',
    'operations/raw.graphql': '{ user { id } }',
    'components/A.spec.ts': 'invalid',
    'scripts/tool.ts': 'invalid',
    '__generated__/q.ts': 'invalid',
    '.nuxt/q.ts': 'invalid',
    'types/a.d.ts': 'invalid',
    'node_modules/q.ts': 'invalid',
  });
  const report = inventoryOperations(root, schema);
  assert.equal(discoverOperationSources(root).length, 6);
  assert.deepEqual(report.summary, {
    sourceFiles: 6,
    documents: 6,
    operations: 6,
    fragmentDocuments: 0,
    annotatedStrings: 0,
    validationErrors: 0,
    extractionErrors: 0,
  });
});

test('resolves imports, aliases, barrels, namespaces, default exports and repeated fragments without executing code', (t) => {
  const report = extract(t, {
    'graphQLData/f.ts':
      'export const F=gql`fragment Identity on User { id username }`; export default F; throw new Error("must never execute");',
    'graphQLData/reexport.ts': "export {F as Identity} from './f';",
    'graphQLData/barrel.ts': "export * from './reexport';",
    'graphQLData/nested.ts': "export * from './barrel';",
    'pages/q.ts':
      "import {gql as document} from '@apollo/client/core'; import {Identity as part} from '@/graphQLData/nested'; import * as fragments from '~/graphQLData/f'; import defaultPart from '../graphQLData/f'; const alias=document; const Q=alias`query User { user { ...Identity } } ${part} ${fragments.F} ${defaultPart}`;",
  });
  assert.deepEqual(report.extractionErrors, []);
  assert.equal(errors(report).length, 0);
  assert.deepEqual(
    report.documents.find((doc) => doc.operations.length).fragments,
    ['Identity']
  );
});

test('supports default graphql-tag imports, namespace tags and static call syntax', (t) => {
  const report = extract(t, {
    'q.ts':
      "import doc from 'graphql-tag'; import * as apollo from '@apollo/client/core'; const A=doc('{ user { id } }'); const B=apollo.gql`{ user { name } }`;",
  });
  assert.equal(report.summary.documents, 2);
  assert.equal(
    report.summary.validationErrors + report.summary.extractionErrors,
    0
  );
});

test('validates fragment-only cache documents without treating them as unused network fragments', (t) => {
  const report = extract(t, {
    'q.ts':
      'const Good=gql`fragment A on User { id }`; const Bad=gql`fragment B on User { missing }`;',
  });
  assert.equal(errors(report).length, 1);
  assert.match(errors(report)[0].message, /Cannot query field "missing"/);
});

test('preserves conflicting fragment definitions so validation rejects them', (t) => {
  const report = extract(t, {
    'q.ts':
      'const A=gql`fragment F on User { id }`; const B=gql`fragment F on User { name }`; const Q=gql`{ user { ...F } } ${A} ${B}`;',
  });
  assert.ok(
    errors(report).some((error) =>
      /only one fragment named/.test(error.message)
    )
  );
});

test('reports Vue schema errors at the actual script line and column', (t) => {
  const text =
    '<template><p>Hello</p></template>\n<script setup lang="ts">\nconst Q=gql`query { user { missing } }`;\n</script>\n';
  const report = extract(t, { 'pages/profile.vue': text });
  assert.deepEqual(errors(report)[0].locations[0], {
    file: 'pages/profile.vue',
    line: 3,
    column: text.split('\n')[2].indexOf('missing') + 1,
  });
});

test('maps errors in imported fragments back to their defining source', (t) => {
  const report = extract(t, {
    'f.ts': 'export const F=gql`fragment F on User { missing }`;',
    'q.ts': "import {F} from './f'; const Q=gql`{ user { ...F } } ${F}`;",
  });
  assert.equal(
    report.documents.find((doc) => doc.file === 'q.ts').diagnostics[0]
      .locations[0].file,
    'f.ts'
  );
});

test('uses cooked JavaScript string semantics and retains locations after escaped newlines', (t) => {
  const report = extract(t, {
    'q.ts': 'const Q=gql`query {\\n user { missing } }`;',
  });
  assert.equal(report.extractionErrors.length, 0);
  assert.deepEqual(errors(report)[0].locations[0], {
    file: 'q.ts',
    line: 1,
    column: 30,
  });
});

test('records quoted scalar interpolations without evaluating their expressions', (t) => {
  const report = extract(t, {
    'q.ts': 'const Q=gql`query { hello(value: "${dangerous()}") }`;',
  });
  assert.equal(
    report.summary.validationErrors + report.summary.extractionErrors,
    0
  );
  assert.equal(
    report.documents[0].valueInterpolations[0].expression,
    'dangerous()'
  );
});

for (const [name, text, message] of [
  [
    'dynamic structural interpolation',
    'const Q=gql`{ ${fields()} }`;',
    /Dynamic/,
  ],
  [
    'non-gql factory interpolation',
    'const F=other("fragment F on User { id }"); const Q=gql`{ user { ...F } } ${F}`;',
    /Dynamic/,
  ],
  [
    'missing interpolation',
    'const Q=gql`{ user { ...F } } ${MISSING}`;',
    /Unresolved/,
  ],
  ['cyclic interpolation', 'const A=gql`${B}`; const B=gql`${A}`;', /Cyclic/],
  ['syntax error', 'const Q=gql`query { user { `;', /Syntax Error/],
  ['dynamic gql argument', 'const Q=gql(getQuery());', /static string/],
  [
    'multiple gql arguments',
    'const Q=gql("{ user { id } }", other);',
    /one static/,
  ],
  ['empty document', 'const Q=gql``;', /Empty/],
  [
    'invalid TypeScript',
    'const Q=gql`{ user { id } }`; const =;',
    /Cannot parse/,
  ],
]) {
  test(`fails closed on ${name}`, (t) => {
    const report = extract(t, { 'q.ts': text });
    assert.ok(
      report.extractionErrors.some((error) => message.test(error.message))
    );
  });
}

test('rejects missing fragment imports and ambiguous re-exports', (t) => {
  const report = extract(t, {
    'a.ts': 'export const F=gql`fragment A on User { id }`;',
    'b.ts': 'export const F=gql`fragment B on User { name }`;',
    'barrel.ts': "export * from './a'; export * from './b';",
    'q.ts': "import {F} from './barrel'; const Q=gql`{ user { ...A } } ${F}`;",
    'missing.ts':
      "import {F} from './absent'; const Q=gql`{ user { ...A } } ${F}`;",
  });
  assert.equal(report.extractionErrors.length, 2);
});

test('resolves fragment bindings in their lexical scope', (t) => {
  const report = extract(t, {
    'q.ts':
      'const F=gql`fragment F on User { id }`; function component(){const F=gql`fragment F on User { name }`; return gql`{ user { ...F } } ${F}`;} const Q=gql`{ user { ...F } } ${F}`;',
  });
  assert.equal(report.extractionErrors.length + errors(report).length, 0);
  const operations = report.documents.filter((doc) => doc.operations.length);
  assert.notEqual(operations[0].hash, operations[1].hash);
});

test('validates variables, arguments, fields, aliases and fragment reachability', (t) => {
  const report = extract(t, {
    'q.ts':
      'const Q=gql`query Q($name: Int) { people: users(where: {username: {eq: $name}}) { id } missing } fragment Unused on User { id }`;',
  });
  assert.equal(errors(report).length, 3);
});

test('baseline accepts only exact existing invalid documents and rejects changes', (t) => {
  const original = extract(t, { 'q.ts': 'const Q=gql`{ user { missing } }`;' });
  const baseline = baselineFor(original);
  assert.deepEqual(compareBaseline(original, baseline, 'schema'), {
    unexpected: [],
    stale: [],
  });
  const changed = extract(t, {
    'q.ts': 'const Q=gql`{ user { missing name } }`;',
  });
  const delta = compareBaseline(changed, baseline, 'schema');
  assert.equal(delta.unexpected.length, 1);
  assert.equal(delta.stale.length, 1);
});

test('resolved baseline entries must be removed and a new schema requires review', (t) => {
  const invalid = extract(t, { 'q.ts': 'const Q=gql`{ user { missing } }`;' });
  const fixed = extract(t, { 'q.ts': 'const Q=gql`{ user { name } }`;' });
  const baseline = baselineFor(invalid);
  assert.equal(compareBaseline(fixed, baseline, 'schema').stale.length, 1);
  assert.throws(
    () => compareBaseline(invalid, baseline, 'other schema'),
    /schema hash/
  );
});

const cli = new URL('./validate-graphql-operations.mjs', import.meta.url)
  .pathname;
function runCli(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('CLI strict mode fails, inventory reports findings, and explicit baseline ratchets them', (t) => {
  const root = workspace(t, {
    'q.ts': 'const Q=gql`{ users { definitelyMissing } }`;',
  });
  assert.equal(runCli('--root', root).status, 1);
  const output = path.join(root, 'report.json');
  assert.equal(
    runCli('--root', root, '--report-only', '--report', output).status,
    0
  );
  assert.equal(
    JSON.parse(readFileSync(output, 'utf8')).summary.validationErrors,
    1
  );
  const baseline = path.join(root, 'baseline.json');
  assert.equal(runCli('--root', root, '--write-baseline', baseline).status, 0);
  assert.equal(runCli('--root', root, '--baseline', baseline).status, 0);
  writeFileSync(
    path.join(root, 'q.ts'),
    'const Q=gql`{ users { anotherMissing } }`;'
  );
  assert.equal(runCli('--root', root, '--baseline', baseline).status, 1);
});

test('CLI never permits extraction exceptions, even during baseline creation or report-only mode', (t) => {
  const root = workspace(t, { 'q.ts': 'const Q=gql`${unknown()}`;' });
  const baseline = path.join(root, 'baseline.json');
  assert.equal(runCli('--root', root, '--write-baseline', baseline).status, 1);
  assert.equal(runCli('--root', root, '--report-only').status, 1);
});

test('CLI rejects unknown, missing, or contradictory options', () => {
  for (const args of [
    ['--unknown'],
    ['--report'],
    ['--baseline', 'x', '--report-only'],
  ])
    assert.equal(runCli(...args).status, 1);
  assert.equal(runCli('--help').status, 0);
});

test('new copies of invalid documents cannot inherit an exemption by reusing a binding name', (t) => {
  const original = extract(t, { 'q.ts': 'const Q=gql`{ user { missing } }`;' });
  const copied = extract(t, {
    'q.ts':
      'const Q=gql`{ user { missing } }`; function f(){ const Q=gql`{ user { missing } }`; }',
  });
  assert.equal(
    compareBaseline(copied, baselineFor(original), 'schema').unexpected.length,
    1
  );
});

test('JS escape forms and CRLFs map to original source without evaluation', (t) => {
  for (const escape of ['\\x75', '\\u0075', '\\u{75}']) {
    const text = 'const Q=gql`{ ' + escape + 'ser { missing } }`;';
    const report = extract(t, { 'q.ts': text });
    assert.equal(report.extractionErrors.length, 0);
    assert.deepEqual(errors(report)[0].locations[0], {
      file: 'q.ts',
      line: 1,
      column: text.indexOf('missing') + 1,
    });
  }
  const report = extract(t, {
    'q.ts': 'const Q=gql`{\r\n user { missing } }`;',
  });
  assert.equal(errors(report)[0].locations[0].line, 2);
});

test('tracks block-string values and comments when resolving interpolations', (t) => {
  const report = extract(t, {
    'q.ts':
      'const F=gql`fragment F on User { id }`; const Q=gql`query { hello(value: """${value}""") user { ...F } } # " ignored quote\n ${F}`;',
  });
  assert.equal(report.extractionErrors.length + errors(report).length, 0);
});

test('rejects cyclic named re-exports and external document packages', (t) => {
  const report = extract(t, {
    'a.ts': "export {F} from './b';",
    'b.ts': "export {F} from './a';",
    'q.ts': "import {F} from './a'; const Q=gql`${F}`;",
    'external.ts': "import {F} from 'unresolved-package'; const Q=gql`${F}`;",
  });
  assert.equal(report.extractionErrors.length, 2);
});

test('reads default imports of standalone GraphQL fragments', (t) => {
  const report = extract(t, {
    'identity.graphql': 'fragment F on User { id }',
    'q.ts':
      "import F from './identity.graphql'; const Q=gql`{ user { ...F } } ${F}`;",
  });
  assert.equal(
    report.summary.extractionErrors + report.summary.validationErrors,
    0
  );
});

test('unsupported uses of the gql function cannot silently escape the inventory', (t) => {
  const report = extract(t, {
    'q.ts':
      "import {gql} from '@apollo/client/core'; const factory = gql.bind(null); const Q=factory('{ user { id } }');",
  });
  assert.ok(
    report.extractionErrors.some((error) =>
      /used dynamically/.test(error.message)
    )
  );
});

for (const [label, declaration] of [
  ['mutable variable', 'let F=gql`fragment F on User { name }`;'],
  ['uninitialized shadow', 'let F;'],
  ['destructured shadow', 'const {F} = source;'],
]) {
  test(`rejects a ${label} instead of resolving an outer fragment`, (t) => {
    const report = extract(t, {
      'q.ts': `const F=gql\`fragment F on User { id }\`; function inner(){ ${declaration} return gql\`{ user { ...F } } \${F}\`; }`,
    });
    assert.ok(
      report.extractionErrors.some((error) =>
        /mutable, destructured, or a parameter/.test(error.message)
      )
    );
  });
}

test('rejects a parameter that shadows a static fragment', (t) => {
  const report = extract(t, {
    'q.ts':
      'const F=gql`fragment F on User { id }`; function inner(F){ return gql`{ user { ...F } } ${F}`; }',
  });
  assert.ok(
    report.extractionErrors.some((error) =>
      /mutable, destructured, or a parameter/.test(error.message)
    )
  );
});

test('a mutable alias of the gql tag cannot hide later dynamic documents', (t) => {
  const report = extract(t, {
    'q.ts':
      "import {gql} from '@apollo/client/core'; let tag=gql; tag=other; const Q=tag`{ user { id } }`;",
  });
  assert.ok(
    report.extractionErrors.some((error) =>
      /used dynamically/.test(error.message)
    )
  );
});

test('extracts annotated raw GraphQL strings used by server requests', (t) => {
  const report = extract(t, {
    'server/one.ts': 'const Q = /* GraphQL */ `query { user { missing } }`;',
    'server/two.ts': 'const Q = /* graphql */ "{ user { id } }";',
    'server/three.mts': 'const Q = /* gql */ `{ user { name } }`;',
  });
  assert.equal(report.summary.annotatedStrings, 3);
  assert.equal(report.summary.validationErrors, 1);
  assert.equal(errors(report)[0].locations[0].file, 'server/one.ts');
});

test('annotated dynamic raw documents and structural interpolations fail closed', (t) => {
  const report = extract(t, {
    'server/one.ts': 'const Q = /* GraphQL */ getQuery();',
    'server/two.ts': 'const Q = /* GraphQL */ `{ user { ${fields} } }`;',
  });
  assert.equal(report.extractionErrors.length, 2);
});

test('annotated static string fragments can be interpolated into tagged documents', (t) => {
  const report = extract(t, {
    'f.ts': 'export const F = /* GraphQL */ `fragment F on User { id }`;',
    'q.ts': "import {F} from './f'; const Q=gql`{ user { ...F } } ${F}`;",
  });
  assert.equal(
    report.summary.extractionErrors + report.summary.validationErrors,
    0
  );
});

test('an annotated argument to gql is counted once', (t) => {
  const report = extract(t, {
    'q.ts': 'const Q = gql(/* GraphQL */ `{ user { id } }`);',
  });
  assert.equal(report.summary.documents, 1);
});

test('unannotated GraphQL-like strings cannot silently disappear from the inventory', (t) => {
  const report = extract(t, {
    'server/q.ts':
      'const Q=`query Account { user { id } }`; const R="{ user { name } }";',
  });
  assert.equal(
    report.extractionErrors.filter((error) => /requires a/.test(error.message))
      .length,
    2
  );
});

test('server requests to GraphQL URLs must reference statically validated documents', (t) => {
  const report = extract(t, {
    'server/good.ts':
      'const Q=/* GraphQL */ `query { user { id } }`; $fetch(graphqlUrl, { body: { query: Q } });',
    'server/bad.ts':
      'function request(query){ return $fetch(graphqlUrl, {body:{query}}); }',
    'server/rest.ts': '$fetch("/rest/search", {body:{query:"text"}});',
  });
  assert.equal(report.extractionErrors.length, 1);
  assert.match(
    report.extractionErrors[0].message,
    /must resolve to a static document/
  );
});

test('baseline rejects altered or duplicated entries', (t) => {
  const report = extract(t, { 'q.ts': 'const Q=gql`{ user { missing } }`;' });
  const altered = baselineFor(report);
  altered.errors[0].message = 'different';
  assert.throws(
    () => compareBaseline(report, altered, 'schema'),
    /Invalid or duplicate/
  );
  const duplicated = baselineFor(report);
  duplicated.errors.push(duplicated.errors[0]);
  assert.throws(
    () => compareBaseline(report, duplicated, 'schema'),
    /Invalid or duplicate/
  );
});

test('separate occurrences of the same error receive distinct baseline identities', (t) => {
  const report = extract(t, {
    'q.ts': 'const Q=gql`{ first:user { missing } second:user { missing } }`;',
  });
  assert.equal(validationEntries(report).length, 2);
  assert.equal(
    new Set(validationEntries(report).map((entry) => entry.id)).size,
    2
  );
});

test('fails closed for ambiguous dual-script Vue documents and unresolved GraphQL imports', (t) => {
  const report = extract(t, {
    'q.vue':
      '<script>const F=gql`fragment F on User { id }`;</script><script setup>const Q=gql`{ user { ...F } } ${F}`;</script>',
    'q.graphql': '# import F from "./f.graphql"\n{ user { ...F } }',
  });
  assert.equal(report.extractionErrors.length, 2);
});

test('unrelated line changes do not invalidate existing debt', (t) => {
  const before = extract(t, { 'q.ts': 'const Q=gql`{ user { missing } }`;' });
  const after = extract(t, {
    'q.ts': '// unrelated comment\n\nconst Q=gql`{ user { missing } }`;',
  });
  assert.deepEqual(compareBaseline(after, baselineFor(before), 'schema'), {
    unexpected: [],
    stale: [],
  });
});

test('supports CommonJS GraphQL tags in production source extensions', (t) => {
  const report = extract(t, {
    'q.cjs':
      "const doc=require('graphql-tag'); const Apollo=require('@apollo/client/core'); const A=doc`{ user { id } }`; const B=Apollo.gql`{ user { name } }`;",
  });
  assert.equal(report.summary.documents, 2);
  assert.equal(report.extractionErrors.length + errors(report).length, 0);
});

test('does not silently skip symlinked source directories', (t) => {
  const root = workspace(t, { 'real/q.ts': 'const Q=gql`{ user { id } }`;' });
  symlinkSync('real', path.join(root, 'linked'), 'dir');
  assert.throws(() => discoverOperationSources(root), /Source symlinks/);
});

test('cyclic imports through local aliases fail cleanly without recursion overflow', (t) => {
  const report = extract(t, {
    'a.ts': "import {B} from './b'; export {B as A};",
    'b.ts': "import {A} from './a'; export {A as B};",
    'q.ts': "import {A} from './a'; const Q=gql`${A}`;",
  });
  assert.ok(
    report.extractionErrors.some((error) =>
      /Cyclic GraphQL re-export/.test(error.message)
    )
  );
});

test('CLI writes a diagnostic report when source discovery fails', (t) => {
  const root = workspace(t, { 'real/q.ts': 'const Q=gql`{ user { id } }`;' });
  symlinkSync('real', path.join(root, 'linked'), 'dir');
  const output = path.join(root, 'report.json');
  assert.equal(
    runCli('--root', root, '--report-only', '--report', output).status,
    1
  );
  assert.match(
    JSON.parse(readFileSync(output, 'utf8')).fatalError,
    /Source symlinks/
  );
});

test('shadowing an imported GraphQL tag cannot hide a dynamically constructed operation', (t) => {
  const report = extract(t, {
    'q.ts':
      "import {gql as doc} from '@apollo/client/core'; function render(doc, fields) { return doc`${fields}`; }",
  });
  assert.ok(
    report.extractionErrors.some((error) => /shadowed/.test(error.message))
  );
});

test('reports source and standalone GraphQL parse errors at their real lines', (t) => {
  const report = extract(t, {
    'broken.ts': 'const valid = 1;\nconst = 2;',
    'broken.graphql': 'query Q {\n  user {\n    id\n',
  });
  assert.equal(
    report.extractionErrors.find(
      (error) => error.locations[0].file === 'broken.ts'
    ).locations[0].line,
    2
  );
  assert.deepEqual(
    report.extractionErrors.find(
      (error) => error.locations[0].file === 'broken.graphql'
    ).locations[0],
    { file: 'broken.graphql', line: 4, column: 1 }
  );
});
