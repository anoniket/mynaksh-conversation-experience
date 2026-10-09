import { dayKey, formatDayLabel } from '../../../shared/utils/date';
import type { GroupPosition, Message, TimelineItem } from './types';

export const GROUP_WINDOW_MS = 5 * 60 * 1000;

function sameGroup(a: Message, b: Message): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === 'system') {
    return false; // system events never group
  }
  if (
    a.type === 'human' &&
    b.type === 'human' &&
    a.authorName !== b.authorName
  ) {
    return false;
  }
  if (dayKey(a.createdAt) !== dayKey(b.createdAt)) {
    return false;
  }
  return Math.abs(b.createdAt - a.createdAt) <= GROUP_WINDOW_MS;
}

/**
 * Pure: chronological messages -> chronological timeline items with date
 * separators and group positions. The list component reverses the output for
 * an inverted FlashList; this function knows nothing about that.
 */
export function buildTimeline(
  messages: Message[],
  now: number = Date.now(),
): TimelineItem[] {
  const items: TimelineItem[] = [];
  let lastDay: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const day = dayKey(msg.createdAt);
    if (day !== lastDay) {
      items.push({
        kind: 'date',
        id: `date_${day}`,
        label: formatDayLabel(msg.createdAt, now),
        dayKey: day,
      });
      lastDay = day;
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const joinsPrev = prev ? sameGroup(prev, msg) : false;
    const joinsNext = next ? sameGroup(msg, next) : false;

    let position: GroupPosition = 'single';
    if (joinsPrev && joinsNext) {
      position = 'middle';
    } else if (joinsPrev) {
      position = 'last';
    } else if (joinsNext) {
      position = 'first';
    }

    items.push({ kind: 'message', id: `msg_${msg.id}`, messageId: msg.id, position });
  }

  return items;
}
