import React, { memo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import PaymentHistoryListRenderItem from '../renderItems/PaymentHistoryListRenderItem';

const PaymentHistoryList = ({ data, ListHeaderComponent, onEndReached, ListFooterComponent }) => {

    return (
        <View style={styles.main}>
             <FlatList
                data={data}
                ListHeaderComponent={ListHeaderComponent}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={ListFooterComponent}
                renderItem={({ item, index }) => {
                    return (
                        <PaymentHistoryListRenderItem
                            item={item}
                            key={index}
                        ></PaymentHistoryListRenderItem>
                    )
                }}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(5) }}
            /> 
        </View>
    )
}

export default memo(PaymentHistoryList);

const styles = StyleSheet.create({
    main: {
        marginTop:hp(0),
        marginBottom:hp(2)
    }

});