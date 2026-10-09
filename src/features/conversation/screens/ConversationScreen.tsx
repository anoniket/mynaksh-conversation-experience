import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../app/theme';
import { DevPanel } from '../../../dev/DevPanel';
import { Composer } from '../components/Composer';
import { ConversationList } from '../components/ConversationList';
import { MessageActionsSheet } from '../components/MessageActionsSheet';
import { EmptyState, ErrorState, LoadingState } from '../components/ScreenState';
import { useConversationStatus } from '../model/selectors';
import { useConversationStore } from '../model/store';

/**
 * The one screen in the app. Owns only screen-level concerns: which state view
 * to show, keyboard avoidance, and which message (if any) has its action sheet
 * open. Everything else lives in focused components below it.
 */
export function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const load = useConversationStore(s => s.load);
  const { status, errorMessage, isEmpty } = useConversationStatus();
  const [actionsFor, setActionsFor] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      load().catch(() => undefined); // store records the error state itself
    }
  }, [status, load]);

  const openActions = useCallback((messageId: string) => setActionsFor(messageId), []);
  const closeActions = useCallback(() => setActionsFor(null), []);

  let body: React.ReactNode;
  if (status === 'idle' || status === 'loading') {
    body = <LoadingState />;
  } else if (status === 'error') {
    body = <ErrorState message={errorMessage ?? undefined} onRetry={load} />;
  } else if (isEmpty) {
    body = <EmptyState />;
  } else {
    body = <ConversationList onLongPressMessage={openActions} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <View style={styles.body}>{body}</View>
      {status === 'ready' ? <Composer /> : null}
      <MessageActionsSheet messageId={actionsFor} onClose={closeActions} />
      <DevPanel />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
});
