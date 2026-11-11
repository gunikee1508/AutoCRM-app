import type { ComponentType, ReactNode } from 'react';
export type Kit = {
  Form: ComponentType<{ children: ReactNode; submit: () => void }>;
  Card: ComponentType<{ children: ReactNode }>;
  Heading: ComponentType<{ children: ReactNode }>;
  Body: ComponentType<{ children: ReactNode }>;
  Notice: ComponentType<{ children: ReactNode }>;
  Input: ComponentType<{
    label: string;
    value: string;
    change: (v: string) => void;
    hint?: string;
    type?: 'email' | 'password' | 'otp' | 'text';
  }>;
  Button: ComponentType<{
    children: string;
    press: () => void;
    secondary?: boolean;
    submit?: boolean;
    disabled?: boolean;
  }>;
  Image: ComponentType<{ src: string; label: string }>;
  Pick: ComponentType<{
    label: string;
    disabled: boolean;
    picked: (base64: string) => void;
    failed: (error: string) => void;
  }>;
  Share: ComponentType<{ code: string; area: string }>;
};
