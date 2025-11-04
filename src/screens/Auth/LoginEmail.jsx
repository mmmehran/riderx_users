import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Modal,
  Platform,
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
import {appleAuth} from '@invertase/react-native-apple-authentication';

import CustomScreen from '../../components/common/CustomScreen';
import {Form, Input, Button} from '../../components/form/index';
import {postData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {showToast, showError} from '../../utils/helpers';
import {
  Logo,
  Google,
  Apple,
  PersonIcon,
  KeyboardIcon,
} from '../../../assets/svg/index';
import {login} from '../../redux/reducers/authenticationReducer';
import {setConfigTest, setConfig} from '../../services/defaultAxios';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import i18n from '../../utils/i18n';
import routes from '../../navigation/routes';
import {version} from '../../../package.json';

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
    }, [loadRemembered]),
  );

  const toggleRemember = async () => setRememberMe(v => !v);

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId:
        '224724744593-sshnpoo8igmgi1h5aku239r1f6bikma7.apps.googleusercontent.com',
      webClientId:
        '224724744593-h32i8kmlgcj029vv27tmqhh5i815cd8h.apps.googleusercontent.com',
    });
  }, []);

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }
      const userInfo = await GoogleSignin.signIn();
      const token = await GoogleSignin.getTokens();

      setConfig();
      await new Promise(r => setTimeout(r, 300));

      const response = await postData(
        urls.SOCIALLOGIN,
        {
          access_token: token?.accessToken,
        },
        false,
      );

      if (response?.data?.status) {
        if (response?.data?.data) {
          dispatch(login(response?.data?.data));
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
    } catch (error) {
      showError(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== 'ios' || !appleAuth.isSupported) {
        showError('Sign in with Apple is not supported.');
        return;
      }
      setLoading(true);
      const appleResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      const {user, email, fullName, identityToken, authorizationCode} =
        appleResponse;
      setConfig();
      await new Promise(r => setTimeout(r, 300));
      const response = await postData(
        urls.SOCIALLOGINAPPLE,
        {
          id_token: identityToken,
          apple_user: user,
          email,
          fullName,
        },
        false,
      );
      if (response?.data?.status) {
        if (response?.data?.data) {
          dispatch(login(response?.data?.data));
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
    } catch (e) {
      if (e?.code !== appleAuth.Error.CANCELED) {
        console.log('Apple sign-in error', e);
        showError(e?.message || 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomScreen>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <CustomText style={styles.title}>
          {t('enterYourPhoneOrEmail')}
        </CustomText>
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
                  inputName={t('enterPhoneOrEmail')}
                  input={{textAlign: 'left'}}
                  autoCapitalize="none"
                  value={values?.email}
                  icon={
                    <PersonIcon width={wp(4.5)} height={wp(4.5)}></PersonIcon>
                  }
                />
                <Input
                  name="password"
                  inputName={t('enterYourPassword')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                  value={values?.password}
                  icon={
                    <KeyboardIcon
                      width={wp(4.5)}
                      height={wp(4.5)}></KeyboardIcon>
                  }
                />
                {/* <RememberCheckbox /> */}
                <Button loading={loading}>{t('Continue')}</Button>
              </>
            )}
          </Form>
          <TouchableOpacity style={{marginTop: hp(2.5)}}>
            <CustomText style={styles.textSignu}>
              {t('forgetPassword')}
            </CustomText>
          </TouchableOpacity>
          <View style={styles.rowContainer}>
            <View style={styles.line}></View>
            <View style={styles.center}>
              <CustomText style={styles.textOr}>{t('or')}</CustomText>
            </View>
            <View style={styles.line}></View>
          </View>
          <View style={styles.rowSocial}>
            <TouchableOpacity
              onPress={handleGoogleLogin}
              style={styles.socialButton}>
              <Google width={wp(6.5)} height={wp(6.5)} />
            </TouchableOpacity>
            {Platform.OS === 'ios' && appleAuth.isSupported ? (
              <TouchableOpacity
                onPress={handleAppleLogin}
                style={styles.socialButton}>
                <Apple width={wp(8)} height={wp(8)} />
              </TouchableOpacity>
            ) : null}
          </View>
          <View
            style={[
              styles.line,
              {marginTop: hp(3), width: wp(92), marginHorizontal: wp(4)},
            ]}></View>
          <TouchableOpacity
            style={styles.signUpContainer}
            onPress={() => navigation.navigate(routes.SIGNUPSENDER)}>
            <CustomText style={[styles.textSignu, {fontSize: wp(4)}]}>
              {t('dontAccount')}
            </CustomText>
            <View style={styles.buttonRegister}>
              <CustomText style={[styles.textSignu, {fontSize: wp(3.4)}]}>
                {t('register')}
              </CustomText>
            </View>
          </TouchableOpacity>
          <View
            style={{flex: 1, justifyContent: 'flex-end', marginBottom: hp(1)}}>
            <TouchableOpacity onPress={openLangModal}>
              <CustomText style={styles.text}>{currentLabel}</CustomText>
            </TouchableOpacity>
          </View>
          <View style={styles.rowVersion}>
            <CustomText style={styles.textVersion}>
              {t('appVersion')}
            </CustomText>
            <CustomText style={[styles.textSignu, {fontSize: wp(3.6)}]}>
              {version}
            </CustomText>
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(3),
  },
  rowVersion: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  line: {
    height: wp(0.3),
    width: wp(40),
    backgroundColor: colors.neutral200,
  },
  textVersion: {
    color: colors.neutral500,
    marginRight: wp(1),
    fontSize: wp(3.5),
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  rowSocial: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(2.5),
  },
  center: {
    width: wp(10),
    height: hp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOr: {
    color: colors.neutral400,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(3.3),
  },
  logoContainer: {alignItems: 'center', marginTop: hp(5)},
  formContainer: {flex: 1, marginTop: hp(3)},
  text: {textAlign: 'center', color: colors.blue},
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    marginLeft: wp(6),
  },
  title: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(10.5),
    width: wp(65),
    marginLeft: wp(4),
    marginTop: hp(3),
    lineHeight: hp(5.5),
  },
  textSignu: {
    textAlign: 'center',
    color: colors.neutral600,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(4.5),
  },
  rememberText: {
    marginLeft: wp(1.5),
  },
  socialButton: {
    width: wp(43),
    height: hp(7.5),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(3),
    marginHorizontal: wp(2),
    borderWidth: wp(0.3),
    borderColor: colors.neutral200,
    flexDirection: 'row',
  },
  buttonRegister: {
    height: hp(4.2),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2.5),
    borderWidth: wp(0.3),
    borderColor: colors.neutral200,
    paddingHorizontal: wp(2),
    marginLeft: wp(2),
  },
  textButtonSocial: {
    color: colors.black,
    marginLeft: wp(2),
    fontWeight: 'bold',
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
  checkboxChecked: {borderColor: colors.blue},
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
  sheetTitle: {fontSize: wp(4.3), marginBottom: hp(1.5)},
  optionRow: {
    paddingVertical: hp(1.8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  optionText: {fontSize: wp(4)},
  appleRow: {
    marginTop: hp(3),
    alignItems: 'center',
  },
  appleButton: {
    width: wp(89),
    height: hp(6),
    borderRadius: 8,
  },
});
