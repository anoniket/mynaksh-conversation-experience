module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Reanimated 4 / worklets ship this resolver so Jest picks their non-native (JS) builds.
  resolver: 'react-native-reanimated/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@shopify/flash-list|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|@react-native-clipboard)/)',
  ],
};
