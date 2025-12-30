import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from '@react-navigation/core';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import { getData } from '../../services/common.service';
import errorHandler from '../../utils/errorHandler';
import { selectConfig } from '../../redux/reducers/configReducer';
import routes from '../../navigation/routes';
import MultiOrderRenderItem from '../../components/renderItems/MultiOrderRenderItem';

const MultiOrder = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [multiOrder, setMultiOrder] = useState(null);
  const config = useSelector(selectConfig);

  useFocusEffect(
    useCallback(() => {
      const getOrder = async () => {
        setLoading(true);
        const vehicleId = config?.selectVehicle?.id;
        const deliveryId = route?.params?.data?.[0]?.id;
        if (vehicleId && deliveryId) {
          const response = await getData(`vehicle/${vehicleId}/optimal_route?new_delivery_id=${deliveryId}`);
          if (response?.data?.status) {
            setMultiOrder(response?.data?.data)
          }
          else errorHandler(response);
        }
        setLoading(false);
      };

      getOrder();
    }, [config?.selectVehicle?.id, route?.params?.data]),
  );

  const handleAcceptOrder = async () => {
    setLoading(true);
    navigation.navigate(routes.HOMEMAIN, { multi: "acceptNewOrder", order: route?.params?.data[0] })
    setLoading(false);
  };

  return (
    <CustomScreen>
      <CustomHeaderApp title={t('nextTrip')} />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        {loading ?
          <View>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          : <MultiOrderRenderItem item={route?.params?.data[0]} multi={true}
            multiOrder={multiOrder ?? null}
            handleAccept={handleAcceptOrder}
          />}
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
