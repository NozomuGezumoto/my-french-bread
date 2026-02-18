// ============================================
// French Bakery Data Loader
// Loads bakery shop locations for map pins
// ============================================

import { BakeryGeoJSON, BakeryFeature, BakeryPin } from '../types';
import { CustomBakery } from '../store/useStore';

import franceBakeriesData from './france_bakeries.json';
import franceBakeriesExtra from './france_bakeries_extra.json';

// フランスの地域おおよその座標範囲（境界判定用）
const REGION_BOUNDS: { [key: string]: [number, number, number, number] } = {
  'Île-de-France': [48.1, 49.2, 1.4, 3.4],
  'Auvergne-Rhône-Alpes': [43.9, 46.3, 2.7, 7.1],
  'Nouvelle-Aquitaine': [42.6, 46.9, -1.8, 2.2],
  'Occitanie': [42.3, 44.2, 1.0, 4.8],
  'Hauts-de-France': [49.9, 51.0, 1.5, 4.2],
  'Provence-Alpes-Côte d\'Azur': [43.0, 44.5, 4.6, 7.7],
  'Grand Est': [47.4, 49.8, 5.4, 8.2],
  'Pays de la Loire': [46.1, 48.0, -2.6, 0.9],
  'Bretagne': [47.2, 48.9, -4.8, -1.0],
  'Normandie': [48.3, 49.7, -1.9, 1.9],
  'Bourgogne-Franche-Comté': [46.2, 48.2, 3.3, 7.2],
  'Centre-Val de Loire': [46.4, 48.4, 0.0, 3.2],
  'Corse': [41.3, 43.0, 8.5, 9.6],
};

function getRegionFromCoords(lat: number, lng: number): string {
  for (const [region, bounds] of Object.entries(REGION_BOUNDS)) {
    const [minLat, maxLat, minLng, maxLng] = bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return region;
    }
  }
  return '';
}

interface BakeryFeatureProps {
  id?: string;
  name: string;
  name_reading?: string;
  region: string;
  address?: string;
  type: BakeryPin['type'];
  characteristics?: string;
  source?: string;
}

function featureToPin(feature: BakeryFeature): BakeryPin {
  const props = feature.properties as BakeryFeatureProps;
  const [lng, lat] = feature.geometry.coordinates;
  const name = props.name || 'Boulangerie';
  return {
    id: props.id || `bakery-${feature.geometry.coordinates.join('-')}`,
    lat,
    lng,
    name,
    nameReading: props.name_reading || name,
    type: props.type || 'boulangerie',
    address: props.address || props.region || '',
    region: props.region || getRegionFromCoords(lat, lng),
    characteristics: props.characteristics,
    isCustom: false,
  };
}

export function customBakeryToPin(bakery: CustomBakery): BakeryPin {
  return {
    id: bakery.id,
    lat: bakery.lat,
    lng: bakery.lng,
    name: bakery.name,
    nameReading: bakery.name,
    type: bakery.type,
    address: bakery.address || '',
    region: getRegionFromCoords(bakery.lat, bakery.lng),
    isCustom: true,
  };
}

export function getAllBakeryPins(): BakeryPin[] {
  const data = franceBakeriesData as BakeryGeoJSON;
  const extra = franceBakeriesExtra as BakeryFeature[];
  const allFeatures = [...data.features, ...extra];
  return allFeatures.map((f) => featureToPin(f as BakeryFeature));
}

export function getBakeryCount(): number {
  const data = franceBakeriesData as BakeryGeoJSON;
  const extra = franceBakeriesExtra as BakeryFeature[];
  return data.features.length + extra.length;
}
