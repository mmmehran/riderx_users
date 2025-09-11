import React, {useState, useRef} from 'react';
import {View, StyleSheet, Keyboard} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as Yup from 'yup';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import {Form, Input, Button} from '../../components/form/index';
import {postData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {showToast} from '../../utils/helpers';
import {Logo} from '../../../assets/svg/index';
import {login} from '../../redux/reducers/authenticationReducer';

const LoginEmail = props => {
  const formikRef = useRef();
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required(),
    password: Yup.string().min(4).required(),
  });

  const onSubmit = async value => {
    Keyboard.dismiss();
    setLoading(true);
    const response = await postData(urls.LOGIN, {
      email: value?.email,
      password: value?.password,
    });
    if (response?.data?.status) {
      dispatch(login(response?.data?.data));
      showToast(response?.data?.message);
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
        <View style={styles.logoContainer}>
          <Logo width={wp(33)} height={wp(33)} />
        </View>
        <View style={styles.formContainer}>
          <Form
            initialValues={{
              email: '',
              password: '',
            }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            innerRef={formikRef}>
            {({values}) => (
              <>
                <Input
                  name="email"
                  inputName={t('emailOrPhone')}
                  input={{textAlign: 'left'}}
                  autoCapitalize="none"></Input>
                <Input
                  name="password"
                  inputName={t('password')}
                  input={{textAlign: 'left'}}
                  autoCapitalize="none"></Input>
                <View style={styles.buttonContainer}>
                  <Button loading={loading}>{t('login')}</Button>
                </View>
              </>
            )}
          </Form>
        </View>
      </KeyboardAwareScrollView>
    </CustomScreen>
  );
};

export default LoginEmail;

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginTop: hp(5),
  },
  formContainer: {
    flex: 1,
    marginTop: hp(3),
  },
  buttonContainer: {
    marginTop: hp(4),
  },
});
