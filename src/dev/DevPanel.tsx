/**
 * DEV-ONLY tooling. Never ships: renders null unless __DEV__.
 * Flips mockApiConfig knobs so every loading / empty / error / failed-send state can be forced on camera.
 */
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../app/theme';
import { mockApiConfig } from '../features/conversation/api/mockConversationApi';
import { useConversationStore } from '../features/conversation/model/store';
import { getRegisteredTypes } from '../features/recommendations/registry';
import { Chip } from '../shared/ui/Chip';

type BooleanKnob = 'failNextLoad' | 'emptyNextLoad' | 'failNextSend';

const BOOLEAN_KNOBS: { key: BooleanKnob; label: string }[] = [
  { key: 'failNextLoad', label: 'Fail next load' },
  { key: 'emptyNextLoad', label: 'Empty next load' },
  { key: 'failNextSend', label: 'Fail next send' },
];

const FAILURE_RATES = [0, 0.25, 1] as const;

/** Rough clearance so the gear floats above a single-line composer. */
const COMPOSER_CLEARANCE = 72;

export const DevPanel: React.FC = () => {
  if (!__DEV__) {
    return null;
  }
  return <DevPanelInner />;
};

const DevPanelInner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  // mockApiConfig is a plain mutable object (one-shot flags reset themselves inside the mock),
  // so we bump a counter to re-read it on every interaction.
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  const toggle = (key: BooleanKnob) => {
    mockApiConfig[key] = !mockApiConfig[key];
    refresh();
  };

  const setRate = (rate: number) => {
    mockApiConfig.sendFailureRate = rate;
    refresh();
  };

  const reload = () => {
    useConversationStore.getState().load();
    setOpen(false);
  };

  const resetStore = () => {
    const store = useConversationStore.getState();
    store.reset();
    store.load();
    setOpen(false);
  };

  const types = getRegisteredTypes();

  return (
    <>
      <Pressable
        onPress={openPanel}
        accessibilityRole="button"
        accessibilityLabel="Open developer panel"
        style={[
          styles.fab,
          {
            bottom: insets.bottom + COMPOSER_CLEARANCE,
            right: spacing.md + insets.right,
          },
        ]}
      >
        <Text style={styles.fabGlyph}>⚙︎</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        statusBarTranslucent
        animationType="fade"
        onShow={refresh}
        onRequestClose={closePanel}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={closePanel}
          accessibilityRole="button"
          accessibilityLabel="Close developer panel"
        />
        <View
          style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]}
          accessibilityViewIsModal
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Dev panel (mock API)</Text>

            <Text style={styles.section}>One-shot flags</Text>
            <View style={styles.wrap}>
              {BOOLEAN_KNOBS.map(k => (
                <Chip
                  key={k.key}
                  label={`${mockApiConfig[k.key] ? '☑' : '☐'} ${k.label}`}
                  selected={mockApiConfig[k.key]}
                  tone={mockApiConfig[k.key] ? 'danger' : 'default'}
                  onPress={() => toggle(k.key)}
                />
              ))}
            </View>

            <Text style={styles.section}>Send failure rate</Text>
            <View style={styles.wrap}>
              {FAILURE_RATES.map(rate => (
                <Chip
                  key={rate}
                  label={`${Math.round(rate * 100)}%`}
                  selected={mockApiConfig.sendFailureRate === rate}
                  onPress={() => setRate(rate)}
                />
              ))}
            </View>

            <Text style={styles.section}>Conversation</Text>
            <View style={styles.wrap}>
              <Chip label="Reload conversation" onPress={reload} />
              <Chip label="Reset store" tone="danger" onPress={resetStore} />
            </View>

            <Text style={styles.section}>Registered recommendation types</Text>
            {types.length === 0 ? (
              <Text style={styles.mono}>(none registered)</Text>
            ) : (
              types.map(t => (
                <Text key={t} style={styles.mono}>
                  • {t}
                </Text>
              ))
            )}

            <Pressable
              onPress={closePanel}
              accessibilityRole="button"
              style={styles.closeButton}
            >
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  fabGlyph: {
    color: colors.warning,
    fontSize: 18,
  },
  backdrop: {
    backgroundColor: colors.overlay,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 2,
    borderColor: colors.warning,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.warning,
  },
  section: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mono: {
    ...typography.caption,
    color: colors.text,
    fontFamily: 'Menlo',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  closeLabel: {
    ...typography.label,
    color: colors.text,
  },
});
