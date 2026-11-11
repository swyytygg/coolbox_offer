import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// 알림 표시 정책 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 웹앱이 배포된 Vercel URL 또는 로컬 개발 서버 URL
const WEBVIEW_URL = process.env.EXPO_PUBLIC_WEBVIEW_URL || 'https://coolbox-global.vercel.app';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 1. 푸시 알림 권한 및 토큰 발급 로직
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!Device.isDevice) {
        console.log('[Push] 푸시 알림은 모바일 실기기에서만 지원됩니다.');
        return;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('[Push] 알림 권한 승인이 거부되었습니다.');
          return;
        }

        // Expo SDK 56에서는 app.json의projectId 설정이 필수적입니다.
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          console.warn('[Push] EAS ProjectId가 app.json에 설정되지 않았습니다.');
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[Push] 발급된 Expo 푸시 토큰:', token);
        setPushToken(token);
      } catch (error) {
        console.error('[Push] 푸시 토큰 획득 중 에러 발생:', error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  // 2. 토큰 전달 함수 (injectJavaScript 이용)
  const sendPushTokenToWebView = (token: string) => {
    if (webViewRef.current) {
      const msg = JSON.stringify({ type: 'REGISTER_PUSH_TOKEN', token });
      const js = `
        (function() {
          try {
            const msgObj = ${msg};
            // Window message 이벤트 발행
            window.postMessage(JSON.stringify(msgObj), "*");
            // 수동으로 MessageEvent 트리거하여 리스너가 감지하도록 보장
            const event = new MessageEvent('message', { data: JSON.stringify(msgObj) });
            window.dispatchEvent(event);
            console.log('[NativeBridge] 푸시 토큰이 웹앱으로 전송되었습니다.');
          } catch (e) {
            console.error('[NativeBridge] 토큰 주입 실패:', e);
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  };

  // 3. 토큰이 발급되었고 웹뷰가 준비되었을 때 전송
  useEffect(() => {
    if (pushToken && isWebViewLoaded) {
      sendPushTokenToWebView(pushToken);
    }
  }, [pushToken, isWebViewLoaded]);

  // 4. 안드로이드 하드웨어 백버튼 처리
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // 백 핸들러 가로채기
      }
      return false; // 기본 동작 수행 (앱 종료)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  // 에러 발생 시 재시도
  const handleReload = () => {
    setLoadError(false);
    setIsWebViewLoaded(false);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: WEBVIEW_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          nativeConfig={{}}
          // 파일 선택 및 카메라 격발 지원 설정
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={['*']}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadEnd={() => {
            setIsWebViewLoaded(true);
          }}
          onError={() => {
            setLoadError(true);
          }}
        />

        {/* 로딩 표시 (웹뷰 로딩 전까지 프리미엄 스피너 표시) */}
        {!isWebViewLoaded && !loadError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#208AEF" />
            <Text style={styles.loadingText}>CoolBox 불러오는 중...</Text>
          </View>
        )}

        {/* 네트워크 에러 등의 오류 발생 시 복구 화면 */}
        {loadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>연결할 수 없습니다</Text>
            <Text style={styles.errorSubtitle}>네트워크 상태를 확인하고 다시 시도해 주세요.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryText}>재시도</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
