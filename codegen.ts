import type { CodegenConfig } from '@graphql-codegen/cli';
import config from './config';

const codegenConfig: CodegenConfig = {
  schema: config.graphqlUrl,
  documents: ['src/**/*.tsx'],
  generates: {
    './src/__generated__/': {
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