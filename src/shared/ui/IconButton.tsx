/**
 * Small round tappable glyph (emoji or short text) with an optional selected tint.
 * Always pass an accessibilityLabel: the glyph itself is not a usable label.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../app/theme';

export interface IconButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  selected?: boolean;
  size?: number;
  disabled?: boolean;
}

export const IconButton = React.memo(function IconButtonView({
  label,
  onPress,
  accessibilityLabel,
  selected = false,
  size = 32,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.glyph, { fontSize: Math.round(size * 0.45) }]}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'transparent',
  },
  selected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
  glyph: {
    color: colors.text,
  },
});
