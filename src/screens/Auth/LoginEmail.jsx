import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Modal,
  FlatList,
  I18nManager,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as Yup from 'yup';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

import CustomScreen from '../../components/common/CustomScreen';
import {Form, Input, Button} from '../../components/form/index';
import {postData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {showToast, showError} from '../../utils/helpers';
import {Logo} from '../../../assets/svg/index';
import {login} from '../../redux/reducers/authenticationReducer';
import {setConfigTest, setConfig} from '../../services/defaultAxios';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import i18n from '../../utils/i18n';
import routes from '../../navigation/routes';

const LANGS = [
  {code: 'en', label: 'English', rtl: false},
  {code: 'de', label: 'Deutsch', rtl: false},
  {code: 'tr', label: 'Türkçe', rtl: false},
  {code: 'fa', label: 'فارسی', rtl: true},
  {code: 'ar', label: 'العربية', rtl: true},
];

const LoginEmail = props => {
  const formikRef = useRef();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [langModal, setLangModal] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required(),
    password: Yup.string().min(4).required(),
  });

  const onSubmit = async value => {
    setLoading(true);
    Keyboard.dismiss();
    if (/^[^@\s]+@bb\.com$/i.test(value?.email)) setConfigTest();
    else setConfig();
    await new Promise(r => setTimeout(r, 300));
    const response = await postData(
      urls.LOGIN,
      {email: value?.email, password: value?.password},
      false,
    );
    if (response?.data?.status) {
      if (!response?.data?.data?.email_verified) {
        showError(t('emailNotVerify'));
        setLoading(false);
        return;
      }
      if (response?.data?.data?.is_rider) {
        dispatch(login(response?.data?.data));
      } else {
        navigation.navigate(routes.SENDER, {
          url: response?.data?.data?.sender_panel_direct_login_url,
        });
      }
      showToast(response?.data?.message);
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  const openLangModal = () => setLangModal(true);

  const applyLanguage = async (code, rtl) => {
    setLangModal(false);
    // persist
    await AsyncStorage.setItem('language', code);
    await i18n.changeLanguage(code);

    // handle RTL toggle for Arabic
    const needRTL = !!rtl;
    // if (I18nManager.isRTL !== needRTL) {
    //   //  I18nManager.allowRTL(needRTL);
    //   //I18nManager.forceRTL(needRTL);
    //   // If you have RNRestart installed, uncomment:
    //   // RNRestart.restart();
    //   // Otherwise, suggest reopening the app or navigate to root.
    //   showToast(
    //     t('languageChanged') ||
    //       'Language changed. Please restart the app to apply layout direction.',
    //   );
    // }
  };

  const currentLabel =
    LANGS.find(l => l.code === i18n.language)?.label || 'English';

  return (
    <CustomScreen>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.logoContainer}>
          <Logo width={wp(33)} height={wp(33)} />
        </View>
        <View style={styles.formContainer}>
          <Form
            initialValues={{email: '', password: ''}}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            innerRef={formikRef}>
            {() => (
              <>
                <Input
                  name="email"
                  inputName={t('emailOrPhone')}
                  input={{textAlign: 'left'}}
                  autoCapitalize="none"
                />
                <Input
                  name="password"
                  inputName={t('password')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                />
                <View style={styles.buttonContainer}>
                  <Button loading={loading}>{t('login')}</Button>
                </View>
              </>
            )}
          </Form>
          <View
            style={{flex: 1, justifyContent: 'flex-end', marginBottom: hp(7)}}>
            <TouchableOpacity onPress={openLangModal}>
              <CustomText style={styles.text}>{currentLabel}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <Modal
        visible={langModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModal(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <CustomText style={styles.sheetTitle}>
              {t('selectLanguage')}
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
                {t('cancel')}
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
  logoContainer: {alignItems: 'center', marginTop: hp(5)},
  formContainer: {flex: 1, marginTop: hp(3)},
  buttonContainer: {marginTop: hp(4)},
  text: {textAlign: 'center', color: colors.blue},

  // modal styles
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
