import Toast from "react-native-toast-message";

// utils/platform.js
import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const apiLevel = isAndroid ? Number(Platform.Version) : 0;
export const isAndroid15Plus = isAndroid && apiLevel === 35;


export const showError = (text) => {
    Toast.show({ type: "error", text2: text })
}

export const showToast = (message, type = "success") => {
    Toast.show({
        type: type,
        text2: message,
    });
}
export const showToastWarning = (message, type = "warning") => {
    Toast.show({
        type: type,
        text2: message,
    });
}

export const isoWithOffsetPlusMinutes = (minutes = 0) => {
     const d = new Date(Date.now() + minutes * 60_000);

  const pad2 = n => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  const h = pad2(d.getHours());
  const m = pad2(d.getMinutes());
  const s = pad2(d.getSeconds());

  // JS only has milliseconds; make it 6 digits by padding with 3 zeros
  const micro = String(d.getMilliseconds()).padStart(3, '0') + '000';

  // Timezone offset (+/-HH:MM)
  const tzMin = -d.getTimezoneOffset();
  const sign = tzMin >= 0 ? '+' : '-';
  const tzH = pad2(Math.floor(Math.abs(tzMin) / 60));
  const tzM = pad2(Math.abs(tzMin) % 60);

  return `${y}-${M}-${D}T${h}:${m}:${s}.${micro}${sign}${tzH}:${tzM}`;
}

export const convertDate = (isoString) => {

  const inputDate = new Date(isoString);
  const today = new Date();

  // Normalize times to midnight for comparison
  const inputDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = todayDay - inputDay;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    // Fallback to readable date
    return inputDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
 
}
}

export const getEnumAction = (input, input2) => {
    const match = input?.find((item) => item?.id == input2?.actionTypeId);
    if (!match) return "";

    return input2?.attendanceTypeId == 2
        ? match?.textButtons[1]?.text
        : match?.textButtons[0]?.text
};



export const  parseSocketUrl = (full) => {
  try {
    const u = new URL(full);
    const roomId = u.searchParams.get('roomId');
    const baseUrl = `${u.protocol}//${u.host}${u.pathname.replace(/\/$/, '') || ''}`;
    return { baseUrl, roomId };
  } catch (e) {
    // fallback if a raw string comes without protocol, etc.
    const [urlPart, qs] = String(full || '').split('?');
    const roomId = (qs || '').split('&').map(kv => kv.split('='))
      .reduce((acc,[k,v]) => (k==='roomId'? decodeURIComponent(v||''):acc), null);
    return { baseUrl: urlPart, roomId };
  }
}
