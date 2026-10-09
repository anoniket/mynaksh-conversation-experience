/**
 * Library-free bottom sheet listing the actions from getMessageActions for one message.
 * Animates in/out with a shared value so the exit plays before the Modal unmounts.
 */
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, radius, spacing, typography } from '../../../app/theme';
import { useMessage } from '../model/selectors';
import { useConversationStore } from '../model/store';
import type { Message } from '../model/types';
import { getMessageActions, type MessageAction } from './messageActions';

export interface MessageActionsSheetProps {
  messageId: string | null;
  onClose: () => void;
}

const DURATION_MS = 220;
/** Off-screen offset for the closed state; larger than any realistic sheet height. */
const HIDDEN_OFFSET = 480;

const copyToClipboard = (text: string) => Clipboard.setString(text);

export const MessageActionsSheet: React.FC<MessageActionsSheetProps> = ({
  messageId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const live = useMessage(messageId ?? '');
  // Snapshot keeps the sheet's content rendered while it animates out (e.g. after Delete).
  const [shown, setShown] = useState<Message | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (messageId && live) {
      setShown(live);
      progress.value = withTiming(1, {
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    if (messageId && !live) {
      // Message vanished (deleted elsewhere, conversation reloaded): close instead of showing stale data.
      onClose();
      return;
    }
    progress.value = withTiming(
      0,
      { duration: DURATION_MS, easing: Easing.in(Easing.cubic) },
      finished => {
        if (finished) {
          scheduleOnRN(setShown, null);
        }
      },
    );
  }, [messageId, live, onClose, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [HIDDEN_OFFSET, 0]) },
    ],
  }));

  const onRun = useCallback(
    (action: MessageAction) => {
      if (!shown) {
        return;
      }
      action.run({
        message: shown,
        store: useConversationStore.getState(),
        copyToClipboard,
        close: onClose,
      });
    },
    [shown, onClose],
  );

  if (!shown) {
    return null;
  }

  const actions = getMessageActions(shown);

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message actions"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.md },
          sheetStyle,
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.handle} />
        <Text style={styles.quote} numberOfLines={1}>
          “{shown.text}”
        </Text>
        {actions.map(action => (
          <ActionRow key={action.key} action={action} onRun={onRun} />
        ))}
        {actions.length === 0 ? (
          <Text style={styles.empty}>No actions for this message.</Text>
        ) : null}
      </Animated.View>
    </Modal>
  );
};

const ActionRow = React.memo(function ActionRowView({
  action,
  onRun,
}: {
  action: MessageAction;
  onRun: (action: MessageAction) => void;
}) {
  const onPress = useCallback(() => onRun(action), [onRun, action]);
  const tint = action.destructive ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[styles.icon, { color: tint }]}>{action.icon}</Text>
      <Text style={[styles.label, { color: tint }]}>{action.label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  quote: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  icon: {
    width: 28,
    fontSize: 18,
    textAlign: 'center',
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  empty: {
    ...typography.caption,
    color: colors.textFaint,
    paddingVertical: spacing.md,
  },
});
