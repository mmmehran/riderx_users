import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Modal,
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
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

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

const LANGS = [
  {code: 'en', label: 'English', rtl: false},
  {code: 'de', label: 'Deutsch', rtl: false},
  {code: 'tr', label: 'Türkçe', rtl: false},
  {code: 'fa', label: 'فارسی', rtl: true},
  {code: 'ar', label: 'العربية', rtl: true},
];

const REMEMBER_KEY = 'remember_credentials_v1';

const LoginEmail = props => {
  const formikRef = useRef(null);
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [prefill, setPrefill] = useState({email: '', password: ''});

  const validationSchema = Yup.object().shape({
    email: Yup.string().required(),
    password: Yup.string().min(4).required(),
  });

  const loadRemembered = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(REMEMBER_KEY);
      if (raw) {
        const {email = '', password = ''} = JSON.parse(raw) || {};
        setPrefill({email, password});
        setRememberMe(true);
        setTimeout(() => {
          const f = formikRef.current;
          if (f?.setFieldValue) {
            f.setFieldValue('email', email, false);
            f.setFieldValue('password', password, false);
          }
        }, 0);
      } else {
        setRememberMe(false);
        setPrefill({email: '', password: ''});
        setTimeout(() => {
          const f = formikRef.current;
          if (f?.setFieldValue) {
            f.setFieldValue('email', '', false);
            f.setFieldValue('password', '', false);
          }
        }, 0);
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRemembered();
    }, []),
  );

  const toggleRemember = async () => {
    setRememberMe(!rememberMe);
  };

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
      try {
        if (rememberMe) {
          await AsyncStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({
              email: value?.email,
              password: value?.password,
            }),
          );
        } else {
          await AsyncStorage.removeItem(REMEMBER_KEY);
        }
      } catch {}
      if (response?.data?.data) {
        dispatch(login(response?.data?.data));
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
    await AsyncStorage.setItem('language', code);
    await i18n.changeLanguage(code);
  };

  const currentLabel =
    (LANGS.find(l => l.code === i18n.language) || {})?.label || 'English';

  const RememberCheckbox = () => (
    <TouchableOpacity
      onPress={toggleRemember}
      style={styles.rememberRow}
      activeOpacity={0.8}>
      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
        {rememberMe ? <View style={styles.checkboxDot} /> : null}
      </View>
      <CustomText style={styles.rememberText}>{t('rememberMe')}</CustomText>
    </TouchableOpacity>
  );

  GoogleSignin.configure({
    iosClientId:
      '224724744593-sshnpoo8igmgi1h5aku239r1f6bikma7.apps.googleusercontent.com',
    webClientId:
      '224724744593-puvbgi93mp7uvpodv0qvnhb9tbneggej.apps.googleusercontent.com',
  });

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const token = await GoogleSignin.getTokens();
      setConfigTest();
      await new Promise(r => setTimeout(r, 300));
      const response = await postData(urls.SOCIALLOGIN, {
        access_token: token?.accessToken,
      });
      console.log(response?.data);
      if (response?.data?.status) {
        if (response?.data?.data) {
          // dispatch(login(response?.data?.data));
        }
      } else {
        errorHandler(response);
      }
    } catch (error) {
      console.log(error);
      showError(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
            initialValues={{email: prefill.email, password: prefill.password}}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            innerRef={formikRef}
            enableReinitialize>
            {({values}) => (
              <>
                <Input
                  name="email"
                  inputName={t('emailOrPhone')}
                  input={{textAlign: 'left'}}
                  autoCapitalize="none"
                  value={values?.email}
                />
                <Input
                  name="password"
                  inputName={t('password')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                  value={values?.password}
                />

                <RememberCheckbox />

                <View style={styles.buttonContainer}>
                  <Button loading={loading}>{t('login')}</Button>
                </View>
              </>
            )}
          </Form>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={{marginTop: hp(5), marginLeft: wp(10)}}>
            <CustomText>Google login </CustomText>
          </TouchableOpacity>

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
                onPress={() => applyLanguage(item.code, item.rtl)}>
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    marginLeft: wp(6),
  },
  rememberText: {
    marginLeft: wp(1.5),
  },
  checkbox: {
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(20),
    borderWidth: 2,
    borderColor: '#9AA0A6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    borderColor: colors.blue,
  },
  checkboxDot: {
    width: wp(3.6),
    height: wp(3.6),
    borderRadius: wp(20),
    backgroundColor: colors.blue,
  },
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
