import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../app/theme';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useTimelineItems } from '../model/selectors';
import { useConversationStore } from '../model/store';
import type { MessageType, TimelineItem } from '../model/types';
import { DateSeparator } from './DateSeparator';
import { MessageRow } from './MessageRow';
import { TypingIndicator } from './TypingIndicator';

export interface ConversationListProps {
  onLongPressMessage: (messageId: string) => void;
}

/** A timeline item plus its recycling pool key, derived once per timeline change. */
interface ListRow {
  item: TimelineItem;
  type: 'date' | MessageType;
}

const keyExtractor = (row: ListRow) => row.item.id;
const getItemType = (row: ListRow) => row.type;

/**
 * Header of an inverted list renders at the visual bottom, i.e. right under
 * the newest message. It owns its own subscription so typing toggles never
 * re-render the list itself.
 */
function TypingSlot() {
  const isTyping = useConversationStore(s => s.isAssistantTyping);
  return isTyping ? <TypingIndicator /> : null;
}

/**
 * MVCP is on by default in FlashList v2 (it pins minIndexForVisible: 0
 * internally); stated explicitly so deleting a row never jumps the viewport.
 * v2 has no `minIndexForVisible` prop, so this is the supported equivalent.
 */
const MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: false } as const;

/**
 * The chat timeline: an inverted FlashList (index 0 = newest) of date
 * separators and message rows, with chat-style auto-scroll and a
 * "New messages" pill when the user has scrolled up into history.
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  onLongPressMessage,
}) => {
  const listRef = useRef<FlashListRef<ListRow>>(null);
  const items = useTimelineItems();
  const byId = useConversationStore(s => s.byId);
  const lastAppendedId = useConversationStore(s => s.lastAppendedId);

  // Reverse for the inverted list and attach the item type in the same pass.
  // `byId` changes exactly when `items` does, so this adds no extra recomputes.
  const rows = useMemo<ListRow[]>(() => {
    const out: ListRow[] = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      out.push({
        item,
        type:
          item.kind === 'date'
            ? 'date'
            : byId[item.messageId]?.type ?? 'system',
      });
    }
    return out;
  }, [items, byId]);

  // Parents often pass inline callbacks; route through a ref so rows get one
  // stable function for the lifetime of the list and React.memo always holds.
  const onLongPressRef = useRef(onLongPressMessage);
  onLongPressRef.current = onLongPressMessage;
  const handleLongPress = useCallback(
    (messageId: string) => onLongPressRef.current(messageId),
    [],
  );

  const renderItem = useCallback(
    ({ item: row }: ListRenderItemInfo<ListRow>) => {
      const { item } = row;
      if (item.kind === 'date') {
        return <DateSeparator label={item.label} />;
      }
      return (
        <MessageRow
          messageId={item.messageId}
          position={item.position}
          onLongPress={handleLongPress}
        />
      );
    },
    [handleLongPress],
  );

  const { onScroll, showNewMessagesPill, scrollToLatest } = useAutoScroll({
    listRef,
    lastAppendedId,
  });

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        inverted
        maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
        ListHeaderComponent={TypingSlot}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      />
      {showNewMessagesPill ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(160)}
          style={styles.pillContainer}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={scrollToLatest}
            accessibilityRole="button"
            accessibilityLabel="New messages. Scroll to latest"
            hitSlop={8}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Text style={styles.pillText}>New messages ↓</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Inverted: paddingTop sits under the newest message, paddingBottom above the oldest.
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  pillContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.overlay,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  pillText: {
    ...typography.label,
    color: colors.text,
  },
});
