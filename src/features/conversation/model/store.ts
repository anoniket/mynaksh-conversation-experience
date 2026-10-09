import { create } from 'zustand';
import { createClientId } from '../../../shared/utils/id';
import type { ConversationApi } from '../api/conversationApi';
import { mockConversationApi } from '../api/mockConversationApi';
import type {
  FeedbackReason,
  FeedbackVote,
  LoadStatus,
  Message,
  MessageFeedback,
  UserMessage,
} from './types';

export interface ConversationState {
  status: LoadStatus;
  errorMessage: string | null;
  /** Normalized: O(1) patches, and each row subscribes to its own id. */
  byId: Record<string, Message>;
  /** Chronological ids. The list reverses this for the inverted FlashList. */
  order: string[];
  replyToId: string | null;
  feedback: Record<string, MessageFeedback>;
  isAssistantTyping: boolean;
  /** Bumped whenever a message is appended; the list uses it to decide auto-scroll. */
  lastAppendedId: string | null;

  load: () => Promise<void>;
  send: (text: string) => Promise<void>;
  retry: (messageId: string) => Promise<void>;
  remove: (messageId: string) => void;
  setReplyTo: (messageId: string | null) => void;
  setVote: (messageId: string, vote: FeedbackVote | null) => void;
  toggleReason: (messageId: string, reason: FeedbackReason) => void;
  reset: () => void;
}

const EMPTY_FEEDBACK: MessageFeedback = { vote: null, reasons: [] };

const initialData = {
  status: 'idle' as LoadStatus,
  errorMessage: null,
  byId: {} as Record<string, Message>,
  order: [] as string[],
  replyToId: null,
  feedback: {} as Record<string, MessageFeedback>,
  isAssistantTyping: false,
  lastAppendedId: null,
};

/**
 * Factory so tests can inject a fake API. The app uses the default export below.
 */
export function createConversationStore(api: ConversationApi = mockConversationApi) {
  return create<ConversationState>()((set, get) => {
    // Sends are independent; the indicator stays on until the last one settles.
    let inFlight = 0;
    const setTyping = (delta: number) => {
      inFlight = Math.max(0, inFlight + delta);
      set({ isAssistantTyping: inFlight > 0 });
    };

    const append = (message: Message) =>
      set(s => ({
        byId: { ...s.byId, [message.id]: message },
        order: [...s.order, message.id],
        lastAppendedId: message.id,
      }));

    const patch = (id: string, changes: Partial<Message>) =>
      set(s => {
        const existing = s.byId[id];
        if (!existing) {
          return s;
        }
        return { byId: { ...s.byId, [id]: { ...existing, ...changes } as Message } };
      });

    const deliver = async (message: UserMessage) => {
      patch(message.id, { status: 'sending' });
      setTyping(+1);
      try {
        const reply = await api.sendMessage({
          clientId: message.id,
          text: message.text,
          replyToId: message.replyToId,
        });
        patch(message.id, { status: 'sent' });
        if (get().byId[message.id]) {
          // Only show the reply if the user did not delete the question meanwhile.
          append(reply);
        }
      } catch {
        patch(message.id, { status: 'failed' });
      } finally {
        setTyping(-1);
      }
    };

    return {
      ...initialData,

      async load() {
        set({ status: 'loading', errorMessage: null });
        try {
          const messages = await api.fetchConversation();
          const byId: Record<string, Message> = {};
          for (const m of messages) {
            byId[m.id] = m;
          }
          set({
            status: 'ready',
            byId,
            order: messages.map(m => m.id),
            lastAppendedId: messages.at(-1)?.id ?? null,
            // A fresh conversation has no stale reply target or feedback.
            replyToId: null,
            feedback: {},
          });
        } catch (e) {
          set({
            status: 'error',
            errorMessage: e instanceof Error ? e.message : 'Unable to load conversation.',
          });
        }
      },

      async send(text) {
        const trimmed = text.trim();
        if (!trimmed) {
          return;
        }
        const message: UserMessage = {
          id: createClientId('u'),
          type: 'user',
          text: trimmed,
          createdAt: Date.now(),
          status: 'sending',
          replyToId: get().replyToId ?? undefined,
        };
        set({ replyToId: null });
        append(message); // optimistic
        await deliver(message);
      },

      async retry(messageId) {
        const message = get().byId[messageId];
        if (!message || message.type !== 'user' || message.status !== 'failed') {
          return;
        }
        await deliver(message); // same id: no remount, idempotent on the wire
      },

      remove(messageId) {
        set(s => {
          if (!s.byId[messageId]) {
            return s;
          }
          const byId = { ...s.byId };
          delete byId[messageId];
          const feedback = { ...s.feedback };
          delete feedback[messageId];
          return {
            byId,
            feedback,
            order: s.order.filter(id => id !== messageId),
            replyToId: s.replyToId === messageId ? null : s.replyToId,
          };
        });
      },

      setReplyTo(messageId) {
        set({ replyToId: messageId });
      },

      setVote(messageId, vote) {
        set(s => {
          const current = s.feedback[messageId] ?? EMPTY_FEEDBACK;
          const next: MessageFeedback =
            vote === 'dislike'
              ? { vote, reasons: current.reasons }
              : { vote, reasons: [] }; // like or clearing drops the reasons
          return { feedback: { ...s.feedback, [messageId]: next } };
        });
      },

      toggleReason(messageId, reason) {
        set(s => {
          const current = s.feedback[messageId] ?? EMPTY_FEEDBACK;
          const has = current.reasons.includes(reason);
          const reasons = has
            ? current.reasons.filter(r => r !== reason)
            : [...current.reasons, reason];
          return {
            feedback: { ...s.feedback, [messageId]: { vote: 'dislike', reasons } },
          };
        });
      },

      reset() {
        set({ ...initialData });
      },
    };
  });
}

export const useConversationStore = createConversationStore();
