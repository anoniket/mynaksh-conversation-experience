import {
  buildTimeline,
  GROUP_WINDOW_MS,
} from '../src/features/conversation/model/grouping';
import type {
  Message,
  TimelineItem,
} from '../src/features/conversation/model/types';

// All timestamps are built in local time so day boundaries are TZ-independent.
const at = (day: number, hour: number, minute: number, second = 0) =>
  new Date(2026, 9, day, hour, minute, second).getTime();

const NOW = at(9, 18, 0); // 9 Oct 2026, 18:00 local

let seq = 0;
function msg(
  type: Message['type'],
  createdAt: number,
  extra: Record<string, unknown> = {},
): Message {
  seq += 1;
  const base = { id: `m${seq}`, text: `text ${seq}`, createdAt };
  switch (type) {
    case 'user':
      return { ...base, type, status: 'sent', ...extra } as Message;
    case 'human':
      return { ...base, type, authorName: 'Meera', ...extra } as Message;
    default:
      return { ...base, type, ...extra } as Message;
  }
}

const positions = (items: TimelineItem[]) =>
  items.flatMap(i => (i.kind === 'message' ? [i.position] : []));

const dates = (items: TimelineItem[]) =>
  items.flatMap(i => (i.kind === 'date' ? [i] : []));

beforeEach(() => {
  seq = 0;
});

describe('buildTimeline', () => {
  it('returns [] for empty input', () => {
    expect(buildTimeline([], NOW)).toEqual([]);
  });

  it('inserts exactly one date item per calendar day, in chronological order', () => {
    const messages = [
      msg('user', at(7, 9, 0)),
      msg('ai', at(7, 9, 1)),
      msg('user', at(8, 23, 59)),
      msg('ai', at(9, 0, 1)),
      msg('user', at(9, 10, 0)),
    ];
    const items = buildTimeline(messages, NOW);

    expect(items.map(i => i.kind)).toEqual([
      'date',
      'message',
      'message',
      'date',
      'message',
      'date',
      'message',
      'message',
    ]);
    expect(dates(items).map(d => d.dayKey)).toEqual([
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
    ]);
    expect(dates(items).map(d => d.id)).toEqual([
      'date_2026-10-07',
      'date_2026-10-08',
      'date_2026-10-09',
    ]);
    // message items keep input order and reference the source ids
    expect(
      items.flatMap(i => (i.kind === 'message' ? [i.messageId] : [])),
    ).toEqual(messages.map(m => m.id));
    expect(items[1]).toMatchObject({ id: 'msg_m1', messageId: 'm1' });
  });

  it('labels today as "Today" and the previous day as "Yesterday" relative to `now`', () => {
    const items = buildTimeline(
      [msg('user', at(7, 12, 0)), msg('user', at(8, 12, 0)), msg('user', at(9, 0, 0))],
      NOW,
    );
    const labels = dates(items).map(d => d.label);
    expect(labels[1]).toBe('Yesterday');
    expect(labels[2]).toBe('Today');
    expect(labels[0]).not.toMatch(/Today|Yesterday/);
  });

  it('marks a lone message as single', () => {
    expect(positions(buildTimeline([msg('ai', at(9, 10, 0))], NOW))).toEqual([
      'single',
    ]);
  });

  it('marks 3 consecutive AI messages within 5 min as first/middle/last', () => {
    const items = buildTimeline(
      [msg('ai', at(9, 10, 0)), msg('ai', at(9, 10, 2)), msg('ai', at(9, 10, 4))],
      NOW,
    );
    expect(positions(items)).toEqual(['first', 'middle', 'last']);
  });

  it('treats a gap of exactly the window as grouped, and > window as a break', () => {
    const t0 = at(9, 10, 0);
    expect(
      positions(buildTimeline([msg('ai', t0), msg('ai', t0 + GROUP_WINDOW_MS)], NOW)),
    ).toEqual(['first', 'last']);
    expect(
      positions(
        buildTimeline([msg('ai', t0), msg('ai', t0 + GROUP_WINDOW_MS + 1)], NOW),
      ),
    ).toEqual(['single', 'single']);
  });

  it('breaks a group when the gap exceeds 5 min', () => {
    const items = buildTimeline(
      [
        msg('ai', at(9, 10, 0)),
        msg('ai', at(9, 10, 1)),
        msg('ai', at(9, 10, 7)), // 6 min gap
        msg('ai', at(9, 10, 8)),
      ],
      NOW,
    );
    expect(positions(items)).toEqual(['first', 'last', 'first', 'last']);
  });

  it('breaks a group when the type changes', () => {
    const items = buildTimeline(
      [
        msg('user', at(9, 10, 0)),
        msg('user', at(9, 10, 1)),
        msg('ai', at(9, 10, 2)),
        msg('user', at(9, 10, 3)),
      ],
      NOW,
    );
    expect(positions(items)).toEqual(['first', 'last', 'single', 'single']);
  });

  it('breaks a group when the day changes, even within 5 min', () => {
    const items = buildTimeline(
      [msg('ai', at(8, 23, 58)), msg('ai', at(8, 23, 59)), msg('ai', at(9, 0, 1))],
      NOW,
    );
    expect(items.map(i => (i.kind === 'date' ? 'date' : i.position))).toEqual([
      'date',
      'first',
      'last',
      'date',
      'single',
    ]);
  });

  it('breaks human groups when authorName differs, groups when it matches', () => {
    const items = buildTimeline(
      [
        msg('human', at(9, 10, 0), { authorName: 'Meera' }),
        msg('human', at(9, 10, 1), { authorName: 'Meera' }),
        msg('human', at(9, 10, 2), { authorName: 'Ravi' }),
        msg('human', at(9, 10, 3), { authorName: 'Ravi' }),
      ],
      NOW,
    );
    expect(positions(items)).toEqual(['first', 'last', 'first', 'last']);
  });

  it('never groups system messages', () => {
    const items = buildTimeline(
      [
        msg('system', at(9, 10, 0)),
        msg('system', at(9, 10, 0, 10)),
        msg('system', at(9, 10, 0, 20)),
      ],
      NOW,
    );
    expect(positions(items)).toEqual(['single', 'single', 'single']);
  });

  it('a system message between two AI messages breaks their group', () => {
    const items = buildTimeline(
      [msg('ai', at(9, 10, 0)), msg('system', at(9, 10, 1)), msg('ai', at(9, 10, 2))],
      NOW,
    );
    expect(positions(items)).toEqual(['single', 'single', 'single']);
  });
});
