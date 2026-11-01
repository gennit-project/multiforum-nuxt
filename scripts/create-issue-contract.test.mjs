import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getVariableValues, parse, validate } from 'graphql';
import { readSchemaContract } from './graphql-schema-contract.mjs';

const { schema } = readSchemaContract();
const source = readFileSync(new URL('../graphQLData/issue/mutations.js', import.meta.url), 'utf8');
const operation = parse(source.match(/export const CREATE_ISSUE = gql`([\s\S]*?)`;/)[1]);
const definitions = operation.definitions[0].variableDefinitions;

for (const input of [
  { title: 'Request', body: 'Details' },
  { title: 'Request', body: 'Details', channelUniqueName: 'cats', asModerationProfile: true },
]) {
  test(`coerces actual generic ${input.channelUniqueName ? 'forum/mod' : 'server/user'} creation variables`, () => {
    assert.deepEqual({ validation: validate(schema, operation), variables: getVariableValues(schema, definitions, { input }).errors ?? [] }, { validation: [], variables: [] });
  });
}
for (const input of [
  { body: 'Missing title' },
  { title: 'Missing body' },
  { title: 'Request', body: 'Details', issueNumber: 1 },
  { title: 'Request', body: 'Details', Author: { User: {} } },
  { title: 'Request', body: 'Details', asModerationProfile: 'spoofed' },
]) {
  test(`rejects invalid creation input ${JSON.stringify(input)}`, () => {
    assert.ok(getVariableValues(schema, definitions, { input }).errors?.length);
  });
}
