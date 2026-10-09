import { Platform } from 'react-native';

/**
 * App-level switches. Mock is the default so the assignment runs with zero setup.
 * Flip USE_LLM to true (and run `npm start` inside ./server) to talk to Claude
 * through the dev proxy. The key never lives in the app bundle.
 */
export const appConfig = {
  useLlm: false,
  /** Android emulators reach the host machine via 10.0.2.2; iOS simulators via localhost. */
  proxyBaseUrl: Platform.select({
    android: 'http://10.0.2.2:8787',
    default: 'http://localhost:8787',
  }) as string,
};
