import React from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import {WebView} from 'react-native-webview';
import colors from '../../config/colors';

export default function Sender() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screen}>
        <View style={{flex: 1}}>
          <WebView
            key="only-web"
            style={{flex: 1}}
            source={{uri: 'https://p3.riderx.me'}}
            javaScriptEnabled
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
