import { Stack } from 'expo-router';
export default function Layout() {
  return <Stack screenOptions={{ title: 'AutoCRM', headerTintColor: '#152647', headerBackTitle: 'Voltar' }}>
    <Stack.Screen name="oficina" options={{ title: 'Oficina' }}/>
    <Stack.Screen name="motorista" options={{ title: 'Motorista' }}/>
    <Stack.Screen name="demo" options={{ title: 'Demonstração' }}/>
  </Stack>;
}
