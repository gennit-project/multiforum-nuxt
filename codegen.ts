import type { CodegenConfig } from '@graphql-codegen/cli';
import * as dotenv from 'dotenv'
dotenv.config()

const codegenConfig: CodegenConfig = {
  schema: process.env.GRAPHQL_URL_FOR_TYPES,
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