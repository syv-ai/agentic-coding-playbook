#!/usr/bin/env node
// Generates every harness's plugin manifest from .claude-plugin/plugin.json and
// the owner in .claude-plugin/marketplace.json, so name, version, skills and
// agents live in one place.
//
//   node scripts/sync-manifests.mjs                  write the generated manifests
//   node scripts/sync-manifests.mjs --check          exit 1 if any is stale or invalid
//   node scripts/sync-manifests.mjs --bump <x.y.z>   set the version, then write
//
// Copilot CLI and VS Code read .claude-plugin/ directly, and Pi discovers
// skills/ by convention, so none of them gets a file here. Do not add a root
// plugin.json: Copilot CLI and VS Code would prefer it over .claude-plugin/.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = ".claude-plugin/plugin.json";
const CLAUDE_MARKETPLACE = ".claude-plugin/marketplace.json";

const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const serialize = (value) => JSON.stringify(value, null, 2) + "\n";

function sourceErrors(plugin) {
  const errors = [];
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version ?? "")) {
    errors.push(`${SOURCE}: "version" must be x.y.z, got ${JSON.stringify(plugin.version)}`);
  }
  const onDisk = readdirSync(join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, "skills", entry.name, "SKILL.md")))
    .map((entry) => `./skills/${entry.name}`);
  for (const skill of onDisk.filter((path) => !plugin.skills.includes(path))) {
    errors.push(`${SOURCE}: ${skill} has a SKILL.md but is missing from "skills"`);
  }
  for (const path of [...plugin.skills, ...(plugin.agents ?? [])]) {
    if (!existsSync(join(root, path))) errors.push(`${SOURCE}: ${path} does not exist`);
  }
  return errors;
}

function generate(plugin, owner) {
  const { name, version, description, author, homepage, repository, license, keywords, skills, agents } = plugin;
  const pluginEntry = { name, source: "./", description: readJson(CLAUDE_MARKETPLACE).plugins[0].description };

  return {
    // Cursor ignores .claude-plugin/; this is also the only way it gets the agents.
    ".cursor-plugin/plugin.json": {
      name, version, description, author, homepage, repository, license, keywords, skills, agents,
    },
    ".cursor-plugin/marketplace.json": { name, owner, plugins: [pluginEntry] },

    // Codex reads .claude-plugin/ as a fallback; the native files add the
    // display metadata. Codex plugins cannot bundle agents, so none are listed.
    ".codex-plugin/plugin.json": {
      name, version, description, author, homepage, repository, license, keywords, skills,
      interface: {
        displayName: "Syv Skills",
        shortDescription: pluginEntry.description,
        developerName: owner.name,
        category: "Developer Tools",
        websiteURL: homepage,
      },
    },
    ".agents/plugins/marketplace.json": {
      name,
      interface: { displayName: "Syv Skills" },
      plugins: [
        {
          name,
          source: { source: "local", path: "./" },
          policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
          category: "Developer Tools",
        },
      ],
    },

    // Gemini auto-loads skills/. An empty contextFileName stops it loading a
    // root GEMINI.md into every user's context if one is ever added.
    "gemini-extension.json": { name, version, description, contextFileName: [] },
  };
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const bumpIndex = args.indexOf("--bump");

const plugin = readJson(SOURCE);
if (bumpIndex !== -1) {
  const next = args[bumpIndex + 1];
  if (!/^\d+\.\d+\.\d+$/.test(next ?? "")) {
    console.error("--bump needs a version like 1.2.0");
    process.exit(1);
  }
  plugin.version = next;
  writeFileSync(join(root, SOURCE), serialize(plugin));
}

const errors = sourceErrors(plugin);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const stale = [];
for (const [path, value] of Object.entries(generate(plugin, readJson(CLAUDE_MARKETPLACE).owner))) {
  const target = join(root, path);
  const content = serialize(value);
  if (existsSync(target) && readFileSync(target, "utf8") === content) continue;
  if (check) {
    stale.push(path);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    console.log(`wrote ${path}`);
  }
}

if (stale.length) {
  console.error(`Stale manifests: ${stale.join(", ")}\nRun: node scripts/sync-manifests.mjs`);
  process.exit(1);
}
