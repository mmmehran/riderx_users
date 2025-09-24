import http from "./http.service";
import defaultAxios from "./defaultAxios";

export const getData = async (url, setAuthorization = true) => {
   try {
      const response = await http.get(url, setAuthorization);
      return response;
   } catch (e) {
      return false;
   }
};

export const postData = async (url, data, setAuthorization = true) => {
   try {
      const response = await http.post(url, data, setAuthorization);
      return response
   } catch (error) {
      return false;
   }
};

export const putData = async (url, data, setAuthorization = true) => {
   try {
      const response = await http.put(url, data, setAuthorization);
      return response
   } catch (error) {
      return false;
   }
};


export const externalRequest = async (url, method) => {
   try {
      const response = await defaultAxios.emptyInstance[method](url);
      return response?.data || response;
   } catch (error) {
      a
      return error;
   }
};

export const deleteData = async (url, setAuthorization = true) => {
   try {
      const response = await http.delete(url, setAuthorization);
      return response;
   } catch (error) {
      return false;
   }
};

export const sendData = async (url, data, setAuthorization = true) => {
   try {
      const response = await http.put(url, data, setAuthorization);
      return response;
   } catch (e) {
      return false;
   }
};


export default {
   getData,
   postData,
   putData,
   externalRequest,
   sendData,
   deleteData
};
