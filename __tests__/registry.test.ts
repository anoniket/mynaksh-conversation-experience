import {
  __resetRegistry,
  getRegisteredTypes,
  isKnownRecommendationType,
  registerRecommendation,
  resolveRecommendation,
  UNKNOWN_TYPE,
} from '../src/features/recommendations/registry';
import type { RecommendationDefinition } from '../src/features/recommendations/types';

const DummyCard = () => null;
const OtherCard = () => null;

function def(
  type: string,
  overrides: Partial<RecommendationDefinition> = {},
): RecommendationDefinition {
  return {
    type,
    label: type,
    icon: 'star',
    accent: '#000',
    Card: DummyCard,
    onPress: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  __resetRegistry();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('recommendation registry', () => {
  it('resolves a registered type to its definition', () => {
    const gem = def('gemstone');
    registerRecommendation(gem);
    registerRecommendation(def(UNKNOWN_TYPE));
    expect(resolveRecommendation('gemstone')).toBe(gem);
  });

  it('resolves an unregistered type to the UNKNOWN_TYPE fallback', () => {
    const fallback = def(UNKNOWN_TYPE, { Card: OtherCard });
    registerRecommendation(def('gemstone'));
    registerRecommendation(fallback);
    expect(resolveRecommendation('meditation')).toBe(fallback);
    expect(resolveRecommendation('')).toBe(fallback);
  });

  it('throws if a type is unknown and no fallback is registered', () => {
    registerRecommendation(def('gemstone'));
    expect(() => resolveRecommendation('meditation')).toThrow(/No fallback registered/);
    // known types still resolve without a fallback
    expect(() => resolveRecommendation('gemstone')).not.toThrow();
  });

  it('isKnownRecommendationType is true only for registered non-fallback types', () => {
    registerRecommendation(def('gemstone'));
    registerRecommendation(def(UNKNOWN_TYPE));
    expect(isKnownRecommendationType('gemstone')).toBe(true);
    expect(isKnownRecommendationType(UNKNOWN_TYPE)).toBe(false);
    expect(isKnownRecommendationType('meditation')).toBe(false);
  });

  it('getRegisteredTypes excludes the fallback', () => {
    registerRecommendation(def('gemstone'));
    registerRecommendation(def(UNKNOWN_TYPE));
    registerRecommendation(def('tarot'));
    expect(getRegisteredTypes()).toEqual(['gemstone', 'tarot']);
  });

  it('warns in __DEV__ when a type is registered twice, and the last one wins', () => {
    expect(__DEV__).toBe(true);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const first = def('gemstone');
    const second = def('gemstone', { Card: OtherCard, label: 'v2' });

    registerRecommendation(first);
    expect(warn).not.toHaveBeenCalled();

    registerRecommendation(second);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"gemstone" registered twice');
    expect(resolveRecommendation('gemstone')).toBe(second);
    expect(getRegisteredTypes()).toEqual(['gemstone']);
  });

  it('__resetRegistry clears everything', () => {
    registerRecommendation(def('gemstone'));
    registerRecommendation(def(UNKNOWN_TYPE));
    __resetRegistry();
    expect(getRegisteredTypes()).toEqual([]);
    expect(() => resolveRecommendation('gemstone')).toThrow();
  });
});
