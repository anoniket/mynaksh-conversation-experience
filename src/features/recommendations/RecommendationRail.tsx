import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { spacing } from '../../app/theme';
import { createActionContext, handleRecommendationPress } from './actions';
import { CardErrorBoundary } from './CardErrorBoundary';
import { BaseCard } from './cards';
import { resolveRecommendation } from './registry';
import type { Recommendation } from './types';

/**
 * The rail rendered under an AI bubble. It knows nothing about concrete
 * recommendation types: each item is resolved through the registry to a
 * definition (custom `Card`, else `BaseCard`), isolated in its own error
 * boundary, and taps are routed to the central dispatcher in `actions.ts`.
 *
 * Importing `./cards` registers the built-in definitions, so any screen that
 * renders a rail is guaranteed a populated registry.
 */
export interface RecommendationRailProps {
  recommendations: Recommendation[];
  messageId: string;
}

interface RailItemProps {
  recommendation: Recommendation;
  messageId: string;
}

/** Resolves inside the boundary so a registry failure is contained too. */
function ResolvedCard({ recommendation, messageId }: RailItemProps) {
  const definition = resolveRecommendation(recommendation.type);
  const Card = definition.Card ?? BaseCard;
  const onPress = useCallback(
    () =>
      handleRecommendationPress(
        recommendation,
        createActionContext({ messageId }),
      ),
    [recommendation, messageId],
  );
  return (
    <Card
      recommendation={recommendation}
      definition={definition}
      onPress={onPress}
    />
  );
}

const RailItem = React.memo(function RailItemView(props: RailItemProps) {
  return (
    <CardErrorBoundary
      label={`${props.recommendation.type}:${props.recommendation.id}`}
    >
      <ResolvedCard {...props} />
    </CardErrorBoundary>
  );
});

const keyExtractor = (item: Recommendation, index: number) =>
  `${item.type}:${item.id ?? index}`;

const Separator = () => <View style={styles.separator} />;

export const RecommendationRail = React.memo(function RecommendationRailView({
  recommendations,
  messageId,
}: RecommendationRailProps) {
  const renderItem = useCallback<ListRenderItem<Recommendation>>(
    ({ item }) => <RailItem recommendation={item} messageId={messageId} />,
    [messageId],
  );

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={recommendations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      initialNumToRender={3}
      decelerationRate="fast"
      accessibilityRole="list"
      accessibilityLabel={`${recommendations.length} recommendations`}
    />
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  separator: { width: spacing.md },
});
