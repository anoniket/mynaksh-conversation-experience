import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../../app/theme';
import type { RecommendationCardProps } from '../types';
import { CardShell } from './BaseCard';

/**
 * Forward-compatibility fallback, registered under UNKNOWN_TYPE. Renders any
 * type this build does not know (e.g. a new "meditation" experience) as a
 * neutral card. Reads only optional, type-checked fields, so it never throws
 * on a malformed payload.
 */
export const UnknownCard = React.memo(function UnknownCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps) {
  const title: unknown = recommendation?.title;
  const subtitle: unknown = recommendation?.subtitle;
  return (
    <CardShell
      definition={definition}
      title={
        typeof title === 'string' && title ? title : 'Something new for you'
      }
      subtitle={subtitle}
      onPress={onPress}
    >
      <Text style={styles.hint} numberOfLines={1}>
        Update the app to explore this
      </Text>
    </CardShell>
  );
});

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
});
