/**
 * Single source of truth for which long-press actions each message type supports.
 * Adding an action (e.g. "Report") is one entry here plus one line in the per-type table.
 */
import type { ConversationState } from '../model/store';
import type { Message, MessageType } from '../model/types';

export interface MessageActionContext {
  message: Message;
  store: ConversationState;
  copyToClipboard: (text: string) => void;
  close: () => void;
}

export interface MessageAction {
  key: 'reply' | 'copy' | 'delete';
  label: string;
  icon: string;
  destructive?: boolean;
  run: (ctx: MessageActionContext) => void;
}

const reply: MessageAction = {
  key: 'reply',
  label: 'Reply',
  icon: '↩︎',
  run: ({ message, store, close }) => {
    store.setReplyTo(message.id);
    close();
  },
};

const copy: MessageAction = {
  key: 'copy',
  label: 'Copy',
  icon: '⧉',
  run: ({ message, copyToClipboard, close }) => {
    copyToClipboard(message.text);
    close();
  },
};

const remove: MessageAction = {
  key: 'delete',
  label: 'Delete',
  icon: '🗑',
  destructive: true,
  run: ({ message, store, close }) => {
    store.remove(message.id);
    close();
  },
};

const ACTIONS_BY_TYPE: Record<MessageType, readonly MessageAction[]> = {
  ai: [reply, copy, remove],
  user: [copy, remove],
  human: [reply, copy],
  system: [],
};

export function getMessageActions(message: Message): MessageAction[] {
  return [...ACTIONS_BY_TYPE[message.type]];
}
