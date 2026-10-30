import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  describeSchemaContract,
  readSchemaContract,
} from './graphql-schema-contract.mjs';
import {
  compareBaseline,
  inventoryOperations,
  validationEntries,
} from './graphql-operations.mjs';

function argumentsFor(values) {
  const options = { root: process.cwd() };
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === '--help' || value === '--report-only')
      options[value.slice(2)] = true;
    else if (
      ['--root', '--report', '--baseline', '--write-baseline'].includes(
        value
      ) &&
      values[index + 1] &&
      !values[index + 1].startsWith('--')
    )
      options[value.slice(2)] = values[++index];
    else throw new Error(`Unknown or incomplete argument: ${value}`);
  }
  if (
    [
      options.baseline,
      options['write-baseline'],
      options['report-only'],
    ].filter(Boolean).length > 1
  )
    throw new Error(
      'Choose baseline checking, baseline creation, or report-only mode'
    );
  return options;
}

let reportPath;
let reportWritten = false;
try {
  const options = argumentsFor(process.argv.slice(2));
  if (options.report) reportPath = path.resolve(options.report);
  if (options.help) {
    console.log(
      'Usage: node scripts/validate-graphql-operations.mjs [--root directory] [--report file] [--baseline file | --write-baseline file | --report-only]'
    );
  } else {
    const { schema, manifest } = readSchemaContract();
    const schemaHash = manifest.files['schema.graphql'].sha256;
    const report = {
      schema: { ...manifest.source, sha256: schemaHash },
      ...inventoryOperations(path.resolve(options.root), schema),
    };
    if (reportPath) {
      mkdirSync(path.dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      reportWritten = true;
    }
    console.log(
      `GraphQL operations checked against ${describeSchemaContract(manifest)}`
    );
    console.log(JSON.stringify(report.summary));
    for (const problem of report.extractionErrors) {
      const at = problem.locations[0];
      console.error(
        `${at.file}:${at.line}:${at.column} [extraction] ${problem.message}`
      );
    }
    for (const document of report.documents)
      for (const problem of document.diagnostics) {
        const at = problem.locations[0] ?? document;
        console.log(
          `${at.file}:${at.line}:${at.column} [schema] ${document.id}: ${problem.message}`
        );
      }
    if (report.extractionErrors.length)
      throw new Error(
        'GraphQL extraction failed; extraction gaps cannot be baselined'
      );
    if (options['write-baseline']) {
      const baseline = {
        formatVersion: 1,
        schemaHash,
        owner: 'frontend',
        remediation:
          'Phase 2 compatibility cleanup: remove these exact legacy diagnostics before enabling the strict gate. No extraction exceptions are allowed.',
        errors: validationEntries(report),
      };
      writeFileSync(
        path.resolve(options['write-baseline']),
        `${JSON.stringify(baseline, null, 2)}\n`
      );
      console.log(
        `Explicitly recorded ${baseline.errors.length} legacy diagnostics; review the baseline as migration debt.`
      );
    } else if (options.baseline) {
      const baseline = JSON.parse(
        readFileSync(path.resolve(options.baseline), 'utf8')
      );
      const { unexpected, stale } = compareBaseline(
        report,
        baseline,
        schemaHash
      );
      console.log(
        `Baseline comparison: ${unexpected.length} unexpected diagnostics; ${stale.length} stale entries.`
      );
      for (const entry of unexpected)
        console.error(`[new] ${entry.document}: ${entry.message}`);
      for (const entry of stale)
        console.error(`[stale baseline] ${entry.document}: ${entry.message}`);
      if (unexpected.length || stale.length)
        throw new Error(
          'GraphQL validation debt changed. Fix unexpected errors and remove resolved baseline entries; baseline updates require review.'
        );
      console.log(
        `Known migration debt: ${baseline.errors.length} diagnostics. Every document was checked; new or changed invalid documents fail this gate.`
      );
    } else if (report.summary.validationErrors && !options['report-only']) {
      throw new Error(
        `${report.summary.validationErrors} GraphQL schema validation errors`
      );
    }
  }
} catch (error) {
  if (reportPath && !reportWritten) {
    try {
      mkdirSync(path.dirname(reportPath), { recursive: true });
      writeFileSync(
        reportPath,
        `${JSON.stringify({ formatVersion: 1, fatalError: error.message }, null, 2)}\n`
      );
    } catch (reportError) {
      console.error(
        `Could not write GraphQL diagnostic report: ${reportError.message}`
      );
    }
  }
  console.error(`GraphQL operation check failed: ${error.message}`);
  process.exitCode = 1;
}
