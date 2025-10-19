import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import routes from '../../navigation/routes';
import {Logo} from '../../../assets/svg/index';
import {version} from '../../../package.json';
import colors from '../../config/colors';

const Splash = props => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate(routes.MAINNAVIGATOR);
    }, 4000);
  }, []);

  return (
    <CustomScreen>
      <View style={styles.container}>
        <Logo width={wp(50)} height={hp(20)} />
      </View>
      <View style={{marginBottom: hp(4), alignItems: 'center'}}>
        <CustomText
          style={[
            styles.langText,
            {color: colors.gray300, fontWeight: 'bold'},
          ]}>
          {version}
        </CustomText>
      </View>
    </CustomScreen>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
