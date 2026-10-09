import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';
import type {
  PromotionRecommendation,
  RecommendationCardProps,
} from '../types';
import { CardShell } from './BaseCard';

/**
 * Tier-two card for `promotion`: accent-filled, big discount, coupon code in
 * a dashed box and an expiry line. Every field is optional.
 */
function formatExpiry(iso?: string): string | undefined {
  if (!iso) {
    return undefined;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return `Ends ${date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })}`;
}

export const PromotionCard = React.memo(function PromotionCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps<PromotionRecommendation>) {
  const { discountPct, code, expiresAt } = recommendation;
  const expiry = formatExpiry(expiresAt);
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      onPress={onPress}
      filled
    >
      {typeof discountPct === 'number' ? (
        <Text style={styles.discount}>{discountPct}% OFF</Text>
      ) : null}
      <View style={styles.row}>
        {code ? (
          <View style={styles.codeBox}>
            <Text style={styles.code}>{code}</Text>
          </View>
        ) : null}
        {expiry ? <Text style={styles.expiry}>{expiry}</Text> : null}
      </View>
    </CardShell>
  );
});

const styles = StyleSheet.create({
  discount: {
    ...typography.title,
    fontSize: 24,
    color: colors.background,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  codeBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  code: { ...typography.label, color: colors.background, letterSpacing: 1 },
  expiry: { ...typography.caption, color: colors.background },
});
