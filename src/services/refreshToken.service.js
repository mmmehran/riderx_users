import urls from "./urls.json";
import { getData } from "./common.service";

export const refreshAccessToken = async () => {
   try {
      const resRefreshToken = await getData(urls.REFRESH_TOKEN);
      return resRefreshToken;
   } catch (e) {
      return false;
   }
};

export default {
   refreshAccessToken,
};
