// ============================================
// French Bakery (Boulangerie) Types
// Pins = shop locations in France
// ============================================

export interface Bakery {
  id: string;
  name: string;
  name_reading?: string;
  region: string;
  address?: string;
  type: 'boulangerie' | 'patisserie' | 'artisan';
  characteristics?: string;
  source?: string;
}

export interface BakeryFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: Bakery & { 'addr:region'?: string; 'addr:full'?: string };
}

export interface BakeryGeoJSON {
  type: 'FeatureCollection';
  features: BakeryFeature[];
}

export interface BakeryPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  nameReading: string;
  type: 'boulangerie' | 'patisserie' | 'artisan';
  address: string;
  region: string;
  characteristics?: string;
  isCustom?: boolean;
}

// フランスの地域（レジオン）
export const FRANCE_REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Côte d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
] as const;

export type FranceRegion = typeof FRANCE_REGIONS[number];
