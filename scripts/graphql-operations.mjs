import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parse as parseVue } from 'vue/compiler-sfc';
import {
  Kind,
  NoUnusedFragmentsRule,
  Source,
  parse,
  print,
  specifiedRules,
  validate,
} from 'graphql';

const extensions = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.graphql',
  '.gql',
];
// Production source only. Report these boundaries so inventory coverage is explicit.
export const excludedDirectories = [
  'node_modules',
  '__generated__',
  'graphql-schema',
  'tests',
  'test',
  '__tests__',
  'scripts',
  'docs',
  'coverage',
  'dist',
  'artifacts',
  'public',
  'static',
  'assets',
  'deploy',
  'playwright-report',
  'test-results',
];
const looksLikeOperation = (value) =>
  /^(?:(?:query|mutation|subscription)\b(?:\s+[_A-Za-z]\w*)?\s*(?:\(|\{|@)|fragment\s+[_A-Za-z]\w*\s+on\s+[_A-Za-z]\w*\s*\{|\{\s*(?:[_A-Za-z]|\.\.\.))/i.test(
    value.replace(/^(?:\s|#[^\n]*(?:\n|$))*/, '')
  );
const digest = (value) => createHash('sha256').update(value).digest('hex');
const slash = (value) => value.split(path.sep).join('/');
const mask = (value) => value.replace(/[^\r\n]/g, ' ');

export function discoverOperationSources(root) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name)
    )) {
      if (
        entry.name.startsWith('.') ||
        excludedDirectories.includes(entry.name)
      )
        continue;
      const absolute = path.join(directory, entry.name);
      if (
        entry.isSymbolicLink() &&
        (!path.extname(entry.name) ||
          extensions.includes(path.extname(entry.name)))
      ) {
        throw new Error(
          `Source symlinks require an explicit inventory decision: ${absolute}`
        );
      }
      if (entry.isDirectory()) walk(absolute);
      else if (
        extensions.includes(path.extname(entry.name)) &&
        !/\.(?:spec|test|d)\.[^.]+$/.test(entry.name)
      ) {
        files.push(slash(path.relative(root, absolute)));
      }
    }
  }
  walk(root);
  return files;
}

// Map cooked JS template/string characters back to their original source.
// This interprets escapes only; application expressions are never evaluated.
function literalOffsets(raw, cooked, start) {
  let result = '';
  const offsets = [];
  for (let i = 0; i < raw.length;) {
    const at = i;
    let value = raw[i++];
    if (value === '\r') {
      if (raw[i] === '\n') i++;
      value = '\n';
    } else if (value === '\\') {
      const escape = raw[i++];
      const simple = {
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
        v: '\v',
        0: '\0',
      };
      if (escape === '\n' || escape === '\r') {
        if (escape === '\r' && raw[i] === '\n') i++;
        value = '';
      } else if (escape === 'x') {
        value = String.fromCharCode(parseInt(raw.slice(i, i + 2), 16));
        i += 2;
      } else if (escape === 'u') {
        if (raw[i] === '{') {
          const end = raw.indexOf('}', i);
          value = String.fromCodePoint(parseInt(raw.slice(i + 1, end), 16));
          i = end + 1;
        } else {
          value = String.fromCharCode(parseInt(raw.slice(i, i + 4), 16));
          i += 4;
        }
      } else value = simple[escape] ?? escape;
    }
    result += value;
    for (let j = 0; j < value.length; j++) offsets.push(start + at);
  }
  if (result !== cooked)
    throw new Error(
      'Unsupported JavaScript literal escape; use a static GraphQL document'
    );
  return offsets;
}

function insideString(text) {
  let state = 'code';
  for (let i = 0; i < text.length; i++) {
    if (state === 'comment') {
      if (text[i] === '\n') state = 'code';
      continue;
    }
    if (text[i] === '\\' && (state === 'string' || state === 'block')) {
      i++;
      continue;
    }
    if (state !== 'string' && text.slice(i, i + 3) === '"""') {
      state = state === 'block' ? 'code' : 'block';
      i += 2;
      continue;
    }
    if (state === 'block') continue;
    if (text[i] === '"') state = state === 'string' ? 'code' : 'string';
    else if (state === 'code' && text[i] === '#') state = 'comment';
  }
  return state === 'string' || state === 'block';
}

export function inventoryOperations(
  root,
  schema,
  files = discoverOperationSources(root),
  { includeSource = false } = {}
) {
  const modules = new Map();
  const sourceMaps = new WeakMap();
  const compiled = new WeakMap();
  const compiling = new Set();
  const problems = [];
  const documents = [];
  const fileSet = new Set(files.map(slash));

  function location(module, offset) {
    const position = Math.min(offset, module.text.length);
    if (!module.ast) {
      const lines = module.text.slice(0, position).split(/\r\n|\r|\n/);
      return {
        file: module.file,
        line: lines.length,
        column: lines.at(-1).length + 1,
      };
    }
    const point = module.ast.getLineAndCharacterOfPosition(position);
    return {
      file: module.file,
      line: point.line + 1,
      column: point.character + 1,
    };
  }
  function failure(module, node, message) {
    return {
      kind: 'extraction',
      message,
      locations: [
        location(
          module,
          typeof node === 'number' ? node : node.getStart(module.ast)
        ),
      ],
    };
  }
  function scope(node) {
    while (
      node &&
      !ts.isSourceFile(node) &&
      !ts.isBlock(node) &&
      !ts.isFunctionLike(node) &&
      !ts.isCaseBlock(node)
    )
      node = node.parent;
    return node;
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const text = readFileSync(path.join(root, file), 'utf8');
    let code = text;
    const module = {
      file,
      text,
      imports: new Map(),
      bindings: new Map(),
      exports: new Map(),
      stars: [],
      templates: [],
      rawDocuments: new Set(),
    };
    modules.set(file, module);
    let multipleVueScripts = false;
    if (file.endsWith('.vue')) {
      const { descriptor, errors } = parseVue(text, { filename: file });
      if (errors.length) {
        const error = new Error(
          `Cannot parse Vue source ${file}: ${errors.map((e) => e.message ?? e).join('; ')}`
        );
        error.sourceOffset = errors[0]?.loc?.start?.offset ?? 0;
        throw error;
      }
      multipleVueScripts = !!descriptor.script && !!descriptor.scriptSetup;
      code = mask(text);
      for (const block of [descriptor.script, descriptor.scriptSetup].filter(
        Boolean
      )) {
        if (block.src)
          throw new Error(
            `External Vue script requires explicit extraction support: ${file}`
          );
        code =
          code.slice(0, block.loc.start.offset) +
          block.content +
          code.slice(block.loc.end.offset);
      }
    }
    module.ast = ts.createSourceFile(
      file,
      code,
      ts.ScriptTarget.Latest,
      true,
      /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    if (/\.(graphql|gql)$/.test(file)) return module;
    if (module.ast.parseDiagnostics.length) {
      const error = module.ast.parseDiagnostics[0];
      const issue = new Error(
        `Cannot parse ${file}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`
      );
      issue.sourceOffset = error.start ?? 0;
      throw issue;
    }
    for (const statement of module.ast.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const from = statement.moduleSpecifier.text;
        const clause = statement.importClause;
        if (clause?.name)
          module.imports.set(clause.name.text, { from, imported: 'default' });
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const binding of clause.namedBindings.elements)
            module.imports.set(binding.name.text, {
              from,
              imported: binding.propertyName?.text ?? binding.name.text,
            });
        } else if (clause?.namedBindings)
          module.imports.set(clause.namedBindings.name.text, {
            from,
            imported: '*',
          });
      }
      if (ts.isExportDeclaration(statement)) {
        const from = statement.moduleSpecifier?.text;
        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          for (const binding of statement.exportClause.elements)
            module.exports.set(binding.name.text, {
              from,
              imported: binding.propertyName?.text ?? binding.name.text,
            });
        } else if (from) module.stars.push(from);
      }
      if (ts.isExportAssignment(statement))
        module.exports.set('default', { expression: statement.expression });
      if (
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name))
            module.exports.set(declaration.name.text, {
              imported: declaration.name.text,
            });
      }
    }
    function requiredPackage(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      )
        return node.arguments[0].text;
      return null;
    }
    function isTag(node, seen = new Set()) {
      if (requiredPackage(node) === 'graphql-tag') return true;
      if (ts.isIdentifier(node)) {
        if (seen.has(node.text)) return false;
        let current = scope(node);
        while (current) {
          const binding = module.bindings
            .get(node.text)
            ?.find((candidate) => scope(candidate) === current);
          if (binding) {
            if (
              ts.isVariableDeclaration(binding) &&
              ts.isIdentifier(binding.name) &&
              binding.parent.flags & ts.NodeFlags.Const &&
              binding.initializer
            )
              return isTag(binding.initializer, new Set(seen).add(node.text));
            return false;
          }
          current = scope(current.parent);
        }
        const imported = module.imports.get(node.text);
        return (
          node.text === 'gql' ||
          imported?.imported === 'gql' ||
          (imported?.imported === 'default' && imported.from === 'graphql-tag')
        );
      }
      if (!ts.isPropertyAccessExpression(node) || node.name.text !== 'gql')
        return false;
      if (
        ['graphql-tag', '@apollo/client', '@apollo/client/core'].includes(
          requiredPackage(node.expression)
        )
      )
        return true;
      if (!ts.isIdentifier(node.expression)) return false;
      let current = scope(node);
      while (current) {
        const binding = module.bindings
          .get(node.expression.text)
          ?.find((candidate) => scope(candidate) === current);
        if (binding)
          return (
            ts.isVariableDeclaration(binding) &&
            ts.isIdentifier(binding.name) &&
            !!(binding.parent.flags & ts.NodeFlags.Const) &&
            !!binding.initializer &&
            ['graphql-tag', '@apollo/client', '@apollo/client/core'].includes(
              requiredPackage(binding.initializer)
            )
          );
        current = scope(current.parent);
      }
      return module.imports.get(node.expression.text)?.imported === '*';
    }
    function registerBinding(name, declaration) {
      if (ts.isIdentifier(name)) {
        const bindings = module.bindings.get(name.text) ?? [];
        bindings.push(declaration);
        module.bindings.set(name.text, bindings);
      } else {
        for (const element of name.elements)
          if (ts.isBindingElement(element))
            registerBinding(element.name, declaration);
      }
    }
    function visit(node) {
      if (ts.isVariableDeclaration(node) || ts.isParameter(node))
        registerBinding(node.name, node);
      ts.forEachChild(node, visit);
    }
    visit(module.ast);
    function collect(node) {
      if (
        (ts.isTaggedTemplateExpression(node) && isTag(node.tag)) ||
        (ts.isCallExpression(node) && isTag(node.expression))
      )
        module.templates.push(node);
      const tag = ts.isTaggedTemplateExpression(node)
        ? node.tag
        : ts.isCallExpression(node)
          ? node.expression
          : null;
      if (tag && ts.isIdentifier(tag) && !isTag(tag)) {
        const imported = module.imports.get(tag.text);
        if (
          imported?.imported === 'gql' ||
          (imported?.imported === 'default' && imported.from === 'graphql-tag')
        ) {
          problems.push(
            failure(
              module,
              tag,
              'GraphQL tag is shadowed by a dynamic local binding'
            )
          );
        }
      }
      const parent = node.parent;
      const ownTrivia = module.ast.text.slice(
        node.getFullStart(),
        node.getStart(module.ast)
      );
      const annotated = /\/\*\s*(?:graphql|gql)\s*\*\//i.test(ownTrivia);
      const sameExpressionStart =
        parent &&
        ts.isExpression(parent) &&
        parent.getStart(module.ast) === node.getStart(module.ast);
      const literal = ts.isTemplateExpression(node)
        ? node.head.text
        : ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
          ? node.text
          : null;
      const ownedByTag =
        !!parent &&
        ((ts.isTaggedTemplateExpression(parent) && isTag(parent.tag)) ||
          (ts.isCallExpression(parent) && isTag(parent.expression)));
      if (
        literal !== null &&
        !annotated &&
        !ownedByTag &&
        looksLikeOperation(literal)
      ) {
        problems.push(
          failure(
            module,
            node,
            'Raw GraphQL-like string requires a /* GraphQL */ annotation for static validation'
          )
        );
      }
      if (annotated && ts.isExpression(node) && !sameExpressionStart) {
        const ownedByTag =
          (ts.isTaggedTemplateExpression(parent) && isTag(parent.tag)) ||
          (ts.isCallExpression(parent) && isTag(parent.expression));
        if (
          !ownedByTag &&
          (ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateExpression(node))
        ) {
          module.rawDocuments.add(node);
          module.templates.push(node);
        } else if (
          !ownedByTag &&
          !(ts.isTaggedTemplateExpression(node) && isTag(node.tag)) &&
          !(ts.isCallExpression(node) && isTag(node.expression))
        ) {
          problems.push(
            failure(
              module,
              node,
              'Annotated GraphQL must be a static string, template, or recognized GraphQL tag'
            )
          );
        }
      }
      ts.forEachChild(node, collect);
    }
    collect(module.ast);
    if (multipleVueScripts && module.templates.length) {
      throw new Error(
        `GraphQL in Vue files with both script blocks requires explicit scope support: ${file}`
      );
    }
    function checkTagUsage(node) {
      if (
        (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) &&
        isTag(node)
      ) {
        const parent = node.parent;
        let ancestor = parent;
        while (ancestor && !ts.isSourceFile(ancestor)) {
          if (
            ts.isImportDeclaration(ancestor) ||
            ts.isExportDeclaration(ancestor)
          )
            break;
          ancestor = ancestor.parent;
        }
        const declaration = ancestor && !ts.isSourceFile(ancestor);
        const supported =
          declaration ||
          (ts.isTaggedTemplateExpression(parent) && parent.tag === node) ||
          (ts.isCallExpression(parent) && parent.expression === node) ||
          (ts.isVariableDeclaration(parent) &&
            (parent.name === node ||
              (parent.initializer === node &&
                ts.isIdentifier(parent.name) &&
                parent.parent.flags & ts.NodeFlags.Const))) ||
          (ts.isPropertyAccessExpression(parent) && isTag(parent));
        if (!supported)
          problems.push(
            failure(
              module,
              node,
              'GraphQL tag used dynamically; static extraction cannot account for this usage'
            )
          );
      }
      ts.forEachChild(node, checkTagUsage);
    }
    checkTagUsage(module.ast);
    // Server requests addressed to a GraphQL URL must not hide their query in
    // opaque values. The generic /api/graphql proxy forwards user requests and
    // has no authored query, so it is outside this check.
    if (module.file.startsWith('server/')) {
      function checkRequest(node) {
        if (
          (ts.isPropertyAssignment(node) ||
            ts.isShorthandPropertyAssignment(node)) &&
          node.name?.getText(module.ast) === 'query'
        ) {
          const body = node.parent;
          const bodyField = body?.parent;
          const options = bodyField?.parent;
          const request = options?.parent;
          if (
            ts.isObjectLiteralExpression(body) &&
            ts.isPropertyAssignment(bodyField) &&
            bodyField.name.getText(module.ast) === 'body' &&
            ts.isObjectLiteralExpression(options) &&
            ts.isCallExpression(request) &&
            request.arguments[1] === options &&
            /graphql/i.test(request.arguments[0]?.getText(module.ast) ?? '')
          ) {
            try {
              resolveExpression(
                module,
                ts.isPropertyAssignment(node) ? node.initializer : node.name
              );
            } catch (error) {
              problems.push(
                failure(
                  module,
                  node,
                  `Server GraphQL request query must resolve to a static document: ${error.message}`
                )
              );
            }
          }
        }
        ts.forEachChild(node, checkRequest);
      }
      checkRequest(module.ast);
    }
    return module;
  }
  function resolveModule(module, from) {
    const base =
      from.startsWith('@/') || from.startsWith('~/')
        ? from.slice(2)
        : from.startsWith('.')
          ? slash(path.join(path.dirname(module.file), from))
          : null;
    if (base === null)
      throw new Error(
        `Cannot statically import GraphQL documents from package ${from}`
      );
    const candidates = [
      base,
      ...extensions.map((ext) => base + ext),
      ...extensions.map((ext) => `${base}/index${ext}`),
    ];
    if (base.endsWith('.mjs')) candidates.push(base.slice(0, -4) + '.mts');
    if (base.endsWith('.cjs')) candidates.push(base.slice(0, -4) + '.cts');
    if (/\.[jt]sx?$/.test(base))
      candidates.push(
        base.replace(/\.[jt]sx?$/, '.ts'),
        base.replace(/\.[jt]sx?$/, '.js')
      );
    const found = candidates.find((candidate) => fileSet.has(candidate));
    if (!found)
      throw new Error(`Unresolved GraphQL import ${from} from ${module.file}`);
    return load(found);
  }
  function resolveExport(module, name, trail = new Set()) {
    const key = `${module.file}#${name}`;
    if (trail.has(key)) throw new Error(`Cyclic GraphQL re-export: ${key}`);
    const next = new Set(trail).add(key);
    if (/\.(graphql|gql)$/.test(module.file) && name === 'default')
      return standalone(module);
    const exported = module.exports.get(name);
    if (exported?.expression)
      return resolveExpression(module, exported.expression, next);
    if (exported?.from)
      return resolveExport(
        resolveModule(module, exported.from),
        exported.imported,
        next
      );
    if (exported)
      return resolveIdentifier(module, exported.imported, module.ast, next);
    const candidates = module.stars.map((from) => resolveModule(module, from));
    const matches = candidates.filter((candidate) =>
      providesExport(candidate, name)
    );
    if (matches.length === 1) return resolveExport(matches[0], name, next);
    throw new Error(`Missing or ambiguous GraphQL export ${key}`);
  }
  function providesExport(module, name, seen = new Set()) {
    if (seen.has(module.file)) return false;
    if (module.exports.has(name)) return true;
    return module.stars.some((from) =>
      providesExport(
        resolveModule(module, from),
        name,
        new Set(seen).add(module.file)
      )
    );
  }
  function resolveIdentifier(module, name, reference, trail = new Set()) {
    let current = scope(reference);
    while (current) {
      const binding = module.bindings
        .get(name)
        ?.find((candidate) => scope(candidate) === current);
      if (binding) {
        if (
          !ts.isVariableDeclaration(binding) ||
          !ts.isIdentifier(binding.name) ||
          !(binding.parent.flags & ts.NodeFlags.Const) ||
          !binding.initializer
        ) {
          throw new Error(
            `GraphQL interpolation ${name} is mutable, destructured, or a parameter in ${module.file}`
          );
        }
        return resolveExpression(module, binding.initializer, trail);
      }
      current = scope(current.parent);
    }
    const imported = module.imports.get(name);
    if (imported && imported.imported !== '*')
      return resolveExport(
        resolveModule(module, imported.from),
        imported.imported,
        trail
      );
    throw new Error(
      `Unresolved or non-document GraphQL interpolation ${name} in ${module.file}`
    );
  }
  function resolveExpression(module, expression, trail = new Set()) {
    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression)
    )
      return resolveExpression(module, expression.expression, trail);
    if (ts.isIdentifier(expression))
      return resolveIdentifier(module, expression.text, expression, trail);
    if (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression)
    ) {
      const imported = module.imports.get(expression.expression.text);
      if (imported?.imported === '*')
        return resolveExport(
          resolveModule(module, imported.from),
          expression.name.text,
          trail
        );
    }
    if (module.templates.includes(expression))
      return compile(module, expression);
    throw new Error(
      `Dynamic GraphQL document interpolation is unsupported: ${expression.getText(module.ast)}`
    );
  }
  function standalone(module) {
    if (/^\s*#\s*import\b/m.test(module.text))
      throw new Error(
        `GraphQL #import directives require explicit resolution support: ${module.file}`
      );
    const source = new Source(module.text, module.file);
    sourceMaps.set(source, {
      module,
      offsets: Array.from({ length: module.text.length }, (_, i) => i),
      endOffset: module.text.length,
    });
    return { definitions: parse(source).definitions, valueInterpolations: [] };
  }
  function compile(module, node) {
    if (compiled.has(node)) return compiled.get(node);
    if (compiling.has(node))
      throw new Error(
        `Cyclic GraphQL document interpolation in ${module.file}`
      );
    compiling.add(node);
    try {
      const template = ts.isTaggedTemplateExpression(node)
        ? node.template
        : ts.isCallExpression(node)
          ? node.arguments[0]
          : node;
      if (
        !template ||
        (!ts.isStringLiteral(template) &&
          !ts.isNoSubstitutionTemplateLiteral(template) &&
          !ts.isTemplateExpression(template)) ||
        (ts.isCallExpression(node) && node.arguments.length !== 1)
      ) {
        throw new Error(
          'GraphQL calls require one static string or template literal'
        );
      }
      let body = '';
      const offsets = [];
      const dependencies = [];
      const valueInterpolations = [];
      function append(literal, last) {
        const start = literal.getStart(module.ast) + 1;
        const end = literal.end - (last ? 1 : 2);
        body += literal.text;
        offsets.push(
          ...literalOffsets(module.text.slice(start, end), literal.text, start)
        );
      }
      if (ts.isTemplateExpression(template)) {
        append(template.head, false);
        for (const span of template.templateSpans) {
          if (insideString(body)) {
            const placeholder = 'STATIC_INTERPOLATED_VALUE';
            body += placeholder;
            offsets.push(
              ...Array(placeholder.length).fill(
                span.expression.getStart(module.ast)
              )
            );
            valueInterpolations.push({
              ...location(module, span.expression.getStart(module.ast)),
              expression: span.expression.getText(module.ast),
            });
          } else {
            if (module.rawDocuments.has(node))
              throw new Error(
                'Raw GraphQL strings cannot interpolate structural expressions'
              );
            dependencies.push(resolveExpression(module, span.expression));
            body += ' ';
            offsets.push(span.expression.getStart(module.ast));
          }
          append(
            span.literal,
            span.literal.kind === ts.SyntaxKind.TemplateTail
          );
        }
      } else append(template, true);
      const source = new Source(body, module.file);
      sourceMaps.set(source, { module, offsets, endOffset: template.end - 1 });
      const definitions = body.trim() ? parse(source).definitions : [];
      const combined = [
        ...definitions,
        ...dependencies.flatMap((dep) => dep.definitions),
      ];
      const seen = new Set();
      const result = {
        definitions: combined.filter((definition) => {
          if (definition.kind !== Kind.FRAGMENT_DEFINITION) return true;
          const signature = print(definition);
          if (seen.has(signature)) return false;
          seen.add(signature);
          return true;
        }),
        valueInterpolations: [
          ...valueInterpolations,
          ...dependencies.flatMap((dep) => dep.valueInterpolations),
        ],
      };
      if (!result.definitions.length) throw new Error('Empty GraphQL document');
      compiled.set(node, result);
      return result;
    } finally {
      compiling.delete(node);
    }
  }
  function errorLocations(error, fallback) {
    const nodes = error.nodes ?? [];
    const points = nodes
      .filter((node) => node.loc)
      .map((node) => ({ source: node.loc.source, position: node.loc.start }));
    if (!points.length && error.source)
      for (const position of error.positions ?? [0])
        points.push({ source: error.source, position });
    return points.map(({ source, position }) => {
      const mapped = sourceMaps.get(source);
      return mapped
        ? location(mapped.module, mapped.offsets[position] ?? mapped.endOffset)
        : fallback;
    });
  }
  function record(module, node, document) {
    const at = location(module, node ? node.getStart(module.ast) : 0);
    const declaration = node?.parent;
    const ast = { kind: Kind.DOCUMENT, definitions: document.definitions };
    const name =
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      ts.isIdentifier(declaration.name)
        ? declaration.name.text
        : `inline:${ast.definitions.find((definition) => definition.name)?.name?.value ?? 'anonymous'}`;
    const id = `${module.file}#${name}`;
    const text = print(ast);
    const hasOperations = ast.definitions.some(
      (definition) => definition.kind === Kind.OPERATION_DEFINITION
    );
    const rules = hasOperations
      ? specifiedRules
      : specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule);
    const diagnostics = validate(schema, ast, rules).map((error) => ({
      kind: 'validation',
      message: error.message,
      locations: errorLocations(error, at),
    }));
    documents.push({
      id,
      file: module.file,
      line: at.line,
      column: at.column,
      hash: digest(text),
      ...(includeSource ? { source: text } : {}),
      operations: ast.definitions
        .filter((d) => d.kind === Kind.OPERATION_DEFINITION)
        .map((d) => ({ name: d.name?.value ?? null, kind: d.operation })),
      style: module.rawDocuments.has(node)
        ? 'annotated-string'
        : /\.(graphql|gql)$/.test(module.file)
          ? 'graphql-file'
          : 'tagged-document',
      fragments: ast.definitions
        .filter((d) => d.kind === Kind.FRAGMENT_DEFINITION)
        .map((d) => d.name.value),
      valueInterpolations: document.valueInterpolations,
      diagnostics,
    });
  }
  for (const file of files) {
    let module;
    try {
      module = load(file);
      if (/\.(graphql|gql)$/.test(file))
        record(module, null, standalone(module));
      for (const node of module.templates) {
        try {
          record(module, node, compile(module, node));
        } catch (error) {
          const diagnostic = failure(module, node, error.message);
          const mapped = errorLocations(error, diagnostic.locations[0]);
          problems.push({
            ...diagnostic,
            locations: mapped.length ? mapped : diagnostic.locations,
          });
        }
      }
    } catch (error) {
      const sourceModule = module ?? modules.get(file);
      const fallback = sourceModule
        ? location(sourceModule, error.sourceOffset ?? 0)
        : { file, line: 1, column: 1 };
      const mapped = errorLocations(error, fallback);
      problems.push({
        kind: 'extraction',
        message: error.message,
        locations: mapped.length ? mapped : [fallback],
      });
    }
  }
  return {
    formatVersion: 1,
    boundaries: {
      excludedDirectories,
      excludedFiles: '*.spec.*, *.test.*, *.d.*; dot directories/files',
    },
    sourceFiles: files,
    documents,
    extractionErrors: problems,
    summary: {
      sourceFiles: files.length,
      documents: documents.length,
      operations: documents.reduce((n, doc) => n + doc.operations.length, 0),
      fragmentDocuments: documents.filter((doc) => !doc.operations.length)
        .length,
      annotatedStrings: documents.filter(
        (doc) => doc.style === 'annotated-string'
      ).length,
      validationErrors: documents.reduce(
        (n, doc) => n + doc.diagnostics.length,
        0
      ),
      extractionErrors: problems.length,
    },
  };
}

export function validationEntries(report) {
  const occurrences = new Map();
  return report.documents.flatMap((document) =>
    document.diagnostics.map((diagnostic) => {
      const base = {
        document: document.id,
        hash: document.hash,
        message: diagnostic.message,
      };
      const key = JSON.stringify(base);
      const occurrence = occurrences.get(key) ?? 0;
      occurrences.set(key, occurrence + 1);
      const signature = { ...base, occurrence };
      return {
        id: digest(JSON.stringify(signature)),
        ...signature,
        locations: diagnostic.locations,
      };
    })
  );
}

export function compareBaseline(report, baseline, schemaHash) {
  if (
    baseline.formatVersion !== 1 ||
    baseline.schemaHash !== schemaHash ||
    !Array.isArray(baseline.errors)
  )
    throw new Error(
      'Validation baseline format or schema hash does not match the pinned contract'
    );
  const entries = validationEntries(report);
  const expected = new Set();
  for (const entry of baseline.errors) {
    const signature = {
      document: entry.document,
      hash: entry.hash,
      message: entry.message,
      occurrence: entry.occurrence,
    };
    if (
      typeof entry.document !== 'string' ||
      !/^[a-f0-9]{64}$/.test(entry.hash ?? '') ||
      typeof entry.message !== 'string' ||
      !Number.isSafeInteger(entry.occurrence) ||
      entry.occurrence < 0 ||
      !Array.isArray(entry.locations) ||
      entry.id !== digest(JSON.stringify(signature)) ||
      expected.has(entry.id)
    ) {
      throw new Error('Invalid or duplicate GraphQL validation baseline entry');
    }
    expected.add(entry.id);
  }
  const actual = new Set(entries.map((entry) => entry.id));
  return {
    unexpected: entries.filter((entry) => !expected.has(entry.id)),
    stale: baseline.errors.filter((entry) => !actual.has(entry.id)),
  };
}
