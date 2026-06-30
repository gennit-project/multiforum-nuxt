import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const rootVueRouterDir = path.join(projectRoot, 'node_modules', 'vue-router');
const nestedVueRouterDir = path.join(
  projectRoot,
  'node_modules',
  'nuxt',
  'node_modules',
  'vue-router'
);

const rootPackageJsonPath = path.join(rootVueRouterDir, 'package.json');
const nestedVolarDir = path.join(nestedVueRouterDir, 'dist', 'volar');
const rootVolarDir = path.join(rootVueRouterDir, 'dist', 'volar');

if (!existsSync(rootPackageJsonPath) || !existsSync(nestedVolarDir)) {
  process.exit(0);
}

const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));

if (
  rootPackageJson.exports?.['./volar/sfc-route-blocks'] &&
  rootPackageJson.exports?.['./volar/sfc-typed-router'] &&
  existsSync(path.join(rootVolarDir, 'sfc-route-blocks.cjs')) &&
  existsSync(path.join(rootVolarDir, 'sfc-typed-router.cjs'))
) {
  process.exit(0);
}

mkdirSync(rootVolarDir, { recursive: true });
cpSync(nestedVolarDir, rootVolarDir, { recursive: true });

rootPackageJson.exports ||= {};
rootPackageJson.exports['./volar/sfc-route-blocks'] = {
  types: './dist/volar/sfc-route-blocks.d.cts',
  default: './dist/volar/sfc-route-blocks.cjs',
};
rootPackageJson.exports['./volar/sfc-typed-router'] = {
  types: './dist/volar/sfc-typed-router.d.cts',
  default: './dist/volar/sfc-typed-router.cjs',
};

rootPackageJson.typesVersions ||= {};
rootPackageJson.typesVersions['*'] ||= {};
rootPackageJson.typesVersions['*']['volar/*'] ||= ['./dist/volar/*.d.cts'];

writeFileSync(rootPackageJsonPath, `${JSON.stringify(rootPackageJson, null, 2)}\n`);
