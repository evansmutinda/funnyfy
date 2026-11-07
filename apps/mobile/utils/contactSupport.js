import { Linking } from 'react-native';
import { SUPPORT_EMAIL } from '../constants';

export function openContactSupport(onUnavailable) {
  return Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(onUnavailable);
}

export function openStyleRequest(onUnavailable) {
  const subject = encodeURIComponent('Style request');
  const body = encodeURIComponent("Style I'd like:\n\n");
  return Linking.openURL(
    `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
  ).catch(onUnavailable);
}
