import React from 'react';
import { Text, View } from 'react-native';
import type { Recommendation } from './types';

export interface RecommendationRailProps {
  recommendations: Recommendation[];
  messageId: string;
}

/** STUB: replaced by the recommendations agent. Keep the exported name and props. */
export const RecommendationRail = React.memo(function RecommendationRail({
  recommendations,
}: RecommendationRailProps) {
  return (
    <View>
      <Text>{recommendations.length} recommendations</Text>
    </View>
  );
});
