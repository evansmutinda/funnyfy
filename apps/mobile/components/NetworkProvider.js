import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import OfflineBanner from './OfflineBanner';
import { isNetworkOnline } from '../utils/network';

const NetworkContext = createContext({ isOnline: true });

export function useNetwork() {
  return useContext(NetworkContext);
}

export default function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const apply = (state) => setIsOnline(isNetworkOnline(state));

    const unsubscribe = NetInfo.addEventListener(apply);
    NetInfo.fetch().then(apply).catch(() => {});

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
      <OfflineBanner />
    </NetworkContext.Provider>
  );
}
