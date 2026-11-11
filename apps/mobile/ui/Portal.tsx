import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { portals, type Area } from '@autocrm/core/domain';
import { Workspace } from '@autocrm/core/workspace';
import { kit, styles } from './portal-kit';
export { styles } from './portal-kit';

export default function Portal({ area }: { area: Area }) {
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
      <Workspace
        kit={kit}
        area={area}
        initialCode={convite}
        url={process.env.EXPO_PUBLIC_SUPABASE_URL}
        publicKey={process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
      />
    </ScrollView>
  );
}
