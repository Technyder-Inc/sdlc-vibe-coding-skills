#!/usr/bin/env node

import {access, appendFile, copyFile, mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const scaffoldDir = path.resolve(scriptDir, '../scaffold');
const args = process.argv.slice(2);
const force = args.includes('--force');
const positional = args.filter((arg) => arg !== '--force');
const targetDir = path.resolve(positional[0] ?? process.cwd());

const DEMO_SCRIPTS = {
  'demo:doctor': 'node scripts/demo/demo-engine.mjs doctor',
  'demo:validate': 'node scripts/demo/demo-engine.mjs validate',
  'demo:render': 'node scripts/demo/demo-engine.mjs render',
  'demo:release': 'node scripts/demo/demo-engine.mjs release',
  'demo:hook': 'node scripts/demo/demo-engine.mjs hook',
};

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory, prefix = '') {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolute, relative));
    } else {
      files.push(relative);
    }
  }

  return files;
}

async function installScaffold() {
  const files = await collectFiles(scaffoldDir);
  const copied = [];
  const skipped = [];

  for (const relative of files) {
    if (relative === 'AGENTS.demo.md') continue;

    const source = path.join(scaffoldDir, relative);
    const destination = path.join(targetDir, relative);
    const destinationExists = await exists(destination);

    if (destinationExists && !force) {
      skipped.push(relative);
      continue;
    }

    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(source, destination);
    copied.push(relative);
  }

  return {copied, skipped};
}

async function mergePackageJson() {
  const packagePath = path.join(targetDir, 'package.json');
  let packageJson;

  if (await exists(packagePath)) {
    packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  } else {
    packageJson = {
      name: path.basename(targetDir).toLowerCase().replace(/[^a-z0-9._-]+/g, '-'),
      private: true,
      version: '0.0.0',
    };
  }

  packageJson.scripts = packageJson.scripts ?? {};
  for (const [name, command] of Object.entries(DEMO_SCRIPTS)) {
    if (!(name in packageJson.scripts) || force) {
      packageJson.scripts[name] = command;
    }
  }

  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

async function mergeAgentsInstructions() {
  const snippetPath = path.join(scaffoldDir, 'AGENTS.demo.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const snippet = await readFile(snippetPath, 'utf8');
  const marker = '<!-- technyder-product-demo-policy -->';

  if (await exists(agentsPath)) {
    const current = await readFile(agentsPath, 'utf8');
    if (!current.includes(marker)) {
      await appendFile(agentsPath, `\n\n${snippet.trim()}\n`, 'utf8');
    }
  } else {
    await writeFile(agentsPath, `${snippet.trim()}\n`, 'utf8');
  }
}

async function main() {
  await mkdir(targetDir, {recursive: true});
  const {copied, skipped} = await installScaffold();
  await mergePackageJson();
  await mergeAgentsInstructions();

  console.log(`Product demo infrastructure installed in: ${targetDir}`);
  console.log(`Created or replaced: ${copied.length} file(s)`);
  if (skipped.length > 0) {
    console.log(`Preserved existing: ${skipped.length} file(s)`);
    console.log('Use --force only after reviewing the existing files.');
  }
  console.log('\nNext commands:');
  console.log('  npm run demo:doctor');
  console.log('  Edit demo/demo.json');
  console.log('  npm run demo:validate');
  console.log('  npm run demo:release');
  console.log('\nCodex: restart the extension if the skill is not visible, then review project hooks with /hooks.');
}

main().catch((error) => {
  console.error(`Demo infrastructure installation failed: ${error.message}`);
  process.exitCode = 1;
});
