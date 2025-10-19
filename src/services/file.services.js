import http from "./http.service";
import { addContentTypeFormData, addContentTypeJson } from "./defaultAxios";

export const uploadFile = async (url, value) => {
   addContentTypeFormData();
   const data = new FormData();
   if (!value?.assets) {
      data.append("File", {
         uri: value[0]?.uri,
         name: 'upload.pdf' ,
         type: value[0].type,
      });
      data.append('Description', 'ok');
   } else {
      data.append("File", {
         uri: value?.assets[0]?.uri,
         name: value?.assets[0].fileName,
         type: value?.assets[0].type,
      });
      data.append('Description', 'ok');
   }
   try {
      const response = await http.post(url, data)
      addContentTypeJson()
      return response?.data
   } catch (error) {
      console.log('errorUploadVideo: ' + error);
      return false
   }
};

