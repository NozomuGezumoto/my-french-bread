// ============================================
// French Bread Map Component
// Full-screen map: French bakeries (boulangeries) in France
// 行ったことがある = チェックで表示
// ============================================

import React, { useRef, useCallback, useMemo, useState, memo, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Switch, Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import {
  BEER_COLORS,
  FRANCE_INITIAL_REGION,
  PIN_SIZE,
  SPACING,
  RADIUS,
} from '../constants/theme';
import { BakeryPin } from '../types';
import { getAllBakeryPins, customBakeryToPin } from '../data/bakeryData';
import { useStore } from '../store/useStore';
import BakeryDetail from './BakeryDetail';
import AddBakeryModal from './AddBakeryModal';

const REGIONS: { name: string; regions: string[] }[] = [
  { name: 'Île-de-France', regions: ['Île-de-France'] },
  { name: 'Northeast', regions: ['Hauts-de-France', 'Grand Est', 'Bourgogne-Franche-Comté'] },
  { name: 'Northwest', regions: ['Normandie', 'Bretagne', 'Pays de la Loire'] },
  { name: 'Central', regions: ['Centre-Val de Loire', 'Nouvelle-Aquitaine'] },
  { name: 'Southeast', regions: ['Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Corse'] },
  { name: 'Southwest', regions: ['Occitanie'] },
];

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#EDE8E2' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5C5348' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFDF9' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#E0DAD2' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#D8E4D4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFDF9' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E8E2DB' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#A8C5E0' }] },
];

interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function FilterButton({ label, count, isActive, color, icon, onPress }: FilterButtonProps) {
  return (
    <Pressable
      style={[styles.filterButton, isActive && { backgroundColor: color + '20', borderColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={14} color={isActive ? color : BEER_COLORS.textMuted} />
      <Text style={[styles.filterButtonText, isActive && { color }]}>{label}</Text>
      <Text style={[styles.filterCount, isActive && { color }]}>{count}</Text>
    </Pressable>
  );
}

function getBakeryTypeLabel(type: BakeryPin['type']): string {
  if (type === 'boulangerie') return 'Boulangerie';
  if (type === 'patisserie') return 'Pâtisserie';
  return 'Artisan';
}

interface ListItemProps {
  bakery: BakeryPin;
  isTried: boolean;
  isWantToGo: boolean;
  onPress: () => void;
}

const ListSeparator = memo(() => <View style={styles.listSeparator} />);

const ListItem = memo(function ListItem({ bakery, isTried, isWantToGo, onPress }: ListItemProps) {
  const typeLabel = getBakeryTypeLabel(bakery.type);
  return (
    <Pressable style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemIcon}>
        {isTried ? (
          <Ionicons name="checkmark-circle" size={24} color={BEER_COLORS.accentSecondary} />
        ) : isWantToGo ? (
          <Ionicons name="bookmark" size={24} color={BEER_COLORS.accent} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color={BEER_COLORS.textMuted} />
        )}
      </View>
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemName} numberOfLines={1}>{bakery.name}</Text>
        <Text style={styles.listItemType} numberOfLines={1}>
          {typeLabel}
          {bakery.isCustom ? ' · Added by you' : ''}
          {isWantToGo && !isTried ? ' · Want to go' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={BEER_COLORS.textMuted} />
    </Pressable>
  );
});

export default function BakeryMap() {
  const mapRef = useRef<MapView | null>(null);
  const detailSheetRef = useRef<BottomSheet>(null);
  const listSheetRef = useRef<BottomSheet>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPin, setSelectedPin] = useState<BakeryPin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newBakeryLocation, setNewBakeryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedRegionGroup, setSelectedRegionGroup] = useState<string | null>(null);

  const setRegionFilter = useStore((state) => state.setRegionFilter);

  const handleAreaFilterChange = useCallback((regionName: string | null) => {
    if (regionName === null) {
      setSelectedRegionGroup(null);
      setRegionFilter('');
      return;
    }
    const group = REGIONS.find((r) => r.name === regionName);
    if (!group) return;
    setSelectedRegionGroup(regionName);
    if (group.regions.length === 1) {
      setRegionFilter(group.regions[0]);
    } else {
      setRegionFilter('');
    }
  }, [setRegionFilter]);

  const handleRegionFilterChange = useCallback((region: string) => {
    setRegionFilter(region);
  }, [setRegionFilter]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const customBakeries = useStore((state) => state.customBakeries);
  const excludedBakeries = useStore((state) => state.excludedBakeries);
  const filterMode = useStore((state) => state.filterMode);
  const setFilterMode = useStore((state) => state.setFilterMode);
  const regionFilter = useStore((state) => state.regionFilter);
  const hideExcluded = useStore((state) => state.hideExcluded);
  const setHideExcluded = useStore((state) => state.setHideExcluded);
  const isTried = useStore((state) => state.isTried);
  const isWantToGo = useStore((state) => state.isWantToGo);
  const clearAllExcluded = useStore((state) => state.clearAllExcluded);

  const dataPins = useMemo(() => getAllBakeryPins(), []);
  const customPins = useMemo(() => customBakeries.map(customBakeryToPin), [customBakeries]);
  const allPins = useMemo(() => [...dataPins, ...customPins], [dataPins, customPins]);

  const regionFilteredPins = useMemo(() => {
    if (!regionFilter) return allPins;
    return allPins.filter((pin) => pin.region === regionFilter);
  }, [allPins, regionFilter]);

  const triedBakeries = useStore((state) => state.triedBakeries);
  const wantToGoBakeries = useStore((state) => state.wantToGoBakeries);
  const totalCount = regionFilteredPins.length;
  const triedIdsSet = useMemo(() => new Set(triedBakeries.map((t) => t.id)), [triedBakeries]);
  const wantToGoIdsSet = useMemo(() => new Set(wantToGoBakeries), [wantToGoBakeries]);
  const triedCount = useMemo(
    () => regionFilteredPins.filter((pin) => triedIdsSet.has(pin.id)).length,
    [regionFilteredPins, triedIdsSet]
  );
  const wantToGoCount = useMemo(
    () => regionFilteredPins.filter((pin) => wantToGoIdsSet.has(pin.id)).length,
    [regionFilteredPins, wantToGoIdsSet]
  );

  const pins = useMemo(() => {
    let filtered = regionFilteredPins;
    if (filterMode === 'tried') {
      filtered = filtered.filter((pin) => triedIdsSet.has(pin.id));
    } else if (filterMode === 'wantToGo') {
      filtered = filtered.filter((pin) => wantToGoIdsSet.has(pin.id));
    }
    if (hideExcluded && excludedBakeries.length > 0) {
      const excludedSet = new Set(excludedBakeries);
      filtered = filtered.filter((pin) => !excludedSet.has(pin.id));
    }
    return filtered;
  }, [filterMode, regionFilteredPins, triedIdsSet, wantToGoIdsSet, hideExcluded, excludedBakeries]);

  const displayCount = pins.length;
  const detailSnapPoints = useMemo(() => ['55%', '85%'], []);
  const listSnapPoints = useMemo(() => ['12%', '50%', '85%'], []);

  const handleResetToCenter = useCallback(() => {
    mapRef.current?.animateToRegion(FRANCE_INITIAL_REGION, 500);
  }, []);

  const handleRegionChange = useCallback((_region: Region) => {}, []);

  const handlePinPress = useCallback((pin: BakeryPin) => {
    setSelectedPin(pin);
    listSheetRef.current?.snapToIndex(0);
    detailSheetRef.current?.snapToIndex(0);
    mapRef.current?.animateToRegion({
      latitude: pin.lat,
      longitude: pin.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, []);

  const handleListItemPress = useCallback((pin: BakeryPin) => {
    setSelectedPin(pin);
    listSheetRef.current?.snapToIndex(0);
    detailSheetRef.current?.snapToIndex(0);
    mapRef.current?.animateToRegion({
      latitude: pin.lat,
      longitude: pin.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, []);

  const handleCloseDetail = useCallback(() => {
    detailSheetRef.current?.close();
    setSelectedPin(null);
  }, []);

  const handleToggleAddMode = useCallback(() => {
    setAddMode((prev) => !prev);
    setNewBakeryLocation(null);
  }, []);

  const handleMapPress = useCallback((e: any) => {
    if (!addMode) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setNewBakeryLocation({ lat: latitude, lng: longitude });
    setShowAddModal(true);
  }, [addMode]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setNewBakeryLocation(null);
    setAddMode(false);
  }, []);

  const renderListItem = useCallback(({ item }: { item: BakeryPin }): React.ReactElement => (
    <ListItem
      bakery={item}
      isTried={isTried(item.id)}
      isWantToGo={isWantToGo(item.id)}
      onPress={() => handleListItemPress(item)}
    />
  ), [isTried, isWantToGo, handleListItemPress]);

  const getPinStyle = (pin: BakeryPin) => {
    const tried = isTried(pin.id);
    const wantToGo = isWantToGo(pin.id);
    if (tried) {
      return {
        borderColor: BEER_COLORS.accentSecondary,
        bgColor: BEER_COLORS.accentSecondary,
        icon: 'checkmark' as const,
        iconColor: '#fff',
        iconSize: 26,
        isTried: true,
      };
    }
    if (wantToGo) {
      return {
        borderColor: BEER_COLORS.accent,
        bgColor: BEER_COLORS.accent,
        icon: 'bookmark' as const,
        iconColor: '#fff',
        iconSize: 22,
        isTried: false,
      };
    }
    return {
      borderColor: BEER_COLORS.primary,
      bgColor: BEER_COLORS.backgroundCard,
      icon: null,
      iconColor: '',
      iconSize: 0,
      isTried: false,
    };
  };

  const renderCluster = (cluster: any) => {
    const { id, geometry, onPress } = cluster;
    const points = cluster.properties.point_count;
    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{ longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={styles.clusterContainer}>
          <Text style={styles.clusterText}>{points > 99 ? '99+' : points}</Text>
        </View>
      </Marker>
    );
  };

  return (
    <View style={styles.container}>
      {addMode && (
        <View style={styles.addModeBanner}>
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={styles.addModeBannerText}>Tap the map to choose a location</Text>
          <Pressable style={styles.addModeCancelButton} onPress={handleToggleAddMode}>
            <Text style={styles.addModeCancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.actionButtonsContainer}>
        <Pressable style={styles.actionButton} onPress={handleResetToCenter}>
          <Ionicons name="locate" size={22} color={BEER_COLORS.primary} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.addButton, addMode && styles.addButtonActive]}
          onPress={handleToggleAddMode}
        >
          <Ionicons name={addMode ? 'close' : 'add'} size={24} color="#fff" />
        </Pressable>
      </View>

      <ClusteredMapView
        mapRef={(ref: React.Ref<MapView>) => {
          if (ref != null && typeof ref === 'object' && 'current' in ref)
            (mapRef as React.MutableRefObject<MapView | null>).current = (ref as React.RefObject<MapView>).current;
        }}
        style={styles.map}
        initialRegion={FRANCE_INITIAL_REGION}
        customMapStyle={MAP_STYLE}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        minZoomLevel={5}
        maxZoomLevel={18}
        clusterColor={BEER_COLORS.cluster}
        clusterTextColor="#fff"
        clusterFontFamily="System"
        radius={50}
        renderCluster={renderCluster}
        minPoints={3}
      >
        {pins.map((pin) => {
          const pinStyle = getPinStyle(pin);
          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => handlePinPress(pin)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.pinContainer,
                  { borderColor: pinStyle.borderColor, backgroundColor: pinStyle.bgColor },
                  pinStyle.icon && styles.highlightedPinShadow,
                ]}
              >
                {pinStyle.icon ? (
                  <Ionicons name={pinStyle.icon} size={pinStyle.iconSize} color={pinStyle.iconColor} />
                ) : (
                  <Text style={styles.pinEmoji}>🥖</Text>
                )}
              </View>
            </Marker>
          );
        })}
      </ClusteredMapView>

      <BottomSheet
        ref={listSheetRef}
        index={0}
        snapPoints={listSnapPoints}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
        animateOnMount={false}
        enableOverDrag={false}
      >
        <View style={styles.listHeader}>
          <View style={styles.listHeaderRow}>
            <View>
              <View style={styles.listTitleRow}>
                <Image source={require('../../assets/images/icon.png')} style={styles.listTitleIcon} resizeMode="contain" />
                <Text style={styles.listTitle}>{regionFilter || 'France'} · Boulangeries</Text>
              </View>
              <Text style={styles.listSubtitle}>
                {displayCount.toLocaleString()} shown
                {excludedBakeries.length > 0 && hideExcluded && ` (${excludedBakeries.length} hidden)`}
              </Text>
            </View>
            <Pressable
              style={[styles.filterToggle, showAdvancedFilters && styles.filterToggleActive]}
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Ionicons name="options-outline" size={18} color={showAdvancedFilters ? '#fff' : BEER_COLORS.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.listFilterRow}>
          <FilterButton label="All" count={totalCount} isActive={filterMode === 'all'} color={BEER_COLORS.primary} icon="grid-outline" onPress={() => setFilterMode('all')} />
          <FilterButton label="Want to go" count={wantToGoCount} isActive={filterMode === 'wantToGo'} color={BEER_COLORS.accent} icon="bookmark" onPress={() => setFilterMode('wantToGo')} />
          <FilterButton label="Visited" count={triedCount} isActive={filterMode === 'tried'} color={BEER_COLORS.accentSecondary} icon="checkmark-circle" onPress={() => setFilterMode('tried')} />
        </View>

        {showAdvancedFilters && (
          <View style={styles.advancedFilters}>
            <View style={styles.advancedFilterSection}>
              <View style={styles.advancedFilterLabel}>
                <Ionicons name="location-outline" size={18} color={BEER_COLORS.textSecondary} />
                <Text style={styles.advancedFilterText}>Region</Text>
                {regionFilter && <Text style={styles.prefectureSelected}>{regionFilter}</Text>}
              </View>
              <View style={styles.regionContainer}>
                <Pressable style={[styles.regionOption, !selectedRegionGroup && !regionFilter && styles.regionOptionActive]} onPress={() => handleAreaFilterChange(null)}>
                  <Text style={[styles.regionOptionText, !selectedRegionGroup && !regionFilter && styles.regionOptionTextActive]}>All France</Text>
                </Pressable>
                {REGIONS.map((region) => (
                  <Pressable key={region.name} style={[styles.regionOption, selectedRegionGroup === region.name && styles.regionOptionActive]} onPress={() => handleAreaFilterChange(region.name)}>
                    <Text style={[styles.regionOptionText, selectedRegionGroup === region.name && styles.regionOptionTextActive]}>{region.name}</Text>
                  </Pressable>
                ))}
              </View>
              {selectedRegionGroup && (() => {
                const group = REGIONS.find((r) => r.name === selectedRegionGroup);
                if (!group || group.regions.length <= 1) return null;
                return (
                  <View style={styles.prefectureContainer}>
                    {group.regions.map((reg) => (
                      <Pressable key={reg} style={[styles.prefectureOption, regionFilter === reg && styles.prefectureOptionActive]} onPress={() => handleRegionFilterChange(reg)}>
                        <Text style={[styles.prefectureOptionText, regionFilter === reg && styles.prefectureOptionTextActive]}>{reg}</Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })()}
            </View>

            {excludedBakeries.length > 0 && (
              <View style={styles.advancedFilterSection}>
                <View style={styles.advancedFilterRow}>
                  <View style={styles.advancedFilterLabel}>
                    <Ionicons name="eye-off-outline" size={18} color={BEER_COLORS.textSecondary} />
                    <Text style={styles.advancedFilterText}>Hide excluded</Text>
                    <Text style={styles.excludedCount}>({excludedBakeries.length})</Text>
                  </View>
                  <Switch value={hideExcluded} onValueChange={setHideExcluded} trackColor={{ false: BEER_COLORS.border, true: BEER_COLORS.primary + '60' }} thumbColor={hideExcluded ? BEER_COLORS.primary : '#f4f3f4'} />
                </View>
                <Pressable style={styles.clearExcludedButton} onPress={clearAllExcluded}>
                  <Ionicons name="refresh-outline" size={14} color={BEER_COLORS.error} />
                  <Text style={styles.clearExcludedText}>Clear all exclusions</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {pins.length > 0 ? (
          <BottomSheetFlatList
            data={pins}
            keyExtractor={(item: BakeryPin) => item.id}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={ListSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={3}
            getItemLayout={(_: unknown, index: number) => ({ length: 57, offset: 57 * index, index })}
          />
        ) : (
          <View style={styles.listEmpty}>
            <Image source={require('../../assets/images/icon.png')} style={styles.listEmptyIconImage} resizeMode="contain" />
            <Text style={styles.listEmptyText}>
              {filterMode === 'tried' ? 'No visited bakeries yet' : filterMode === 'wantToGo' ? 'No want-to-go bakeries yet' : 'No bakeries here'}
            </Text>
          </View>
        )}
      </BottomSheet>

      <BottomSheet ref={detailSheetRef} index={-1} snapPoints={detailSnapPoints} enablePanDownToClose backgroundStyle={styles.sheetBackground} handleIndicatorStyle={styles.sheetIndicator} animateOnMount={false}>
        <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {selectedPin && <BakeryDetail bakery={selectedPin} onClose={handleCloseDetail} />}
        </BottomSheetScrollView>
      </BottomSheet>

      <AddBakeryModal visible={showAddModal} onClose={handleCloseAddModal} initialLocation={newBakeryLocation || undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BEER_COLORS.background },
  addModeBanner: {
    position: 'absolute', top: 60, left: SPACING.lg, right: SPACING.lg, zIndex: 20,
    backgroundColor: BEER_COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 6,
  },
  addModeBannerText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
  addModeCancelButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.md },
  addModeCancelText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  actionButtonsContainer: { position: 'absolute', top: 60, right: SPACING.lg, zIndex: 10, gap: SPACING.sm },
  actionButton: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: BEER_COLORS.backgroundCard, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  addButton: { backgroundColor: BEER_COLORS.primary },
  addButtonActive: { backgroundColor: BEER_COLORS.error },
  map: { flex: 1 },
  pinContainer: {
    width: PIN_SIZE.marker, height: PIN_SIZE.marker, borderRadius: PIN_SIZE.marker / 2, borderWidth: 3, backgroundColor: BEER_COLORS.backgroundCard,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  pinEmoji: { fontSize: 22 },
  pinImageWrap: { width: PIN_SIZE.marker, height: PIN_SIZE.marker, justifyContent: 'center', alignItems: 'center' },
  pinImage: { width: PIN_SIZE.marker + 12, height: PIN_SIZE.marker + 12 },
  highlightedPinShadow: { shadowOpacity: 0.4, shadowRadius: 5, elevation: 6 },
  clusterContainer: {
    width: PIN_SIZE.cluster, height: PIN_SIZE.cluster, borderRadius: PIN_SIZE.cluster / 2, backgroundColor: BEER_COLORS.cluster, borderWidth: 3, borderColor: BEER_COLORS.backgroundCard,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  clusterText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sheetBackground: { backgroundColor: BEER_COLORS.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetIndicator: { backgroundColor: BEER_COLORS.textMuted, width: 48, height: 5 },
  listHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontSize: 20, fontWeight: '700', color: BEER_COLORS.textPrimary },
  listSubtitle: { fontSize: 13, color: BEER_COLORS.textMuted, marginTop: 2 },
  filterToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: BEER_COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BEER_COLORS.border },
  filterToggleActive: { backgroundColor: BEER_COLORS.primary, borderColor: BEER_COLORS.primary },
  listFilterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BEER_COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: BEER_COLORS.border, gap: 4 },
  filterButtonText: { fontSize: 12, fontWeight: '600', color: BEER_COLORS.textMuted },
  filterCount: { fontSize: 11, fontWeight: '700', color: BEER_COLORS.textMuted },
  listContent: { paddingBottom: 100 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  listItemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: BEER_COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: '600', color: BEER_COLORS.textPrimary },
  listItemType: { fontSize: 12, color: BEER_COLORS.textMuted, marginTop: 2 },
  listSeparator: { height: 1, backgroundColor: BEER_COLORS.border, marginLeft: SPACING.lg + 40 + SPACING.md },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xl },
  listEmptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  listEmptyIconImage: { width: 72, height: 72, marginBottom: SPACING.md },
  listTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  listTitleIcon: { width: 28, height: 28 },
  listEmptyText: { fontSize: 14, color: BEER_COLORS.textMuted, textAlign: 'center' },
  advancedFilters: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: BEER_COLORS.border, marginBottom: SPACING.sm },
  advancedFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  advancedFilterSection: { paddingVertical: SPACING.sm },
  advancedFilterLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  advancedFilterText: { fontSize: 14, color: BEER_COLORS.textSecondary },
  excludedCount: { fontSize: 12, color: BEER_COLORS.textMuted },
  prefectureSelected: { fontSize: 12, color: BEER_COLORS.primary, fontWeight: '600', marginLeft: SPACING.xs },
  regionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  regionOption: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: BEER_COLORS.surface, borderWidth: 1, borderColor: BEER_COLORS.border },
  regionOptionActive: { backgroundColor: BEER_COLORS.primary, borderColor: BEER_COLORS.primary },
  regionOptionText: { fontSize: 13, fontWeight: '500', color: BEER_COLORS.textSecondary },
  regionOptionTextActive: { color: '#fff' },
  prefectureContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: BEER_COLORS.border },
  prefectureOption: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: BEER_COLORS.surfaceLight, borderWidth: 1, borderColor: BEER_COLORS.border },
  prefectureOptionActive: { backgroundColor: BEER_COLORS.primary, borderColor: BEER_COLORS.primary },
  prefectureOptionText: { fontSize: 12, fontWeight: '500', color: BEER_COLORS.textSecondary },
  prefectureOptionTextActive: { color: '#fff' },
  clearExcludedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, marginTop: SPACING.xs },
  clearExcludedText: { fontSize: 13, color: BEER_COLORS.error },
});
