import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/core';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import { Search, PhoneCall, SearchInput } from '../../../assets/svg';
import { getData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { authenticated } from '../../redux/reducers/authenticationReducer';
import { timeAgoShort } from '../../utils/helpers';
import routes from '../../navigation/routes';

const ChatListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const user = useSelector(authenticated);

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchChats = async () => {
    if (!refreshing) setLoading(true);
    const response = await getData(urls.GETCHATMSGS);
    if (response?.data?.status) {
      setChats(response.data.data.items || []);
      setFilteredChats(response.data.data.items || []);
    } else {
      errorHandler(response);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, []),
  );

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => {
        const otherParticipant = chat.participants.find(p => String(p.user.id) !== String(user.user_id));
        const name = `${otherParticipant?.user?.first_name} ${otherParticipant?.user?.last_name}`.toLowerCase();
        return name.includes(searchText.toLowerCase());
      });
      setFilteredChats(filtered);
    }
  }, [searchText, chats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderChatItem = ({ item }) => {
    const otherParticipant = item.participants.find(p => String(p.user.id) !== String(user.user_id));
    const partner = otherParticipant?.user;
    const lastMessage = item.last_message;
    const unreadCount = item.unread_count || 0;

    const initials = partner ? `${partner.first_name?.[0] || ''}${partner.last_name?.[0] || ''}`.toUpperCase() : '';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate(routes.CHAT, { senderId: partner?.id, chatId: item.id })}
      >
        <View style={styles.avatarContainer}>
          {partner?.profile_image ? (
            <Image source={{ uri: partner.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <CustomText style={styles.initialsText}>{initials}</CustomText>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <CustomText style={styles.badgeText}>{unreadCount}</CustomText>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <CustomText style={styles.partnerName} numberOfLines={1}>
            {partner ? `${partner.first_name} ${partner.last_name}` : 'Unknown'}
          </CustomText>
          <CustomText style={styles.timeText}>
            {item.updated_at ? timeAgoShort(item.updated_at) : 'Just now'}
          </CustomText>
        </View>
        {/* 
        <TouchableOpacity style={styles.callButton}>
          <PhoneCall width={wp(4)} height={wp(4)} stroke={colors.neutral500} />
        </TouchableOpacity> */}
      </TouchableOpacity>
    );
  };

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.CHAT)}
        title={t('messageList')} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchInput width={wp(4)} height={wp(4)} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('findHere')}
            placeholderTextColor={colors.neutral400}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.neonTeal300} />
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderChatItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.neonTeal300]} />
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.centerContainer}>
                  <CustomText>{t('noChatsFound')}</CustomText>
                </View>
              )
            }
          />
        )}
      </View>
    </CustomScreen>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: hp(1)
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
    paddingHorizontal: wp(3),
    height: hp(5),
    borderRadius: wp(3),
    borderWidth: wp(0.3),
    borderColor: colors.neutral200,
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: wp(3.8),
    color: colors.neutral900,
    fontFamily: "YaldeviJaffna-Medium",
    marginLeft: wp(1)
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(5),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: wp(3),
  },
  avatar: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(50),
  },
  initialsAvatar: {
    backgroundColor: colors.blue2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: wp(5),
    fontFamily: 'YaldeviJaffna-Bold',
    color: '#122368',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.red,
    minWidth: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: wp(2.5),
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: wp(4.5),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
    marginBottom: hp(0.2),
  },
  timeText: {
    fontSize: wp(3.3),
    color: colors.neutral500,
  },
  callButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(2),
    backgroundColor: colors.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
});
