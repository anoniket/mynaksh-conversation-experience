import {
  normalizeConversation,
  normalizeMessage,
} from '../src/features/conversation/model/normalize';
import type {
  AiMessage,
  ApiMessage,
  HumanMessage,
  UserMessage,
} from '../src/features/conversation/model/types';

const FALLBACK = new Date(2026, 9, 9, 10, 0).getTime();

describe('normalizeMessage', () => {
  it('parses an ISO createdAt into epoch ms', () => {
    const iso = '2026-10-08T21:17:42.123Z';
    const m = normalizeMessage({ id: '1', type: 'system', text: 'x', createdAt: iso }, FALLBACK);
    expect(m.createdAt).toBe(Date.parse(iso));
    expect(m.createdAt).not.toBe(FALLBACK);
  });

  it('backfills the fallback when createdAt is missing', () => {
    const m = normalizeMessage({ id: '1', type: 'ai', text: 'x' }, FALLBACK);
    expect(m.createdAt).toBe(FALLBACK);
  });

  it('maps an unknown message type to a system message, keeping id and text', () => {
    const m = normalizeMessage(
      { id: '9', type: 'poll', text: 'Vote now', authorName: 'X' },
      FALLBACK,
    );
    expect(m).toEqual({ id: '9', type: 'system', text: 'Vote now', createdAt: FALLBACK });
  });

  it('gives user messages status "sent"', () => {
    const m = normalizeMessage({ id: '2', type: 'user', text: 'hi' }, FALLBACK) as UserMessage;
    expect(m.type).toBe('user');
    expect(m.status).toBe('sent');
  });

  it('keeps human authorName', () => {
    const m = normalizeMessage(
      { id: '4', type: 'human', text: 'hi', authorName: 'Astrologer Meera' },
      FALLBACK,
    ) as HumanMessage;
    expect(m.authorName).toBe('Astrologer Meera');
  });

  it('keeps AI recommendations, including extra fields on unknown types', () => {
    const dto: ApiMessage = {
      id: '3',
      type: 'ai',
      text: 'recs',
      recommendations: [
        { id: 'r1', type: 'gemstone', title: 'Blue Sapphire', subtitle: 'Saturn' },
        { id: 'r2', type: 'meditation', title: 'Guru Mantra', durationMin: 12, tags: ['calm'] },
      ],
    };
    const m = normalizeMessage(dto, FALLBACK) as AiMessage;
    expect(m.type).toBe('ai');
    expect(m.recommendations).toEqual(dto.recommendations);
    expect(m.recommendations![1]).toMatchObject({ durationMin: 12, tags: ['calm'] });
    // copies rather than aliasing the wire objects
    expect(m.recommendations![0]).not.toBe(dto.recommendations![0]);
  });

  it('leaves recommendations undefined when the AI message has none', () => {
    const m = normalizeMessage({ id: '3', type: 'ai', text: 'x' }, FALLBACK) as AiMessage;
    expect(m.recommendations).toBeUndefined();
  });
});

describe('normalizeConversation', () => {
  it('preserves order and assigns strictly increasing createdAt when timestamps are absent', () => {
    const dtos: ApiMessage[] = [
      { id: 'a', type: 'system', text: '1' },
      { id: 'b', type: 'user', text: '2' },
      { id: 'c', type: 'ai', text: '3' },
      { id: 'd', type: 'human', text: '4' },
    ];
    const out = normalizeConversation(dtos);
    expect(out.map(m => m.id)).toEqual(['a', 'b', 'c', 'd']);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].createdAt).toBeGreaterThan(out[i - 1].createdAt);
    }
    // backfilled times are in the past (not in the future)
    expect(out[out.length - 1].createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('returns [] for an empty payload', () => {
    expect(normalizeConversation([])).toEqual([]);
  });
});

describe('normalizeMessage with an unparseable createdAt', () => {
  it('falls back instead of producing NaN', () => {
    const m = normalizeMessage(
      { id: 'x', type: 'system', text: 't', createdAt: 'garbage' },
      123456,
    );
    expect(m.createdAt).toBe(123456);
  });
});
