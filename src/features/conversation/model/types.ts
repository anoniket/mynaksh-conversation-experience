import type { Recommendation } from '../../recommendations/types';

export type MessageType = 'user' | 'ai' | 'human' | 'system';

/** Delivery state for messages the user sent. */
export type MessageStatus = 'sending' | 'sent' | 'failed';

interface BaseMessage {
  id: string;
  text: string;
  /** Epoch ms. Not in the brief's payload; added because date separators and grouping need it. */
  createdAt: number;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  status: MessageStatus;
  replyToId?: string;
}

export interface AiMessage extends BaseMessage {
  type: 'ai';
  recommendations?: Recommendation[];
  replyToId?: string;
}

export interface HumanMessage extends BaseMessage {
  type: 'human';
  authorName?: string;
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
}

export type Message = UserMessage | AiMessage | HumanMessage | SystemMessage;

export type FeedbackVote = 'like' | 'dislike';

export const FEEDBACK_REASONS = [
  { key: 'inaccurate', label: 'Inaccurate' },
  { key: 'too_generic', label: 'Too Generic' },
  { key: 'didnt_help', label: "Didn't Help" },
  { key: 'too_long', label: 'Too Long' },
] as const;

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]['key'];

export interface MessageFeedback {
  vote: FeedbackVote | null;
  reasons: FeedbackReason[];
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Where in a run of consecutive same-sender messages this one sits. Drives avatar/tail/radius. */
export type GroupPosition = 'single' | 'first' | 'middle' | 'last';

export type TimelineItem =
  | { kind: 'date'; id: string; label: string; dayKey: string }
  | { kind: 'message'; id: string; messageId: string; position: GroupPosition };

/* ---- Wire format (what the backend sends). Kept separate from the domain model. ---- */

export interface ApiRecommendation {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  [extra: string]: unknown;
}

export interface ApiMessage {
  id: string;
  type: string;
  text: string;
  createdAt?: string;
  recommendations?: ApiRecommendation[];
  authorName?: string;
}
