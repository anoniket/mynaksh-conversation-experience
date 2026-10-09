import { appConfig } from '../../../app/config';
import { createClientId } from '../../../shared/utils/id';
import { normalizeMessage } from '../model/normalize';
import type { AiMessage, ApiRecommendation, Message } from '../model/types';
import {
  ConversationApiError,
  type ConversationApi,
  type SendMessageInput,
} from './conversationApi';
import { mockConversationApi } from './mockConversationApi';

interface ProxyReply {
  text: string;
  recommendations: ApiRecommendation[];
}

/**
 * Same interface as the mock, backed by ./server (which talks to Claude).
 * Conversation history still loads from the mock seed; only replies are live.
 * Nothing above the ConversationApi boundary knows the difference.
 */
export const remoteConversationApi: ConversationApi = {
  fetchConversation(): Promise<Message[]> {
    return mockConversationApi.fetchConversation();
  },

  async sendMessage(input: SendMessageInput): Promise<AiMessage> {
    let res: Response;
    try {
      res = await fetch(`${appConfig.proxyBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId: input.clientId,
          text: input.text,
          replyToId: input.replyToId,
        }),
      });
    } catch {
      throw new ConversationApiError(
        `Proxy unreachable at ${appConfig.proxyBaseUrl}. Is ./server running?`,
      );
    }
    if (!res.ok) {
      throw new ConversationApiError(`Proxy error ${res.status}`, res.status >= 500);
    }
    const body = (await res.json()) as ProxyReply;
    const reply = normalizeMessage(
      {
        id: createClientId('ai'),
        type: 'ai',
        text: body.text,
        recommendations: body.recommendations,
        createdAt: new Date().toISOString(),
      },
      Date.now(),
    ) as AiMessage;
    reply.replyToId = input.clientId;
    return reply;
  },
};
