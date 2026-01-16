// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Find frontend-services package location
const nodeModulesPath = path.resolve(__dirname, 'node_modules/@tasks-management/frontend-services');
const relativePath = path.resolve(__dirname, '../frontend-services');

// Determine which path exists (EAS uses node_modules, local dev uses relative)
let frontendServicesPath = null;
if (fs.existsSync(nodeModulesPath)) {
  try {
    const stats = fs.lstatSync(nodeModulesPath);
    frontendServicesPath = stats.isSymbolicLink() ? fs.realpathSync(nodeModulesPath) : nodeModulesPath;
  } catch (e) {
    // Continue
  }
}
if (!frontendServicesPath && fs.existsSync(relativePath)) {
  frontendServicesPath = relativePath;
}

// Always set extraNodeModules (even if path not found at config time)
// In EAS builds, the path will exist at runtime
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@tasks-management/frontend-services': frontendServicesPath || nodeModulesPath || relativePath,
};

// Custom resolver - MUST handle the package before default resolution
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  // Handle @tasks-management/frontend-services - intercept FIRST
  if (realModuleName === '@tasks-management/frontend-services' || moduleName === '@tasks-management/frontend-services') {
    // Check all possible locations
    const checkPaths = [
      frontendServicesPath,
      nodeModulesPath,
      relativePath,
    ].filter(Boolean);
    
    for (const basePath of checkPaths) {
      const mainPath = path.resolve(basePath, 'dist/index.js');
      const packageJsonPath = path.resolve(basePath, 'package.json');
      
      try {
        // Check if both package.json and dist/index.js exist
        if (fs.existsSync(packageJsonPath) && fs.existsSync(mainPath)) {
          return {
            type: 'sourceFile',
            filePath: mainPath,
          };
        }
      } catch (e) {
        // Continue to next path
      }
    }
  }
  
  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, realModuleName, platform, moduleName);
  }
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = config;
