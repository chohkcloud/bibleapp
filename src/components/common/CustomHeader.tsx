import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
  rightButton?: {
    text: string;
    onPress: () => void;
  };
  rightComponent?: ReactNode;
}

export function CustomHeader({
  title,
  showBackButton = true,
  backButtonText = '← 뒤로',
  rightButton,
  rightComponent,
}: CustomHeaderProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, {
      paddingTop: insets.top > 0 ? 4 : 4,
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
    }]}>
      {/* 왼쪽: 뒤로 버튼 */}
      <View style={styles.leftContainer}>
        {showBackButton && navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              {backButtonText}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* 중앙: 타이틀 */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      {/* 오른쪽: 커스텀 버튼 */}
      <View style={styles.rightContainer}>
        {rightButton ? (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={rightButton.onPress}
          >
            <Text style={[styles.rightButtonText, { color: colors.primary }]}>
              {rightButton.text}
            </Text>
          </TouchableOpacity>
        ) : rightComponent ? (
          rightComponent
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    flex: 2,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightButton: {
    paddingVertical: 8,
    paddingLeft: 12,
  },
  rightButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    width: 60,
  },
});
