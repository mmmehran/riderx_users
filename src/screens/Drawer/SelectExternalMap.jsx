import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import CustomButton from '../../components/common/CustomButton';
import routes from '../../navigation/routes';
import { selectConfig, setExternalMap } from '../../redux/reducers/configReducer';

// ✅ import detector
import { getAvailableMapApps } from '../../utils/externalMap';

const SelectExternalMap = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const config = useSelector(selectConfig);
  const [selected, setSelected] = useState(config?.externalMap || 'google');

  // full list with icons
  const MAP_APPS = [
    {
      code: 'google',
      label: 'Google Maps',
      icon: require('../../../assets/image/google-maps.png'),
    },
    {
      code: 'waze',
      label: 'Waze',
      icon: require('../../../assets/image/waze.png'),
    },
    {
      code: 'wego',
      label: 'HERE WeGo',
      icon: require('../../../assets/image/here-wego.png'),
    },
    {
      code: 'yandex',
      label: 'Yandex Maps',
      icon: require('../../../assets/image/yandex-maps.png'),
    },
    {
      code: 'gis',
      label: '2GIS',
      icon: require('../../../assets/image/2gis.png'),
    },
    {
      code: 'apple',
      label: 'Apple Maps',
      icon: require('../../../assets/image/apple-maps.png'),
    },
  ];

  // what we actually render (installed apps)
  const [availableApps, setAvailableApps] = useState(MAP_APPS);

  useEffect(() => {
    if (config?.externalMap) {
      setSelected(config.externalMap);
    }
  }, [config?.externalMap]);

  useEffect(() => {
    // on mount, detect installed apps
    (async () => {
      try {
        const installedCodes = await getAvailableMapApps(); // ['google','waze',...]
        if (installedCodes && installedCodes.length > 0) {
          const filtered = MAP_APPS.filter(app =>
            installedCodes.includes(app.code),
          );
          setAvailableApps(filtered);

          // ensure selected app is valid
          if (!installedCodes.includes(selected)) {
            setSelected(filtered[0]?.code || 'google');
          }
        } else {
          // if nothing detected (e.g. canOpenURL restrictions), show full list
          setAvailableApps(MAP_APPS);
        }
      } catch (e) {
        console.log('getAvailableMapApps error', e);
        setAvailableApps(MAP_APPS);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const onSave = () => {
    dispatch(setExternalMap(selected));
    navigation.navigate(routes.APPSETTINGS);
  };

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.APPSETTINGS)}
        title={t('externalMap')}
      />

      <CustomText style={styles.textContent}>
        {t('selectExternalMapContent')}
      </CustomText>

      {availableApps.map(item => (
        <TouchableOpacity
          key={item.code}
          onPress={() => setSelected(item.code)}
          style={styles.rowButton}>
          <View style={styles.checkContainer}>
            {selected === item.code && <View style={styles.pin} />}
          </View>
          <Image source={item.icon} style={styles.image} />
          <CustomText style={styles.title}>{item.label}</CustomText>
        </TouchableOpacity>
      ))}

      <View style={styles.buttonContainer}>
        <View style={styles.rowButton1}>
          <CustomButton
            style={styles.button1}
            onPress={() => navigation.navigate(routes.APPSETTINGS)}
            textStyle={{ color: colors.neutral900 }}>
            {t('cancel')}
          </CustomButton>
          <CustomButton onPress={onSave} style={styles.button}>
            {t('Savechanges')}
          </CustomButton>
        </View>
      </View>
    </CustomScreen>
  );
};

export default SelectExternalMap;

const styles = StyleSheet.create({
  image: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(20),
  },
  rowButton1: {
    flexDirection: 'row',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: hp(3),
    alignItems: 'center',
  },
  button: {
    width: wp(40),
    marginHorizontal: wp(3),
  },
  button1: {
    width: wp(43),
    marginHorizontal: wp(2),
    backgroundColor: 'transparent',
    borderColor: colors.neutral900,
    borderWidth: wp(0.3),
  },
  textContent: {
    color: colors.neutral700,
    fontSize: wp(3.9),
    marginHorizontal: wp(4.5),
    marginTop: hp(2),
    marginBottom: hp(3),
    lineHeight: hp(2.5),
  },
  checkContainer: {
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(0.3),
    borderColor: colors.neutral700,
    marginRight: wp(3),
    marginLeft: wp(2),
  },
  pin: {
    width: wp(3.5),
    height: wp(3.5),
    backgroundColor: colors.neutral900,
    borderRadius: wp(20),
  },
  rowButton: {
    flexDirection: 'row',
    marginLeft: wp(2.5),
    marginBottom: hp(3),
    alignItems: 'center',
  },
  title: {
    color: colors.neutral700,
    marginLeft: wp(2),
  },
});
