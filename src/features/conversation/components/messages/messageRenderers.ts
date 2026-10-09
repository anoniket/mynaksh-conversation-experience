import type { ComponentType } from 'react';
import type {
  GroupPosition,
  Message,
  MessageType,
} from '../../model/types';
import { AiBubble } from './AiBubble';
import { HumanBubble } from './HumanBubble';
import { SystemEvent } from './SystemEvent';
import { UserBubble } from './UserBubble';

/** Props every message renderer receives. Narrowed per type by the registry below. */
export interface MessageComponentProps<M extends Message = Message> {
  message: M;
  position: GroupPosition;
  onLongPress?: () => void;
}

type MessageOfType<T extends MessageType> = Extract<Message, { type: T }>;

/**
 * Registry: message `type` -> renderer. Same idea as the recommendation
 * registry: the list never switches on type, it asks this map. The mapped
 * type makes it exhaustive, so adding a MessageType without a renderer is a
 * compile error rather than a blank row.
 */
type MessageRendererRegistry = {
  [T in MessageType]: ComponentType<MessageComponentProps<MessageOfType<T>>>;
};

const renderers: MessageRendererRegistry = {
  user: UserBubble,
  ai: AiBubble,
  human: HumanBubble,
  system: SystemEvent,
};

/**
 * Resolves the renderer for a message type. Unknown types (e.g. a stale
 * persisted payload) degrade to the neutral SystemEvent instead of crashing.
 */
export function getMessageRenderer(
  type: string,
): ComponentType<MessageComponentProps> {
  const found = (renderers as Partial<Record<string, unknown>>)[type] ?? SystemEvent;
  // Safe widening: each entry is keyed by its own message type, and callers pass
  // `message.type` for the message they render, so props always match at runtime.
  return found as ComponentType<MessageComponentProps>;
}
