import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../app/theme';
import { Pill } from '../../../shared/ui/Pill';

export interface DateSeparatorProps {
  label: string;
}

/** Centered day label ("Today", "12 Oct") between messages from different days. */
export const DateSeparator = React.memo(function DateSeparatorView({
  label,
}: DateSeparatorProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={label}
    >
      <Pill>{label}</Pill>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
});
