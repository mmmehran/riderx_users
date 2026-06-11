import React, { useEffect, useRef, useState } from 'react';
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
import { getData } from '../../services/common.service';
import { authenticated } from '../../redux/reducers/authenticationReducer';
import DeviceInfo from 'react-native-device-info';
import errorHandler from '../../utils/errorHandler';
import defaultAxios, { setConfigTest } from '../../services/defaultAxios';


const Splash = props => {
  const navigation = useNavigation();
  const config = useSelector(selectConfig);
  const user = useSelector(authenticated)
  const [isVersionValid, setIsVersionValid] = useState(false)
  const [isGettingVersion, setIsGettingVersion] = useState(true)
  const errorCount = useRef(0)

  const isCurrentVersionValid = async () => {
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    setIsGettingVersion(true)
    setIsVersionValid(false)
    await sleep(2618)
    while (true) {
      if (errorCount.current >= 3) break;
      try {
        let path = `/app_version_code?app=user&version_code=${DeviceInfo.getBuildNumber()}&type=${(Platform?.OS ?? 'OS').toLowerCase()}${user?.authenticated ? '&email=' + user.email : ''}`
        let base = defaultAxios.instance.defaults.baseURL?.replace(/\/v\d+\/?$/, "");
        const url = base + path;
        if (__DEV__) console.log(url)
        const res = await getData(url)
        if (!res.data?.status) {
          if (res?.response?.status == 404) {
            setConfigTest()
            setIsGettingVersion(false)
            setIsVersionValid(true)
            break;
          }
          await sleep(2618)
          errorCount.current = errorCount.current + 1
          continue
        }
        if (!res.data.data.force_update) {
          setIsGettingVersion(false)
          setIsVersionValid(true)
          break;
        } else {
          setIsGettingVersion(false)
          setIsVersionValid(false)
          break;
        }
      } catch (err) {
        await sleep(2618)
      }
    }

  }

  useEffect(() => {
    if (isGettingVersion) return
    if (isVersionValid) {
      if (config?.seeOnboarding) {
        navigation.navigate(routes.MAINNAVIGATOR);
      } else {
        navigation.navigate(routes.ONBOARDING);
      }
    } else {
      navigation.navigate(routes.INSTALLUSERAPP);
    }
  }, [isVersionValid, isGettingVersion]);

  useEffect(() => {
    errorCount.current = 0
    isCurrentVersionValid()
  }, [user?.authenticated])

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
