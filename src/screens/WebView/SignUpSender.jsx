import React, { useCallback, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';

import colors from '../../config/colors';
import {
  logout,
  authenticated,
  login
} from '../../redux/reducers/authenticationReducer';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { IOS_CLIENT_ID, WEB_CLIENT_ID } from "@env";
import { postData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { showToast, showError } from '../../utils/helpers';
import { setConfig } from '../../services/defaultAxios';



export default function SignUpSender({ route }) {
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const onMessage = useCallback(e => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.type === 'LOGOUT') {
        dispatch(logout());
      }
      if (data?.type === 'google_auth') {
        handleGoogleLogin()
      }
    } catch { }
  }, []);


  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: IOS_CLIENT_ID,
      webClientId: WEB_CLIENT_ID,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }
      const userInfo = await GoogleSignin.signIn();
      const token = await GoogleSignin.getTokens();

      setConfig();
      await new Promise(r => setTimeout(r, 300));

      const response = await postData(
        urls.SOCIALLOGIN,
        {
          access_token: token?.accessToken,
        },
        false,
      );

      if (response?.data?.status) {
        if (response?.data?.data) {
          dispatch(login(response?.data?.data));
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
    } catch (error) {
      showError(error?.message || 'Something went wrong');
    } finally {
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screen}>
        <View style={{ flex: 1 }}>
          <WebView
            key="only-web"
            style={{ flex: 1 }}
            source={{ uri: 'https://s.riderx.me/register' }}
            javaScriptEnabled
            onMessage={onMessage}
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
  },
});
