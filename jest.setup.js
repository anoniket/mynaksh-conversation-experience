/* eslint-env jest */
require('react-native-reanimated').setUpTests();
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));
require('@shopify/flash-list/jestSetup');
