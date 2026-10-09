import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';
import type {
  ConsultationRecommendation,
  RecommendationCardProps,
} from '../types';
import { CardShell } from './BaseCard';

/**
 * Tier-two card for `consultation`: a "Live" presence dot, the astrologer's
 * name and per-minute rate when present.
 */
export const ConsultationCard = React.memo(function ConsultationCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps<ConsultationRecommendation>) {
  const { astrologerName, ratePerMinInr } = recommendation;
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      subtitle={recommendation.subtitle}
      onPress={onPress}
    >
      <View style={styles.row}>
        <View style={styles.dot} />
        <Text style={styles.live}>Live</Text>
        {astrologerName ? (
          <Text style={styles.meta} numberOfLines={1}>
            {' · '}
            {astrologerName}
          </Text>
        ) : null}
      </View>
      {typeof ratePerMinInr === 'number' ? (
        <Text style={styles.meta}>₹{ratePerMinInr}/min</Text>
      ) : null}
    </CardShell>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  live: { ...typography.caption, color: colors.success, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
});
