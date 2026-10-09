import type {
  RecommendationBase,
  RecommendationDefinition,
} from './types';

/**
 * The heart of the "Dynamic Recommendation Framework".
 *
 * A lookup from recommendation `type` to how it renders and what a tap does.
 * The conversation timeline never imports a concrete card; it asks this
 * registry. Adding a new experience = one card file + one register() call.
 */
const definitions = new Map<string, RecommendationDefinition<any>>();

export const UNKNOWN_TYPE = '__unknown__';

export function registerRecommendation<T extends RecommendationBase>(
  definition: RecommendationDefinition<T>,
): void {
  if (__DEV__ && definitions.has(definition.type)) {
    console.warn(
      `[recommendations] "${definition.type}" registered twice; last one wins.`,
    );
  }
  definitions.set(definition.type, definition);
}

export function resolveRecommendation<T extends RecommendationBase>(
  type: string,
): RecommendationDefinition<T> {
  const found = definitions.get(type) ?? definitions.get(UNKNOWN_TYPE);
  if (!found) {
    throw new Error(
      '[recommendations] No fallback registered. Import "features/recommendations/cards" once at app start.',
    );
  }
  return found as RecommendationDefinition<T>;
}

export function isKnownRecommendationType(type: string): boolean {
  return definitions.has(type) && type !== UNKNOWN_TYPE;
}

export function getRegisteredTypes(): string[] {
  return [...definitions.keys()].filter(t => t !== UNKNOWN_TYPE);
}

/** Test helper. */
export function __resetRegistry(): void {
  definitions.clear();
}
