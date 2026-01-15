// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for resolving subpath exports from frontend-services
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Map the subpath export to the actual file
    '@tasks-management/frontend-services/i18n': path.resolve(__dirname, '../frontend-services/dist/i18n'),
  },
  resolveRequest: (context, realModuleName, platform, moduleName) => {
    // Handle @tasks-management/frontend-services/i18n subpath export
    if (realModuleName === '@tasks-management/frontend-services/i18n') {
      return context.resolveRequest(
        context,
        path.resolve(__dirname, '../frontend-services/dist/i18n/index.js'),
        platform
      );
    }
    
    // Use default resolver for everything else
    return context.resolveRequest(context, realModuleName, platform, moduleName);
  },
};

module.exports = config;
