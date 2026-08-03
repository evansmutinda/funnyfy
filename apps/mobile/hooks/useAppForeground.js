import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function useAppForeground() {
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setForeground(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  return foreground;
}
