/**
 * Public surface of the Dynamic Recommendation Framework. Feature code
 * (e.g. the conversation timeline) imports from here only.
 */
export { RecommendationRail } from './RecommendationRail';
export type { RecommendationRailProps } from './RecommendationRail';
export {
  registerRecommendation,
  resolveRecommendation,
  isKnownRecommendationType,
  getRegisteredTypes,
  UNKNOWN_TYPE,
} from './registry';
export { createActionContext, handleRecommendationPress } from './actions';
export { ensureRecommendationsRegistered, BaseCard, CardShell } from './cards';
export type { CardShellProps } from './cards/BaseCard';
export type {
  RecommendationBase,
  GemstoneRecommendation,
  TarotRecommendation,
  ConsultationRecommendation,
  ArticleRecommendation,
  PromotionRecommendation,
  KnownRecommendation,
  Recommendation,
  RecommendationSource,
  RecommendationActionContext,
  RecommendationCardProps,
  RecommendationDefinition,
} from './types';
