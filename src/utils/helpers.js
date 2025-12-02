import Toast from "react-native-toast-message";

// utils/platform.js
import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const apiLevel = isAndroid ? Number(Platform.Version) : 0;
export const isAndroid15Plus = isAndroid && apiLevel >= 35;


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


export const timeAgoShort = (isoString, now = new Date()) => {
  // "2025-10-28T14:13:51.774352+01:00" -> "11 min ago"
  // Normalize fractional seconds to max 3 digits so Date() parses reliably
  const safe = isoString.replace(/(\.\d{3})\d+/, '$1');

  const then = new Date(safe);
  if (isNaN(then)) return ''; // invalid input

  let diffMs = now - then; // positive => past, negative => future
  const past = diffMs >= 0;
  diffMs = Math.abs(diffMs);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return past ? `${sec}s ago` : `in ${sec}s`;

  const min = Math.floor(sec / 60);
  if (min < 60) return past ? `${min} min ago` : `in ${min} min`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return past ? `${hr} h ago` : `in ${hr} h`;

  const day = Math.floor(hr / 24);
  if (day < 7) return past ? `${day} d ago` : `in ${day} d`;

  const wk = Math.floor(day / 7);
  if (wk < 5) return past ? `${wk} wk ago` : `in ${wk} wk`;

  const mo = Math.floor(day / 30);
  if (mo < 12) return past ? `${mo} mo ago` : `in ${mo} mo`;

  const yr = Math.floor(day / 365);
  return past ? `${yr} yr ago` : `in ${yr} yr`;

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

export const isoTo12Hour = (isoString) => {
     const d = new Date(isoString);

  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // convert 0 → 12 for midnight
  minutes = String(minutes).padStart(2, "0");

  return `${hours}:${minutes} ${ampm}`;
}

export const formatDdMon = (iso) => {
    const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]}`;
}

export const  normalizeLabel = (s = "") => {
  // drop a leading boolean-y "is"/"has" (isSecure -> Secure, hasGPS -> GPS)
  const dropped = s.replace(/^(is|has)(?=[A-Z_-\s])/i, "");

  // split camelCase into words
  const splitCamel = dropped.replace(/([a-z])([A-Z])/g, "$1 $2");

  // unify separators to space
  const spaced = splitCamel.replace(/[_-]+/g, " ").trim();

  // title-case words, but keep all-caps (e.g., GPS) as-is
  return spaced
    .split(/\s+/)
    .map(w => (/[A-Z]{2,}/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
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

export const capitalizeFirstLetter = (string) => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
}
