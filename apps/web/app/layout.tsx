import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AutoCRM | Seu carro, sempre conectado', description: 'Gestão de atendimento para oficinas e acompanhamento transparente para motoristas.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
