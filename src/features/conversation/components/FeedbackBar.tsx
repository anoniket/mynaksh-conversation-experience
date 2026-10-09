/**
 * Like / Dislike under an AI reply. Dislike expands multi-select reason chips.
 * Each bar subscribes only to its own message's feedback slice.
 */
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../../app/theme';
import { Chip } from '../../../shared/ui/Chip';
import { IconButton } from '../../../shared/ui/IconButton';
import { useFeedback } from '../model/selectors';
import { useConversationStore } from '../model/store';
import {
  FEEDBACK_REASONS,
  type FeedbackReason,
  type FeedbackVote,
} from '../model/types';

export interface FeedbackBarProps {
  messageId: string;
}

export const FeedbackBar = React.memo(function FeedbackBarView({
  messageId,
}: FeedbackBarProps) {
  const { vote, reasons } = useFeedback(messageId);

  const onVote = useCallback(
    (next: FeedbackVote) => {
      const { feedback, setVote } = useConversationStore.getState();
      // Read the current vote at tap time so the callback stays stable across re-renders.
      const current = feedback[messageId]?.vote ?? null;
      setVote(messageId, current === next ? null : next);
    },
    [messageId],
  );
  const onLike = useCallback(() => onVote('like'), [onVote]);
  const onDislike = useCallback(() => onVote('dislike'), [onVote]);
  const onToggleReason = useCallback(
    (reason: FeedbackReason) =>
      useConversationStore.getState().toggleReason(messageId, reason),
    [messageId],
  );

  const showThanks =
    vote === 'like' || (vote === 'dislike' && reasons.length > 0);

  return (
    <Animated.View layout={LinearTransition} style={styles.container}>
      <View style={styles.voteRow}>
        <IconButton
          label="👍"
          size={30}
          selected={vote === 'like'}
          onPress={onLike}
          accessibilityLabel={
            vote === 'like' ? 'Remove like' : 'Like this response'
          }
        />
        <IconButton
          label="👎"
          size={30}
          selected={vote === 'dislike'}
          onPress={onDislike}
          accessibilityLabel={
            vote === 'dislike' ? 'Remove dislike' : 'Dislike this response'
          }
        />
        {showThanks ? (
          <Animated.Text
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.thanks}
            accessibilityLiveRegion="polite"
          >
            Thanks for your feedback
          </Animated.Text>
        ) : null}
      </View>

      {vote === 'dislike' ? (
        <Animated.View
          layout={LinearTransition}
          exiting={FadeOut}
          style={styles.reasons}
          accessibilityLabel="What went wrong?"
        >
          <Text style={styles.prompt}>What went wrong?</Text>
          <View style={styles.chipRow}>
            {FEEDBACK_REASONS.map((r, i) => (
              <Animated.View
                key={r.key}
                entering={FadeInDown.delay(i * 40)}
                exiting={FadeOut}
              >
                <ReasonChip
                  reason={r.key}
                  label={r.label}
                  selected={reasons.includes(r.key)}
                  onToggle={onToggleReason}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

/** Binds a reason key to the shared toggle so Chip receives a stable onPress. */
const ReasonChip = React.memo(function ReasonChipView({
  reason,
  label,
  selected,
  onToggle,
}: {
  reason: FeedbackReason;
  label: string;
  selected: boolean;
  onToggle: (reason: FeedbackReason) => void;
}) {
  const onPress = useCallback(() => onToggle(reason), [onToggle, reason]);
  return <Chip label={label} selected={selected} onPress={onPress} />;
});

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  thanks: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  reasons: {
    marginTop: spacing.xs,
  },
  prompt: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
