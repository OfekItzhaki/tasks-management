// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add parent directory to nodeModulesPaths so Metro can find frontend-services
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(__dirname, '..'),
];

// Find the frontend-services package location
function findFrontendServicesPath() {
  const nodeModulesPath = path.resolve(__dirname, 'node_modules/@tasks-management/frontend-services');
  const relativePath = path.resolve(__dirname, '../frontend-services');
  
  // First check node_modules (EAS build environment)
  if (fs.existsSync(nodeModulesPath)) {
    try {
      const stats = fs.lstatSync(nodeModulesPath);
      if (stats.isSymbolicLink()) {
        return fs.realpathSync(nodeModulesPath);
      }
      return nodeModulesPath;
    } catch (e) {
      // Continue to check relative path
    }
  }
  
  // Check relative path (local development)
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }
  
  return null;
}

const frontendServicesPath = findFrontendServicesPath();

// Add support for resolving @tasks-management/frontend-services package
const nodeModulesPath = path.resolve(__dirname, 'node_modules/@tasks-management/frontend-services');
const relativePath = path.resolve(__dirname, '../frontend-services');

// Determine which path exists
let frontendServicesPath = null;
if (fs.existsSync(nodeModulesPath)) {
  try {
    const stats = fs.lstatSync(nodeModulesPath);
    frontendServicesPath = stats.isSymbolicLink() ? fs.realpathSync(nodeModulesPath) : nodeModulesPath;
  } catch (e) {
    // Fall through
  }
}
if (!frontendServicesPath && fs.existsSync(relativePath)) {
  frontendServicesPath = relativePath;
}

// Map the package in extraNodeModules (use node_modules path for EAS, relative for local)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@tasks-management/frontend-services': frontendServicesPath || nodeModulesPath,
};

// Custom resolver to handle the package - MUST be called before default resolver
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @tasks-management/frontend-services (main package) - check FIRST
  if (moduleName === '@tasks-management/frontend-services') {
    // Try all possible paths
    const possibleMainPaths = [
      frontendServicesPath ? path.resolve(frontendServicesPath, 'dist/index.js') : null,
      path.resolve(nodeModulesPath, 'dist/index.js'),
      path.resolve(relativePath, 'dist/index.js'),
    ].filter(Boolean);
    
    for (const mainPath of possibleMainPaths) {
      try {
        if (fs.existsSync(mainPath)) {
          return {
            type: 'sourceFile',
            filePath: mainPath,
          };
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  // Handle subpath exports
  if (
    moduleName === '@tasks-management/frontend-services/i18n' ||
    moduleName === '@tasks-management/frontend-services/dist/i18n'
  ) {
    const possibleI18nPaths = [
      frontendServicesPath ? path.resolve(frontendServicesPath, 'dist/i18n/index.js') : null,
      path.resolve(nodeModulesPath, 'dist/i18n/index.js'),
      path.resolve(relativePath, 'dist/i18n/index.js'),
    ].filter(Boolean);
    
    for (const i18nPath of possibleI18nPaths) {
      try {
        if (fs.existsSync(i18nPath)) {
          return {
            type: 'sourceFile',
            filePath: i18nPath,
          };
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
