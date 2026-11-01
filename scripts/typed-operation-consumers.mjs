import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { parse as parseVue } from 'vue/compiler-sfc';
import { discoverOperationSources } from './graphql-operations.mjs';

const slash = (value) => value.split(path.sep).join('/');
const camel = (value) =>
  value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const textName = (node) =>
  node && (ts.isIdentifier(node) || ts.isStringLiteral(node))
    ? node.text
    : undefined;
const merge = (values) => ({
  documents: [
    ...new Map(
      values
        .flatMap((value) => value.documents)
        .map((value) => [JSON.stringify(value), value])
    ).values(),
  ],
  unresolved: [...new Set(values.flatMap((value) => value.unresolved))],
  erasures: [...new Set(values.flatMap((value) => value.erasures))],
});
const empty = () => ({ documents: [], unresolved: [], erasures: [] });
const unknown = (reason) => ({ ...empty(), unresolved: [reason] });
const isFunction = (node) => ts.isFunctionLike(node) && !!node.body;
const isScope = (node) =>
  ts.isSourceFile(node) || ts.isBlock(node) || isFunction(node);
function scopeOf(node) {
  let current = node.parent;
  while (current && !isScope(current)) current = current.parent;
  return current;
}
function distance(node, scope) {
  let count = 0;
  for (let current = node; current; current = current.parent, count++)
    if (current === scope) return count;
  return Infinity;
}
function returns(node) {
  if (!ts.isBlock(node.body)) return [node.body];
  const result = [];
  const walk = (child) => {
    if (ts.isReturnStatement(child) && child.expression)
      result.push(child.expression);
    else if (!isFunction(child)) ts.forEachChild(child, walk);
  };
  ts.forEachChild(node.body, walk);
  return result;
}

// Report every recognized boundary. Unknown flows remain explicit failures in
// enforcement mode; resolving a generated source alone does not prove a caller
// retained the type (generic overrides and document assertions are also recorded).
export function auditConsumers(root, options = {}) {
  const fileTexts =
    options.files ||
    Object.fromEntries(
      discoverOperationSources(root).map((file) => [
        file,
        readFileSync(path.join(root, file), 'utf8'),
      ])
    );
  const mapping =
    options.mapping ||
    JSON.parse(
      readFileSync(
        path.join(root, '__generated__/operation-sources.json'),
        'utf8'
      )
    ).sources;
  const symbolSources = new Map();
  for (const [id, entry] of Object.entries(mapping))
    for (const item of [...entry.operations, ...entry.fragments]) {
      const sources = symbolSources.get(item.document) || [];
      sources.push(id);
      symbolSources.set(item.document, sources);
    }
  const manifest = path.join(root, 'graphql-schema/manifest.json');
  const schemaContractFingerprint =
    options.schemaContractFingerprint ??
    (existsSync(manifest)
      ? createHash('sha256').update(readFileSync(manifest)).digest('hex')
      : null);
  const models = new Map();
  for (const [file, original] of Object.entries(fileTexts)) {
    let source = original;
    let template;
    if (file.endsWith('.vue')) {
      const descriptor = parseVue(original, { filename: file }).descriptor;
      source = original.replace(/[^\r\n]/g, ' ');
      for (const block of [descriptor.script, descriptor.scriptSetup].filter(
        Boolean
      ))
        source =
          source.slice(0, block.loc.start.offset) +
          block.content +
          source.slice(block.loc.end.offset);
      template = descriptor.template?.ast;
    }
    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const model = {
      file,
      ast,
      source,
      template,
      imports: new Map(),
      declarations: new Map(),
      exports: new Map(),
      calls: [],
    };
    const add = (name, value) => {
      const list = model.declarations.get(name) || [];
      list.push(value);
      model.declarations.set(name, list);
    };
    const walk = (node) => {
      if (ts.isImportDeclaration(node) && node.importClause) {
        const module = node.moduleSpecifier.text;
        if (node.importClause.name)
          model.imports.set(node.importClause.name.text, {
            module,
            name: 'default',
          });
        const bindings = node.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings))
          for (const item of bindings.elements)
            model.imports.set(item.name.text, {
              module,
              name: item.propertyName?.text || item.name.text,
              typeOnly: node.importClause.isTypeOnly || item.isTypeOnly,
            });
        if (bindings && ts.isNamespaceImport(bindings))
          model.imports.set(bindings.name.text, { module, name: '*' });
      }
      if (ts.isVariableDeclaration(node)) {
        if (ts.isIdentifier(node.name))
          add(node.name.text, {
            node,
            value: node.initializer,
            scope: scopeOf(node),
            type: node.type,
          });
        else if (ts.isObjectBindingPattern(node.name))
          for (const item of node.name.elements)
            if (ts.isIdentifier(item.name))
              add(item.name.text, {
                node,
                value: node.initializer,
                scope: scopeOf(node),
                select: textName(item.propertyName) || item.name.text,
                type: node.type,
              });
      }
      if (ts.isFunctionDeclaration(node) && node.name)
        add(node.name.text, { node, value: node, scope: scopeOf(node) });
      if (ts.isParameter(node) && ts.isIdentifier(node.name))
        add(node.name.text, {
          node,
          value: node.initializer,
          scope: node.parent,
          type: node.type,
          parameter: true,
        });
      if (ts.isCallExpression(node)) model.calls.push(node);
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      )
        for (const item of node.exportClause.elements)
          model.exports.set(item.name.text, {
            name: item.propertyName?.text || item.name.text,
            module: node.moduleSpecifier?.text,
          });
      ts.forEachChild(node, walk);
    };
    walk(ast);
    models.set(file, model);
  }
  const moduleFile = (model, specifier) => {
    const base =
      specifier.startsWith('@/') || specifier.startsWith('~/')
        ? specifier.slice(2)
        : specifier.startsWith('.')
          ? slash(
              path.normalize(path.join(path.dirname(model.file), specifier))
            )
          : undefined;
    if (!base) return undefined;
    return [
      base,
      ...['.ts', '.js', '.vue', '.mts', '/index.ts', '/index.js'].map(
        (extension) => base + extension
      ),
    ].find((file) => models.has(file));
  };
  const generatedImport = (specifier) =>
    /(?:^|\/)__generated__\/operations(?:\.ts)?$/.test(specifier);
  const propInputs = new Map();
  for (const model of models.values()) {
    const walk = (node) => {
      if (!node) return;
      if (node.type === 1) {
        const imported = model.imports.get(node.tag);
        const target = imported && moduleFile(model, imported.module);
        if (target)
          for (const prop of node.props || [])
            if (
              prop.type === 7 &&
              prop.name === 'bind' &&
              prop.arg?.content &&
              prop.exp?.content
            ) {
              const key = `${target}:${camel(prop.arg.content)}`;
              const entries = propInputs.get(key) || [];
              const expressionAst = ts.createSourceFile(
                'binding.ts',
                `(${prop.exp.content})`,
                ts.ScriptTarget.Latest,
                true
              );
              entries.push({
                model,
                expression: expressionAst.statements[0].expression,
                context: model.ast,
              });
              propInputs.set(key, entries);
            }
      }
      for (const child of node.children || []) walk(child);
      if (node.branches) for (const branch of node.branches) walk(branch);
    };
    walk(model.template);
  }
  function resolve(model, node, keys = [], seen = new Set(), context = node) {
    if (!node) return unknown('missing document expression');
    const marker = `${model.file}:${node.pos}:${node.end}:${keys.join('.')}`;
    if (seen.has(marker))
      return unknown(
        `cyclic/recursive document flow: ${node.getText(model.ast).slice(0, 80)}`
      );
    const next = new Set([...seen, marker]);
    const recur = (expression, remaining = keys, at = context) =>
      resolve(model, expression, remaining, next, at);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node)
    )
      return recur(node.expression);
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      const value = recur(node.expression);
      return {
        ...value,
        erasures: [
          ...value.erasures,
          `document assertion: ${node.type.getText(model.ast)}`,
        ],
      };
    }
    if (ts.isIdentifier(node)) {
      const imported = model.imports.get(node.text);
      if (imported) {
        if (generatedImport(imported.module)) {
          const symbol = imported.name === '*' ? keys[0] : imported.name;
          return symbolSources.has(symbol)
            ? {
                ...empty(),
                documents: [
                  {
                    kind: 'generated',
                    symbol,
                    sources: symbolSources.get(symbol),
                  },
                ],
              }
            : unknown(`unknown generated export ${symbol}`);
        }
        const target = moduleFile(model, imported.module);
        if (target)
          return resolveExport(
            models.get(target),
            imported.name === '*' ? keys[0] : imported.name,
            imported.name === '*' ? keys.slice(1) : keys,
            next
          );
        return unknown(
          `external document origin: ${imported.module}#${imported.name}`
        );
      }
      const candidates = (model.declarations.get(node.text) || [])
        .map((entry) => ({
          ...entry,
          distance: distance(context, entry.scope),
        }))
        .filter((entry) => Number.isFinite(entry.distance))
        .sort((left, right) => left.distance - right.distance);
      const declaration =
        candidates[0] ||
        (context === model.ast
          ? model.declarations
              .get(node.text)
              ?.find((entry) => ts.isSourceFile(entry.scope))
          : undefined);
      if (!declaration) return unknown(`unresolved identifier ${node.text}`);
      const value =
        declaration.parameter && !declaration.value
          ? resolveParameter(model, declaration.node, keys, next)
          : resolve(
              model,
              declaration.value,
              declaration.select ? [declaration.select, ...keys] : keys,
              next,
              declaration.node
            );
      if (
        declaration.type &&
        /\b(?:DocumentNode|any|unknown)\b/.test(
          declaration.type.getText(model.ast)
        )
      )
        value.erasures.push(
          `document annotation: ${declaration.type.getText(model.ast)}`
        );
      return value;
    }
    if (ts.isPropertyAccessExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === 'props')
        return resolveProp(model, node.name.text, keys, next);
      return recur(node.expression, [node.name.text, ...keys]);
    }
    if (ts.isElementAccessExpression(node)) {
      const key =
        node.argumentExpression &&
        (ts.isStringLiteral(node.argumentExpression) ||
          ts.isNumericLiteral(node.argumentExpression))
          ? node.argumentExpression.text
          : undefined;
      return recur(node.expression, [key || '*', ...keys]);
    }
    if (ts.isConditionalExpression(node))
      return merge([recur(node.whenTrue), recur(node.whenFalse)]);
    if (
      ts.isBinaryExpression(node) &&
      [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
        node.operatorToken.kind
      )
    )
      return merge([recur(node.left), recur(node.right)]);
    if (ts.isObjectLiteralExpression(node)) {
      if (!keys.length) return unknown('object used as document');
      const [key, ...remaining] = keys;
      const properties = node.properties.filter(
        (property) => key === '*' || textName(property.name) === key
      );
      return properties.length
        ? merge(
            properties.map((property) =>
              ts.isPropertyAssignment(property)
                ? recur(property.initializer, remaining)
                : ts.isShorthandPropertyAssignment(property)
                  ? recur(property.name, remaining)
                  : unknown('unsupported document object spread/method')
            )
          )
        : unknown(`missing document property ${key}`);
    }
    if (isFunction(node)) {
      const value = merge(
        returns(node).map((expression) =>
          resolve(model, expression, keys, next, expression)
        )
      );
      if (
        node.type &&
        /\b(?:DocumentNode|any|unknown)\b/.test(node.type.getText(model.ast))
      )
        value.erasures.push(
          `document return annotation: ${node.type.getText(model.ast)}`
        );
      return value;
    }
    if (ts.isCallExpression(node)) {
      const name = ts.isIdentifier(node.expression)
        ? node.expression.text
        : undefined;
      if (['computed', 'ref', 'shallowRef', 'readonly'].includes(name))
        return recur(
          node.arguments[0],
          keys[0] === 'value' ? keys.slice(1) : keys
        );
      if (name === 'gql' || name === 'graphql')
        return {
          ...empty(),
          documents: [
            {
              kind: 'raw',
              source: model.file,
              expression: node.getText(model.ast).slice(0, 120),
              documentFingerprint: createHash('sha256')
                .update(node.getText(model.ast))
                .digest('hex'),
            },
          ],
        };
      if (name === 'defineProps' || name === 'withDefaults')
        return keys.length
          ? resolveProp(model, keys[0], keys.slice(1), next)
          : unknown('props object used as document');
      return recur(node.expression);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return {
        ...empty(),
        documents: [
          {
            kind: 'raw',
            source: model.file,
            expression: node.text.slice(0, 120),
            documentFingerprint: createHash('sha256')
              .update(node.text)
              .digest('hex'),
          },
        ],
      };
    if (ts.isTaggedTemplateExpression(node))
      return {
        ...empty(),
        documents: [
          {
            kind: 'raw',
            source: model.file,
            expression: node.getText(model.ast).slice(0, 120),
            documentFingerprint: createHash('sha256')
              .update(node.getText(model.ast))
              .digest('hex'),
          },
        ],
      };
    return unknown(
      `unsupported document expression: ${ts.SyntaxKind[node.kind]}`
    );
  }
  function resolveParameter(model, parameter, keys, seen) {
    const fn = parameter.parent;
    const name =
      fn.name?.text ||
      (ts.isVariableDeclaration(fn.parent)
        ? textName(fn.parent.name)
        : undefined);
    if (!name)
      return unknown(
        `anonymous wrapper parameter ${parameter.name.getText(model.ast)}`
      );
    const index = fn.parameters.indexOf(parameter);
    const inputs = [];
    for (const candidate of models.values())
      for (const call of candidate.calls) {
        if (!ts.isIdentifier(call.expression)) continue;
        const imported = candidate.imports.get(call.expression.text);
        const sameLocal = candidate === model && call.expression.text === name;
        const sameImport =
          imported &&
          imported.name === name &&
          moduleFile(candidate, imported.module) === model.file;
        if (sameLocal || sameImport)
          inputs.push(
            resolve(candidate, call.arguments[index], keys, seen, call)
          );
      }
    return inputs.length
      ? merge(inputs)
      : unknown(
          `wrapper parameter without resolved callers: ${model.file}#${name}.${parameter.name.getText(model.ast)}`
        );
  }
  function resolveExport(model, name, keys, seen) {
    const reexport = model.exports.get(name);
    if (reexport?.module) {
      if (generatedImport(reexport.module))
        return symbolSources.has(reexport.name)
          ? {
              ...empty(),
              documents: [
                {
                  kind: 'generated',
                  symbol: reexport.name,
                  sources: symbolSources.get(reexport.name),
                },
              ],
            }
          : unknown(`unknown generated export ${reexport.name}`);
      const target = moduleFile(model, reexport.module);
      return target
        ? resolveExport(models.get(target), reexport.name, keys, seen)
        : unknown(`unresolved re-export ${reexport.module}`);
    }
    const local = reexport?.name || name;
    const imported = model.imports.get(local);
    if (imported) {
      const identifier = model.ast.statements
        .flatMap((statement) =>
          ts.isImportDeclaration(statement) &&
          statement.importClause?.namedBindings &&
          ts.isNamedImports(statement.importClause.namedBindings)
            ? statement.importClause.namedBindings.elements
            : []
        )
        .find((item) => item.name.text === local)?.name;
      if (identifier) return resolve(model, identifier, keys, seen, model.ast);
    }
    const declaration = model.declarations
      .get(local)
      ?.find((entry) => ts.isSourceFile(entry.scope));
    return declaration
      ? resolve(model, declaration.value, keys, seen, declaration.node)
      : unknown(`unresolved export ${model.file}#${local}`);
  }
  function resolveProp(model, name, keys, seen) {
    const values = (propInputs.get(`${model.file}:${name}`) || []).map(
      (input) =>
        resolve(input.model, input.expression, keys, seen, input.context)
    );
    for (const call of model.calls)
      if (
        ts.isIdentifier(call.expression) &&
        call.expression.text === 'defineProps' &&
        call.arguments[0] &&
        ts.isObjectLiteralExpression(call.arguments[0])
      ) {
        const prop = call.arguments[0].properties.find(
          (property) => textName(property.name) === name
        );
        if (
          prop &&
          ts.isPropertyAssignment(prop) &&
          ts.isObjectLiteralExpression(prop.initializer)
        ) {
          const defaultProperty = prop.initializer.properties.find(
            (property) => textName(property.name) === 'default'
          );
          if (defaultProperty && ts.isPropertyAssignment(defaultProperty))
            values.push(
              resolve(
                model,
                defaultProperty.initializer,
                keys,
                seen,
                defaultProperty
              )
            );
          if (/\b(?:DocumentNode|any|unknown)\b/.test(prop.getText(model.ast)))
            values.push({
              ...empty(),
              erasures: [`untyped document prop ${name}`],
            });
        }
      }
    return values.length
      ? merge(values)
      : unknown(
          `document prop ${name} has no statically resolved input/default`
        );
  }
  // Legacy variable exceptions must be re-reviewed when their actual payload
  // builders change, not only when a ReturnType/typeof spelling changes. Capture
  // normalized builder/computed bodies and the local/utility helpers they call.
  function payloadContracts(model, call) {
    const printer = ts.createPrinter({ removeComments: true });
    const collected = new Map();
    const seen = new Set();
    const findDeclaration = (owner, name, context) => {
      const candidates = (owner.declarations.get(name) || [])
        .map((entry) => ({
          ...entry,
          distance: distance(context, entry.scope),
        }))
        .filter((entry) => Number.isFinite(entry.distance))
        .sort((left, right) => left.distance - right.distance);
      return (
        candidates[0] ||
        owner.declarations
          .get(name)
          ?.find((entry) => ts.isSourceFile(entry.scope))
      );
    };
    const collect = (owner, name, context, required = false) => {
      const imported = owner.imports.get(name);
      if (imported) {
        const target = moduleFile(owner, imported.module);
        // Vue/auth/composable state is runtime input, not payload construction.
        // Utility helpers are construction code and must be fingerprinted too.
        if (target && (required || /(?:^|\/)utils\//.test(target))) {
          const targetModel = models.get(target);
          const reexport = targetModel.exports.get(imported.name);
          if (reexport?.module) {
            const reexported = moduleFile(targetModel, reexport.module);
            if (reexported)
              collect(
                models.get(reexported),
                reexport.name,
                models.get(reexported).ast,
                true
              );
          } else
            collect(
              targetModel,
              reexport?.name || imported.name,
              targetModel.ast,
              true
            );
        }
        return;
      }
      const declaration = findDeclaration(owner, name, context);
      if (!declaration?.value || declaration.parameter) return;
      const key = `${owner.file}:${declaration.node.pos}:${name}`;
      if (seen.has(key)) return;
      seen.add(key);
      const body = printer.printNode(
        ts.EmitHint.Unspecified,
        declaration.value,
        owner.ast
      );
      collected.set(`${owner.file}#${name}:${body}`, {
        source: `${owner.file}#${name}`,
        body,
      });
      const walk = (node) => {
        if (ts.isTypeNode(node)) return;
        if (ts.isIdentifier(node)) {
          const parent = node.parent;
          const propertyName =
            (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
            (ts.isPropertyAssignment(parent) &&
              parent.name === node &&
              !ts.isComputedPropertyName(parent.name)) ||
            ((ts.isVariableDeclaration(parent) ||
              ts.isParameter(parent) ||
              ts.isFunctionDeclaration(parent)) &&
              parent.name === node);
          if (!propertyName) collect(owner, node.text, node);
        }
        ts.forEachChild(node, walk);
      };
      walk(declaration.value);
    };
    const find = (node) => {
      if (ts.isTypeQueryNode(node)) {
        let expression = node.exprName;
        while (ts.isQualifiedName(expression)) expression = expression.left;
        if (ts.isIdentifier(expression))
          collect(model, expression.text, call, true);
      }
      ts.forEachChild(node, find);
    };
    for (const argument of call.typeArguments || []) find(argument);
    return [...collected.values()].sort(
      (left, right) =>
        left.source.localeCompare(right.source) ||
        left.body.localeCompare(right.body)
    );
  }
  // A transport helper is supplementary only when its document/result generic
  // linkage is explicit. Merely printing a raw/unresolved document is not enough.
  function typedTransport(model, call, document) {
    if (!document || !ts.isIdentifier(document)) return false;
    let fn = call.parent;
    while (fn && !isFunction(fn)) fn = fn.parent;
    if (!fn || !fn.parameters) return false;
    const parameter = fn.parameters.find(
      (item) => textName(item.name) === document.text
    );
    const type = parameter?.type;
    if (
      !type ||
      !ts.isTypeReferenceNode(type) ||
      !ts.isIdentifier(type.typeName)
    )
      return false;
    const imported = model.imports.get(type.typeName.text);
    if (
      imported?.module !== '@graphql-typed-document-node/core' ||
      imported.name !== 'TypedDocumentNode' ||
      type.typeArguments?.length !== 2
    )
      return false;
    const result = type.typeArguments[0].getText(model.ast);
    const response = call.typeArguments?.[0];
    if (
      call.typeArguments?.length !== 1 ||
      !response ||
      !ts.isTypeReferenceNode(response) ||
      !ts.isIdentifier(response.typeName) ||
      response.typeArguments?.length !== 1 ||
      response.typeArguments[0].getText(model.ast) !== result
    )
      return false;
    if (
      !fn.type ||
      !ts.isTypeReferenceNode(fn.type) ||
      fn.type.typeName.getText(model.ast) !== 'Promise' ||
      fn.type.typeArguments?.[0]?.getText(model.ast) !==
        response.getText(model.ast)
    )
      return false;
    const envelope = model.ast.statements.find(
      (statement) =>
        ts.isTypeAliasDeclaration(statement) &&
        statement.name.text === response.typeName.text
    );
    if (
      !envelope ||
      envelope.typeParameters?.length !== 1 ||
      !ts.isTypeLiteralNode(envelope.type)
    )
      return false;
    const data = envelope.type.members.find(
      (member) => textName(member.name) === 'data'
    );
    const isResult = (member) =>
      ts.isTypeReferenceNode(member) &&
      member.typeName.getText(model.ast) ===
        envelope.typeParameters[0].name.text;
    const members =
      data?.type && ts.isUnionTypeNode(data.type)
        ? data.type.types
        : data?.type
          ? [data.type]
          : [];
    if (
      !members.some(isResult) ||
      !members.every(
        (member) =>
          isResult(member) ||
          member.kind === ts.SyntaxKind.UndefinedKeyword ||
          (ts.isLiteralTypeNode(member) &&
            member.literal.kind === ts.SyntaxKind.NullKeyword)
      )
    )
      return false;
    const origins = resolve(model, document);
    return (
      origins.documents.length > 0 &&
      origins.documents.every((item) => item.kind === 'generated') &&
      !origins.unresolved.length &&
      !origins.erasures.length
    );
  }
  function callableName(model, node, context, seen = new Set(), selected) {
    if (!node) return undefined;
    const marker = `${node.pos}:${selected || ''}`;
    if (seen.has(marker)) return undefined;
    const next = new Set([...seen, marker]);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return callableName(model, node.expression, context, next, selected);
    if (ts.isPropertyAccessExpression(node)) return node.name.text;
    if (ts.isIdentifier(node)) {
      const imported = model.imports.get(node.text);
      if (imported?.module === '@vue/apollo-composable')
        return selected || imported.name;
      const candidates = (model.declarations.get(node.text) || [])
        .map((entry) => ({
          ...entry,
          distance: distance(context, entry.scope),
        }))
        .filter((entry) => Number.isFinite(entry.distance))
        .sort((left, right) => left.distance - right.distance);
      const entry = candidates[0];
      if (
        entry?.value &&
        (ts.isIdentifier(entry.value) ||
          ts.isPropertyAccessExpression(entry.value) ||
          ts.isParenthesizedExpression(entry.value))
      )
        return callableName(
          model,
          entry.value,
          context,
          next,
          entry.select || selected
        );
      return selected || node.text;
    }
    return selected;
  }
  const boundaries = [];
  const supplementary = [];
  const refetchDocuments = [];
  const assertions = [];
  for (const model of models.values()) {
    const counts = new Map();
    const location = (node) => ({
      file: model.file,
      line:
        model.ast.getLineAndCharacterOfPosition(node.getStart(model.ast)).line +
        1,
    });
    const inspectRefetch = (node, owner) => {
      if (node && ts.isArrayLiteralExpression(node)) {
        for (const element of node.elements) inspectRefetch(element, owner);
        return;
      }
      if (node && isFunction(node)) {
        for (const expression of returns(node))
          inspectRefetch(expression, owner);
        return;
      }
      const ordinal = (counts.get('refetchDocument') || 0) + 1;
      counts.set('refetchDocument', ordinal);
      let expression = node;
      let resolved;
      let status;
      if (node && ts.isStringLiteral(node)) {
        const sources = Object.entries(mapping)
          .filter(([, entry]) =>
            entry.operations.some((operation) => operation.name === node.text)
          )
          .map(([id]) => id);
        const all = ['active', 'all'].includes(node.text);
        resolved =
          sources.length || all
            ? {
                ...empty(),
                documents: [
                  {
                    kind: all ? 'refetch-all' : 'named-refetch',
                    name: node.text,
                    sources,
                  },
                ],
              }
            : unknown(`unknown named refetch ${node.text}`);
        status = sources.length
          ? 'named-refetch'
          : all
            ? 'refetch-all'
            : 'unresolved';
      } else {
        if (node && ts.isObjectLiteralExpression(node)) {
          const property = node.properties.find(
            (item) => textName(item.name) === 'query'
          );
          expression =
            property &&
            (ts.isPropertyAssignment(property)
              ? property.initializer
              : property.name);
        }
        resolved = resolve(model, expression);
        status =
          resolved.unresolved.length || !resolved.documents.length
            ? 'unresolved'
            : resolved.documents.some((document) => document.kind === 'raw')
              ? 'raw'
              : resolved.erasures.length
                ? 'typed-with-override'
                : 'generated';
      }
      refetchDocuments.push({
        id: `${model.file}#refetchDocument:${ordinal}`,
        ...location(node || owner),
        kind: 'refetchDocument',
        expression:
          expression?.getText(model.ast) || '<indirect refetch options>',
        status,
        ...resolved,
        generics: [],
      });
    };
    for (const call of model.calls) {
      const identifier = ts.isIdentifier(call.expression)
        ? call.expression.text
        : undefined;
      const imported = identifier && model.imports.get(identifier);
      let name =
        imported && imported.module === '@vue/apollo-composable'
          ? imported.name
          : identifier;
      if (
        ts.isPropertyAccessExpression(call.expression) &&
        ts.isIdentifier(call.expression.expression)
      ) {
        const namespace = model.imports.get(call.expression.expression.text);
        if (
          namespace?.module === '@vue/apollo-composable' &&
          namespace.name === '*'
        )
          name = call.expression.name.text;
      }
      const callee = callableName(model, call.expression, call);
      if (
        ['useQuery', 'useLazyQuery', 'useMutation', 'useSubscription'].includes(
          callee
        )
      )
        name = callee;
      const aliasedMethod =
        ts.isIdentifier(call.expression) &&
        (model.declarations.get(call.expression.text) || []).some(
          (entry) =>
            entry.value &&
            (ts.isPropertyAccessExpression(entry.value) ||
              (entry.select && ts.isIdentifier(entry.value)))
        );
      const method = ts.isPropertyAccessExpression(call.expression)
        ? call.expression.name.text
        : [
              'query',
              'mutate',
              'readQuery',
              'writeQuery',
              'readFragment',
              'writeFragment',
              'refetchQueries',
            ].includes(callee) && aliasedMethod
          ? callee
          : undefined;
      let kind;
      let expression;
      let resolvedOptions;
      if (
        ['useQuery', 'useLazyQuery', 'useMutation', 'useSubscription'].includes(
          name
        )
      ) {
        kind = name;
        expression = call.arguments[0];
      } else if (
        name === 'requestGraphql' ||
        imported?.name === 'requestGraphql'
      ) {
        kind = 'requestGraphql';
        expression = call.arguments[1];
      } else if (
        [
          'query',
          'mutate',
          'readQuery',
          'writeQuery',
          'readFragment',
          'writeFragment',
        ].includes(method)
      ) {
        const property = ['readFragment', 'writeFragment'].includes(method)
          ? 'fragment'
          : method === 'mutate'
            ? 'mutation'
            : 'query';
        const argument = call.arguments[0];
        if (argument && ts.isObjectLiteralExpression(argument)) {
          const entry = argument.properties.find(
            (value) => textName(value.name) === property
          );
          if (entry) {
            kind = method;
            expression = ts.isPropertyAssignment(entry)
              ? entry.initializer
              : entry.name;
          } else {
            kind = method;
            expression = argument;
            resolvedOptions = resolve(model, argument, [property]);
          }
        } else {
          kind = method;
          expression = argument;
          resolvedOptions = resolve(model, argument, [property]);
        }
      }
      if (
        !kind &&
        (['$fetch', 'fetch'].includes(name) ||
          ['post', 'request'].includes(method))
      ) {
        let query;
        const findQuery = (node) => {
          if (ts.isPropertyAssignment(node) && textName(node.name) === 'query')
            query = node.initializer;
          else ts.forEachChild(node, findQuery);
        };
        for (const argument of call.arguments) findQuery(argument);
        if (query) {
          const printing =
            ts.isCallExpression(query) &&
            ts.isIdentifier(query.expression) &&
            model.imports.get(query.expression.text)?.module === 'graphql' &&
            model.imports.get(query.expression.text)?.name === 'print';
          expression = printing ? query.arguments[0] : query;
          if (printing && typedTransport(model, call, expression)) {
            supplementary.push({
              ...location(call),
              kind: 'typed-http-transport',
              expression: query.getText(model.ast),
              documents: resolve(model, expression).documents,
              review:
                'Document/result/envelope generics are linked; authored helper callers are primary boundaries.',
            });
          } else kind = 'http-query';
        }
      }
      if (method === 'refetchQueries') {
        const options = call.arguments[0];
        const include =
          options &&
          ts.isObjectLiteralExpression(options) &&
          options.properties.find(
            (property) => textName(property.name) === 'include'
          );
        if (include && ts.isPropertyAssignment(include))
          inspectRefetch(include.initializer, call);
        else if (!options || !ts.isObjectLiteralExpression(options))
          inspectRefetch(options, call);
      }
      if (kind) {
        const ordinal = (counts.get(kind) || 0) + 1;
        counts.set(kind, ordinal);
        const resolved = resolvedOptions || resolve(model, expression);
        const generics =
          call.typeArguments?.map((type) => type.getText(model.ast)) || [];
        const status = resolved.unresolved.length
          ? 'unresolved'
          : resolved.documents.some((document) => document.kind === 'raw')
            ? 'raw'
            : !resolved.documents.length
              ? 'unresolved'
              : resolved.erasures.length || generics.length
                ? 'typed-with-override'
                : 'generated';
        boundaries.push({
          id: `${model.file}#${kind}:${ordinal}`,
          ...location(call),
          kind,
          expression: expression?.getText(model.ast) || '<indirect options>',
          status,
          ...resolved,
          generics,
          payloadContracts: payloadContracts(model, call),
        });
      }
      if (
        [
          'refetchQueries',
          'fetchMore',
          'modify',
          'evict',
          'identify',
          'useApolloClient',
        ].includes(method || name)
      )
        supplementary.push({
          ...location(call),
          kind: method || name,
          expression: call.getText(model.ast).slice(0, 300),
        });
    }
    const walk = (node) => {
      if (
        ts.isPropertyAssignment(node) &&
        textName(node.name) === 'refetchQueries'
      ) {
        inspectRefetch(node.initializer, node);
        const namedOperations = [];
        const inspect = (value) => {
          if (ts.isStringLiteral(value))
            namedOperations.push({
              name: value.text,
              sources: Object.entries(mapping)
                .filter(([, entry]) =>
                  entry.operations.some(
                    (operation) => operation.name === value.text
                  )
                )
                .map(([id]) => id),
            });
          ts.forEachChild(value, inspect);
        };
        inspect(node.initializer);
        supplementary.push({
          ...location(node),
          kind: 'refetchQueries-option',
          expression: node.initializer.getText(model.ast),
          namedOperations,
        });
      }
      if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
        const type = node.type.getText(model.ast);
        const schemaImports = [...model.imports]
          .filter(([, imported]) =>
            /__generated__\/graphql/.test(imported.module)
          )
          .map(([name]) => name);
        if (
          type === 'any' ||
          type === 'unknown' ||
          schemaImports.some((name) => new RegExp(`\\b${name}\\b`).test(type))
        )
          assertions.push({
            ...location(node),
            type,
            expression: node.expression.getText(model.ast).slice(0, 160),
            review:
              'Potential schema/entity assertion; review selected response vs input/enum use. Not an automatic failure.',
          });
      }
      ts.forEachChild(node, walk);
    };
    walk(model.ast);
  }
  for (const item of [...boundaries, ...refetchDocuments])
    item.contractFingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          schemaContractFingerprint,
          kind: item.kind,
          expression: item.expression,
          status: item.status,
          documents: item.documents,
          unresolved: item.unresolved,
          erasures: item.erasures,
          generics: item.generics,
          payloadContracts: item.payloadContracts || [],
        })
      )
      .digest('hex');
  const summary = {
    sourceFiles: models.size,
    boundaries: boundaries.length,
    generated: boundaries.filter((item) => item.status === 'generated').length,
    raw: boundaries.filter((item) => item.status === 'raw').length,
    unresolved: boundaries.filter((item) => item.status === 'unresolved')
      .length,
    typedWithOverride: boundaries.filter(
      (item) => item.status === 'typed-with-override'
    ).length,
    supplementary: supplementary.length,
    refetchDocuments: refetchDocuments.length,
    assertionsToReview: assertions.length,
  };
  return {
    summary,
    schemaContractFingerprint,
    boundaries,
    refetchDocuments,
    supplementary,
    assertions,
    limitations: [
      'Static resolver follows imported aliases, local factories/maps/branches, and explicit Vue component bindings/defaults. Dynamic component selection, arbitrary runtime document construction and external wrapper code fail unresolved rather than count as migrated.',
      'Generated origin does not prove backend response completeness. Schema/input assertions are review evidence, not automatically response bypasses.',
    ],
    fingerprint: createHash('sha256')
      .update(JSON.stringify(boundaries))
      .digest('hex'),
  };
}

export function enforcementFailures(report, exceptions = []) {
  const failures = [];
  const entries = [...report.boundaries, ...(report.refetchDocuments || [])];
  const accepted = new Set(['generated', 'named-refetch', 'refetch-all']);
  for (const item of entries.filter(
    (boundary) => !accepted.has(boundary.status)
  )) {
    const exception = exceptions.find(
      (value) =>
        value.id === item.id &&
        value.expression === item.expression &&
        value.status === item.status &&
        value.contractFingerprint === item.contractFingerprint
    );
    if (
      !exception ||
      !exception.owner ||
      !exception.reason ||
      !exception.resolution ||
      !exception.tracking
    )
      failures.push(item);
  }
  for (const exception of exceptions)
    if (
      !entries.some(
        (item) =>
          item.id === exception.id &&
          item.expression === exception.expression &&
          item.status === exception.status &&
          item.contractFingerprint === exception.contractFingerprint &&
          !accepted.has(item.status)
      )
    )
      failures.push({
        id: exception.id,
        status: 'stale-exception',
        expression: exception.expression,
      });
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const report = auditConsumers(root);
  const reportIndex = process.argv.indexOf('--report');
  if (reportIndex !== -1) {
    const target = path.resolve(root, process.argv[reportIndex + 1]);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report.summary));
  if (!process.argv.includes('--report-only')) {
    const exceptionPath = path.join(
      root,
      'scripts/typed-operation-exceptions.json'
    );
    const exceptions = existsSync(exceptionPath)
      ? JSON.parse(readFileSync(exceptionPath, 'utf8'))
      : [];
    const failures = enforcementFailures(report, exceptions);
    for (const item of failures)
      console.error(`${item.id}: ${item.status}: ${item.expression}`);
    if (failures.length) process.exitCode = 1;
  }
}
