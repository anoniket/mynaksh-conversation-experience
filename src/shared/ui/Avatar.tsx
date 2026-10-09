import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../app/theme';

export interface AvatarProps {
  /** Short text shown inside the circle, e.g. "AI" or initials. */
  label: string;
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 32;

/**
 * Circular text avatar. Purely presentational; callers decide the label
 * (initials, "AI") and the accent so it can be reused for any sender.
 */
export const Avatar = React.memo(function AvatarView({
  label,
  size = DEFAULT_SIZE,
  color = colors.primarySoft,
}: AvatarProps) {
  // Size/color are dynamic, so memoize the derived style instead of recreating it per render.
  const circleStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }),
    [size, color],
  );
  const labelStyle = useMemo(
    () => ({ fontSize: Math.round(size * 0.38) }),
    [size],
  );

  return (
    <View
      style={[styles.circle, circleStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
  },
});
