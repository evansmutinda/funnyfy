#!/usr/bin/env node
/**
 * Bump FunnyFy app version (single source: version.json).
 *
 * Usage:
 *   node scripts/bump-version.js --build     # +1 versionCode & iosBuildNumber (default for APK builds)
 *   node scripts/bump-version.js --patch     # semver patch + build numbers
 *   node scripts/bump-version.js --minor
 *   node scripts/bump-version.js --major
 *   node scripts/bump-version.js --set 1.2.0 # set semver (+ build numbers unless --no-build)
 *   node scripts/bump-version.js --dry-run
 */

const fs = require('fs');
const path = require('path');

const MOBILE_ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(MOBILE_ROOT, 'version.json');
const PACKAGE_FILE = path.join(MOBILE_ROOT, 'package.json');

function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
}

function writeVersion(data) {
  fs.writeFileSync(VERSION_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseSemver(version) {
  const parts = String(version).split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpSemver(current, kind) {
  const v = parseSemver(current);
  if (kind === 'major') {
    return formatSemver({ major: v.major + 1, minor: 0, patch: 0 });
  }
  if (kind === 'minor') {
    return formatSemver({ major: v.major, minor: v.minor + 1, patch: 0 });
  }
  return formatSemver({ major: v.major, minor: v.minor, patch: v.patch + 1 });
}

function syncPackageJson(version) {
  if (!fs.existsSync(PACKAGE_FILE)) return;
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(PACKAGE_FILE, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const opts = {
    buildOnly: false,
    semver: null,
    setVersion: null,
    dryRun: false,
    noBuild: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--build') opts.buildOnly = true;
    else if (arg === '--patch') opts.semver = 'patch';
    else if (arg === '--minor') opts.semver = 'minor';
    else if (arg === '--major') opts.semver = 'major';
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--no-build') opts.noBuild = true;
    else if (arg === '--set') {
      opts.setVersion = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    }
  }

  if (!opts.buildOnly && !opts.semver && !opts.setVersion && !opts.help) {
    opts.buildOnly = true;
  }

  return opts;
}

function printHelp() {
  console.log(`FunnyFy version bump

  node scripts/bump-version.js --build       Increment Android/iOS build numbers
  node scripts/bump-version.js --patch       Patch semver + build numbers
  node scripts/bump-version.js --minor       Minor semver + build numbers
  node scripts/bump-version.js --major       Major semver + build numbers
  node scripts/bump-version.js --set 1.2.0   Set semver explicitly
  node scripts/bump-version.js --dry-run     Show changes without writing
`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const prev = readVersion();
  const next = { ...prev };

  if (opts.setVersion) {
    parseSemver(opts.setVersion);
    next.version = opts.setVersion;
  } else if (opts.semver) {
    next.version = bumpSemver(prev.version, opts.semver);
  }

  if (!opts.noBuild && (opts.buildOnly || opts.semver || opts.setVersion)) {
    next.androidVersionCode = (prev.androidVersionCode || 0) + 1;
    next.iosBuildNumber = (prev.iosBuildNumber || 0) + 1;
  }

  console.log('Version bump:');
  console.log(`  version:            ${prev.version} -> ${next.version}`);
  console.log(`  androidVersionCode: ${prev.androidVersionCode} -> ${next.androidVersionCode}`);
  console.log(`  iosBuildNumber:     ${prev.iosBuildNumber} -> ${next.iosBuildNumber}`);

  if (opts.dryRun) {
    console.log('(dry run — no files changed)');
    return;
  }

  writeVersion(next);
  syncPackageJson(next.version);
  console.log('Updated version.json and package.json.');
  console.log('app.config.js reads version.json automatically (About screen uses expo-constants).');
}

main();
