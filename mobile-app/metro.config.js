// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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
if (frontendServicesPath) {
  // Map the entire package to ensure Metro can find it
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@tasks-management/frontend-services': frontendServicesPath,
  };
  
  // Custom resolver to handle the package and its exports
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Handle @tasks-management/frontend-services (main package)
    if (moduleName === '@tasks-management/frontend-services') {
      const mainPath = path.resolve(frontendServicesPath, 'dist/index.js');
      if (fs.existsSync(mainPath)) {
        return {
          type: 'sourceFile',
          filePath: mainPath,
        };
      }
    }
    
    // Handle subpath exports (legacy support)
    if (
      moduleName === '@tasks-management/frontend-services/i18n' ||
      moduleName === '@tasks-management/frontend-services/dist/i18n'
    ) {
      const i18nPath = path.resolve(frontendServicesPath, 'dist/i18n/index.js');
      if (fs.existsSync(i18nPath)) {
        return {
          type: 'sourceFile',
          filePath: i18nPath,
        };
      }
    }
    
    // Use default resolver for everything else
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
