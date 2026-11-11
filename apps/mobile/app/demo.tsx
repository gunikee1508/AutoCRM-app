import { stages as statusLabels } from '@autocrm/core/domain';
/** AutoCRM: first native UX preview. Demo state only; no production authentication or API. */
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Role = 'workshop' | 'customer';
type Status = (typeof statusLabels)[keyof typeof statusLabels];
const stages = Object.values(statusLabels);
const C = { navy: '#101A2F', blue: '#3264EC', teal: '#0EA98D', ink: '#15213A', muted: '#75839B', surface: '#F5F7FB', line: '#E6EBF3', white: '#FFFFFF' };

export default function AutoCRMPreview() {
  const [role, setRole] = useState<Role>('workshop');
  const [status, setStatus] = useState<Status>('Em manutenção');
  const [customer, setCustomer] = useState('João Silva');
  const [vehicle, setVehicle] = useState('Chevrolet Onix 2021');
  const [service, setService] = useState('Troca de óleo e filtros');
  const [shop, setShop] = useState('Oficina Silva');
  const [address, setAddress] = useState('Rua Exemplo, 150 — Centro, Rio de Janeiro/RJ');
  const [channel, setChannel] = useState<'business' | 'personal'>('business');
  const [notification, setNotification] = useState('Nenhum aviso recente');
  const [editing, setEditing] = useState(false);
  function updateStatus(next: Status) {
    if (status === next) return;
    setStatus(next);
    if (next === 'Pronto para retirada') {
      setNotification('Aviso de retirada preparado (simulação)');
      Alert.alert('Manutenção concluída', channel === 'business'
        ? 'Na versão conectada, e-mail e WhatsApp Business serão enviados automaticamente, após as verificações necessárias. Nesta prévia não há envio real.'
        : 'E-mail será automático na versão conectada. A mensagem do WhatsApp normal precisará ser enviada manualmente. Nesta prévia não há envio real.');
    } else {
      setNotification(`Status atualizado: ${next}`);
    }
  }
  return <View style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor={C.white} />
    <View style={styles.header}>
      <View style={styles.brandSymbol}><Text style={styles.brandSymbolText}>A<Text style={{ color: '#49E2CC' }}>✦</Text></Text></View>
      <View style={{ flex: 1 }}><Text style={styles.brandText}>auto<Text style={{ color: C.blue }}>crm</Text></Text><Text style={styles.brandSub}>CONNECT · DEMO</Text></View>
      <View style={styles.rolePill}><TouchableOpacity onPress={() => setRole('workshop')} style={[styles.roleButton, role === 'workshop' && styles.roleActive]}><Text style={[styles.roleText, role === 'workshop' && styles.roleTextActive]}>Oficina</Text></TouchableOpacity><TouchableOpacity onPress={() => setRole('customer')} style={[styles.roleButton, role === 'customer' && styles.roleActive]}><Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Cliente</Text></TouchableOpacity></View>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {role === 'workshop' ? <>
        <Text style={styles.overline}>GESTÃO DA OFICINA</Text>
        <Text style={styles.title}>Tudo sob controle. 👋</Text>
        <Text style={styles.subtitle}>Atualize o atendimento e informe seu cliente em segundos.</Text>
        <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricIcon}>⚒</Text><Text style={styles.metricNumber}>01</Text><Text style={styles.metricLabel}>Em atendimento</Text></View><View style={styles.metric}><Text style={styles.metricIcon}>✉</Text><Text style={styles.metricNumber}>{status === 'Pronto para retirada' ? '01' : '00'}</Text><Text style={styles.metricLabel}>Pronto para retirada</Text></View></View>
        <View style={styles.card}><View style={styles.cardTop}><View><Text style={styles.cardHeading}>Atendimento #0128</Text><Text style={styles.meta}>{customer} · Exemplo fictício</Text></View><Text style={styles.car}>🚘</Text></View>
          {editing ? <><Text style={styles.label}>Cliente</Text><TextInput value={customer} onChangeText={setCustomer} style={styles.input} /><Text style={styles.label}>Veículo</Text><TextInput value={vehicle} onChangeText={setVehicle} style={styles.input}/><Text style={styles.label}>Serviço realizado</Text><TextInput value={service} onChangeText={setService} style={styles.input}/><TouchableOpacity style={styles.primaryButton} onPress={() => setEditing(false)}><Text style={styles.primaryText}>Salvar dados do serviço</Text></TouchableOpacity></> : <><Text style={styles.vehicle}>{vehicle}</Text><Text style={styles.meta}>{service}</Text><TouchableOpacity onPress={() => setEditing(true)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Editar dados do serviço</Text></TouchableOpacity></>}
          <View style={styles.separator}/><Text style={styles.label}>Status da manutenção</Text><View style={styles.statusList}>{stages.map(s => <TouchableOpacity key={s} onPress={() => updateStatus(s)} style={[styles.statusButton, status === s && styles.statusSelected]}><Text style={[styles.statusLabel, status === s && styles.statusLabelSelected]}>{s === 'Pronto para retirada' ? '✓ ' : ''}{s}</Text></TouchableOpacity>)}</View>
        </View>
        <View style={styles.card}><Text style={styles.cardHeading}>Canal de comunicação</Text><Text style={styles.meta}>Como a oficina pretende enviar o aviso</Text><View style={styles.twoButtons}><TouchableOpacity onPress={() => setChannel('business')} style={[styles.channel, channel === 'business' && styles.channelSelected]}><Text style={styles.channelText}>Business + API</Text></TouchableOpacity><TouchableOpacity onPress={() => setChannel('personal')} style={[styles.channel, channel === 'personal' && styles.channelSelected]}><Text style={styles.channelText}>WhatsApp normal</Text></TouchableOpacity></View><Text style={styles.hint}>{channel === 'business' ? 'Automatização disponível após integração oficial e autorização de contato.' : 'Mensagem preparada para envio manual; o e-mail será automático no sistema real.'}</Text></View>
        <View style={styles.card}><Text style={styles.cardHeading}>Dados da oficina</Text><Text style={styles.label}>Nome</Text><TextInput style={styles.input} value={shop} onChangeText={setShop}/><Text style={styles.label}>Endereço para retirada</Text><TextInput style={styles.input} value={address} onChangeText={setAddress} multiline/><Text style={styles.hint}>Estes dados são compartilhados com a prévia do cliente.</Text></View>
        <View style={styles.note}><Text style={styles.noteText}>⚡ Última atividade: {notification}</Text></View>
      </> : <>
        <Text style={styles.overline}>ÁREA DO MOTORISTA</Text><Text style={styles.title}>Meu veículo</Text><Text style={styles.subtitle}>Acompanhe sua manutenção, sem precisar ligar para a oficina.</Text>
        <View style={styles.hero}><Text style={styles.heroBadge}>🚘  SEU VEÍCULO</Text><Text style={styles.heroTitle}>{vehicle}</Text><Text style={styles.heroSub}>{shop} · OS #0128</Text></View>
        <View style={styles.card}><Text style={styles.cardHeading}>Acompanhamento</Text>{stages.map((s,i) => {const step=stages.indexOf(status),current=i===step;return <View key={s} style={styles.step}><View style={[styles.stepCircle, i<=step && { backgroundColor: current ? C.blue : '#DFF8F1' }]}><Text style={[styles.stepSymbol, i<=step && { color: current ? C.white : C.teal }]}>{i<step ? '✓' : current ? '●' : '○'}</Text></View><View style={{ flex:1 }}><Text style={[styles.stepTitle, i>step && { color: '#9EAAC0' }]}>{s}</Text><Text style={styles.meta}>{current ? 'Etapa atual do atendimento' : i<step ? 'Etapa concluída' : 'Aguardando atualização'}</Text></View></View>})}</View>
        {status === 'Pronto para retirada' && <View style={styles.ready}><Text style={styles.readyTitle}>✓ Seu carro está pronto!</Text><Text style={styles.readyText}>A oficina informou que você já pode buscar o veículo.</Text></View>}
        <View style={styles.card}><Text style={styles.cardHeading}>Local de retirada</Text><Text style={styles.vehicle}>{shop}</Text><Text style={styles.meta}>{address}</Text><View style={styles.separator}/><Text style={styles.cardHeading}>Serviço realizado</Text><Text style={styles.meta}>{service}</Text></View>
        <View style={styles.card}><Text style={styles.cardHeading}>Fotos do serviço</Text><View style={styles.photos}><View style={styles.photo}><Text style={styles.photoText}>▧\nAntes</Text></View><View style={styles.photo}><Text style={styles.photoText}>▧\nDurante</Text></View><View style={styles.photo}><Text style={styles.photoText}>▧\nDepois</Text></View></View><Text style={styles.hint}>Fotos aparecerão após a oficina compartilhá-las.</Text></View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert('Agendamento', 'Esta é apenas a prévia visual. O agendamento real será conectado ao backend.') }><Text style={styles.primaryText}>Solicitar próximo atendimento →</Text></TouchableOpacity>
      </>}
      <Text style={styles.demoFooter}>AUTOCRM · PRÉVIA LOCAL · NÃO ENVIA MENSAGENS NEM ARMAZENA DADOS EM NUVEM</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface }, header: { paddingTop: 15, paddingHorizontal: 18, paddingBottom: 15, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, brandSymbol: { width: 39, height: 39, borderRadius: 12, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center' }, brandSymbolText: { color: C.white, fontSize: 21, fontWeight: '800' }, brandText: { fontSize: 19, fontWeight: '900', color: C.navy, letterSpacing: -0.8 }, brandSub: { fontSize: 8, color: C.muted, fontWeight: '800', letterSpacing: 1.4 }, rolePill: { flexDirection: 'row', borderRadius: 10, padding: 3, backgroundColor: '#F0F3F9' }, roleButton: { paddingVertical: 8, paddingHorizontal: 9, borderRadius: 8 }, roleActive: { backgroundColor: C.navy }, roleText: { fontSize: 10, color: C.muted, fontWeight: '800' }, roleTextActive: { color: C.white },
  content: { padding: 17, paddingBottom: 50, gap: 14 }, overline: { fontSize: 10, color: C.blue, letterSpacing: 2, fontWeight: '900', marginTop: 10 }, title: { fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.5 }, subtitle: { fontSize: 12, color: C.muted, lineHeight: 19, marginBottom: 6 }, metrics: { flexDirection: 'row', gap: 12 }, metric: { backgroundColor: C.white, flex: 1, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 17 }, metricIcon: { fontSize: 22, color: C.blue }, metricNumber: { fontSize: 29, fontWeight: '900', color: C.navy, marginTop: 7 }, metricLabel: { color: C.muted, fontSize: 11, marginTop: 3 },
  card: { padding: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, gap: 10 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardHeading: { color: C.ink, fontSize: 16, fontWeight: '800' }, meta: { color: C.muted, fontSize: 12, lineHeight: 19 }, car: { fontSize: 31 }, vehicle: { color: C.ink, fontSize: 17, fontWeight: '800' }, separator: { height: 1, backgroundColor: C.line, marginVertical: 4 }, label: { fontSize: 12, fontWeight: '800', color: '#586B86' }, input: { borderWidth: 1, borderColor: '#DEE4EF', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: C.ink, fontSize: 13 }, primaryButton: { backgroundColor: C.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 2 }, primaryText: { color: C.white, fontWeight: '800', fontSize: 13 }, secondaryButton: { marginTop: 8, backgroundColor: '#EDF2FF', padding: 12, borderRadius: 11, alignItems: 'center' }, secondaryText: { color: C.blue, fontSize: 12, fontWeight: '800' }, statusList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, statusButton: { backgroundColor: '#F2F5FA', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' }, statusSelected: { backgroundColor: '#EAF1FF', borderColor: '#B9CAFA' }, statusLabel: { color: '#71819B', fontWeight: '700', fontSize: 11 }, statusLabelSelected: { color: '#2452C8' }, twoButtons: { flexDirection: 'row', gap: 8 }, channel: { flex: 1, borderRadius: 11, backgroundColor: '#F4F7FC', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' }, channelSelected: { borderColor: '#B8C9F9', backgroundColor: '#E9F0FF' }, channelText: { fontSize: 11, fontWeight: '800', color: C.ink }, hint: { color: C.muted, fontSize: 11, lineHeight: 18 }, note: { backgroundColor: '#EAF2FF', padding: 14, borderRadius: 12 }, noteText: { color: '#5274A8', fontSize: 12 },
  hero: { backgroundColor: '#172B59', padding: 25, borderRadius: 20, gap: 8 }, heroBadge: { fontSize: 10, fontWeight: '800', color: '#AFC8FF', letterSpacing: 1.6 }, heroTitle: { fontSize: 25, fontWeight: '900', color: C.white }, heroSub: { color: '#C6D5F5', fontSize: 12 }, step: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 7 }, stepCircle: { width: 33, height: 33, backgroundColor: '#EDF1F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, stepSymbol: { color: '#A7B3C7', fontSize: 16, fontWeight: '900' }, stepTitle: { color: C.ink, fontSize: 12, fontWeight: '800' }, ready: { padding: 16, borderRadius: 14, backgroundColor: '#E5F9F0', borderColor: '#B8EBD6', borderWidth: 1, gap: 4 }, readyTitle: { color: '#087A62', fontWeight: '900' }, readyText: { color: '#20866D', fontSize: 12 }, photos: { flexDirection: 'row', gap: 8 }, photo: { flex: 1, backgroundColor: '#F6F8FC', borderColor: '#D8E0EB', borderWidth: 1, borderStyle: 'dashed', borderRadius: 11, height: 78, alignItems: 'center', justifyContent: 'center' }, photoText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 22 }, demoFooter: { textAlign: 'center', color: '#A8B3C4', fontSize: 9, lineHeight: 15, marginTop: 16, letterSpacing: 0.7 }
});
