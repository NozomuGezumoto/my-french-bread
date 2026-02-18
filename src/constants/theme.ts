// ============================================
// My French Bread – Theme (French-inspired)
// Cream, French blue, soft red, warm gold
// ============================================

export const BEER_COLORS = {
  // Primary – French blue (bleu de France)
  primary: '#1E3A5F',
  primaryLight: '#2C5282',
  primaryDark: '#0F2744',

  // Accent – visited (soft green / sage)
  accent: '#C9A227',
  accentSecondary: '#2D5A27',
  accentTertiary: '#B8860B',

  // Backgrounds – cream & off-white (French café feel)
  background: '#F7F3EE',
  backgroundElevated: '#FFFDF9',
  backgroundCard: '#FFFDF9',

  // Surface
  surface: '#EDE8E2',
  surfaceLight: '#F5F1EC',
  surfaceDark: '#E0DAD2',

  // Text
  textPrimary: '#2C2419',
  textSecondary: '#5C5348',
  textMuted: '#8A8074',

  // Semantic
  success: '#2D5A27',
  warning: '#C9A227',
  error: '#A52A2A',

  // Map – soft cream / blue tint
  mapOverlay: 'rgba(247, 243, 238, 0.95)',
  mapOverlayLight: 'rgba(247, 243, 238, 0.80)',

  // Pins – French blue & gold
  beerPin: '#1E3A5F',
  cluster: '#2C5282',

  // Bakery pins – Ghibli-style (soft sage, cream, warm amber)
  bakeryPinDefaultBg: '#F5F0E8',
  bakeryPinDefaultBorder: '#8B9B7A',
  bakeryPinVisited: '#6B8E6B',
  bakeryPinWantToGo: '#C4A35A',
  bakeryPinShadow: '#5C5348',
  bakeryCluster: '#7D8B6F',

  // Borders
  border: 'rgba(44, 36, 25, 0.08)',
  borderLight: 'rgba(44, 36, 25, 0.04)',
};

export const SUSHI_COLORS = BEER_COLORS;

// France-wide view
export const FRANCE_CENTER = {
  latitude: 46.6,
  longitude: 2.4,
};

export const FRANCE_INITIAL_REGION = {
  latitude: 46.6,
  longitude: 2.4,
  latitudeDelta: 10.0,
  longitudeDelta: 10.0,
};

export const TOKYO_CENTER = { latitude: 35.6762, longitude: 139.6503 };
export const TOKYO_INITIAL_REGION = { latitude: 35.6762, longitude: 139.6503, latitudeDelta: 0.15, longitudeDelta: 0.15 };
export const JAPAN_CENTER = { latitude: 36.5, longitude: 138.0 };
export const JAPAN_INITIAL_REGION = { latitude: 36.5, longitude: 138.0, latitudeDelta: 12.0, longitudeDelta: 12.0 };

export const PIN_SIZE = { marker: 44, cluster: 48 };

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};
