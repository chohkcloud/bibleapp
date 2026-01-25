import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore } from '../../store';

export function FontSizeScreen() {
  const { colors } = useTheme();
  const { fontSize, setFontSize } = useSettingsStore();

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.preview, { backgroundColor: colors.surface }]}>
        <Text style={[styles.previewText, { color: colors.text, fontSize }]}>
          태초에 하나님이 천지를 창조하시니라
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>작게</Text>
        <Slider
          style={styles.slider}
          minimumValue={12}
          maximumValue={28}
          value={fontSize}
          onValueChange={(value) => setFontSize(Math.round(value))}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>크게</Text>
      </View>

      <Text style={[styles.sizeValue, { color: colors.text }]}>
        현재 크기: {fontSize}pt
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
  sizeValue: {
    textAlign: 'center',
    fontSize: 16,
  },
});
