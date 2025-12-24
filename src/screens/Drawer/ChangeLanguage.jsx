import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {sendData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';

import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import CustomButton from '../../components/common/CustomButton';
import routes from '../../navigation/routes';
import i18n from '../../utils/i18n';

const MyAccount = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const LANGS = [
    {code: 'en', label: 'English', rtl: false},
    {code: 'de', label: 'Deutsch', rtl: false},
    {code: 'tr', label: 'Türkçe', rtl: false},
    {code: 'fa', label: 'فارسی', rtl: true},
    {code: 'ar', label: 'العربية', rtl: true},
  ];

  const applyLanguage = async (code, rtl) => {
    await AsyncStorage.setItem('language', code);
    await i18n.changeLanguage(code);
    const response = await sendData(urls.UPDATELANGUAGE, {
      language: code,
    });
    if (response?.data?.status) {
    } else {
      errorHandler(response);
    }
  };

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.MYACCOUNT)}
        title={t('ChangeLanguage')}
      />
      <CustomText style={styles.textContent}>{t('contentLanguage')}</CustomText>
      {LANGS?.map(item => {
        return (
          <TouchableOpacity
            onPress={() => applyLanguage(item.code, item.rtl)}
            style={styles.rowButton}>
            <View style={[styles.checkContainer]}>
              {i18n.language === item.code && <View style={styles.pin}></View>}
            </View>
            <CustomText style={styles.title}>{item?.label}</CustomText>
          </TouchableOpacity>
        );
      })}
      <View style={styles.buttonContainer}>
        <View style={styles.rowButton1}>
          <CustomButton
            style={styles.button1}
            onPress={() => navigation.navigate(routes.MYACCOUNT)}
            textStyle={{color: colors.neutral900}}>
            {t('cancel')}
          </CustomButton>
          <CustomButton
            onPress={() => navigation.navigate(routes.MYACCOUNT)}
            style={styles.button}>
            {t('Savechanges')}
          </CustomButton>
        </View>
      </View>
    </CustomScreen>
  );
};

export default MyAccount;

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(15),
    height: wp(15),
    backgroundColor: colors.grayLight,
    marginRight: wp(2),
    borderRadius: wp(50),
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
    // fontFamily: 'YaldeviJaffna-Bold',
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
  },
  title: {
    color: colors.neutral700,
  },
});
