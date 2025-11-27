import http from "./http.service";
import { addContentTypeFormData, addContentTypeJson } from "./defaultAxios";

export const uploadFile = async (url, value) => {
   addContentTypeFormData();
   const data = new FormData();
      data.append("profile_image", {
         uri: value?.assets[0]?.uri,
         name: value?.assets[0].fileName,
         type: value?.assets[0].type,
      });
   try {
      const response = await http.post(url, data)
      addContentTypeJson()
      return response?.data
   } catch (error) {
      console.log('errorUploadVideo: ' + error);
      return false
   }
};

