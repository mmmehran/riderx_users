import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';

import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import CustomButton from '../../components/common/CustomButton';
import routes from '../../navigation/routes';
import { useDispatch, useSelector } from 'react-redux';
import { selectConfig, setExternalMap } from '../../redux/reducers/configReducer';

const SelectExternalMap = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const config = useSelector(selectConfig);
  const [selected, setSelected] = useState(config?.externalMap || 'google');

  useEffect(() => {
     if(config?.externalMap){
        setSelected(config?.externalMap)
     }
  }, [config?.externalMap]);

  const onSave = () => {
     dispatch(setExternalMap(selected));
     navigation.navigate(routes.APPSETTINGS);
  };


  const LANGS = [
    {code: 'apple', label: 'Apple Maps'},
    {code: 'google', label: 'Google Maps'},
    {code: 'waze', label: 'Waze'},
  ];

 

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.APPSETTINGS)}
        title={t('externalMap')}
      />
      <CustomText style={styles.textContent}>{t('selectExternalMapContent')}</CustomText>
      {LANGS?.map(item => {
        return (
          <TouchableOpacity
            onPress={() => setSelected(item.code)}
            style={styles.rowButton}>
            <View style={[styles.checkContainer]}>
              {selected === item.code && <View style={styles.pin}></View>}
            </View>
            <CustomText style={styles.title}>{item?.label}</CustomText>
          </TouchableOpacity>
        );
      })}
      <View style={styles.buttonContainer}>
        <View style={styles.rowButton1}>
          <CustomButton
            style={styles.button1}
            onPress={() => navigation.navigate(routes.APPSETTINGS)}
            textStyle={{color: colors.neutral900}}>
            {t('cancel')}
          </CustomButton>
          <CustomButton
            onPress={onSave}
            style={styles.button}>
            {t('Savechanges')}
          </CustomButton>
        </View>
      </View>
    </CustomScreen>
  );
};

export default SelectExternalMap;

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
