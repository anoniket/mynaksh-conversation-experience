import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { ensureRecommendationsRegistered } from './src/features/recommendations/cards';

// Register every recommendation experience once, before the first render.
// New experiences: add a card + one register() call in features/recommendations/cards.
ensureRecommendationsRegistered();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
