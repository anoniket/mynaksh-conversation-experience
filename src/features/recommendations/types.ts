import type { ComponentType } from 'react';

/**
 * Every recommendation the backend can send has at least these fields.
 * `type` is an open string on purpose: the AI platform will ship types this
 * build has never seen, and the registry must degrade gracefully, not crash.
 */
export interface RecommendationBase {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
}

export interface GemstoneRecommendation extends RecommendationBase {
  type: 'gemstone';
  planet?: string;
  priceInr?: number;
}

export interface TarotRecommendation extends RecommendationBase {
  type: 'tarot';
  spread?: string;
}

export interface ConsultationRecommendation extends RecommendationBase {
  type: 'consultation';
  astrologerName?: string;
  ratePerMinInr?: number;
}

export interface ArticleRecommendation extends RecommendationBase {
  type: 'article';
  readMinutes?: number;
}

export interface PromotionRecommendation extends RecommendationBase {
  type: 'promotion';
  discountPct?: number;
  code?: string;
  expiresAt?: string;
}

export type KnownRecommendation =
  | GemstoneRecommendation
  | TarotRecommendation
  | ConsultationRecommendation
  | ArticleRecommendation
  | PromotionRecommendation;

/** Known types are strict; anything else still flows through to the fallback card. */
export type Recommendation = KnownRecommendation | RecommendationBase;

export interface RecommendationSource {
  messageId: string;
}

/**
 * Everything a tap handler may need. Today `alert` is enough (the brief allows
 * an Alert). Tomorrow `navigate` points at a real screen without touching cards.
 */
export interface RecommendationActionContext {
  source: RecommendationSource;
  alert: (title: string, message?: string) => void;
  track: (event: string, props?: Record<string, unknown>) => void;
  navigate?: (route: string, params?: Record<string, unknown>) => void;
}

export interface RecommendationCardProps<
  T extends RecommendationBase = RecommendationBase,
> {
  recommendation: T;
  definition: RecommendationDefinition<T>;
  onPress: () => void;
}

/**
 * One entry in the registry. Two tiers of extension:
 *  - config only: omit `Card`, the rail renders `BaseCard` with your icon/accent/cta.
 *  - custom:      supply `Card` for a bespoke layout.
 */
export interface RecommendationDefinition<
  T extends RecommendationBase = RecommendationBase,
> {
  type: T['type'];
  label: string;
  icon: string;
  accent: string;
  cta?: string;
  Card?: ComponentType<RecommendationCardProps<T>>;
  onPress: (recommendation: T, ctx: RecommendationActionContext) => void;
}
