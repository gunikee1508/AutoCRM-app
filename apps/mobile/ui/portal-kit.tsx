import { useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Kit } from '@autocrm/core/kit';

export const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, gap: 16, backgroundColor: '#F5F7FB' },
  hero: { borderRadius: 22, padding: 24, backgroundColor: '#152647', gap: 10 },
  kicker: { color: '#78E5D6', fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  title: { color: 'white', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#D7E2F7', fontSize: 16, lineHeight: 24 },
  card: {
    padding: 20,
    gap: 14,
    borderRadius: 18,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDE4EE',
  },
  heading: { color: '#152647', fontSize: 20, fontWeight: '700' },
  body: { color: '#43536A', fontSize: 15, lineHeight: 22 },
  label: { color: '#223653', fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#9AA8B9',
    color: '#101A2F',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
    backgroundColor: '#FBFCFE',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#254FC4',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  secondary: { backgroundColor: '#EAF0FC' },
  secondaryText: { color: '#244895' },
  notice: {
    padding: 12,
    color: '#164C46',
    backgroundColor: '#E0F5F1',
    borderRadius: 10,
    lineHeight: 21,
  },
  image: { width: '100%', height: 170, borderRadius: 12, backgroundColor: '#F5F7FB' },
});
export const kit: Kit = {
  Form: ({ children }) => <View style={styles.card}>{children}</View>,
  Card: ({ children }) => <View style={styles.card}>{children}</View>,
  Heading: ({ children }) => (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  ),
  Body: ({ children }) => (
    <Text selectable style={styles.body}>
      {children}
    </Text>
  ),
  Notice: ({ children }) => (
    <Text accessibilityLiveRegion="polite" style={styles.notice}>
      {children}
    </Text>
  ),
  Input: ({ label, value, change, hint, type }) => (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        placeholder={hint}
        placeholderTextColor="#65758A"
        value={value}
        onChangeText={change}
        autoCapitalize={type ? 'none' : 'sentences'}
        secureTextEntry={type === 'password'}
        keyboardType={type === 'email' ? 'email-address' : type === 'otp' ? 'number-pad' : 'default'}
      />
    </View>
  ),
  Button: ({ children, press, secondary, disabled }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.55 : pressed ? 0.8 : 1 },
      ]}
      onPress={press}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{children}</Text>
    </Pressable>
  ),
  Image: ({ src, label }) => (
    <Image
      source={{ uri: src }}
      accessibilityLabel={label}
      accessible
      resizeMode="contain"
      style={styles.image}
    />
  ),
  Pick: function Pick({ label, disabled, picked, failed }) {
    const [loading, setLoading] = useState(false);
    return (
      <kit.Button
        disabled={disabled || loading}
        press={async () => {
          setLoading(true);
          try {
            const selection = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.45,
              base64: true,
            });
            if (selection.canceled) return;
            const bytes = selection.assets[0]?.base64;
            if (!bytes || bytes.length > 699052) {
              failed('Escolha um recorte menor para ficar dentro de 512 KiB.');
              return;
            }
            picked(bytes);
          } catch {
            failed('Não foi possível abrir a imagem. Confira as permissões do aplicativo.');
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? 'Preparando imagem…' : label}
      </kit.Button>
    );
  },
  Share: function InviteShare({ code, area }) {
    const url = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');
    const invitation = url ? url + '/' + area + '#convite=' + code : code;
    const [message, setMessage] = useState('');
    return (
      <View style={{ gap: 10 }}>
        <Text style={styles.body}>
          Compartilhe em particular. O destinatário pode colar o convite na área correspondente no site
          ou no app.
        </Text>
        <Text selectable style={styles.label}>
          {invitation}
        </Text>
        <kit.Button
          secondary
          press={async () => {
            try {
              await Share.share({ message: 'Convite AutoCRM · ' + area + '\n' + invitation });
            } catch {
              setMessage('Selecione e copie o convite acima.');
            }
          }}
        >
          Compartilhar convite
        </kit.Button>
        {message && <kit.Notice>{message}</kit.Notice>}
      </View>
    );
  },
};
