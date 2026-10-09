import type { ApiMessage } from '../model/types';

/** The payload from the brief, verbatim, plus createdAt so separators/grouping have data. */
export function buildSeedConversation(now: number = Date.now()): ApiMessage[] {
  const yesterday = now - 24 * 60 * 60 * 1000;
  const at = (base: number, minutesAgo: number) =>
    new Date(base - minutesAgo * 60_000).toISOString();

  return [
    {
      id: '1',
      type: 'system',
      text: 'Your session with AI Astrologer has started.',
      createdAt: at(yesterday, 30),
    },
    {
      id: '2',
      type: 'user',
      text: 'Can you tell me about my career this year?',
      createdAt: at(yesterday, 28),
    },
    {
      id: '3',
      type: 'ai',
      text: 'I can already see a strong Saturn influence in your chart. Based on this, here are a few recommendations that may help you.',
      createdAt: at(yesterday, 27),
      recommendations: [
        { id: '1', type: 'gemstone', title: 'Blue Sapphire', subtitle: 'Recommended for Saturn' },
        { id: '2', type: 'tarot', title: 'Career Tarot Reading' },
        { id: '3', type: 'consultation', title: 'Talk to an Astrologer' },
        { id: '4', type: 'article', title: 'Understanding Saturn Mahadasha' },
      ],
    },
    {
      id: '4',
      type: 'human',
      text: 'I also recommend focusing on your upcoming Jupiter transit.',
      createdAt: at(now, 12),
      authorName: 'Astrologer Meera',
    },
    {
      id: '5',
      type: 'human',
      text: 'Jupiter enters your 10th house next month, which is favourable for recognition at work.',
      createdAt: at(now, 11),
      authorName: 'Astrologer Meera',
    },
  ];
}

/** Canned AI replies cycled after each send. The last one carries an unknown type to prove the fallback. */
export const CANNED_AI_REPLIES: Array<Omit<ApiMessage, 'id' | 'createdAt' | 'type'>> = [
  {
    text: 'Saturn rewards patience. Over the next few months, steady effort will matter more than bold moves. A few things that may support you:',
    recommendations: [
      { id: 'r1', type: 'tarot', title: 'Three-Card Career Spread', subtitle: 'Past, present, future' },
      { id: 'r2', type: 'promotion', title: '20% off your first consultation', subtitle: 'Code SATURN20', discountPct: 20, code: 'SATURN20' },
      { id: 'r3', type: 'article', title: 'How Saturn shapes your work life', readMinutes: 4 },
    ],
  },
  {
    text: 'Your Jupiter transit begins soon. This is a good window for learning and expanding your network.',
    recommendations: [
      { id: 'r4', type: 'consultation', title: 'Jupiter Transit Deep-Dive', subtitle: 'With Astrologer Meera', astrologerName: 'Meera' },
      { id: 'r5', type: 'gemstone', title: 'Yellow Sapphire', subtitle: 'Recommended for Jupiter', planet: 'Jupiter' },
      { id: 'r6', type: 'meditation', title: 'Guru Mantra Meditation', subtitle: 'A new experience type the app has not seen yet' },
    ],
  },
  {
    text: 'Noted. I will keep that in mind for the rest of our session.',
  },
];
