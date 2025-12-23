import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export function hasRevenueCatKey() {
  return Boolean(IOS_KEY || ANDROID_KEY);
}

// Initialize RevenueCat SDK
export async function initRevenueCat(appUserId) {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] Missing SDK key, skipping init');
    return;
  }

  await Purchases.configure({
    apiKey,
    appUserID: appUserId || null, // replace with real user id when auth is added
  });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings?.current?.availablePackages || [];
}

export async function purchasePackage(pkg) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}
