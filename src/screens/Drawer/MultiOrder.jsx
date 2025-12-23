import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/core';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {
  TickYellow,
  EditIcon,
  FileGray,
  FileGreen,
  FileRed,
  LanguageIcon,
  NotificationIcon,
  PasswordIcon,
  ArrowRightGray,
  LogoutIcon,
} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import { postData, getData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';
import { logouConfig } from '../../redux/reducers/configReducer';
import routes from '../../navigation/routes';
import MultiOrderRenderItem from '../../components/renderItems/MultiOrderRenderItem';

const MultiOrder = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector(authenticated);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [lastPackageData, setLastPackageData] = useState(null);






  return (
    <CustomScreen>
      <CustomHeaderApp title={t('nextTrip')} />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <MultiOrderRenderItem item={[
          {}
        ]} />
      </KeyboardAwareScrollView>
    </CustomScreen>
  );
};

export default MultiOrder;

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

});
