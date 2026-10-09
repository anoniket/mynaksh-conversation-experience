/**
 * Integration test: the real screen, real store, real registry, mock API.
 * Walks the Part A + Part B flows end to end without a device.
 */
import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ConversationScreen } from '../src/features/conversation/screens/ConversationScreen';
import { useConversationStore } from '../src/features/conversation/model/store';
import { mockApiConfig, __resetMockApi } from '../src/features/conversation/api/mockConversationApi';
import { ensureRecommendationsRegistered } from '../src/features/recommendations/cards';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 400, height: 900 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ConversationScreen />
    </SafeAreaProvider>,
  );
}

const flush = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  __resetMockApi();
  mockApiConfig.sendFailureRate = 0;
  useConversationStore.getState().reset();
  ensureRecommendationsRegistered();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  mockApiConfig.sendFailureRate = 0.25;
  mockApiConfig.loadLatencyMs = 900;
});

describe('ConversationScreen', () => {
  it('shows loading, then the seeded timeline with recommendation cards', async () => {
    const r = await renderScreen();
    expect(r.getByText(/Loading conversation/)).toBeTruthy();

    await flush(1000);

    expect(r.getByText('Can you tell me about my career this year?')).toBeTruthy();
    expect(r.getByText('Your session with AI Astrologer has started.')).toBeTruthy();
    expect(r.getByText('Blue Sapphire')).toBeTruthy();
    expect(r.getByText('Career Tarot Reading')).toBeTruthy();
    expect(r.getByText('Today')).toBeTruthy();
    expect(r.getByText('Yesterday')).toBeTruthy();
  });

  it('tapping a card dispatches through the registry to an Alert', async () => {
    const r = await renderScreen();
    await flush(1000);
    await fireEvent.press(r.getByText('Blue Sapphire'));
    expect(Alert.alert).toHaveBeenCalled();
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toMatch(/Blue Sapphire/);
  });

  it('error state offers retry; empty state shows the start copy', async () => {
    // Real timers here: RNTL 14's async press awaits settled work, and a
    // timer-gated reload under fake timers would deadlock the act scope.
    jest.useRealTimers();
    mockApiConfig.loadLatencyMs = 5;
    mockApiConfig.failNextLoad = true;

    const r = await renderScreen();
    await waitFor(() => expect(r.getByText(/Unable to load conversation/)).toBeTruthy());

    mockApiConfig.emptyNextLoad = true;
    await fireEvent.press(r.getByText(/Retry/));
    await waitFor(() => expect(r.getByText(/Start your conversation/)).toBeTruthy());
  });

  it('sends optimistically, shows Sending then Sent, and renders the AI reply with an unknown-type fallback card', async () => {
    const r = await renderScreen();
    await flush(1000);

    const input = r.getByPlaceholderText(/Ask your astrologer/);
    await fireEvent.changeText(input, 'What about Jupiter?');
    await fireEvent.press(r.getByLabelText(/send/i));

    expect(r.getByText('What about Jupiter?')).toBeTruthy();
    expect(r.getByText(/Sending/)).toBeTruthy();

    await flush(1300);
    expect(r.queryByText(/Sending/)).toBeNull();
    expect(r.getAllByText(/Sent/).length).toBeGreaterThanOrEqual(2); // seed + ours
    expect(r.getByText(/Saturn rewards patience/)).toBeTruthy();
    expect(r.getByText('20% off your first consultation')).toBeTruthy();

    // second send -> second canned reply carries the unknown "meditation" type
    await fireEvent.changeText(input, 'And my transit?');
    await fireEvent.press(r.getByLabelText(/send/i));
    await flush(1300);
    expect(r.getByText('Guru Mantra Meditation')).toBeTruthy();
  });

  it('a failed send shows Retry and recovers with the same message id', async () => {
    const r = await renderScreen();
    await flush(1000);
    mockApiConfig.failNextSend = true;

    await fireEvent.changeText(r.getByPlaceholderText(/Ask your astrologer/), 'hello');
    await fireEvent.press(r.getByLabelText(/send/i));
    await flush(1300);

    expect(r.getByText(/Failed/)).toBeTruthy();
    const idBefore = useConversationStore.getState().order.at(-1);

    await fireEvent.press(r.getByText(/Retry/));
    await flush(1300);
    expect(r.queryByText(/Failed/)).toBeNull();
    expect(useConversationStore.getState().byId[idBefore!]).toMatchObject({ type: 'user', status: 'sent' });
  });

  it('dislike expands reason chips and records the selection', async () => {
    const r = await renderScreen();
    await flush(1000);

    await fireEvent.press(r.getAllByLabelText(/dislike/i)[0]);
    expect(r.getByText('Inaccurate')).toBeTruthy();
    await fireEvent.press(r.getByText('Too Long'));

    expect(useConversationStore.getState().feedback['3']).toEqual({
      vote: 'dislike',
      reasons: ['too_long'],
    });
  });

  it('long-press on an AI message opens Reply / Copy / Delete; delete removes it', async () => {
    const r = await renderScreen();
    await flush(1000);

    const aiText = /strong Saturn influence/;
    await fireEvent(r.getByText(aiText), 'longPress');
    await waitFor(() => expect(r.getByText('Delete')).toBeTruthy());
    expect(r.getByText('Reply')).toBeTruthy();
    expect(r.getByText('Copy')).toBeTruthy();

    await fireEvent.press(r.getByText('Delete'));
    await flush(500);
    await waitFor(() => expect(r.queryByText(aiText)).toBeNull());
    expect(useConversationStore.getState().order).not.toContain('3');
  });

  it('reply shows a preview above the composer and the sent message quotes it', async () => {
    const r = await renderScreen();
    await flush(1000);

    await fireEvent(r.getByText(/strong Saturn influence/), 'longPress');
    await waitFor(() => expect(r.getByText('Reply')).toBeTruthy());
    await fireEvent.press(r.getByText('Reply'));
    await flush(500);

    expect(r.getByLabelText('Cancel reply')).toBeTruthy(); // preview is up
    await fireEvent.changeText(r.getByPlaceholderText(/Ask your astrologer/), 'thanks');
    await fireEvent.press(r.getByLabelText(/send/i));
    await flush(500); // let the preview's exit animation finish
    expect(r.queryByLabelText('Cancel reply')).toBeNull(); // preview gone
    expect(r.getByText('Replying to AI Astrologer')).toBeTruthy(); // the sent bubble quotes it
    expect(useConversationStore.getState().byId[useConversationStore.getState().order.at(-1)!]).toMatchObject({
      type: 'user',
      replyToId: '3',
    });
  });
});
