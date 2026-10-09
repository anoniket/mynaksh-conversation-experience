/**
 * Built-in recommendation definitions, registered at import time.
 *
 * ---------------------------------------------------------------------------
 * How to add a new recommendation type
 * ---------------------------------------------------------------------------
 * 1. (Optional) Create `cards/MyTypeCard.tsx` composing `CardShell` for a
 *    bespoke layout. Skip this step and the type renders with `BaseCard`.
 * 2. Add one `registerRecommendation({ type, label, icon, accent, cta,
 *    Card?, onPress })` call in `registerBuiltins()` below.
 *
 * Nothing else changes: the rail, the chat timeline and the tap dispatcher
 * look types up in the registry. Types the backend sends before this build
 * knows them fall back to the UNKNOWN_TYPE definition, never a crash.
 * ---------------------------------------------------------------------------
 */
import {
  isKnownRecommendationType,
  registerRecommendation,
  UNKNOWN_TYPE,
} from '../registry';
import type {
  ArticleRecommendation,
  ConsultationRecommendation,
  GemstoneRecommendation,
  PromotionRecommendation,
  TarotRecommendation,
} from '../types';
import { ArticleCard } from './ArticleCard';
import { ConsultationCard } from './ConsultationCard';
import { GemstoneCard } from './GemstoneCard';
import { PromotionCard } from './PromotionCard';
import { TarotCard } from './TarotCard';
import { UnknownCard } from './UnknownCard';

const BUILTIN_TYPES = [
  'gemstone',
  'tarot',
  'consultation',
  'article',
  'promotion',
];

function registerBuiltins(): void {
  registerRecommendation<GemstoneRecommendation>({
    type: 'gemstone',
    label: 'Gemstone',
    icon: '💎',
    accent: '#60A5FA',
    cta: 'View stone',
    Card: GemstoneCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        rec.title,
        `${
          rec.subtitle ??
          (rec.planet
            ? `Recommended for ${rec.planet}`
            : 'Chosen for your chart')
        }. Open gemstone details.`,
      ),
  });

  registerRecommendation<TarotRecommendation>({
    type: 'tarot',
    label: 'Tarot',
    icon: '🔮',
    accent: '#C084FC',
    cta: 'Start reading',
    Card: TarotCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        rec.title,
        `Shuffle the deck and draw your ${rec.spread ?? 'spread'}.`,
      ),
  });

  registerRecommendation<ConsultationRecommendation>({
    type: 'consultation',
    label: 'Consultation',
    icon: '📞',
    accent: '#34D399',
    cta: 'Talk now',
    Card: ConsultationCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        rec.title,
        rec.astrologerName
          ? `Connect with ${rec.astrologerName} for a live session.`
          : 'Connect with an available astrologer for a live session.',
      ),
  });

  registerRecommendation<ArticleRecommendation>({
    type: 'article',
    label: 'Article',
    icon: '📖',
    accent: '#F472B6',
    cta: 'Read',
    Card: ArticleCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        rec.title,
        rec.readMinutes
          ? `Open the ${rec.readMinutes} min article.`
          : 'Open the article.',
      ),
  });

  registerRecommendation<PromotionRecommendation>({
    type: 'promotion',
    label: 'Offer',
    icon: '🎁',
    accent: '#F5B544',
    cta: 'Claim offer',
    Card: PromotionCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        rec.title,
        rec.code
          ? `Use code ${rec.code} at checkout.`
          : 'Offer applied at checkout.',
      ),
  });

  // Fallback for any type this build has not shipped yet.
  registerRecommendation({
    type: UNKNOWN_TYPE,
    label: 'New experience',
    icon: '✨',
    accent: '#A79FC4',
    cta: 'Learn more',
    Card: UnknownCard,
    onPress: (rec, ctx) =>
      ctx.alert(
        'Coming soon',
        `"${rec.type}" experiences arrive in a future app update.`,
      ),
  });
}

/**
 * Idempotent: registers the built-ins only if any are missing (so it also
 * recovers after a test calls `__resetRegistry()`), and never clobbers a
 * definition an app overrode after bootstrap.
 */
export function ensureRecommendationsRegistered(): void {
  if (BUILTIN_TYPES.every(isKnownRecommendationType)) {
    return;
  }
  registerBuiltins();
}

ensureRecommendationsRegistered();

export { BaseCard, CardShell, CARD_WIDTH } from './BaseCard';
