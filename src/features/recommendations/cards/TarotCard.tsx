import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';
import type { RecommendationCardProps, TarotRecommendation } from '../types';
import { CardShell } from './BaseCard';

/**
 * Tier-two card for `tarot`: a fanned three-card motif with the spread name
 * (falls back to a generic label when the payload has no `spread`).
 */
const FAN = [-10, 0, 10];

export const TarotCard = React.memo(function TarotCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps<TarotRecommendation>) {
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      subtitle={recommendation.subtitle}
      onPress={onPress}
    >
      <View style={styles.row}>
        <View style={styles.fan} accessible={false}>
          {FAN.map(deg => (
            <View
              key={deg}
              style={[
                styles.mini,
                {
                  borderColor: definition.accent,
                  transform: [{ rotate: `${deg}deg` }],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.spread} numberOfLines={1}>
          {recommendation.spread ?? 'Card spread'}
        </Text>
      </View>
    </CardShell>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  fan: { flexDirection: 'row', marginRight: spacing.sm },
  mini: {
    width: 12,
    height: 18,
    marginHorizontal: -1,
    borderWidth: 1,
    borderRadius: radius.sm / 3,
    backgroundColor: colors.surfaceAlt,
  },
  spread: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
});
