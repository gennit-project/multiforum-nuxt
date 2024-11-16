import type { CodegenConfig } from '@graphql-codegen/cli';
import * as dotenv from 'dotenv'
dotenv.config()

console.log('codegen', process.env.GRAPHQL_URL)
const codegenConfig: CodegenConfig = {
  schema: process.env.GRAPHQL_URL,
  documents: ['src/**/*.tsx'],
  generates: {
    './__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      }
    }
  },
  ignoreNoDocuments: true,
};

export default codegenConfig;