import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';
import type { GemstoneRecommendation, RecommendationCardProps } from '../types';
import { CardShell } from './BaseCard';

/**
 * Tier-two card for `gemstone`: base chrome plus a ruling-planet chip and a
 * price line, each shown only when the payload carries it.
 */
export const GemstoneCard = React.memo(function GemstoneCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps<GemstoneRecommendation>) {
  const { planet, priceInr } = recommendation;
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      subtitle={recommendation.subtitle}
      onPress={onPress}
    >
      <View style={styles.meta}>
        {planet ? (
          <View style={[styles.chip, { borderColor: definition.accent }]}>
            <Text style={styles.chipText}>{planet}</Text>
          </View>
        ) : null}
        {typeof priceInr === 'number' ? (
          <Text style={styles.price}>
            from ₹{priceInr.toLocaleString('en-IN')}
          </Text>
        ) : null}
      </View>
    </CardShell>
  );
});

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: { ...typography.caption, color: colors.text },
  price: { ...typography.caption, color: colors.textMuted },
});
