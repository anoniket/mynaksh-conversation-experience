import React, { type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../app/theme';
import { CARD_WIDTH } from './cards/BaseCard';

/**
 * Per-card isolation. Each card in a rail is wrapped in its own boundary, so
 * one malformed payload or buggy custom card degrades to a small placeholder
 * instead of taking down the message bubble or the whole chat list.
 */
interface Props {
  children: ReactNode;
  /** Identifies the failing card in dev logs. */
  label?: string;
}

interface State {
  hasError: boolean;
}

export class CardErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn(
        `[recommendations] card crashed${
          this.props.label ? ` (${this.props.label})` : ''
        }`,
        error,
        info.componentStack,
      );
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback} accessibilityRole="text">
          <Text style={styles.text}>Couldn't load this card</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    width: CARD_WIDTH,
    flexGrow: 1,
    minHeight: 172,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  text: { ...typography.caption, color: colors.textFaint, textAlign: 'center' },
});
