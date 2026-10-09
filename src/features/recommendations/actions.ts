import { Alert } from 'react-native';
import { resolveRecommendation, isKnownRecommendationType } from './registry';
import type { Recommendation, RecommendationActionContext } from './types';

/**
 * Tap dispatch for the Dynamic Recommendation Framework.
 *
 * Cards never decide what a tap does. They call one `onPress` prop, the rail
 * routes it here, and this module resolves the definition and runs its
 * handler with a context of capabilities (alert, track, navigate). Swapping
 * Alerts for real navigation or deeplinks is a change in this file and the
 * definitions, never in a card.
 */

/**
 * Single analytics choke point. Every recommendation event funnels through
 * here, so wiring a real analytics SDK later is a one-line change.
 */
function track(event: string, props?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, props ?? {});
  }
}

function alert(title: string, message?: string): void {
  Alert.alert(title, message);
}

export function createActionContext(args: {
  messageId: string;
  navigate?: RecommendationActionContext['navigate'];
}): RecommendationActionContext {
  return {
    source: { messageId: args.messageId },
    alert,
    track,
    navigate: args.navigate,
  };
}

/**
 * The one place a recommendation tap is handled. A future navigation or
 * deeplink dispatcher (e.g. honouring a server-sent `deeplink` field before
 * falling back to the definition) belongs here.
 */
export function handleRecommendationPress(
  rec: Recommendation,
  ctx: RecommendationActionContext,
): void {
  const definition = resolveRecommendation(rec.type);
  ctx.track('recommendation_press', {
    type: rec.type,
    id: rec.id,
    messageId: ctx.source.messageId,
    known: isKnownRecommendationType(rec.type),
  });
  try {
    definition.onPress(rec, ctx);
  } catch (error) {
    // A faulty handler must never crash the chat; surface it in dev only.
    if (__DEV__) {
      console.warn(`[recommendations] onPress failed for "${rec.type}"`, error);
    }
  }
}
