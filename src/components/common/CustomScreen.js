import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  View,
} from 'react-native';
import colors from '../../config/colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const CustomScreen = ({ children }) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.screenBackGround}
      />
      <View style={styles.container}>
        <SafeAreaView style={styles.screen}>{children}</SafeAreaView>
      </View>
    </>
  );
};

export default CustomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginBottom: Platform.OS == 'android' ? hp(6) : 0,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
  },
});
