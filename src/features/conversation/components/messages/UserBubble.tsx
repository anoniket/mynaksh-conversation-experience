import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../../app/theme';
import { formatTime } from '../../../../shared/utils/date';
import { useMessage } from '../../model/selectors';
import type { Message, UserMessage } from '../../model/types';
import { MessageStatus } from '../MessageStatus';
import type { MessageComponentProps } from './messageRenderers';

const ENTERING = FadeInDown.duration(180);

function senderLabel(message: Message): string {
  switch (message.type) {
    case 'user':
      return 'You';
    case 'ai':
      return 'AI Astrologer';
    case 'human':
      return message.authorName ?? 'Astrologer';
    default:
      return 'System';
  }
}

/** Quoted snippet of the message being replied to. Own subscription, so edits/deletes of the target update it. */
const ReplyQuote = React.memo(function ReplyQuoteView({
  replyToId,
}: {
  replyToId: string;
}) {
  const target = useMessage(replyToId);
  return (
    <View style={styles.quote}>
      <Text style={styles.quoteLabel} numberOfLines={1}>
        {target ? `Replying to ${senderLabel(target)}` : 'Replying to'}
      </Text>
      <Text
        style={target ? styles.quoteText : styles.quoteDeleted}
        numberOfLines={2}
      >
        {target ? target.text : 'Message deleted'}
      </Text>
    </View>
  );
});

/**
 * Right-aligned bubble for messages the user sent: optional reply quote,
 * text, then time (end of group only) and delivery status.
 */
export const UserBubble = React.memo(function UserBubbleView({
  message,
  position,
}: MessageComponentProps<UserMessage>) {
  const showTime = position === 'last' || position === 'single';
  return (
    <Animated.View entering={ENTERING} style={styles.row}>
      <View
        style={[styles.bubble, corners[position]]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`You: ${message.text}`}
      >
        {message.replyToId ? (
          <ReplyQuote replyToId={message.replyToId} />
        ) : null}
        <Text style={styles.text}>{message.text}</Text>
      </View>
      <View style={styles.meta}>
        {showTime ? (
          <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
        ) : null}
        <MessageStatus messageId={message.id} />
      </View>
    </Animated.View>
  );
});

const TIGHT = radius.sm / 2;

/** Right side: flatten the corners that touch the neighbouring bubble in the group. */
const corners = StyleSheet.create({
  single: { borderBottomRightRadius: TIGHT },
  first: { borderBottomRightRadius: TIGHT },
  middle: { borderTopRightRadius: TIGHT, borderBottomRightRadius: TIGHT },
  last: { borderTopRightRadius: TIGHT, borderBottomRightRadius: TIGHT },
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    paddingLeft: spacing.xxl * 2,
    paddingRight: spacing.lg,
  },
  bubble: {
    maxWidth: '100%',
    backgroundColor: colors.userBubble,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  quoteLabel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  quoteText: {
    ...typography.caption,
    color: colors.text,
  },
  quoteDeleted: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
