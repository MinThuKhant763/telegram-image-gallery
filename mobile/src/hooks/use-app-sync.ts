import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppSync() {
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => focusManager.setFocused(status === 'active');
    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);
    const netInfoSubscription = NetInfo.addEventListener((state) => onlineManager.setOnline(Boolean(state.isConnected)));

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, []);
}
