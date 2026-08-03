import { Share } from 'react-native';
import { APP_NAME, APP_STORE_LISTING_URL } from '../constants';

export async function shareApp() {
  const url = APP_STORE_LISTING_URL.trim();
  const message = url
    ? `Check out ${APP_NAME} — turn your photos into AI caricatures!\n${url}`
    : `Check out ${APP_NAME} — turn your photos into AI caricatures! (App store link coming soon.)`;

  return Share.share(
    url
      ? { message, url, title: `Share ${APP_NAME}` }
      : { message, title: `Share ${APP_NAME}` },
  );
}
