/**
 * Message input. Owns only the draft text; sending is fire-and-forget into the store
 * (optimistic append), so consecutive sends never block each other.
 */
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../app/theme';
import { useConversationStore } from '../model/store';
import { ReplyPreview } from './ReplyPreview';

const LINE_HEIGHT = typography.body.lineHeight;
const MAX_LINES = 4;
const INPUT_VERTICAL_PADDING = spacing.sm + 2;

export const Composer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0;

  const onSend = useCallback(() => {
    const text = value;
    if (!text.trim()) {
      return;
    }
    setValue('');
    // Not awaited: the store owns status (sending/sent/failed) and the row renders it.
    useConversationStore.getState().send(text);
  }, [value]);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <ReplyPreview />
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask your astrologer…"
          placeholderTextColor={colors.textFaint}
          multiline
          style={styles.input}
          selectionColor={colors.primary}
          keyboardAppearance="dark"
          accessibilityLabel="Message"
          textAlignVertical="center"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.send,
            !canSend && styles.sendDisabled,
            pressed && canSend && styles.sendPressed,
          ]}
        >
          <Text
            style={[styles.sendGlyph, !canSend && styles.sendGlyphDisabled]}
          >
            ↑
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: INPUT_VERTICAL_PADDING,
    paddingBottom: INPUT_VERTICAL_PADDING,
    minHeight: LINE_HEIGHT + INPUT_VERTICAL_PADDING * 2,
    maxHeight: LINE_HEIGHT * MAX_LINES + INPUT_VERTICAL_PADDING * 2,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  sendPressed: {
    opacity: 0.8,
  },
  sendGlyph: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sendGlyphDisabled: {
    color: colors.textFaint,
  },
});
