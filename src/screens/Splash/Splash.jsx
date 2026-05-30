import React, { useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Platform } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import routes from '../../navigation/routes';
import colors from '../../config/colors';
import { selectConfig } from '../../redux/reducers/configReducer';
import { isAndroid15Plus } from '../../utils/helpers';

const Splash = props => {
  const navigation = useNavigation();
  const config = useSelector(selectConfig);

  useEffect(() => {
    setTimeout(() => {
      if (config?.seeOnboarding) {
        navigation.navigate(routes.MAINNAVIGATOR);
      } else {
        navigation.navigate(routes.ONBOARDING);
      }
    }, 4000);
  }, []);

  return (
    <View style={[styles.container, isAndroid15Plus && { marginBottom: hp(12) }]}>
      <ImageBackground
        style={{
          width: wp(100),
          height: hp(100),
        }}
        source={require('../../../assets/image/image.png')}></ImageBackground>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.black,
  },
});
