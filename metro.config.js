// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .db 파일을 asset으로 포함
config.resolver.assetExts.push('db');

// 웹에서 네이티브 모듈 무시
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // 웹에서 문제가 되는 네이티브 모듈들을 빈 모듈로 대체
    const nativeModules = [
      'expo-sqlite',
      'expo-secure-store',
      'expo-local-authentication',
      'expo-sharing',
      'expo-file-system',
      'react-native-view-shot',
    ];

    if (nativeModules.some(mod => moduleName === mod || moduleName.startsWith(mod + '/'))) {
      return {
        type: 'empty',
      };
    }
  }

  // 기본 해석 사용
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
