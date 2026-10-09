import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';

/** Full-screen loading placeholder shown while the conversation is fetched. */
export const LoadingState = React.memo(function LoadingStateView() {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.subtitle}>Loading conversation...</Text>
    </View>
  );
});

export interface EmptyStateProps {
  onStart?: () => void;
}

/** Shown when the conversation has no messages yet; optional CTA focuses the composer. */
export const EmptyState = React.memo(function EmptyStateView({
  onStart,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.glyph} accessibilityElementsHidden>
        ✦
      </Text>
      <Text style={styles.title}>Start your conversation.</Text>
      <Text style={styles.subtitle}>
        Ask about your chart, your day, or what the stars have in store.
      </Text>
      {onStart ? (
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Start your conversation"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Ask a question</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const ERROR_HEADLINE = 'Unable to load conversation.';

export interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

/** Load failure with a retry action. `message` adds detail under the fixed headline. */
export const ErrorState = React.memo(function ErrorStateView({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="assertive">
      <Text style={styles.title}>{ERROR_HEADLINE}</Text>
      {message && message !== ERROR_HEADLINE ? (
        <Text style={styles.subtitle}>{message}</Text>
      ) : null}
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading conversation"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.background,
  },
  glyph: {
    fontSize: 32,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...typography.label,
    color: colors.text,
  },
});
