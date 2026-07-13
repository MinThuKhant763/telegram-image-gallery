import { useColorScheme } from 'react-native';

export const darkTheme = {
  background: '#151515',
  surface: '#1D1D1D',
  elevated: '#252525',
  text: '#F6F2EA',
  mutedText: '#A9A39A',
  faintText: '#77736D',
  border: '#353432',
  accent: '#C98E4C',
  danger: '#F06C5C',
  input: '#1B1B1B',
  statusBar: 'light' as const
};

export const lightTheme = {
  background: '#FBFAF7',
  surface: '#FFFFFF',
  elevated: '#F3F0E9',
  text: '#1D1B19',
  mutedText: '#615C56',
  faintText: '#8B847B',
  border: '#DED9D0',
  accent: '#9B6228',
  danger: '#C94B3F',
  input: '#FFFFFF',
  statusBar: 'dark' as const
};

export type AppTheme = typeof darkTheme | typeof lightTheme;

export function useAppTheme(): AppTheme {
  return useColorScheme() === 'light' ? lightTheme : darkTheme;
}

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 12, md: 16, lg: 22, pill: 999 };
