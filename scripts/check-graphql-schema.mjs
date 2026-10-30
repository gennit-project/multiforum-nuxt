import {
  describeSchemaContract,
  readSchemaContract,
} from './graphql-schema-contract.mjs';

try {
  const { manifest } = readSchemaContract();
  console.log(
    `Verified pinned GraphQL contract: ${describeSchemaContract(manifest)}`
  );
} catch (error) {
  console.error('GraphQL contract verification failed:', error.message);
  process.exitCode = 1;
}
