/**
 * Pill-shaped toggle. Used for feedback reasons and dev-panel options.
 * Pure presentational: selection state is owned by the caller.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../app/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}

export const Chip = React.memo(function ChipView({
  label,
  selected = false,
  onPress,
  tone = 'default',
}: ChipProps) {
  const tint = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: !onPress }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected && { borderColor: tint, backgroundColor: colors.primarySoft },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          tone === 'danger' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.text,
  },
});
