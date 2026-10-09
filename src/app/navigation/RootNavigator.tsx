import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ConversationScreen } from '../../features/conversation/screens/ConversationScreen';
import { colors } from '../theme';

/**
 * Single route today. Recommendation taps go through a dispatcher
 * (features/recommendations/actions.ts), so adding "GemstoneDetail" here and
 * swapping the Alert for navigate() is a two-line change.
 */
export type RootStackParamList = {
  Conversation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Conversation"
          component={ConversationScreen}
          options={{
            title: 'AI Astrologer',
            headerStyle: { backgroundColor: colors.surface },
            headerTitleStyle: { color: colors.text },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
