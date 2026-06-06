const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

// Resolve real paths to avoid Windows junction/symlink path mixing
// when running from C:\exp (junction) vs the real project path.
const workspaceRoot = fs.realpathSync(path.resolve(__dirname, "../.."));
const projectRoot = fs.realpathSync(__dirname);

const config = getDefaultConfig(projectRoot);

// pnpm workspace support:
// Metro needs to watch the workspace root node_modules so it can
// resolve packages installed at the monorepo level (e.g. @supabase/supabase-js).
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.assetExts.push("wasm");

module.exports = config;
