import {
  __resetMockApi,
  mockApiConfig,
  mockConversationApi,
} from '../src/features/conversation/api/mockConversationApi';
import { ConversationApiError } from '../src/features/conversation/api/conversationApi';
import type { AiMessage } from '../src/features/conversation/model/types';

const originalConfig = { ...mockApiConfig };

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 9, 15, 0) });
  __resetMockApi();
});

afterEach(() => {
  Object.assign(mockApiConfig, originalConfig);
  __resetMockApi();
  jest.useRealTimers();
});

/** Kicks off a call and advances fake time past the mock latency. */
async function settle<T>(promise: Promise<T>, ms: number): Promise<T> {
  // Attach a no-op catch so a rejection during the timer advance is not reported as unhandled.
  promise.catch(() => {});
  await jest.advanceTimersByTimeAsync(ms);
  return promise;
}

describe('fetchConversation', () => {
  it('does not resolve before the configured latency', async () => {
    const onDone = jest.fn();
    mockConversationApi.fetchConversation().then(onDone);
    await jest.advanceTimersByTimeAsync(mockApiConfig.loadLatencyMs - 1);
    expect(onDone).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('resolves the normalized seed conversation', async () => {
    const messages = await settle(
      mockConversationApi.fetchConversation(),
      mockApiConfig.loadLatencyMs,
    );
    expect(messages).toHaveLength(5);
    expect(messages.map(m => m.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(messages.map(m => m.type)).toEqual(['system', 'user', 'ai', 'human', 'human']);

    const ai = messages[2] as AiMessage;
    expect(ai.recommendations).toHaveLength(4);
    expect(ai.recommendations!.map(r => r.type)).toEqual([
      'gemstone',
      'tarot',
      'consultation',
      'article',
    ]);

    // chronological, parsed timestamps
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i].createdAt).toBeGreaterThan(messages[i - 1].createdAt);
    }
  });

  it('failNextLoad rejects once, then clears itself', async () => {
    mockApiConfig.failNextLoad = true;
    await expect(
      settle(mockConversationApi.fetchConversation(), mockApiConfig.loadLatencyMs),
    ).rejects.toBeInstanceOf(ConversationApiError);
    expect(mockApiConfig.failNextLoad).toBe(false);

    const messages = await settle(
      mockConversationApi.fetchConversation(),
      mockApiConfig.loadLatencyMs,
    );
    expect(messages).toHaveLength(5);
  });

  it('emptyNextLoad returns [] once, then clears itself', async () => {
    mockApiConfig.emptyNextLoad = true;
    expect(
      await settle(mockConversationApi.fetchConversation(), mockApiConfig.loadLatencyMs),
    ).toEqual([]);
    expect(mockApiConfig.emptyNextLoad).toBe(false);
    expect(
      await settle(mockConversationApi.fetchConversation(), mockApiConfig.loadLatencyMs),
    ).toHaveLength(5);
  });
});

describe('sendMessage', () => {
  beforeEach(() => {
    mockApiConfig.sendFailureRate = 0;
  });

  const send = (clientId: string) =>
    settle(
      mockConversationApi.sendMessage({ clientId, text: 'hi' }),
      mockApiConfig.sendLatencyMs,
    );

  it('resolves an ai message whose replyToId equals the clientId', async () => {
    const reply = await send('u_123');
    expect(reply.type).toBe('ai');
    expect(reply.replyToId).toBe('u_123');
    expect(typeof reply.id).toBe('string');
    expect(reply.id).not.toBe('u_123');
    expect(reply.createdAt).toBe(Date.now());
  });

  it('cycles through the canned replies', async () => {
    const r1 = await send('u1');
    const r2 = await send('u2');
    const r3 = await send('u3');
    const r4 = await send('u4');

    expect(r1.recommendations!.map(r => r.type)).toEqual(['tarot', 'promotion', 'article']);
    // extra fields on recommendations survive normalization
    expect(r1.recommendations![1]).toMatchObject({ discountPct: 20, code: 'SATURN20' });

    // second canned reply carries an unknown "meditation" type for the fallback card
    expect(r2.recommendations!.map(r => r.type)).toEqual([
      'consultation',
      'gemstone',
      'meditation',
    ]);

    // third canned reply has no recommendations
    expect(r3.recommendations).toBeUndefined();

    // wraps back to the first
    expect(r4.text).toBe(r1.text);
    expect(new Set([r1.id, r2.id, r3.id, r4.id]).size).toBe(4);
  });

  it('failNextSend rejects once and does not advance the reply cursor', async () => {
    mockApiConfig.failNextSend = true;
    await expect(send('u1')).rejects.toBeInstanceOf(ConversationApiError);
    expect(mockApiConfig.failNextSend).toBe(false);

    const r = await send('u1');
    expect(r.recommendations!.map(x => x.type)).toEqual(['tarot', 'promotion', 'article']);
  });

  it('sendFailureRate 1 always rejects', async () => {
    mockApiConfig.sendFailureRate = 1;
    await expect(send('u1')).rejects.toThrow('Could not reach the astrologer service');
  });
});
