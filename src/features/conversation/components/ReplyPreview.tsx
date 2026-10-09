/**
 * Quote of the message being replied to, shown above the composer.
 * Driven entirely by store.replyToId; × clears it.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../app/theme';
import { useReplyTarget } from '../model/selectors';
import { useConversationStore } from '../model/store';
import type { Message } from '../model/types';

function authorLabel(message: Message): string {
  switch (message.type) {
    case 'ai':
      return 'AI Astrologer';
    case 'human':
      return message.authorName
        ? `Astrologer ${message.authorName}`
        : 'Astrologer';
    case 'user':
      return 'You';
    case 'system':
      return 'System';
  }
}

export const ReplyPreview: React.FC = () => {
  const target = useReplyTarget();
  const onClear = useCallback(
    () => useConversationStore.getState().setReplyTo(null),
    [],
  );

  if (!target) {
    return null;
  }

  const author = authorLabel(target);
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOut}
      layout={LinearTransition}
      style={styles.container}
      accessibilityLabel={`Replying to ${author}: ${target.text}`}
    >
      <View style={styles.bar} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          Replying to {author}
        </Text>
        <Text style={styles.text} numberOfLines={1}>
          {target.text}
        </Text>
      </View>
      <Pressable
        onPress={onClear}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Cancel reply"
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Text style={styles.closeGlyph}>×</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.label,
    color: colors.accent,
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.border,
  },
  closeGlyph: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 22,
  },
});
