import defaultAxios from "./defaultAxios";
import checkToken from '../utils/checkToken';

const generateRequest = async (func, args, setAuthorization) => {
   if (!setAuthorization) {
      return defaultAxios.instance[func](...args);
   }
   // await checkToken();
   return defaultAxios.instanceWithAuthorization[func](...args);
};

const http = {
   get: (url, setAuthorization = true) => {
      return generateRequest("get", [url], setAuthorization);
   },
   post: (url, data, setAuthorization = true) => {
      return generateRequest("post", [url, data], setAuthorization);
   },
   put: (url, data, setAuthorization = true) => {
      return generateRequest("put", [url, data], setAuthorization);
   },
   delete: (url, setAuthorization = true) => {
      return generateRequest("delete", [url], setAuthorization);
   },
};

export default http;
