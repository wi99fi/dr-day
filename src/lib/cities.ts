export type City = { id: string; name: string; lat: number; lng: number; tz: string };

export const DEFAULT_CITY_ID = "damascus";

export const CITIES: City[] = [
  { id: "damascus", name: "دمشق", lat: 33.5138, lng: 36.2765, tz: "Asia/Damascus" },
  { id: "aleppo", name: "حلب", lat: 36.2021, lng: 37.1343, tz: "Asia/Damascus" },
  { id: "homs", name: "حمص", lat: 34.7324, lng: 36.7137, tz: "Asia/Damascus" },
  { id: "hama", name: "حماة", lat: 35.1318, lng: 36.7578, tz: "Asia/Damascus" },
  { id: "latakia", name: "اللاذقية", lat: 35.5317, lng: 35.7915, tz: "Asia/Damascus" },
  { id: "tartus", name: "طرطوس", lat: 34.889, lng: 35.8866, tz: "Asia/Damascus" },
  { id: "idlib", name: "إدلب", lat: 35.9306, lng: 36.6339, tz: "Asia/Damascus" },
  { id: "deir-ez-zor", name: "دير الزور", lat: 35.3359, lng: 40.1408, tz: "Asia/Damascus" },
  { id: "raqqa", name: "الرقة", lat: 35.9528, lng: 39.0079, tz: "Asia/Damascus" },
  { id: "hasakah", name: "الحسكة", lat: 36.5024, lng: 40.7477, tz: "Asia/Damascus" },
  { id: "qamishli", name: "القامشلي", lat: 37.0522, lng: 41.2318, tz: "Asia/Damascus" },
  { id: "daraa", name: "درعا", lat: 32.6189, lng: 36.1021, tz: "Asia/Damascus" },
  { id: "suwayda", name: "السويداء", lat: 32.709, lng: 36.5663, tz: "Asia/Damascus" },
  { id: "quneitra", name: "القنيطرة", lat: 33.126, lng: 35.824, tz: "Asia/Damascus" },
  { id: "amman", name: "عمّان", lat: 31.9454, lng: 35.9284, tz: "Asia/Amman" },
  { id: "beirut", name: "بيروت", lat: 33.8938, lng: 35.5018, tz: "Asia/Beirut" },
  { id: "baghdad", name: "بغداد", lat: 33.3152, lng: 44.3661, tz: "Asia/Baghdad" },
  { id: "riyadh", name: "الرياض", lat: 24.7136, lng: 46.6753, tz: "Asia/Riyadh" },
  { id: "jeddah", name: "جدة", lat: 21.4858, lng: 39.1925, tz: "Asia/Riyadh" },
  { id: "makkah", name: "مكة المكرمة", lat: 21.3891, lng: 39.8579, tz: "Asia/Riyadh" },
  { id: "madinah", name: "المدينة المنورة", lat: 24.5247, lng: 39.5692, tz: "Asia/Riyadh" },
  { id: "kuwait", name: "الكويت", lat: 29.3759, lng: 47.9774, tz: "Asia/Kuwait" },
  { id: "doha", name: "الدوحة", lat: 25.2854, lng: 51.531, tz: "Asia/Qatar" },
  { id: "dubai", name: "دبي", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai" },
  { id: "abu-dhabi", name: "أبوظبي", lat: 24.4539, lng: 54.3773, tz: "Asia/Dubai" },
  { id: "muscat", name: "مسقط", lat: 23.588, lng: 58.3829, tz: "Asia/Muscat" },
  { id: "cairo", name: "القاهرة", lat: 30.0444, lng: 31.2357, tz: "Africa/Cairo" },
  { id: "istanbul", name: "إسطنبول", lat: 41.0082, lng: 28.9784, tz: "Europe/Istanbul" },
  { id: "ankara", name: "أنقرة", lat: 39.9334, lng: 32.8597, tz: "Europe/Istanbul" },
  { id: "gaziantep", name: "غازي عنتاب", lat: 37.0662, lng: 37.3833, tz: "Europe/Istanbul" },
  { id: "berlin", name: "برلين", lat: 52.52, lng: 13.405, tz: "Europe/Berlin" },
  { id: "paris", name: "باريس", lat: 48.8566, lng: 2.3522, tz: "Europe/Paris" },
  { id: "london", name: "لندن", lat: 51.5074, lng: -0.1278, tz: "Europe/London" },
];

export const CUSTOM_CITY_ID = "custom";

export const findCity = (id: string) => CITIES.find((c) => c.id === id);
