import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore } from '../../store';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;

export function FontSizeScreen() {
  const { colors } = useTheme();
  const { fontSize, setFontSize } = useSettingsStore();

  const decreaseFont = () => {
    if (fontSize > MIN_FONT_SIZE) {
      setFontSize(fontSize - 1);
    }
  };

  const increaseFont = () => {
    if (fontSize < MAX_FONT_SIZE) {
      setFontSize(fontSize + 1);
    }
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.preview, { backgroundColor: colors.surface }]}>
        <Text style={[styles.previewText, { color: colors.text, fontSize }]}>
          태초에 하나님이 천지를 창조하시니라
        </Text>
      </View>

      {/* +/- 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.sizeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={decreaseFont}
          disabled={fontSize <= MIN_FONT_SIZE}
        >
          <Ionicons name="remove" size={28} color={fontSize <= MIN_FONT_SIZE ? colors.textSecondary : colors.primary} />
        </TouchableOpacity>

        <View style={[styles.sizeDisplay, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sizeValue, { color: colors.text }]}>{fontSize}pt</Text>
        </View>

        <TouchableOpacity
          style={[styles.sizeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={increaseFont}
          disabled={fontSize >= MAX_FONT_SIZE}
        >
          <Ionicons name="add" size={28} color={fontSize >= MAX_FONT_SIZE ? colors.textSecondary : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 슬라이더 */}
      <View style={styles.sliderContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>작게</Text>
        <Slider
          style={styles.slider}
          minimumValue={MIN_FONT_SIZE}
          maximumValue={MAX_FONT_SIZE}
          step={1}
          value={fontSize}
          onValueChange={(value) => setFontSize(Math.round(value))}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>크게</Text>
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        +/- 버튼 또는 슬라이더로 조절하세요
      </Text>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  preview: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  previewText: {
    lineHeight: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sizeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeDisplay: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  sizeValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
});
