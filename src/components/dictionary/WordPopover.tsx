import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';

interface WordPopoverProps {
  visible: boolean;
  word: string;
  strongNum?: string;
  onClose: () => void;
  onSearchDictionary: () => void;
  onViewStrong?: () => void;
  onCopyWord?: () => void;
}

export function WordPopover({
  visible,
  word,
  strongNum,
  onClose,
  onSearchDictionary,
  onViewStrong,
  onCopyWord,
}: WordPopoverProps) {
  const { colors, borderRadius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.popover,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              shadowColor: colors.text,
            },
          ]}
        >
          <Text style={[styles.wordText, { color: colors.text }]}>{word}</Text>

          {strongNum && (
            <Text style={[styles.strongNum, { color: colors.primary }]}>
              {strongNum}
            </Text>
          )}

          <View style={styles.divider} />

          {strongNum && onViewStrong && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onViewStrong();
                onClose();
              }}
            >
              <Text style={styles.menuIcon}>📖</Text>
              <Text style={[styles.menuText, { color: colors.text }]}>
                원어 보기
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onSearchDictionary();
              onClose();
            }}
          >
            <Text style={styles.menuIcon}>🔍</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>
              사전에서 찾기
            </Text>
          </TouchableOpacity>

          {onCopyWord && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onCopyWord();
                onClose();
              }}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={[styles.menuText, { color: colors.text }]}>
                복사하기
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={onClose}>
            <Text style={styles.menuIcon}>✕</Text>
            <Text style={[styles.menuText, { color: colors.textSecondary }]}>
              닫기
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popover: {
    minWidth: 200,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  strongNum: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
});

export default WordPopover;
