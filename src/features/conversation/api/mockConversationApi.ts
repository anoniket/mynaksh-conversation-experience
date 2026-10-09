import { createClientId } from '../../../shared/utils/id';
import { normalizeConversation, normalizeMessage } from '../model/normalize';
import type { AiMessage, Message } from '../model/types';
import {
  ConversationApiError,
  type ConversationApi,
  type SendMessageInput,
} from './conversationApi';
import { buildSeedConversation, CANNED_AI_REPLIES } from './mockData';

/**
 * Mutable knobs the dev panel flips to force each state for the screen recording.
 * Module-level on purpose: this is a mock.
 */
export const mockApiConfig = {
  loadLatencyMs: 900,
  sendLatencyMs: 1200,
  /** 0..1 chance that a send fails. */
  sendFailureRate: 0.25,
  failNextLoad: false,
  emptyNextLoad: false,
  failNextSend: false,
};

const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

let replyCursor = 0;

export const mockConversationApi: ConversationApi = {
  async fetchConversation(): Promise<Message[]> {
    await delay(mockApiConfig.loadLatencyMs);
    if (mockApiConfig.failNextLoad) {
      mockApiConfig.failNextLoad = false;
      throw new ConversationApiError('Network request failed');
    }
    if (mockApiConfig.emptyNextLoad) {
      mockApiConfig.emptyNextLoad = false;
      return [];
    }
    return normalizeConversation(buildSeedConversation());
  },

  async sendMessage(input: SendMessageInput): Promise<AiMessage> {
    await delay(mockApiConfig.sendLatencyMs);
    const forced = mockApiConfig.failNextSend;
    if (forced || Math.random() < mockApiConfig.sendFailureRate) {
      mockApiConfig.failNextSend = false;
      throw new ConversationApiError('Could not reach the astrologer service');
    }
    const canned = CANNED_AI_REPLIES[replyCursor % CANNED_AI_REPLIES.length];
    replyCursor += 1;
    const reply = normalizeMessage(
      {
        id: createClientId('ai'),
        type: 'ai',
        text: canned.text,
        recommendations: canned.recommendations,
        createdAt: new Date().toISOString(),
      },
      Date.now(),
    ) as AiMessage;
    reply.replyToId = input.clientId;
    return reply;
  },
};

/** Test helper. */
export function __resetMockApi(): void {
  replyCursor = 0;
  mockApiConfig.failNextLoad = false;
  mockApiConfig.emptyNextLoad = false;
  mockApiConfig.failNextSend = false;
}
