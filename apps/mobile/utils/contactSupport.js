import { Linking } from 'react-native';
import { SUPPORT_EMAIL } from '../constants';

export function openSupportEmail({ subject } = {}, onUnavailable) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return Linking.openURL(`mailto:${SUPPORT_EMAIL}${query}`).catch(onUnavailable);
}

export function openContactSupport(onUnavailable) {
  return openSupportEmail({}, onUnavailable);
}

export function openStyleRequest(onUnavailable) {
  return openSupportEmail({ subject: 'Style request' }, onUnavailable);
}
