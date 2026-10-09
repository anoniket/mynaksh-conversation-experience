# MyNaksh AI Conversation Experience

A React Native (CLI) chat screen where AI replies can carry a horizontally scrolling rail of
**recommendation experiences** (gemstone, tarot, consultation, article, promotion, and types that do not exist yet).
Built for the MyNaksh SDE2/3 machine-coding assignment.

> Mock backend by default. Optional live Claude replies through a tiny local proxy (see **Live AI mode**).

## Quick start

```bash
npm install
# iOS
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
# Android
npm run android
# Tests / types / lint
npm test
npx tsc --noEmit
npm run lint
```

A ⚙︎ button (dev builds only) forces every loading, empty, error and failed-send state so each flow is easy to demo.

## Project structure

```
src/
  app/
    config.ts                 mock vs live switch, proxy URL
    navigation/RootNavigator  one native-stack route
    theme/                    design tokens (colors, spacing, radius, typography)
  features/
    conversation/             everything about the chat itself
      api/                    ConversationApi interface + mock and remote implementations
      model/                  types, zustand store, selectors, pure timeline builder (grouping + date separators)
      components/             list, message rows & bubbles, composer, reply preview, actions sheet, feedback, states
      hooks/                  useAutoScroll
      screens/                ConversationScreen
    recommendations/          everything about the cards (the framework)
      types.ts                RecommendationBase + per-type shapes + RecommendationDefinition
      registry.ts             type -> definition lookup with an unknown-type fallback
      actions.ts              single dispatch point for card taps (Alert today, navigation/analytics tomorrow)
      RecommendationRail.tsx  horizontal rail; resolves each card through the registry
      cards/                  BaseCard + one file per experience + UnknownCard + index.ts (registration)
  shared/                     small UI primitives and utils (date, id)
  dev/DevPanel.tsx            dev-only state forcing
server/                       optional Claude proxy (keeps the API key off the device)
__tests__/                    unit tests (grouping, registry, normalisation, store, mock API) + screen integration test
```

Feature-first: `conversation` and `recommendations` are independent. The only link is that the AI bubble renders
`RecommendationRail`. The rail only knows the registry. A new experience never touches chat code.

## Component architecture

```
ConversationScreen
 ├─ LoadingState | ErrorState | EmptyState          (by store.status)
 ├─ ConversationList (FlashList, inverted)
 │    ├─ DateSeparator
 │    └─ MessageRow ──► messageRenderers[type]
 │          ├─ UserBubble  ──► MessageStatus (Sending… / Sent / Failed · Retry)
 │          ├─ AiBubble    ──► RecommendationRail ──► registry[type].Card ?? BaseCard
 │          │                  └─ FeedbackBar (👍 👎 + reason chips)
 │          ├─ HumanBubble
 │          └─ SystemEvent
 ├─ Composer ──► ReplyPreview
 ├─ MessageActionsSheet (Reply / Copy / Delete, from messageActions.ts)
 └─ DevPanel
```

- **Two registries, one pattern.** Message types resolve through `messageRenderers`, recommendation types through
  the recommendation registry. Same shape, same fallback discipline.
- **Group position** (`single | first | middle | last`) is computed once in the timeline builder and passed down
  as a primitive, so bubbles decide avatar/name visibility and corner radii without looking at neighbours.
- **Capabilities per message type** live in one place (`messageActions.ts`): which actions a long-press offers.

## State management: Zustand, normalised

```
status | errorMessage | byId{id→Message} | order[id] | replyToId | feedback{id→{vote,reasons}} | isAssistantTyping
```

- **Normalised** so a status flip or a feedback tap is an O(1) write to one record.
- **Per-row subscriptions**: a row calls `useMessage(id)` and re-renders only when *its* message changes. Feedback
  is keyed by message id, so a 👍 re-renders one row, not the list.
- **Optimistic send**: the user message is inserted immediately with `status: 'sending'` and a client id; the
  same id is kept on retry, so the row never remounts or flickers.
- **Delete** removes the id from `order` and `byId`; combined with an inverted list and
  `maintainVisibleContentPosition`, the viewport does not jump.
- **Why not Redux Toolkit / Context**: RTK is the right call at team scale (devtools, middleware, RTK Query); the
  store shape here migrates mechanically. Context re-renders every consumer on every update, which is wrong for
  a long list with per-row interactive state.
- The store is a factory (`createConversationStore(api)`), so tests inject a fake API and the app chooses mock
  vs remote from `app/config.ts`.

## Recommendation rendering strategy (the framework)

```ts
registerRecommendation({
  type: 'gemstone', label: 'Gemstone', icon: '💎', accent: '#3B82F6',
  Card: GemstoneCard,                       // optional: omit to get BaseCard with this config
  onPress: (rec, ctx) => ctx.alert(rec.title, rec.subtitle),
});
```

- `RecommendationRail` maps each item through `resolveRecommendation(rec.type)` and renders `def.Card ?? BaseCard`.
- **Unknown types never crash.** The backend will ship new experiences before the app updates; they render through
  `UnknownCard` with their title/subtitle. The mock's second AI reply includes a `meditation` type to show this.
- **Two tiers of extension**: config-only (icon, accent, cta, onPress) on top of `BaseCard`, or a custom `Card`.
- **One dispatch point** (`actions.ts`): every tap goes through `handleRecommendationPress`, so analytics, deep links
  or navigation are a one-line change in one file.
- **Per-card error boundary**: a broken card degrades to a small fallback, not a broken message.
- Types are a discriminated union for known shapes plus an open `RecommendationBase` so unseen data still type-checks.

**Adding a type**: (1) optionally create `cards/PanchangCard.tsx`, (2) add one `registerRecommendation` call in
`cards/index.ts`. Nothing else changes.

## Performance considerations

- `FlashList` with cell recycling; `getItemType` keeps a separate recycle pool per message type and date rows.
- Inverted list: newest at offset 0, auto-scroll is `scrollToOffset(0)`. Auto-scroll only when the user sent the
  message or is already near the bottom; otherwise a "New messages" pill, so incoming replies never yank the user.
- Timeline (date separators + grouping) is a memoised pure function of `order`/`byId`, never recomputed per row.
- Rows and cards are `React.memo` with primitive props and stable callbacks.
- Reanimated layout/enter animations run on the UI thread; no JS-driven animation loops.
- Stable keys including the optimistic client id, so `sending → sent` does not remount.

## Live AI mode (optional)

```bash
cd server && cp .env.example .env   # add ANTHROPIC_API_KEY
npm install && npm start            # http://localhost:8787
```
Set `useLlm: true` in `src/app/config.ts`. The proxy asks Claude for **structured output** (`{ text, recommendations[] }`)
validated with Zod, and may return experience types the app has never seen; the registry's fallback card handles them.
The app never holds the key; in production the proxy is simply the real MyNaksh backend.

## Trade-offs made for the 3-hour window

- No persistence/offline queue (would add MMKV for `byId/order` and a retry queue for failed sends).
- No pagination (`onEndReached` on the inverted list would call `loadOlder`).
- Canned AI replies in mock mode; live mode is non-streaming (a `streaming` status on `AiMessage` is the next step).
- Custom bottom sheet instead of a library, to avoid native-module risk.
- Card taps show `Alert` as the brief allows; the dispatcher is ready for real routes.
- Minimal accessibility labels; no i18n; single dark theme.
- Tests cover pure logic, the store, and one screen-level integration test (load → cards → send → retry →
  feedback → long-press → delete → reply) with React Native Testing Library; no snapshot tests.
