import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/core';
import Modal from 'react-native-modal';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import CustomHeaderChat from '../../components/custom/CustomHeaderChat';
import { VoiceIcon, ArrowSend, PaperClip, VoiceRecord, CancelIcon1, PlayIcon, PauseIcon } from '../../../assets/svg';
import { useSound, useAudioRecorderWithStates } from 'react-native-nitro-sound';
import { postData, getData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { selectConfig } from '../../redux/reducers/configReducer';
import { authenticated } from '../../redux/reducers/authenticationReducer';
import { postFormData } from '../../services/file.services';
import { addMessage, setMessages, selectChatMessages } from '../../redux/reducers/chatReducer';
import routes from '../../navigation/routes';
import TakePictureModal from '../../modal/TakePictureModal';

const ChatScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const { senderId, back } = route.params || {};
  const navigation = useNavigation();

  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);
  const dispatch = useDispatch();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [imageToUpload, setImageToUpload] = useState(null);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const {
    state: soundState,
    startPlayer,
    pausePlayer,
    resumePlayer,
    stopPlayer,
  } = useSound({
    subscriptionDuration: 0.1, // 100ms updates
  });

  const {
    startRecorder,
    stopRecorder,
    pauseRecorder: pauseRec,
    resumeRecorder: resumeRec,
    mmss: mmssRec,
    mmssss: mmssssRec,
    state: recorderState,
  } = useAudioRecorderWithStates({
    subscriptionDuration: 0.1,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordedPath, setRecordedPath] = useState(null);


  const messages = useSelector(selectChatMessages(chatId));

  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (senderId) {
        startChat();
      }
      return () => {
        stopPlayer();
      };
    }, [senderId]),
  );

  // Update playingVoiceId when playback ends
  useEffect(() => {
    if (soundState.status === 'stopped' || soundState.status === 'finished') {
      setPlayingVoiceId(null);
    }
  }, [soundState.status]);

  const requestMicrophonePermission = async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
    const result = await check(permission);
    if (result === RESULTS.GRANTED) return true;

    const requestResult = await request(permission);
    return requestResult === RESULTS.GRANTED;
  };

  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(t('Permission Denied'), t('Please enable microphone access in settings.'));
      return;
    }

    try {
      setIsRecording(true);
      setRecordedPath(null);
      await startRecorder();
    } catch (error) {
      setIsRecording(false);
      errorHandler(error);
    }
  };

  const stopRecording = async (shouldSend = true) => {
    try {
      const path = await stopRecorder();
      setIsRecording(false);
      if (shouldSend) {
        sendVoiceMessage(path);
      }
    } catch (error) {
      console.log('Stop Recording Error:', error);
      setIsRecording(false);
      errorHandler(error);
    }
  };

  const sendVoiceMessage = async (path) => {
    if (!path || !chatId) return;
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: path,
        type: 'audio/m4a',
        name: `voice_${Date.now()}.m4a`,
      });
      formData.append('file_type', 'voice');

      const url = `${urls.GETCHATMSGS}${chatId}/send_message?vehicle_id=${config?.selectVehicle?.id}`;
      const response = await postFormData(url, formData);
      if (response && response.data && response.data.status) {
        const newMessage = response.data.data;
        dispatch(addMessage({ chatId, message: newMessage }));
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        errorHandler(response || { message: 'Network Error' });
      }
    } catch (error) {
      errorHandler(error);
    }
  };

  const playVoice = useCallback(async (url, msgId) => {
    try {
      if (playingVoiceId === msgId) {
        if (soundState.status === 'playing') {
          await pausePlayer();
        } else {
          await resumePlayer();
        }
        return;
      }

      setPlayingVoiceId(msgId);
      await startPlayer(url);
    } catch (error) {
      errorHandler(error);
    }
  }, [playingVoiceId, soundState.status, startPlayer, pausePlayer, resumePlayer]);



  const startChat = async () => {
    // setLoading(true);
    const response = await postData(urls.STARTPRIVATECHAT, { user_id: senderId });
    if (response?.data?.status) {
      const chatDetail = response.data.data;
      setChatId(chatDetail.id);
      const participants = chatDetail.participants;
      const otherUser = participants.find(p => String(p.user.id) === String(senderId));
      if (otherUser) {
        setPartner(otherUser.user);
      } else {
        setPartner(participants[0].user);
      }
      await fetchMessages(chatDetail.id);
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  const handlePickImage = () => {
    setShowPictureModal(true);
  };

  const onImageSelect = (cameraObject) => {
    if (cameraObject?.assets?.[0]) {
      const asset = cameraObject.assets[0];
      setImageToUpload({
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName,
      });
    }
  };

  const removeImage = () => {
    setImageToUpload(null);
  };

  const fetchMessages = async (currentChatId) => {
    const response = await getData(`${urls.GETCHATMSGS}${currentChatId}/messages/?vehicle_id=${config?.selectVehicle?.id}`);
    if (response?.data?.status) {
      dispatch(setMessages({
        chatId: currentChatId,
        messages: [...response.data.data.items].reverse()
      }));
    } else {
      errorHandler(response);
    }
  };

  const sendMessage = async () => {
    if ((inputText.trim().length === 0 && !imageToUpload) || !chatId) return;
    // Removed full screen loading for better UX during message sending
    try {
      const formData = new FormData();
      if (inputText.trim()) {
        formData.append('content', inputText);
      }
      if (imageToUpload) {
        formData.append('file', {
          uri: imageToUpload.uri,
          type: imageToUpload.type,
          name: imageToUpload.name,
        });
      }
      const url = `${urls.GETCHATMSGS}${chatId}/send_message?vehicle_id=${config?.selectVehicle?.id}`;
      const response = await postFormData(url, formData);
      if (response && response.data && response.data.status) {
        const newMessage = response.data.data;
        dispatch(addMessage({ chatId, message: newMessage }));
        setInputText('');
        setImageToUpload(null);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('Send Message Error Response:', response);
        errorHandler(response || { message: 'Network Error' });
      }
    } catch (error) {
      console.log('Send Message Catch Error:', error);
      errorHandler(error);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = String(item.sender.id) === String(user.user_id);
    const time = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const isImage = item.file_type === 'image' && item.file;
    const isVoice = item.file_type === 'voice' && item.file;

    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          { alignItems: isMe ? 'flex-end' : 'flex-start' },
          isImage && styles.imageBubble
        ]}>
          {isImage ? (
            <TouchableOpacity onPress={() => setSelectedImage(item.file)}>
              <Image
                source={{ uri: item.file }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : isVoice ? (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                onPress={() => playVoice(item.file, item.id)}
                style={styles.playButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {playingVoiceId === item.id && soundState.status === 'playing' ? (
                  <PauseIcon width={wp(5)} height={wp(5)} fill={colors.neonTeal300} />
                ) : (
                  <PlayIcon width={wp(5)} height={wp(5)} fill={colors.neonTeal300} />
                )}
              </TouchableOpacity>
              <View style={styles.voiceWaveform}>
                {playingVoiceId === item.id && (
                  <View
                    style={[
                      styles.voiceProgressBar,
                      { width: `${(soundState.currentPosition / soundState.duration) * 100}%` }
                    ]}
                  />
                )}
              </View>
            </View>
          ) : (
            <CustomText style={styles.messageText}>
              {item.content}
            </CustomText>
          )}
          <CustomText style={[
            styles.timeText,
            isMe ? styles.myTimeText : styles.otherTimeText,
            isImage && styles.imageTimeText
          ]}>
            {time}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <CustomScreen>
      <CustomHeaderChat
        name={partner ? `${partner.first_name} ${partner.last_name}` : ''}
        image={partner?.profile_image}
        status={partner ? 'Online' : 'Offline'}
        backPress={() => navigation.goBack()}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.neonTeal300} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? hp(8) : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {imageToUpload && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageToUpload.uri }} style={styles.previewThumb} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                  <CancelIcon1 width={wp(5)} height={wp(5)} fill={colors.white} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              {isRecording ? (
                <View style={styles.recordingContainer}>
                  <TouchableOpacity
                    onPress={() => stopRecording(false)}
                    style={styles.cancelRecBtn}>
                    <CancelIcon1 width={wp(6)} height={wp(6)} fill={colors.red} />
                  </TouchableOpacity>
                  <View style={styles.recordingTimer}>
                    <View style={styles.recordingDot} />
                    <CustomText style={styles.recordingTimeText}>
                      {mmssRec(Math.floor(recorderState.currentPosition / 1000))}
                    </CustomText>
                  </View>
                  <TouchableOpacity
                    onPress={() => stopRecording(true)}
                    style={styles.sendRecBtn}>
                    <ArrowSend width={wp(6)} height={wp(6)} fill={colors.black} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.input}>
                  <TextInput
                    style={styles.input1}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={"Type a message"}
                    placeholderTextColor={colors.neutral400}
                    returnKeyType="send"
                    onSubmitEditing={sendMessage}
                  />
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.sendButton1}>
                    <PaperClip width={wp(4.6)} height={wp(4.6)} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={startRecording}
                    style={[styles.sendButton1, { marginLeft: wp(1) }]}>
                    <VoiceRecord width={wp(7.5)} height={wp(7.5)} />
                  </TouchableOpacity>
                </View>
              )}
              {!isRecording && (
                <TouchableOpacity
                  onPress={sendMessage}
                  style={styles.sendButton}>
                  <ArrowSend width={wp(5)} height={wp(5)} />
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      <Modal
        isVisible={!!selectedImage}
        onBackdropPress={() => setSelectedImage(null)}
        onBackButtonPress={() => setSelectedImage(null)}
        style={styles.modal}
        useNativeDriver
        hideModalContentWhileAnimating
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <CancelIcon1 width={wp(7)} height={wp(7)} />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <TakePictureModal
        isVisible={showPictureModal}
        onBackdropPress={() => setShowPictureModal(false)}
        onSelect={onImageSelect}
      />
    </CustomScreen>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    paddingTop: hp(1),
  },
  messageContainer: {
    marginVertical: hp(0.6),
    flexDirection: 'row',
    width: '100%',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: wp(75),
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(4),
    borderRadius: wp(7),
  },
  myMessageBubble: {
    backgroundColor: "#D1FFF4",
    borderBottomRightRadius: wp(0.5),
  },
  otherMessageBubble: {
    backgroundColor: colors.neutral100,
    borderBottomLeftRadius: wp(0.5),
  },
  messageText: {
    fontSize: wp(4),
    lineHeight: wp(5),
    color: colors.neutral800
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.neutral900,
  },
  timeText: {
    fontSize: wp(3),
    marginTop: hp(0.5),
  },
  myTimeText: {
    color: colors.neutral600,
  },
  otherTimeText: {
    color: colors.neutral500,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    backgroundColor: colors.white,
    paddingBottom: hp(2),
  },
  input: {
    flex: 1,
    height: hp(5.1),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingHorizontal: wp(2),
    fontSize: wp(4),
    color: colors.neutral900,
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: colors.neutral200,
    flexDirection: "row"
  },
  input1: {
    height: hp(5.1),
    fontSize: wp(4),
    color: colors.neutral900,
    width: wp(61)
  },
  sendButton: {
    width: hp(5.1),
    height: hp(5.1),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(20),
    backgroundColor: colors.black,
  },
  sendButton1: {
    width: hp(3.2),
    height: hp(5.1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flexDirection: 'row',
    padding: wp(4),
    backgroundColor: colors.neutral100,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    alignItems: 'center',
  },
  previewThumb: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(2),
    marginRight: wp(2),
  },
  removeImageBtn: {
    position: 'absolute',
    top: hp(1),
    left: wp(14),
    backgroundColor: colors.red,
    borderRadius: wp(3),
    padding: wp(0.5),
  },
  imageBubble: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(1),
    overflow: 'hidden',
  },
  chatImage: {
    width: wp(65),
    height: wp(50),
    borderRadius: wp(6),
  },
  imageTimeText: {
    position: 'absolute',
    bottom: hp(1),
    right: wp(3),
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: wp(2),
    borderRadius: wp(2),
    color: colors.white,
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(100),
    height: hp(100),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: hp(6),
    right: wp(5),
    zIndex: 10,
    padding: wp(2),
  },
  previewImage: {
    width: wp(100),
    height: hp(80),
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.5),
    width: wp(50),
  },
  playButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveform: {
    flex: 1,
    height: hp(0.5),
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: wp(3),
    borderRadius: wp(1),
    overflow: 'hidden',
  },
  voiceProgressBar: {
    height: '100%',
    backgroundColor: colors.neonTeal300,
  },
  recordingContainer: {
    flex: 1,
    height: hp(5.1),
    backgroundColor: colors.black,
    borderRadius: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    marginRight: wp(2),
  },
  cancelRecBtn: {
    padding: wp(1),
  },
  recordingTimer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: colors.red,
    marginRight: wp(2),
  },
  recordingTimeText: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: colors.white,
  },
  sendRecBtn: {
    padding: wp(1),
  },
});
