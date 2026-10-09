import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../app/theme';
import { useMessage } from '../model/selectors';
import type { GroupPosition } from '../model/types';
import { getMessageRenderer } from './messages/messageRenderers';

export interface MessageRowProps {
  messageId: string;
  position: GroupPosition;
  onLongPress: (id: string) => void;
}

/**
 * One timeline row. Subscribes to exactly one message, resolves its renderer
 * from the registry, and owns group spacing so renderers only style themselves.
 * Props are primitives + a stable callback, so memo skips unrelated updates.
 */
export const MessageRow = React.memo(function MessageRowView({
  messageId,
  position,
  onLongPress,
}: MessageRowProps) {
  const message = useMessage(messageId);
  const handleLongPress = useCallback(
    () => onLongPress(messageId),
    [onLongPress, messageId],
  );

  if (!message) {
    return null; // deleted between timeline rebuild and this render
  }

  const Renderer = getMessageRenderer(message.type);
  const startsGroup = position === 'first' || position === 'single';

  return (
    <View style={startsGroup ? styles.groupStart : styles.groupContinue}>
      <Renderer
        message={message}
        position={position}
        onLongPress={handleLongPress}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  groupStart: {
    paddingTop: spacing.md,
  },
  groupContinue: {
    paddingTop: 3,
  },
});
