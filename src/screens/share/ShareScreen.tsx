import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BibleStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { Button, CustomHeader } from '../../components/common';
import { SafeContainer } from '../../components/layout';

type Props = NativeStackScreenProps<BibleStackParamList, 'Share'>;

// 공유 템플릿 타입
type TemplateType = 'simple' | 'card' | 'memo';

export function ShareScreen({ route, navigation }: Props) {
  const { verseId, verseText } = route.params;
  const { colors } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('simple');
  const [isSharing, setIsSharing] = useState(false);

  // 템플릿별 텍스트 생성
  const generateShareText = (): string => {
    switch (selectedTemplate) {
      case 'simple':
        return `"${verseText}"\n\n- ${verseId}`;
      case 'card':
        return `📖 오늘의 말씀\n\n"${verseText}"\n\n${verseId}\n\n#성경 #말씀묵상 #BibleApp`;
      case 'memo':
        return `📖 ${verseId}\n\n"${verseText}"\n\n💭 묵상:\n[여기에 묵상을 적어보세요]\n\n- BibleApp`;
      default:
        return verseText;
    }
  };

  // 공유 실행
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareText = generateShareText();
      const result = await Share.share({
        message: shareText,
        title: `${verseId} - BibleApp`,
      });

      if (result.action === Share.sharedAction) {
        // 공유 성공
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('오류', '공유에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      const shareText = generateShareText();
      await Clipboard.setStringAsync(shareText);
      Alert.alert('복사됨', '텍스트가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  // 템플릿 버튼
  const TemplateButton = ({
    type,
    label,
    icon,
  }: {
    type: TemplateType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <TouchableOpacity
      style={[
        styles.templateButton,
        { borderColor: colors.border },
        selectedTemplate === type && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
      ]}
      onPress={() => setSelectedTemplate(type)}
    >
      <Ionicons
        name={icon}
        size={24}
        color={selectedTemplate === type ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.templateLabel,
          { color: selectedTemplate === type ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 템플릿 선택 */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>템플릿 선택</Text>
        <View style={styles.templateRow}>
          <TemplateButton type="simple" label="심플" icon="document-text-outline" />
          <TemplateButton type="card" label="카드" icon="card-outline" />
          <TemplateButton type="memo" label="묵상" icon="create-outline" />
        </View>

        {/* 미리보기 */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>미리보기</Text>
        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.previewText, { color: colors.text }]}>
            {generateShareText()}
          </Text>
        </View>

        {/* 공유 버튼들 */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSharing ? '공유 중...' : '공유하기'}
            onPress={handleShare}
            disabled={isSharing}
            style={styles.button}
          />
          <Button
            title="텍스트 복사"
            onPress={handleCopy}
            variant="outline"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  templateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  templateLabel: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    minHeight: 150,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    marginBottom: 12,
  },
});
