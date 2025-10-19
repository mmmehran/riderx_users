import React, {useEffect} from 'react';
import {View, StyleSheet, ImageBackground} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import routes from '../../navigation/routes';
import colors from '../../config/colors';

const Splash = props => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate(routes.MAINNAVIGATOR);
      //navigation.navigate(routes.ONBOARDING);
    }, 4000);
  }, []);

  return (
    <View style={styles.container}>
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
