// Polyfills must load before purchases-js (Expo Go browser mode).
import '../polyfills';
import { Linking, Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const ANDROID_PACKAGE = 'com.evansks.funnyfyapp';

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

  // Verbose logs are useful when debugging purchases; WARN hides internal tracking noise
  Purchases.setLogLevel(LOG_LEVEL.WARN);

  console.log('[RevenueCat] Configuring with key prefix:', apiKey.slice(0, 8) + '...');

  Purchases.configure({
    apiKey,
    appUserID: appUserId || null,
  });
}

export async function isConfigured() {
  return Purchases.isConfigured();
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

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}

export async function getAppUserId() {
  try {
    const info = await Purchases.getCustomerInfo();
    return info?.originalAppUserId || null;
  } catch {
    return null;
  }
}

// Link RevenueCat customer to our backend user UUID (transfers anonymous purchases)
export async function loginUser(appUserId) {
  if (!appUserId) return null;
  const result = await Purchases.logIn(appUserId);
  console.log('[RevenueCat] logIn complete, created:', result?.created, 'userId:', appUserId);
  return result?.customerInfo || null;
}

export function tierFromProductId(productId) {
  const lower = (productId || '').toLowerCase();
  if (lower.includes('starter')) return 'starter';
  if (lower.includes('popular')) return 'popular';
  if (lower.includes('pro')) return 'pro';
  return 'starter';
}

// Resolve active subscription details from CustomerInfo (entitlements or activeSubscriptions)
export function getActiveSubscriptionDetails(customerInfo) {
  if (!customerInfo) return null;

  const activeEntitlements = customerInfo.entitlements?.active || {};
  const entitlementValues = Object.values(activeEntitlements);
  if (entitlementValues.length > 0) {
    const ent = entitlementValues.find((e) => e?.productIdentifier) || entitlementValues[0];
    if (ent?.productIdentifier) {
      return {
        productIdentifier: ent.productIdentifier,
        expirationDate: ent.expirationDate || customerInfo.allExpirationDates?.[ent.productIdentifier] || null,
      };
    }
  }

  const activeSubs = customerInfo.activeSubscriptions;
  if (Array.isArray(activeSubs) && activeSubs.length > 0) {
    const productId = activeSubs[0];
    return {
      productIdentifier: productId,
      expirationDate: customerInfo.allExpirationDates?.[productId] || null,
    };
  }

  const purchased = customerInfo.allPurchasedProductIdentifiers;
  if (Array.isArray(purchased) && purchased.length > 0) {
    const productId = purchased[purchased.length - 1];
    return {
      productIdentifier: productId,
      expirationDate: customerInfo.allExpirationDates?.[productId] || null,
    };
  }

  return null;
}

/** Active entitlement billing flags from RevenueCat (source of truth for auto-renew). */
export function getSubscriptionBillingState(customerInfo) {
  if (!customerInfo) return null;

  const activeEntitlements = customerInfo.entitlements?.active || {};
  const entitlementValues = Object.values(activeEntitlements);
  const ent = entitlementValues.find((e) => e?.productIdentifier) || entitlementValues[0];
  if (!ent?.productIdentifier) return null;

  return {
    productIdentifier: ent.productIdentifier,
    expirationDate: ent.expirationDate || customerInfo.allExpirationDates?.[ent.productIdentifier] || null,
    willRenew: ent.willRenew !== false,
    cancelAtPeriodEnd: ent.willRenew === false,
    managementURL: customerInfo.managementURL || null,
  };
}

export function getSubscriptionManagementURL(customerInfo) {
  const billing = getSubscriptionBillingState(customerInfo);
  if (billing?.managementURL) return billing.managementURL;

  if (Platform.OS === 'android') {
    const productId = billing?.productIdentifier;
    let url = `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;
    if (productId) {
      url += `&sku=${encodeURIComponent(productId)}`;
    }
    return url;
  }
  return 'https://apps.apple.com/account/subscriptions';
}

export function getStoreSubscriptionLabel() {
  return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
}

/** Open Google Play / App Store subscription management (required to cancel auto-renew). */
export async function openSubscriptionManagement(customerInfo) {
  const billing = getSubscriptionBillingState(customerInfo);
  const candidates = [
    getSubscriptionManagementURL(customerInfo),
    Platform.OS === 'android'
      ? `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`
      : null,
    Platform.OS === 'android' && billing?.productIdentifier
      ? `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}&sku=${encodeURIComponent(billing.productIdentifier)}`
      : null,
  ].filter(Boolean);

  let lastError = null;
  for (const url of candidates) {
    try {
      // canOpenURL often returns false on Android 11+ without manifest
      // queries — openURL still works, so try directly.
      await Linking.openURL(url);
      return;
    } catch (err) {
      lastError = err;
      console.warn('[RevenueCat] openURL failed:', url, err?.message || err);
    }
  }

  throw lastError || new Error('Cannot open subscription management URL');
}
