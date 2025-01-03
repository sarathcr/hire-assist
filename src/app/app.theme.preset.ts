import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#1565C0',
          inverseColor: '#ffffff',
          hoverColor: '#1976D2',
          activeColor: '#1565C0',
        },
        highlight: {
          background: '{indigo.950}',
          focusBackground: '{indigo.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{indigo.50}',
          inverseColor: '{indigo.950}',
          hoverColor: '{indigo.100}',
          activeColor: '{indigo.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});
