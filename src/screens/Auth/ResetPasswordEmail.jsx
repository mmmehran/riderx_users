import React, {useState, useRef} from 'react';
import {View, StyleSheet, Keyboard, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as Yup from 'yup';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';

import CustomScreen from '../../components/common/CustomScreen';
import {Form, Input, Button} from '../../components/form/index';
import {postData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {showToast} from '../../utils/helpers';
import {PersonIcon, ArrowLeft2} from '../../../assets/svg/index';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import routes from '../../navigation/routes';
import {setConfigTest, setConfig} from '../../services/defaultAxios';

const ResetPasswordEmail = props => {
  const formikRef = useRef(null);
  const {t} = useTranslation();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required(),
  });

  const onSubmit = async value => {
    setLoading(true);
    Keyboard.dismiss();
    if (/^[^@\s]+@bb\.com$/i.test(value?.email)) setConfigTest();
    else setConfig();
    await new Promise(r => setTimeout(r, 300));
    const response = await postData(
      urls.RESETPASSWORD,
      {
        email: value.email,
        type: 'app',
      },
      false,
    );
    if (response?.data?.status) {
      showToast(response?.data?.message);
      navigation.navigate(routes.RESETPASSWORDOTP, {email: value.email});
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  return (
    <CustomScreen>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.buttonBack}>
          <ArrowLeft2></ArrowLeft2>
        </TouchableOpacity>
        <CustomText style={styles.title}>
          {t('enterYourPhoneOrEmail')}
        </CustomText>
        <View style={styles.formContainer}>
          <Form
            initialValues={{email: ''}}
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
                <Button loading={loading}>{t('Continue')}</Button>
              </>
            )}
          </Form>
        </View>
      </KeyboardAwareScrollView>
    </CustomScreen>
  );
};

export default ResetPasswordEmail;

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(3),
  },
  buttonBack: {
    width: wp(10),
    height: wp(10),
    borderColor: colors.neutral200,
    borderWidth: wp(0.3),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    marginLeft: wp(5),
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
    marginTop: hp(2),
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
