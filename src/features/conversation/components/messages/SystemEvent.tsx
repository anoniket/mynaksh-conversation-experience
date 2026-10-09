import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '../../../../app/theme';
import { Pill } from '../../../../shared/ui/Pill';
import type { SystemMessage } from '../../model/types';
import type { MessageComponentProps } from './messageRenderers';

const ENTERING = FadeIn.duration(180);

/**
 * Centered, muted timeline event ("Astrologer joined", "Session ended").
 * Also the registry fallback for unknown message types, so it only reads `text`.
 */
export const SystemEvent = React.memo(function SystemEventView({
  message,
}: MessageComponentProps<SystemMessage>) {
  return (
    <Animated.View
      entering={ENTERING}
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={message.text}
    >
      <Pill>
        <Text style={styles.text}>{message.text}</Text>
      </Pill>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
