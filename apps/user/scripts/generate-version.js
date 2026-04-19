/**
 * generate-version.js
 * Run after standard-version: reads package.json + CHANGELOG.md,
 * writes public/version.json and .env.production.
 *
 * Run location: apps/user/
 * Command: node scripts/generate-version.js
 * Triggered by: postrelease script in apps/user/package.json
 *
 * NOTE: Uses NEXT_PUBLIC_APP_VERSION (not VITE_APP_VERSION)
 */

const fs = require('fs');
const path = require('path');

// All paths relative to apps/user/ (the cwd when this script runs)
const ROOT = path.resolve(__dirname, '..');
const pkgPath = path.join(ROOT, 'package.json');
const changelogPath = path.join(ROOT, 'CHANGELOG.md');
const versionJsonPath = path.join(ROOT, 'public', 'version.json');
const envProductionPath = path.join(ROOT, '.env.production');

// ── Read version from package.json ──────────────────────────────────────────
if (!fs.existsSync(pkgPath)) {
  console.error('❌ package.json not found at', pkgPath);
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

// ── Parse latest changelog section ──────────────────────────────────────────
let changes = [];

if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');

  // standard-version sections start with "## [x.y.z]"
  const sections = changelog.split(/^## /m).slice(1);

  if (sections.length > 0) {
    const latestSection = sections[0];
    const lines = latestSection.split('\n').slice(1); // skip the version heading line

    changes = lines
      .filter((line) => line.startsWith('*') || line.startsWith('-'))
      .map((line) =>
        line
          .replace(/^[\*\-]\s*/, '')               // strip bullet
          .replace(/\[.*?\]\(.*?\)/g, '')           // strip markdown links
          .replace(/\*\*(.*?)\*\*/g, '$1')          // strip bold
          .trim()
      )
      .filter(Boolean)
      .slice(0, 6); // cap at 6 items for mobile readability
  }
}

// Fallback if changelog is empty or not yet generated
if (changes.length === 0) {
  changes = ['Improvements and bug fixes'];
}

// ── Write public/version.json ────────────────────────────────────────────────
const versionData = {
  version,
  changelog: changes,
};

fs.mkdirSync(path.dirname(versionJsonPath), { recursive: true });
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
console.log('✅ version.json written →', versionJsonPath);
console.log('   ', JSON.stringify(versionData));

// ── Write .env.production ────────────────────────────────────────────────────
// Reads existing .env.production and updates/adds NEXT_PUBLIC_APP_VERSION.
// This avoids wiping other env vars that Vercel injects at build time.
let envContent = '';
if (fs.existsSync(envProductionPath)) {
  envContent = fs.readFileSync(envProductionPath, 'utf8');
}

const envKey = 'NEXT_PUBLIC_APP_VERSION';
const envLine = `${envKey}=${version}`;

if (envContent.includes(envKey)) {
  // Replace existing line
  envContent = envContent.replace(new RegExp(`^${envKey}=.*$`, 'm'), envLine);
} else {
  // Append
  envContent = envContent.trimEnd() + '\n' + envLine + '\n';
}

fs.writeFileSync(envProductionPath, envContent);
console.log(`✅ .env.production updated → ${envKey}=${version}`);
