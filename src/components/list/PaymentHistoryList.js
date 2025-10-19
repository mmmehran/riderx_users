import React, { memo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import PaymentHistoryListRenderItem from '../renderItems/PaymentHistoryListRenderItem';

const PaymentHistoryList = ({ data }) => {

    return (
        <View style={styles.main}>
             <FlatList
                data={data}
                renderItem={({ item, index }) => {
                    return (
                        <PaymentHistoryListRenderItem
                            item={item}
                            key={index}
                        ></PaymentHistoryListRenderItem>
                    )
                }}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(2) }}
            /> 
        </View>
    )
}

export default memo(PaymentHistoryList);

const styles = StyleSheet.create({
    main: {
        marginTop:hp(2),
        marginBottom:hp(2)
    }

});