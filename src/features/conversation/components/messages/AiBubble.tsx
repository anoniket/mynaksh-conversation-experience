import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../../app/theme';
import { Avatar } from '../../../../shared/ui/Avatar';
import { RecommendationRail } from '../../../recommendations/RecommendationRail';
import type { AiMessage } from '../../model/types';
import { FeedbackBar } from '../FeedbackBar';
import type { MessageComponentProps } from './messageRenderers';

const ENTERING = FadeInDown.duration(180);
const AVATAR_SIZE = 32;
const LONG_PRESS_DELAY_MS = 300;

/**
 * Left-aligned AI reply: avatar + name at the start of a group, the bubble
 * (long-press opens message actions), an optional recommendation rail, and
 * the feedback bar. The rail sits outside the Pressable so its taps and
 * horizontal scroll are never swallowed by the long-press handler.
 */
export const AiBubble = React.memo(function AiBubbleView({
  message,
  position,
  onLongPress,
}: MessageComponentProps<AiMessage>) {
  const isGroupStart = position === 'first' || position === 'single';
  const hasRecommendations = (message.recommendations?.length ?? 0) > 0;

  return (
    <Animated.View entering={ENTERING} style={styles.row}>
      <View style={styles.gutter}>
        {isGroupStart ? <Avatar label="AI" size={AVATAR_SIZE} /> : null}
      </View>
      <View style={styles.column}>
        {isGroupStart ? <Text style={styles.name}>AI Astrologer</Text> : null}
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={LONG_PRESS_DELAY_MS}
          disabled={!onLongPress}
          accessibilityRole="button"
          accessibilityLabel={`AI Astrologer: ${message.text}`}
          accessibilityHint="Long press for message actions"
          style={({ pressed }) => [
            styles.bubble,
            corners[position],
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.text}>{message.text}</Text>
        </Pressable>
        {hasRecommendations && message.recommendations ? (
          <View style={styles.rail}>
            <RecommendationRail
              recommendations={message.recommendations}
              messageId={message.id}
            />
          </View>
        ) : null}
        <FeedbackBar messageId={message.id} />
      </View>
    </Animated.View>
  );
});

const TIGHT = radius.sm / 2;

/** Left side: flatten the corners that touch the neighbouring bubble in the group. */
const corners = StyleSheet.create({
  single: { borderTopLeftRadius: TIGHT },
  first: { borderTopLeftRadius: TIGHT, borderBottomLeftRadius: TIGHT },
  middle: { borderTopLeftRadius: TIGHT, borderBottomLeftRadius: TIGHT },
  last: { borderTopLeftRadius: TIGHT },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.lg,
  },
  gutter: {
    width: AVATAR_SIZE,
    marginRight: spacing.sm,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: colors.aiBubble,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
  rail: {
    marginTop: spacing.sm,
  },
});
