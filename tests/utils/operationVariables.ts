import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildSchema,
  getOperationAST,
  getVariableValues,
  type DocumentNode,
} from 'graphql';

const schema = buildSchema(
  readFileSync(resolve(process.cwd(), 'graphql-schema/schema.graphql'), 'utf8')
);

export const variableErrors = (
  document: DocumentNode,
  variables: Record<string, unknown>
) => {
  const operation = getOperationAST(document);
  if (!operation) throw new Error('Expected one operation');
  return (
    getVariableValues(
      schema,
      operation.variableDefinitions ?? [],
      variables
    ).errors?.map((error) => error.message) ?? []
  );
};
