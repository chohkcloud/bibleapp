// src/components/memo/LinkedText.tsx
// 성경 구절 링크가 포함된 텍스트 렌더링 컴포넌트

import React, { useMemo } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { parseBibleReferences, ParsedBibleRef } from '../../utils/bibleRefParser';

interface LinkedTextProps {
  text: string;
  onRefPress?: (ref: ParsedBibleRef) => void;
  style?: TextStyle | TextStyle[];
}

interface TextSegment {
  type: 'text' | 'link';
  content: string;
  ref?: ParsedBibleRef;
}

export function LinkedText({ text, onRefPress, style }: LinkedTextProps) {
  const { colors } = useTheme();

  const segments = useMemo((): TextSegment[] => {
    if (!text) return [];

    const refs = parseBibleReferences(text);
    if (refs.length === 0) {
      return [{ type: 'text', content: text }];
    }

    const result: TextSegment[] = [];
    let lastIndex = 0;

    for (const ref of refs) {
      // 링크 전 텍스트
      if (ref.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, ref.startIndex),
        });
      }
      // 링크
      result.push({
        type: 'link',
        content: ref.rawText,
        ref,
      });
      lastIndex = ref.endIndex;
    }

    // 마지막 텍스트
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return result;
  }, [text]);

  if (segments.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        if (segment.type === 'link' && segment.ref) {
          return (
            <Text
              key={index}
              style={[styles.link, { color: colors.primary }]}
              onPress={() => onRefPress?.(segment.ref!)}
            >
              {segment.content}
            </Text>
          );
        }
        return <Text key={index}>{segment.content}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default LinkedText;
