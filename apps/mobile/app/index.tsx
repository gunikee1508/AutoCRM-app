import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { styles } from '../ui/Portal';

export default function Home() {
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.kicker}>AUTOCRM CONNECT</Text><Text style={styles.title}>Seu atendimento</Text><Text style={styles.subtitle}>Escolha a área vinculada à sua conta.</Text></View>
    <View style={styles.card}>
      <Link style={styles.heading} href="/oficina">Painel da oficina →</Link>
      <Link style={styles.heading} href="/motorista">Área do motorista →</Link>
    </View>
    <Link href="/demo">Explorar demonstração com dados fictícios</Link>
  </ScrollView>;
}
