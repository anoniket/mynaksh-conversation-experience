import type { Recommendation } from '../../recommendations/types';
import type { ApiMessage, ApiRecommendation, Message } from './types';

const KNOWN_MESSAGE_TYPES = new Set(['user', 'ai', 'human', 'system']);

function toRecommendation(r: ApiRecommendation): Recommendation {
  return { ...r } as Recommendation;
}

/**
 * Wire -> domain. Backfills `createdAt` when missing and downgrades message
 * types we do not know into system events instead of dropping them.
 */
export function normalizeMessage(
  dto: ApiMessage,
  fallbackCreatedAt: number,
): Message {
  const createdAt = dto.createdAt
    ? new Date(dto.createdAt).getTime()
    : fallbackCreatedAt;
  const type = KNOWN_MESSAGE_TYPES.has(dto.type) ? dto.type : 'system';

  switch (type) {
    case 'user':
      return { id: dto.id, type, text: dto.text, createdAt, status: 'sent' };
    case 'ai':
      return {
        id: dto.id,
        type,
        text: dto.text,
        createdAt,
        recommendations: dto.recommendations?.map(toRecommendation),
      };
    case 'human':
      return {
        id: dto.id,
        type,
        text: dto.text,
        createdAt,
        authorName: dto.authorName,
      };
    default:
      return { id: dto.id, type: 'system', text: dto.text, createdAt };
  }
}

export function normalizeConversation(dtos: ApiMessage[]): Message[] {
  const base = Date.now() - dtos.length * 60_000;
  return dtos.map((dto, i) => normalizeMessage(dto, base + i * 60_000));
}
