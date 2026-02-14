// ============================================
// Bakery Detail Component
// フランスパンの店詳細: 行ったことがある = チェックのみ
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
  Platform,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BEER_COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { BakeryPin } from '../types';
import { useStore } from '../store/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getBakeryTypeLabel(type: BakeryPin['type']): string {
  if (type === 'boulangerie') return 'Boulangerie';
  if (type === 'patisserie') return 'Pâtisserie';
  return 'Artisan';
}

interface BakeryDetailProps {
  bakery: BakeryPin;
  onClose: () => void;
}

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (r: number) => void }) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRatingChange(star)}>
          <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={28} color={star <= rating ? '#f0a500' : BEER_COLORS.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

function PhotoGallery({ photos, onAddPhoto, onRemovePhoto }: { photos: string[]; onAddPhoto: () => void; onRemovePhoto: (uri: string) => void }) {
  const mainPhoto = photos[0];
  const subPhotos = photos.slice(1, 4);
  const canAddMore = photos.length < 4;
  const hasPhotos = photos.length > 0;
  const handleLongPress = (uri: string) => {
    Alert.alert('Remove photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemovePhoto(uri) },
    ]);
  };
  return (
    <View style={styles.photoGallery}>
      <Pressable style={[styles.mainPhotoSlot, hasPhotos && styles.mainPhotoSlotFilled]} onPress={!mainPhoto ? onAddPhoto : undefined} onLongPress={mainPhoto ? () => handleLongPress(mainPhoto) : undefined}>
        {mainPhoto ? (
          <Image source={{ uri: mainPhoto }} style={styles.mainPhoto} />
        ) : (
          <View style={styles.addPhotoPlaceholder}>
            <Text style={styles.addPhotoEmoji}>📸</Text>
            <Text style={styles.addPhotoTitle}>Add your first photo</Text>
            <Text style={styles.addPhotoSubtitle}>Tap to add a photo</Text>
          </View>
        )}
      </Pressable>
      {hasPhotos && (
        <View style={styles.subPhotoRow}>
          {[0, 1, 2].map((index) => {
            const photo = subPhotos[index];
            const isAddButton = !photo && canAddMore && index === subPhotos.length;
            return (
              <Pressable key={index} style={[styles.subPhotoSlot, photo && styles.subPhotoSlotFilled]} onPress={isAddButton ? onAddPhoto : undefined} onLongPress={photo ? () => handleLongPress(photo) : undefined}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.subPhoto} />
                ) : isAddButton ? (
                  <View style={styles.addPhotoPlaceholderSmall}>
                    <Ionicons name="add" size={24} color={BEER_COLORS.primary} />
                  </View>
                ) : (
                  <View style={styles.emptyPhotoSlot} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function BakeryDetail({ bakery, onClose }: BakeryDetailProps) {
  const isTried = useStore((state) => state.isTried);
  const markAsTried = useStore((state) => state.markAsTried);
  const unmarkAsTried = useStore((state) => state.unmarkAsTried);
  const isWantToGo = useStore((state) => state.isWantToGo);
  const addToWantToGo = useStore((state) => state.addToWantToGo);
  const removeFromWantToGo = useStore((state) => state.removeFromWantToGo);
  const getBakeryMemo = useStore((state) => state.getBakeryMemo);
  const setBakeryMemo = useStore((state) => state.setBakeryMemo);
  const addBakeryPhoto = useStore((state) => state.addBakeryPhoto);
  const removeBakeryPhoto = useStore((state) => state.removeBakeryPhoto);
  const getBakeryPhotos = useStore((state) => state.getBakeryPhotos);
  const deleteCustomBakery = useStore((state) => state.deleteCustomBakery);
  const excludeBakery = useStore((state) => state.excludeBakery);
  const unexcludeBakery = useStore((state) => state.unexcludeBakery);
  const isExcluded = useStore((state) => state.isExcluded);

  const existingMemo = getBakeryMemo(bakery.id);
  const [note, setNote] = useState(existingMemo?.note || '');
  const [rating, setRating] = useState(existingMemo?.rating || 0);
  const [showCelebration, setShowCelebration] = useState(false);
  const photos = getBakeryPhotos(bakery.id);

  useEffect(() => {
    const memo = getBakeryMemo(bakery.id);
    setNote(memo?.note || '');
    setRating(memo?.rating || 0);
    setShowCelebration(false);
  }, [bakery.id, getBakeryMemo]);

  const isBakeryTried = isTried(bakery.id);
  const isBakeryWantToGo = isWantToGo(bakery.id);
  const isBakeryExcluded = isExcluded(bakery.id);
  const triedCount = useStore((state) => state.getTriedCount)();

  useEffect(() => {
    if (note || rating > 0) setBakeryMemo(bakery.id, note, rating);
  }, [note, rating, bakery.id, setBakeryMemo]);

  const handleAddPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) addBakeryPhoto(bakery.id, result.assets[0].uri);
  }, [bakery.id, addBakeryPhoto]);

  const handleRemovePhoto = useCallback((uri: string) => removeBakeryPhoto(bakery.id, uri), [bakery.id, removeBakeryPhoto]);

  const handleOpenMaps = useCallback(() => {
    const { lat, lng, name } = bakery;
    const encodedName = encodeURIComponent(name);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodedName}`;
    const appleMapsUrl = `http://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`;
    const url = Platform.OS === 'ios' ? appleMapsUrl : googleMapsUrl;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(googleMapsUrl);
    });
  }, [bakery]);

  const handleSearchWeb = useCallback(() => {
    const query = [bakery.region, bakery.name, 'boulangerie France'].filter(Boolean).join(' ');
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }, [bakery]);

  const handleToggleTried = useCallback(() => {
    if (isBakeryTried) {
      Alert.alert('Remove from visited?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => unmarkAsTried(bakery.id) },
      ]);
    } else {
      markAsTried(bakery.id);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [bakery.id, isBakeryTried, markAsTried, unmarkAsTried]);

  const handleToggleWantToGo = useCallback(() => {
    if (isBakeryWantToGo) removeFromWantToGo(bakery.id);
    else addToWantToGo(bakery.id);
  }, [bakery.id, isBakeryWantToGo, addToWantToGo, removeFromWantToGo]);

  const typeLabel = getBakeryTypeLabel(bakery.type);

  const handleDeleteCustomBakery = useCallback(() => {
    Alert.alert('Delete this place?', 'This will remove the bakery you added. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteCustomBakery(bakery.id); onClose(); } },
    ]);
  }, [bakery.id, deleteCustomBakery, onClose]);

  const handleToggleExclude = useCallback(() => {
    if (isBakeryExcluded) unexcludeBakery(bakery.id);
    else excludeBakery(bakery.id);
  }, [bakery.id, isBakeryExcluded, excludeBakery, unexcludeBakery]);

  return (
    <View style={styles.content}>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={24} color={BEER_COLORS.textMuted} />
      </Pressable>

      <View style={styles.nameRow}>
        <Text style={styles.emoji}>{isBakeryTried ? '✅' : '🥖'}</Text>
        <Text style={styles.name}>{bakery.name}</Text>
      </View>

      <View style={styles.tags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{typeLabel}</Text>
        </View>
        {bakery.isCustom && (
          <View style={[styles.tag, styles.tagCustom]}>
            <Ionicons name="person" size={14} color={BEER_COLORS.primary} />
            <Text style={[styles.tagText, { color: BEER_COLORS.primary }]}>Added by you</Text>
          </View>
        )}
        {isBakeryWantToGo && (
          <View style={[styles.tag, styles.tagWantToGo]}>
            <Ionicons name="bookmark" size={14} color={BEER_COLORS.accent} />
            <Text style={[styles.tagText, { color: BEER_COLORS.accent }]}>Want to go</Text>
          </View>
        )}
        {isBakeryTried && (
          <View style={[styles.tag, styles.tagTried]}>
            <Ionicons name="checkmark" size={14} color={BEER_COLORS.accentSecondary} />
            <Text style={[styles.tagText, { color: BEER_COLORS.accentSecondary }]}>Visited</Text>
          </View>
        )}
      </View>

      {bakery.characteristics ? (
        <View style={styles.characteristicsSection}>
          <Text style={styles.characteristicsLabel}>About this place</Text>
          <Text style={styles.characteristicsText}>{bakery.characteristics}</Text>
        </View>
      ) : null}

      <PhotoGallery photos={photos} onAddPhoto={handleAddPhoto} onRemovePhoto={handleRemovePhoto} />

      {bakery.address ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={BEER_COLORS.textMuted} />
          <Text style={styles.infoText}>{bakery.address}</Text>
        </View>
      ) : null}
      <View style={styles.infoRow}>
        <Ionicons name="compass-outline" size={18} color={BEER_COLORS.textMuted} />
        <Text style={styles.infoText}>{bakery.lat.toFixed(5)}, {bakery.lng.toFixed(5)}</Text>
      </View>

      {showCelebration && (
        <View style={styles.celebrationBanner}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>No. {triedCount} visited!</Text>
          <Text style={styles.celebrationSubtext}>Added to your map</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating</Text>
        <StarRating rating={rating} onRatingChange={setRating} />
        {rating > 0 && (
          <Text style={styles.ratingHint}>
            {rating === 5 ? 'Perfect!' : rating === 4 ? 'Very good' : rating === 3 ? 'Good' : rating === 2 ? 'Okay' : 'Once was enough'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="Add a note..." placeholderTextColor={BEER_COLORS.textMuted} multiline numberOfLines={3} textAlignVertical="top" />
      </View>

      <Pressable style={[styles.wantToGoButton, isBakeryWantToGo && styles.wantToGoButtonActive]} onPress={handleToggleWantToGo}>
        <Ionicons name={isBakeryWantToGo ? 'bookmark' : 'bookmark-outline'} size={22} color={isBakeryWantToGo ? '#fff' : BEER_COLORS.accent} />
        <Text style={[styles.wantToGoButtonText, isBakeryWantToGo && styles.wantToGoButtonTextActive]}>{isBakeryWantToGo ? 'In want-to-go list' : 'I want to go here'}</Text>
      </Pressable>

      <Pressable style={[styles.triedButton, isBakeryTried && styles.triedButtonActive]} onPress={handleToggleTried}>
        <Ionicons name={isBakeryTried ? 'checkmark-circle' : 'restaurant-outline'} size={22} color={isBakeryTried ? '#fff' : BEER_COLORS.accentSecondary} />
        <Text style={[styles.triedButtonText, isBakeryTried && styles.triedButtonTextActive]}>{isBakeryTried ? 'Visited!' : 'I\'ve been here'}</Text>
      </Pressable>

      <Pressable style={styles.mapsButton} onPress={handleOpenMaps}>
        <Ionicons name="map-outline" size={20} color={BEER_COLORS.primary} />
        <Text style={styles.mapsButtonText}>Open in Maps</Text>
      </Pressable>
      <Pressable style={styles.webSearchButton} onPress={handleSearchWeb}>
        <Ionicons name="search-outline" size={20} color={BEER_COLORS.accentSecondary} />
        <Text style={styles.webSearchButtonText}>Search on the web</Text>
      </Pressable>
      <Pressable style={styles.excludeButton} onPress={handleToggleExclude}>
        <Ionicons name={isBakeryExcluded ? 'eye-outline' : 'eye-off-outline'} size={18} color={isBakeryExcluded ? BEER_COLORS.accentSecondary : BEER_COLORS.textMuted} />
        <Text style={[styles.excludeButtonText, isBakeryExcluded && { color: BEER_COLORS.accentSecondary }]}>{isBakeryExcluded ? 'Show in list' : 'Hide from list'}</Text>
      </Pressable>
      {bakery.isCustom && (
        <Pressable style={styles.deleteButton} onPress={handleDeleteCustomBakery}>
          <Ionicons name="trash-outline" size={18} color={BEER_COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete this place</Text>
        </Pressable>
      )}
      <Text style={styles.source}>{bakery.isCustom ? 'Added by you' : 'Famous French boulangeries & pâtisseries. Data for reference.'}</Text>
    </View>
  );
}

const PHOTO_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const MAIN_PHOTO_HEIGHT = 160;
const SUB_PHOTO_SIZE = (PHOTO_WIDTH - SPACING.sm * 2) / 3;

const styles = StyleSheet.create({
  content: { padding: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xl, alignItems: 'center' },
  closeButton: { position: 'absolute', top: SPACING.sm, right: SPACING.md, padding: SPACING.sm, zIndex: 10 },
  photoGallery: { width: '100%', marginBottom: SPACING.md },
  mainPhotoSlot: { width: '100%', height: MAIN_PHOTO_HEIGHT, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm },
  mainPhoto: { width: '100%', height: '100%' },
  mainPhotoSlotFilled: { borderWidth: 0 },
  addPhotoPlaceholder: { flex: 1, backgroundColor: BEER_COLORS.primary + '08', borderRadius: RADIUS.lg, borderWidth: 2, borderColor: BEER_COLORS.primary + '30', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.lg },
  addPhotoEmoji: { fontSize: 36, marginBottom: SPACING.sm },
  addPhotoTitle: { fontSize: 16, fontWeight: '600', color: BEER_COLORS.textPrimary, marginBottom: SPACING.xs },
  addPhotoSubtitle: { fontSize: 13, color: BEER_COLORS.textMuted },
  subPhotoRow: { flexDirection: 'row', gap: SPACING.sm },
  subPhotoSlot: { width: SUB_PHOTO_SIZE, height: SUB_PHOTO_SIZE, borderRadius: RADIUS.md, overflow: 'hidden' },
  subPhotoSlotFilled: { borderWidth: 0 },
  subPhoto: { width: '100%', height: '100%' },
  addPhotoPlaceholderSmall: { flex: 1, backgroundColor: BEER_COLORS.primary + '10', borderRadius: RADIUS.md, borderWidth: 2, borderColor: BEER_COLORS.primary + '30', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  emptyPhotoSlot: { flex: 1, backgroundColor: BEER_COLORS.surface, borderRadius: RADIUS.md, opacity: 0.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm, width: '100%', paddingRight: 40 },
  emoji: { fontSize: 28 },
  name: { fontSize: 20, fontWeight: '700', color: BEER_COLORS.textPrimary, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md, width: '100%' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: BEER_COLORS.primary + '20', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, gap: 4 },
  tagCustom: { backgroundColor: BEER_COLORS.primary + '20' },
  tagWantToGo: { backgroundColor: BEER_COLORS.accent + '20' },
  tagTried: { backgroundColor: BEER_COLORS.accentSecondary + '20' },
  tagText: { fontSize: 13, fontWeight: '600', color: BEER_COLORS.primary },
  wantToGoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.sm, borderWidth: 2, borderColor: BEER_COLORS.accent, backgroundColor: 'transparent', ...SHADOWS.sm },
  wantToGoButtonActive: { backgroundColor: BEER_COLORS.accent, borderColor: BEER_COLORS.accent, ...SHADOWS.md },
  wantToGoButtonText: { fontSize: 16, fontWeight: '700', color: BEER_COLORS.accent },
  wantToGoButtonTextActive: { color: '#fff' },
  characteristicsSection: { width: '100%', marginBottom: SPACING.md },
  characteristicsLabel: { fontSize: 13, fontWeight: '600', color: BEER_COLORS.textSecondary, marginBottom: SPACING.xs },
  characteristicsText: { fontSize: 14, color: BEER_COLORS.textPrimary, lineHeight: 22, backgroundColor: BEER_COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: BEER_COLORS.border },
  triedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm, marginBottom: SPACING.md, gap: SPACING.sm, borderWidth: 2, borderColor: BEER_COLORS.accentSecondary, backgroundColor: 'transparent', ...SHADOWS.sm },
  triedButtonActive: { backgroundColor: BEER_COLORS.accentSecondary, borderColor: BEER_COLORS.accentSecondary, ...SHADOWS.md },
  triedButtonText: { fontSize: 16, fontWeight: '700', color: BEER_COLORS.accentSecondary },
  triedButtonTextActive: { color: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm, width: '100%' },
  infoText: { fontSize: 14, color: BEER_COLORS.textSecondary, flex: 1 },
  celebrationBanner: { width: '100%', backgroundColor: BEER_COLORS.accentSecondary + '15', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: BEER_COLORS.accentSecondary + '30' },
  celebrationEmoji: { fontSize: 32, marginBottom: SPACING.xs },
  celebrationText: { fontSize: 16, fontWeight: '700', color: BEER_COLORS.accentSecondary },
  celebrationSubtext: { fontSize: 13, color: BEER_COLORS.textSecondary, marginTop: 2 },
  section: { width: '100%', marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: BEER_COLORS.textSecondary, marginBottom: SPACING.sm },
  starContainer: { flexDirection: 'row', gap: SPACING.xs },
  ratingHint: { fontSize: 13, color: BEER_COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  noteInput: { backgroundColor: BEER_COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 15, color: BEER_COLORS.textPrimary, minHeight: 80, borderWidth: 1, borderColor: BEER_COLORS.border },
  mapsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BEER_COLORS.primary + '15', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, marginTop: SPACING.lg, gap: SPACING.sm, width: '100%' },
  mapsButtonText: { fontSize: 15, fontWeight: '600', color: BEER_COLORS.primary },
  webSearchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BEER_COLORS.accentSecondary + '15', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, marginTop: SPACING.sm, gap: SPACING.sm, width: '100%' },
  webSearchButtonText: { fontSize: 15, fontWeight: '600', color: BEER_COLORS.accentSecondary },
  excludeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, marginTop: SPACING.md, gap: SPACING.xs },
  excludeButtonText: { fontSize: 14, color: BEER_COLORS.textMuted },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, marginTop: SPACING.sm, gap: SPACING.xs },
  deleteButtonText: { fontSize: 14, color: BEER_COLORS.error },
  source: { fontSize: 11, color: BEER_COLORS.textMuted, marginTop: SPACING.lg },
});
