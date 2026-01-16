// Design tokens extracted from core-flow.png

export const colors = {
  // Dark theme colors
  background: {
    primary: '#0A0B14',
    secondary: '#151621',
    card: '#1C1D2B',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    tertiary: '#6B6B7B',
  },
  accent: {
    primary: '#5B7FFF',
    secondary: '#4A6EEE',
    gradient: 'linear-gradient(135deg, #5B7FFF 0%, #4A6EEE 100%)',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
  },
  status: {
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFC107',
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  round: '50%',
};

export const typography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  card: '0 4px 20px rgba(0, 0, 0, 0.5)',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  modal: 200,
  overlay: 300,
  tooltip: 400,
};
