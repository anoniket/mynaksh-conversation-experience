import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../../app/theme';
import { Avatar } from '../../../shared/ui/Avatar';

const DOT_COUNT = 3;
const STEP_MS = 320;
const STAGGER_MS = 160;
const MIN_OPACITY = 0.3;
const AVATAR_SIZE = 32;
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => i);

/** One dot; its opacity/scale loop runs entirely on the UI thread. */
function Dot({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: STEP_MS }),
          withTiming(0, { duration: STEP_MS }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: MIN_OPACITY + (1 - MIN_OPACITY) * progress.value,
    transform: [{ translateY: -2 * progress.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

/**
 * "AI is typing" bubble shown while a reply is pending. Laid out like an AI
 * bubble (avatar + left aligned) so the real reply replaces it in place.
 */
export const TypingIndicator = React.memo(function TypingIndicatorView() {
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(120)}
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="AI Astrologer is typing"
    >
      <Avatar label="AI" size={AVATAR_SIZE} />
      <View style={styles.bubble}>
        {DOTS.map(i => (
          <Dot key={i} index={i} />
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    backgroundColor: colors.aiBubble,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.textMuted,
  },
});
