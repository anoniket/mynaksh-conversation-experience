import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useConversationStore } from '../model/store';

/** How close (px) to the newest message still counts as "at the bottom". */
export const NEAR_BOTTOM_THRESHOLD = 80;

/** The only list capability this hook needs; keeps it decoupled from FlashList's generic ref. */
export interface ScrollableToOffset {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
}

export interface UseAutoScrollParams {
  listRef: RefObject<ScrollableToOffset | null>;
  /** Store's `lastAppendedId`; a change means a message was appended. */
  lastAppendedId: string | null;
}

export interface UseAutoScrollResult {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  showNewMessagesPill: boolean;
  scrollToLatest: () => void;
}

/**
 * Chat auto-scroll policy for an inverted list (offset 0 = newest message):
 * follow new messages when the user sent them or is already near the bottom;
 * otherwise leave the viewport alone and surface a "New messages" pill.
 * Scroll position lives in refs so scrolling never re-renders the list.
 */
export function useAutoScroll({
  listRef,
  lastAppendedId,
}: UseAutoScrollParams): UseAutoScrollResult {
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const pillVisibleRef = useRef(false);
  const isNearBottomRef = useRef(true);
  // Seed with the current value so mounting onto an existing conversation is not treated as an append.
  const prevAppendedIdRef = useRef(lastAppendedId);

  const setPill = useCallback((visible: boolean) => {
    if (pillVisibleRef.current !== visible) {
      pillVisibleRef.current = visible;
      setShowNewMessagesPill(visible);
    }
  }, []);

  const scrollToLatest = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setPill(false);
  }, [listRef, setPill]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nearBottom =
        event.nativeEvent.contentOffset.y <= NEAR_BOTTOM_THRESHOLD;
      isNearBottomRef.current = nearBottom;
      if (nearBottom) {
        setPill(false);
      }
    },
    [setPill],
  );

  useEffect(() => {
    if (lastAppendedId === prevAppendedIdRef.current) {
      return;
    }
    prevAppendedIdRef.current = lastAppendedId;
    if (!lastAppendedId) {
      return;
    }

    // Read imperatively: the policy needs the type once per append, not a subscription.
    const appended = useConversationStore.getState().byId[lastAppendedId];
    const shouldFollow = appended?.type === 'user' || isNearBottomRef.current;
    if (!shouldFollow) {
      setPill(true);
      return;
    }

    // Wait a frame so the new row is laid out (and FlashList has applied its
    // visible-content-position correction) before animating to it.
    const frame = requestAnimationFrame(scrollToLatest);
    return () => cancelAnimationFrame(frame);
  }, [lastAppendedId, scrollToLatest, setPill]);

  return { onScroll, showNewMessagesPill, scrollToLatest };
}
