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

// Add support for resolving subpath exports and direct dist paths from frontend-services
if (frontendServicesPath) {
  const i18nDirPath = path.resolve(frontendServicesPath, 'dist/i18n');
  
  // Use extraNodeModules to map module paths
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@tasks-management/frontend-services/i18n': i18nDirPath,
    '@tasks-management/frontend-services/dist/i18n': i18nDirPath,
  };
  
  // Custom resolver for subpath exports and direct dist paths
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Handle both @tasks-management/frontend-services/i18n and @tasks-management/frontend-services/dist/i18n
    if (
      moduleName === '@tasks-management/frontend-services/i18n' ||
      moduleName === '@tasks-management/frontend-services/dist/i18n'
    ) {
      const possiblePaths = [
        path.resolve(__dirname, 'node_modules/@tasks-management/frontend-services/dist/i18n/index.js'),
        path.resolve(__dirname, '../frontend-services/dist/i18n/index.js'),
        path.resolve(frontendServicesPath, 'dist/i18n/index.js'),
      ];
      
      for (const possiblePath of possiblePaths) {
        try {
          if (fs.existsSync(possiblePath)) {
            return {
              type: 'sourceFile',
              filePath: possiblePath,
            };
          }
        } catch (e) {
          // Continue to next path
        }
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
