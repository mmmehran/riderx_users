import React, {useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  I18nManager,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import RNRestart from 'react-native-restart'; // optional if you want instant RTL restart

import CustomScreen from '../../components/common/CustomScreen';
import routes from '../../navigation/routes';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';
import {sendData, getData, postData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {
  selectConfig,
  logouConfig,
  setSelectVehicle,
} from '../../redux/reducers/configReducer';
import i18n from '../../utils/i18n';

const LANGS = [
  {code: 'en', label: 'English', rtl: false},
  {code: 'de', label: 'Deutsch', rtl: false},
  {code: 'tr', label: 'Türkçe', rtl: false},
  {code: 'fa', label: 'فارسی', rtl: true},
  {code: 'ar', label: 'العربية', rtl: true},
];

const LoginEmail = props => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);

  const [langModal, setLangModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (config?.selectVehicle) {
        getVehicleStatus();
      }
    }, []),
  );

  const getVehicleStatus = async () => {
    const response = await getData(
      `${urls.GETVEHICLEDETAIL}?id=${config?.selectVehicle?.id}`,
    );
    if (response?.data?.status) {
      dispatch(setSelectVehicle(response?.data?.data));
    } else {
      errorHandler(response);
    }
  };

  const updateVehicleStatus = async () => {
    const response = await sendData(urls.UPDATESTATUSVEHICLE, {
      id: config?.selectVehicle?.id,
      on_status: config?.selectVehicle?.on_status == 'on' ? 'off' : 'on',
    });
    if (response?.data?.status) {
      getVehicleStatus();
    } else {
      errorHandler(response);
    }
  };

  const logOutUser = async () => {
    const response = await postData(urls.LOGOUT);
    if (response?.data?.status) {
      dispatch(logout());
      dispatch(logouConfig());
    } else {
      errorHandler(response);
    }
  };

  const applyLanguage = async (code, rtl) => {
    setLangModal(false);
    await AsyncStorage.setItem('language', code);
    await i18n.changeLanguage(code);

    const needRTL = !!rtl;
    // if (I18nManager.isRTL !== needRTL) {
    //   I18nManager.allowRTL(needRTL);
    //   I18nManager.forceRTL(needRTL);
    //   // If you want instant layout flip, uncomment next line (requires package):
    //   // RNRestart.restart();
    //   showToast(
    //     t('languageChanged') ||
    //       'Language changed. Please restart the app to apply layout direction.',
    //   );
    // }
  };

  const currentLangLabel =
    LANGS.find(l => l.code === i18n.language)?.label || 'English';

  const data = [
    {
      id: 3,
      name: t('wallet'),
      onPress: () => props?.navigation.navigate(routes.WALLET),
    },
    {
      id: 4,
      name: t('sender'),
      onPress: () => props?.navigation.navigate(routes.SENDER),
    },
    {
      id: 5,
      name: t('report'),
      onPress: () => props?.navigation.navigate(routes.REPORT),
    },
    {
      id: 6,
      name: t('logOut'),
      onPress: () => {
        logOutUser();
      },
    },
  ];

  return (
    <CustomScreen>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{uri: user?.profile_image}}
              style={{width: wp(20), height: wp(20)}}
            />
          </View>
          <View style={styles.textContainer}>
            <CustomText numberOfLines={1} style={styles.text}>
              {user?.userProfile?.first_name} {user?.userProfile?.last_name}
            </CustomText>
            <View style={styles.row}>
              <CustomText style={styles.text}>
                {user?.userProfile?.city_name}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity
            onPress={updateVehicleStatus}
            style={[
              styles.stopButton,
              config?.selectVehicle?.on_status !== 'on'
                ? {backgroundColor: colors.success}
                : {backgroundColor: '#CD2C2C'},
            ]}>
            <CustomText style={styles.textButton}>
              {config?.selectVehicle?.on_status == 'on'
                ? t('stop')
                : t('start')}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.rowContainer}>
          {data.map(item => (
            <TouchableOpacity
              onPress={item.onPress}
              key={item.id}
              style={styles.rowList}>
              <CustomText style={styles.textRowbutton}>{item.name}</CustomText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.langContainer}>
          <TouchableOpacity onPress={() => setLangModal(true)}>
            <CustomText style={styles.langText}>{currentLangLabel}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={langModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModal(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <CustomText style={styles.sheetTitle}>
              {t('selectLanguage') || 'Select language'}
            </CustomText>
            {LANGS.map(item => (
              <TouchableOpacity
                key={item.code}
                style={styles.optionRow}
                onPress={() => applyLanguage(item.code)}>
                <CustomText style={styles.optionText}>
                  {item.label}
                  {i18n.language === item.code ? ' ✓' : ''}
                </CustomText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.optionRow, {alignItems: 'center'}]}
              onPress={() => setLangModal(false)}>
              <CustomText style={[styles.optionText, {color: colors.blue}]}>
                {t('cancel') || 'Cancel'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CustomScreen>
  );
};

export default LoginEmail;

const styles = StyleSheet.create({
  rowList: {
    justifyContent: 'center',
    width: wp(80),
    backgroundColor: 'rgba(239, 239, 239, 0.63)',
    height: hp(7.5),
    marginVertical: hp(1),
  },
  buttonBottom: {
    width: wp(35),
    height: wp(35),
    left: wp(-5),
    top: hp(4.5),
    borderRadius: wp(50),
    backgroundColor: 'rgba(251, 188, 4, 0.4)',
    alignItems: 'center',
    paddingTop: hp(4.5),
    paddingLeft: wp(2.5),
  },
  bottom: {justifyContent: 'flex-end', flex: 1},
  textRowbutton: {
    fontSize: wp(7.5),
    color: colors.black,
    fontWeight: '800',
    marginLeft: wp(6),
  },
  rowContainer: {marginTop: hp(6)},
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(20),
    height: wp(20),
    backgroundColor: colors.grayLight,
    borderRadius: wp(50),
    marginRight: wp(4),
    overflow: 'hidden',
  },
  container: {overflow: 'hidden', flex: 1},
  profileContainer: {
    marginTop: hp(4),
    alignItems: 'center',
    marginHorizontal: wp(6),
    flexDirection: 'row',
  },
  row: {flexDirection: 'row-reverse', alignItems: 'center', marginTop: hp(1)},
  text: {fontSize: wp(5), color: colors.black, fontWeight: '800'},
  stopButton: {
    width: wp(25),
    height: wp(12),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {width: wp(22), alignItems: 'flex-start'},
  textButton: {fontSize: wp(4.5), color: colors.black, fontWeight: '900'},
  langContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: hp(7),
  },
  langText: {color: colors.blue, fontSize: wp(4)},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
  },
  sheetTitle: {fontWeight: 'bold', fontSize: wp(4.3), marginBottom: hp(1.5)},
  optionRow: {
    paddingVertical: hp(1.8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  optionText: {fontSize: wp(4)},
});
