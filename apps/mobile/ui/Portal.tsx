import { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { portals, type Area } from '@autocrm/core/domain';
import { Workspace } from '@autocrm/core/workspace';
import { mobileClient } from '../lib/auth';
import { kit, styles } from './portal-kit';
export { styles } from './portal-kit';

export default function Portal({ area }: { area: Area }) {
  const [wake, setWake] = useState(0);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') setWake((v) => v + 1);
    });
    return () => listener.remove();
  }, []);
  const { convite } = useLocalSearchParams<{ convite?: string }>();
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>
          {area === 'oficina' ? 'ÁREA PROFISSIONAL' : 'ÁREA DO MOTORISTA'}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {portals[area].title}
        </Text>
        <Text style={styles.subtitle}>
          {area === 'oficina'
            ? 'Sua oficina, seus clientes e sua equipe.'
            : 'Seus veículos e próximos atendimentos.'}
        </Text>
      </View>
      <Workspace wake={wake} kit={kit} area={area} initialCode={convite} client={mobileClient} />
    </ScrollView>
  );
}
