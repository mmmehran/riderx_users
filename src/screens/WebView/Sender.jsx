import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  BackHandler,
  ToastAndroid,
  AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import InAppBrowser from 'react-native-inappbrowser-reborn';

import CustomScreen from '../../components/common/CustomScreen';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';
import { getDeepLink, setDeepLinkListener } from '../../utils/deepLinkHolder';
import { trackLogout } from '../../utils/webengage';

export default function Sender({ route }) {
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const webViewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const currentUrl = useRef('direct_login')
  const reservedDeeplink = useRef(getDeepLink())
  const lastBackPress = useRef(0);

  const [webUrl, setWebUrl] = useState('');

  const onMessage = useCallback(
    e => {
      try {
        const data = JSON.parse(e.nativeEvent.data);
        if (data?.type === 'LOGOUT') {
          dispatch(logout());
          trackLogout()
        }
      } catch { }
    },
    [dispatch],
  );
  function toWalletUrl(url) {
    const match = url.match(/^(https?:\/\/[^/?#]+)/);

    if (!match) {
      throw new Error('Invalid URL');
    }

    return `${match[1]}/profile/wallet`;
  }
  const handlePaymentUrl = async url => {
    if (await InAppBrowser.isAvailable()) {
      try {
        const baseLink = user?.social_auth_callback_url ?? ''
        let redirect = ''
        const match = baseLink.match(/^https?:\/\/[^/]+/);
        redirect = match ? match[0] : 'riderxapp://';

        var r = await InAppBrowser.openAuth(url, 'riderxapp://', {
          showTitle: true,
          enableUrlBarHiding: false,
          enableDefaultShare: false,
        });
        handleUrl({ url: r.url ?? ((redirect.startsWith('http') && r.type == 'cancel') ? `${redirect}/payment/cancel` : null) })
        return;
      } catch (err) {
        console.log(err)
      }
    } else {
      Linking.openURL(url);
    }
  };
  const handleUrl = ({ url }) => {
    if (!url) return;
    try {
      const normalizedUrl = url.replace('riderxapp://', 'https://');

      if (
        normalizedUrl.includes('/payment/success') ||
        normalizedUrl.includes('/payment/cancel')
      ) {
        setWebUrl(normalizedUrl);
      } else if (user?.social_auth_callback_url && normalizedUrl.includes('/profile/wallet')) {
        const newUrl = toWalletUrl(user?.social_auth_callback_url)
        if (currentUrl.current.includes('direct_login')) {
          reservedDeeplink.current = newUrl
        } else {
          setWebUrl(newUrl)
        }
      } else {
        Linking.openURL(url).catch(err =>
          console.error('Failed to open deeplink', err),
        );
      }
    } catch (err) {
      console.error(err)
    }
  };

  useEffect(() => {
    if (!user?.social_auth_callback_url) {
      return () => { }
    }
    setWebUrl(user?.social_auth_callback_url ?? '');

    // Process deeplink captured before Sender was ready
    if (reservedDeeplink.current) {
      const pending = reservedDeeplink.current;
      reservedDeeplink.current = null;
      handleUrl({ url: pending });
    }

    // 🔹 Handle cold start
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    // 🔹 WebEngage push deeplinks (via setDeepLink)
    setDeepLinkListener(url => handleUrl({ url }));

    // 🔹 Handle when already open (sometimes unreliable)
    const sub = Linking.addEventListener('url', handleUrl);

    // 🔥 KEY FIX: check again when app resumes
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        const pending = getDeepLink();
        if (pending) handleUrl({ url: pending });
        Linking.getInitialURL().then(url => {
          if (url) handleUrl({ url });
        });
      }
    });

    return () => {
      setDeepLinkListener(null);
      sub.remove();
      appStateSub.remove();
    };
  }, [user?.social_auth_callback_url]);

  // ✅ BACK HANDLER (WebView + Double back exit)
  useEffect(() => {
    const onBackPress = () => {
      // 1. If WebView can go back
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      // 2. Double back to exit
      const now = Date.now();
      if (lastBackPress.current && now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPress.current = now;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => subscription.remove();
  }, []);

  return (
    <CustomScreen>
      <View style={styles.webviewWrap} collapsable={false}>
        {webUrl.length > 0 && (
          <WebView
            ref={webViewRef}
            key={user?.user_id || 'guest'}
            style={styles.webview}
            containerStyle={styles.webviewContainer}
            source={{ uri: webUrl }}
            javaScriptEnabled={true}
            onMessage={onMessage}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={true}
            thirdPartyCookiesEnabled={true}
            domStorageEnabled={true}
            setSupportMultipleWindows={true}
            javaScriptCanOpenWindowsAutomatically={true}
            sharedCookiesEnabled={true}
            bounces={false}
            overScrollMode="never"
            nestedScrollEnabled
            scrollEnabled
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            showsHorizontalScrollIndicator={false}
            injectedJavaScript={PREVENT_WEBVIEW_OVERSCROLL}
            onShouldStartLoadWithRequest={request => {
              if (request.url.includes('vivapayments')) {
                handlePaymentUrl(request.url);
                return false;
              }
              return true;
            }}
            onNavigationStateChange={navState => {
              canGoBackRef.current = navState.canGoBack;
              currentUrl.current = navState.url
              if (reservedDeeplink.current && user?.social_auth_callback_url && !currentUrl.current.includes('direct_login')) {
                setWebUrl(reservedDeeplink.current)
                reservedDeeplink.current = null
              }
            }}
          />
        )}
      </View>
    </CustomScreen>
  );
}

const PREVENT_WEBVIEW_OVERSCROLL = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = 'html, body { overscroll-behavior: none; }';
      document.head.appendChild(style);
    } catch (e) {}
    true;
  })();
`;

const styles = StyleSheet.create({
  webviewWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
