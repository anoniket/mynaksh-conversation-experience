import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildTimeline } from './grouping';
import { useConversationStore } from './store';
import type { Message, MessageFeedback, TimelineItem } from './types';

const EMPTY_FEEDBACK: MessageFeedback = { vote: null, reasons: [] };

/** One row, one subscription. Changing another message does not re-render this one. */
export function useMessage(id: string): Message | undefined {
  return useConversationStore(s => s.byId[id]);
}

export function useFeedback(id: string): MessageFeedback {
  return useConversationStore(s => s.feedback[id] ?? EMPTY_FEEDBACK);
}

export function useReplyTarget(): Message | null {
  return useConversationStore(s => (s.replyToId ? s.byId[s.replyToId] ?? null : null));
}

/**
 * Chronological timeline items. Recomputed only when order/byId change, never per row.
 * Returned in chronological order; the list reverses for the inverted FlashList.
 */
export function useTimelineItems(): TimelineItem[] {
  const { order, byId } = useConversationStore(
    useShallow(s => ({ order: s.order, byId: s.byId })),
  );
  return useMemo(() => {
    const messages = order.map(id => byId[id]).filter(Boolean) as Message[];
    return buildTimeline(messages);
  }, [order, byId]);
}

export function useConversationStatus() {
  return useConversationStore(
    useShallow(s => ({
      status: s.status,
      errorMessage: s.errorMessage,
      isEmpty: s.order.length === 0,
    })),
  );
}
