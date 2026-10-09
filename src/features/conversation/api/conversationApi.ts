import type { AiMessage, Message } from '../model/types';

export interface SendMessageInput {
  clientId: string;
  text: string;
  replyToId?: string;
}

/**
 * The only thing the store talks to. Mock today; a real HTTP or LLM-backed
 * implementation later satisfies the same interface, so nothing above changes.
 */
export interface ConversationApi {
  fetchConversation(): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<AiMessage>;
}

export class ConversationApiError extends Error {
  constructor(message: string, readonly retryable = true) {
    super(message);
    this.name = 'ConversationApiError';
  }
}
