module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 is built on react-native-worklets; this plugin must be last.
  plugins: ['react-native-worklets/plugin'],
};
