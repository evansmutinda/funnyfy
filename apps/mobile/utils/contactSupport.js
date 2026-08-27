import { Linking } from 'react-native';
import { SUPPORT_EMAIL } from '../constants';

export function openContactSupport(onUnavailable) {
  return Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(onUnavailable);
}
