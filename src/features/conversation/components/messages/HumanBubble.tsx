import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../../app/theme';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Pill } from '../../../../shared/ui/Pill';
import type { HumanMessage } from '../../model/types';
import type { MessageComponentProps } from './messageRenderers';

const ENTERING = FadeInDown.duration(180);
const AVATAR_SIZE = 32;
const FALLBACK_NAME = 'Astrologer';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map(p => p[0]?.toUpperCase() ?? '').join('') || 'A';
}

/**
 * Left-aligned bubble from a human astrologer who joined the chat. Visually
 * distinct from the AI (accent colour, initials avatar, "Human" tag) so users
 * always know who they are talking to.
 */
export const HumanBubble = React.memo(function HumanBubbleView({
  message,
  position,
}: MessageComponentProps<HumanMessage>) {
  const isGroupStart = position === 'first' || position === 'single';
  const name = message.authorName ?? FALLBACK_NAME;

  return (
    <Animated.View entering={ENTERING} style={styles.row}>
      <View style={styles.gutter}>
        {isGroupStart ? (
          <Avatar
            label={initials(name)}
            size={AVATAR_SIZE}
            color={colors.humanBubble}
          />
        ) : null}
      </View>
      <View style={styles.column}>
        {isGroupStart ? (
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Pill tone="accent">Human</Pill>
          </View>
        ) : null}
        <View
          style={[styles.bubble, corners[position]]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${name}: ${message.text}`}
        >
          <Text style={styles.text}>{message.text}</Text>
        </View>
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
    paddingRight: spacing.xxl * 2,
  },
  gutter: {
    width: AVATAR_SIZE,
    marginRight: spacing.sm,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.label,
    color: colors.textMuted,
    flexShrink: 1,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colors.humanBubble,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
});
