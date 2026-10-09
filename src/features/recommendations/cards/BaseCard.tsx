import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../app/theme';
import type {
  RecommendationCardProps,
  RecommendationDefinition,
} from '../types';

/**
 * Tier one of extension: the generic recommendation card.
 *
 * A type registered with config only (label/icon/accent/cta/onPress, no
 * `Card`) renders through `BaseCard` for free. Custom cards (tier two) compose
 * the exported `CardShell` and add a type-specific body via `children`, so all
 * cards share chrome, sizing, pressed state and accessibility.
 */

export const CARD_WIDTH = 200;

type Chrome = Pick<
  RecommendationDefinition,
  'label' | 'icon' | 'accent' | 'cta'
>;

export interface CardShellProps {
  definition: Chrome;
  title: unknown;
  subtitle?: unknown;
  onPress: () => void;
  /** Accent-filled background, for loud cards such as promotions. */
  filled?: boolean;
  /** Type-specific body rendered between the subtitle and the CTA row. */
  children?: ReactNode;
}

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

export const CardShell = React.memo(function CardShellView({
  definition,
  title,
  subtitle,
  onPress,
  filled = false,
  children,
}: CardShellProps) {
  const { label, icon, accent, cta } = definition;
  const safeTitle = asText(title) ?? label;
  const safeSubtitle = asText(subtitle);
  const ink = filled ? colors.background : colors.text;
  const muted = filled ? colors.background : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${safeTitle}`}
      accessibilityHint={cta}
      style={({ pressed }) => [
        styles.card,
        filled && { backgroundColor: accent, borderColor: accent },
        pressed && styles.pressed,
      ]}
    >
      {!filled && <View style={[styles.stripe, { backgroundColor: accent }]} />}
      <View style={styles.header}>
        <View
          style={[styles.iconCircle, { borderColor: filled ? ink : accent }]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text
          style={[styles.eyebrow, { color: filled ? ink : accent }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text style={[styles.title, { color: ink }]} numberOfLines={2}>
        {safeTitle}
      </Text>
      {safeSubtitle ? (
        <Text style={[styles.subtitle, { color: muted }]} numberOfLines={1}>
          {safeSubtitle}
        </Text>
      ) : null}
      {children}
      <View style={styles.spacer} />
      <View style={styles.ctaRow}>
        <Text
          style={[styles.cta, { color: filled ? ink : accent }]}
          numberOfLines={1}
        >
          {cta ?? 'View'}
        </Text>
        <Text style={[styles.chevron, { color: filled ? ink : accent }]}>
          {'›'}
        </Text>
      </View>
    </Pressable>
  );
});

export const BaseCard = React.memo(function BaseCardView({
  recommendation,
  definition,
  onPress,
}: RecommendationCardProps) {
  return (
    <CardShell
      definition={definition}
      title={recommendation.title}
      subtitle={recommendation.subtitle}
      onPress={onPress}
    />
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 172,
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.md + 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: { fontSize: 16 },
  eyebrow: {
    ...typography.caption,
    flexShrink: 1,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { ...typography.label, fontSize: 15, lineHeight: 20 },
  subtitle: { ...typography.caption, marginTop: spacing.xs },
  spacer: { flexGrow: 1, minHeight: spacing.sm },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  cta: { ...typography.label, flexShrink: 1 },
  chevron: { fontSize: 18, lineHeight: 18, marginLeft: spacing.xs },
});
