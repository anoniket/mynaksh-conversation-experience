/**
 * Delivery caption under a user bubble: Sending… / Sent ✓ / Failed · Retry.
 * Subscribes to one message; renders nothing for non-user messages.
 */
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../../app/theme';
import { useMessage } from '../model/selectors';
import { useConversationStore } from '../model/store';

export interface MessageStatusProps {
  messageId: string;
}

export const MessageStatus = React.memo(function MessageStatusView({
  messageId,
}: MessageStatusProps) {
  const message = useMessage(messageId);
  const onRetry = useCallback(() => {
    useConversationStore.getState().retry(messageId);
  }, [messageId]);

  if (!message || message.type !== 'user') {
    return null;
  }

  switch (message.status) {
    case 'sending':
      return (
        <View
          style={styles.row}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Sending"
        >
          <ActivityIndicator
            size="small"
            color={colors.textMuted}
            style={styles.spinner}
          />
          <Text style={styles.caption}>Sending…</Text>
        </View>
      );
    case 'sent':
      return (
        <View style={styles.row} accessibilityLabel="Sent">
          <Text style={styles.caption}>Sent ✓</Text>
        </View>
      );
    case 'failed':
      return (
        <View style={styles.row} accessibilityLiveRegion="polite">
          <Text style={[styles.caption, styles.danger]}>Failed · </Text>
          <Pressable
            onPress={onRetry}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Message failed to send. Retry"
          >
            <Text style={[styles.caption, styles.danger, styles.retry]}>
              Retry
            </Text>
          </Pressable>
        </View>
      );
  }
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  spinner: {
    transform: [{ scale: 0.6 }],
    marginRight: 2,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  danger: {
    color: colors.danger,
  },
  retry: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
