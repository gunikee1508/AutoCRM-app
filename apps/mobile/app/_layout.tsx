import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { mobileClient } from '../lib/auth';

void SplashScreen.preventAutoHideAsync().catch(() => {});
export default function Layout() {
  useEffect(() => {
    const hide = () => {
      void SplashScreen.hideAsync().catch(() => {});
    };
    const timeout = setTimeout(hide, 2000);
    if (mobileClient) {
      void mobileClient.auth.getSession().then(hide, hide);
    } else hide();
    function refresh(state: string) {
      if (state === 'active') void mobileClient?.auth.startAutoRefresh();
      else void mobileClient?.auth.stopAutoRefresh();
    }
    refresh(AppState.currentState);
    const listener = AppState.addEventListener('change', refresh);
    return () => {
      clearTimeout(timeout);
      listener.remove();
      void mobileClient?.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <Stack screenOptions={{ title: 'AutoCRM', headerTintColor: '#152647', headerBackTitle: 'Voltar' }}>
      <Stack.Screen name="oficina" options={{ title: 'Oficina' }} />
      <Stack.Screen name="motorista" options={{ title: 'Motorista' }} />
      <Stack.Screen name="demo" options={{ title: 'Demonstração' }} />
    </Stack>
  );
}
