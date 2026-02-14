// ============================================
// Add Custom Bakery Modal
// Add bakery (ブーランジェリー等) not in the dataset
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BEER_COLORS, SPACING, RADIUS } from '../constants/theme';
import { useStore } from '../store/useStore';
import type { BakeryPin } from '../types';

interface AddBakeryModalProps {
  visible: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
  onSuccess?: (bakeryId: string) => void;
}

type BakeryType = BakeryPin['type'];

const BAKERY_TYPES: { value: BakeryType; label: string; emoji: string }[] = [
  { value: 'boulangerie', label: 'Boulangerie', emoji: '🥖' },
  { value: 'patisserie', label: 'Pâtisserie', emoji: '🍰' },
  { value: 'artisan', label: 'Artisan', emoji: '👨‍🍳' },
];

export default function AddBakeryModal({
  visible,
  onClose,
  initialLocation,
  onSuccess,
}: AddBakeryModalProps) {
  const addCustomBakery = useStore((state) => state.addCustomBakery);

  const [name, setName] = useState('');
  const [type, setType] = useState<BakeryType>('boulangerie');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setType('boulangerie');
      setAddress('');
    }
  }, [visible]);

  const resetForm = useCallback(() => {
    setName('');
    setType('boulangerie');
    setAddress('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!initialLocation) {
      Alert.alert('Error', 'Please pick a location on the map');
      return;
    }
    const bakeryId = addCustomBakery({
      name: name.trim(),
      type,
      lat: initialLocation.lat,
      lng: initialLocation.lng,
      address: address.trim() || undefined,
    });
    Alert.alert('Done', `"${name.trim()}" has been added`, [
      { text: 'OK', onPress: () => { handleClose(); onSuccess?.(bakeryId); } },
    ]);
  }, [name, type, initialLocation, address, addCustomBakery, handleClose, onSuccess]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Add a bakery</Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={BEER_COLORS.textMuted} />
              </Pressable>
            </View>
            {initialLocation && (
              <View style={styles.locationDisplay}>
                <Ionicons name="location" size={20} color={BEER_COLORS.primary} />
                <Text style={styles.locationText}>
                  {initialLocation.lat.toFixed(6)}, {initialLocation.lng.toFixed(6)}
                </Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Boulangerie du Marché"
                placeholderTextColor={BEER_COLORS.textMuted}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeSelector}>
                {BAKERY_TYPES.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.typeOption, type === option.value && styles.typeOptionActive]}
                    onPress={() => setType(option.value)}
                  >
                    <Text style={styles.typeEmoji}>{option.emoji}</Text>
                    <Text style={[styles.typeLabel, type === option.value && styles.typeLabelActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. 8 rue du Cherche-Midi, 75006 Paris"
                placeholderTextColor={BEER_COLORS.textMuted}
              />
            </View>
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add bakery</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { backgroundColor: BEER_COLORS.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  title: { fontSize: 22, fontWeight: '700', color: BEER_COLORS.textPrimary },
  closeButton: { padding: SPACING.sm, marginRight: -SPACING.sm },
  locationDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: BEER_COLORS.primary + '10', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, gap: SPACING.sm },
  locationText: { fontSize: 14, color: BEER_COLORS.primary, fontWeight: '500' },
  field: { marginBottom: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: BEER_COLORS.textSecondary, marginBottom: SPACING.sm },
  input: { backgroundColor: BEER_COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 16, color: BEER_COLORS.textPrimary, borderWidth: 1, borderColor: BEER_COLORS.border },
  typeSelector: { flexDirection: 'row', gap: SPACING.sm },
  typeOption: { flex: 1, alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: BEER_COLORS.surface, borderWidth: 2, borderColor: BEER_COLORS.border },
  typeOptionActive: { borderColor: BEER_COLORS.primary, backgroundColor: BEER_COLORS.primary + '10' },
  typeEmoji: { fontSize: 24, marginBottom: SPACING.xs },
  typeLabel: { fontSize: 12, fontWeight: '600', color: BEER_COLORS.textMuted },
  typeLabelActive: { color: BEER_COLORS.primary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BEER_COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.xl },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
