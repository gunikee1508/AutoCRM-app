import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { portals, statusLabel, type Area } from '@autocrm/core/domain';
import { usePortal } from '@autocrm/core/use-portal';

function Action({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

export default function Portal({ area }: { area: Area }) {
  const view = portals[area];
  const portal = usePortal(area, process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.kicker}>AUTOCRM CONNECT</Text><Text accessibilityRole="header" style={styles.title}>{view.title}</Text><Text style={styles.subtitle}>{view.description}</Text></View>
    <View style={styles.card}>
      {!portal.configured ? <><Text style={styles.heading}>Acesso em configuração</Text><Text>A demonstração está disponível na tela inicial.</Text></>
      : !portal.sessionId ? <>
        <Text style={styles.heading}>Entre na sua conta</Text><Text>E-mail</Text>
        <TextInput accessibilityLabel="E-mail" style={styles.input} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail}/>
        <Text>Senha</Text><TextInput accessibilityLabel="Senha" style={styles.input} secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword}/>
        <Action title={portal.busy ? 'Entrando…' : 'Entrar'} disabled={portal.busy || !email.trim() || !password} onPress={async () => { await portal.login(email, password); setPassword(''); }}/>
      </> : <><Text style={styles.heading}>Atendimentos recentes</Text>
        {portal.orders?.map(order => <View key={order.id} style={styles.row}><Text style={styles.heading}>{order.service_description}</Text><Text>{statusLabel(order.status)}</Text></View>)}
        {!portal.orders && !portal.message && <Text>Carregando atendimentos…</Text>}
        {portal.orders?.length === 0 && <Text>{view.empty}</Text>}
        <Action title="Atualizar" onPress={portal.reload}/><Action title="Sair" onPress={portal.logout}/>
      </>}
      {Boolean(portal.message) && <Text accessibilityLiveRegion="polite">{portal.message}</Text>}
    </View>
  </ScrollView>;
}

export const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, gap: 16, backgroundColor: '#F5F7FB' },
  hero: { borderRadius: 22, padding: 24, backgroundColor: '#152647', gap: 10 },
  kicker: { color: '#78E5D6', fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  title: { color: 'white', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#D7E2F7', fontSize: 16, lineHeight: 24 },
  card: { padding: 20, gap: 12, borderRadius: 18, backgroundColor: 'white' },
  heading: { color: '#152647', fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#8694AA', color: '#101A2F', borderRadius: 10, padding: 12 },
  button: { minHeight: 48, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 18, backgroundColor: '#254FC4' },
  buttonText: { color: 'white', fontWeight: '700' },
  row: { borderBottomWidth: 1, borderColor: '#DAE2F0', paddingVertical: 10, gap: 4 },
});
