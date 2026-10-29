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
      950: '#091E42',
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
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.900}',
          focusColor: '{primary.900}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b0f19',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '#0b0f19',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'rgba(59, 130, 246, 0.16)',
          focusBackground: 'rgba(59, 130, 246, 0.24)',
          color: '#93c5fd',
          focusColor: '#bfdbfe',
        },
        mask: {
          background: 'rgba(3, 7, 18, 0.75)',
          color: '#cbd5e1',
        },
        formField: {
          background: '#0d1424',
          disabledBackground: '#1e293b',
          filledBackground: '#131b2e',
          filledHoverBackground: '#172238',
          filledFocusBackground: '#172238',
          borderColor: '#1e293b',
          hoverBorderColor: '#334155',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: '#f87171',
          color: '#f8fafc',
          disabledColor: '#64748b',
          placeholderColor: '#64748b',
          floatLabelColor: '#94a3b8',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '#94a3b8',
          floatLabelInvalidColor: '#f87171',
          iconColor: '#94a3b8',
          shadow: 'none',
        },
      },
    },
  },
});
