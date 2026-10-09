import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../app/theme';

export type PillTone = 'muted' | 'accent';

export interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
}

/**
 * Small rounded label used for date separators, system events and tags.
 * String children are wrapped in themed text; anything else renders as-is.
 */
export const Pill = React.memo(function PillView({
  children,
  tone = 'muted',
}: PillProps) {
  const isText = typeof children === 'string' || typeof children === 'number';
  return (
    <View style={[styles.base, tone === 'accent' ? styles.accent : styles.muted]}>
      {isText ? (
        <Text
          style={[
            styles.text,
            tone === 'accent' ? styles.accentText : styles.mutedText,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  muted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  text: {
    ...typography.caption,
  },
  mutedText: {
    color: colors.textMuted,
  },
  accentText: {
    color: colors.text,
    fontWeight: '600',
  },
});
