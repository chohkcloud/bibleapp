import React, { useCallback } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface VerseTextProps {
  text: string;
  verseNum: number;
  fontSize?: number;
  onWordPress?: (word: string, wordIndex: number) => void;
  highlightedWord?: string;
  showVerseNum?: boolean;
  style?: TextStyle;
}

export function VerseText({
  text,
  verseNum,
  fontSize = 16,
  onWordPress,
  highlightedWord,
  showVerseNum = true,
  style,
}: VerseTextProps) {
  const { colors } = useTheme();

  // 텍스트를 단어 단위로 분리 (공백 포함)
  const parts = text.split(/(\s+)/);

  const handleWordPress = useCallback(
    (word: string, index: number) => {
      // 공백이 아닌 단어만 처리
      if (word.trim() && onWordPress) {
        onWordPress(word.trim(), index);
      }
    },
    [onWordPress]
  );

  // 단어 인덱스 계산 (공백 제외)
  let wordIndex = 0;

  return (
    <Text style={[styles.container, { fontSize }, style]}>
      {showVerseNum && (
        <Text style={[styles.verseNum, { color: colors.primary, fontSize: fontSize * 0.75 }]}>
          {verseNum}{' '}
        </Text>
      )}
      {parts.map((part, index) => {
        const isSpace = /^\s+$/.test(part);
        const currentWordIndex = wordIndex;

        if (!isSpace) {
          wordIndex++;
        }

        if (isSpace) {
          return <Text key={index}>{part}</Text>;
        }

        const isHighlighted =
          highlightedWord && part.trim().toLowerCase() === highlightedWord.toLowerCase();

        return (
          <Text
            key={index}
            onPress={onWordPress ? () => handleWordPress(part, currentWordIndex) : undefined}
            style={[
              styles.word,
              { color: colors.text },
              onWordPress && styles.touchableWord,
              isHighlighted && [styles.highlighted, { backgroundColor: colors.primary + '30' }],
            ]}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    lineHeight: 28,
  },
  verseNum: {
    fontWeight: '700',
  },
  word: {
    // 기본 스타일
  },
  touchableWord: {
    // 터치 가능한 단어 스타일 (시각적 힌트 없음 - 터치 시에만 반응)
  },
  highlighted: {
    borderRadius: 2,
  },
});

export default VerseText;
