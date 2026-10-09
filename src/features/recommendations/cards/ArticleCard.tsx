import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../../app/theme';
import type { ArticleRecommendation, RecommendationCardProps } from '../types';
import { CardShell } from './BaseCard';

/** Tier-two card for `article`: adds an "N min read" line when known. */
export const ArticleCard = React.memo(function ArticleCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps<ArticleRecommendation>) {
  const { readMinutes } = recommendation;
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      subtitle={recommendation.subtitle}
      onPress={onPress}
    >
      {typeof readMinutes === 'number' && readMinutes > 0 ? (
        <Text style={styles.read}>{Math.round(readMinutes)} min read</Text>
      ) : null}
    </CardShell>
  );
});

const styles = StyleSheet.create({
  read: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
