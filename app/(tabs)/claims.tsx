import RequireAuth from '@/components/RequireAuth';
import { usePassenger } from '@/context/PassengerContext';
import { BaggageClaim, clearBaggageClaimsForPassenger, listBaggageClaimsForPassenger, removeBaggageClaim } from '@/data/claimsStorage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ClaimsScreen() {
  const { passenger } = usePassenger();
  const [claims, setClaims] = useState<BaggageClaim[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const items = passenger.passengerName
        ? await listBaggageClaimsForPassenger(passenger.passengerName)
        : [];
      setClaims(items);
    } finally {
      setLoading(false);
    }
  }, [passenger.passengerName]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const confirmClear = () => {
    Alert.alert('Effacer', 'Supprimer toutes vos réclamations enregistrées ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: async () => {
          if (passenger.passengerName) {
            await clearBaggageClaimsForPassenger(passenger.passengerName);
          }
          await refresh();
        },
      },
    ]);
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette réclamation ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await removeBaggageClaim(id);
          await refresh();
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('fr-FR');
    } catch {
      return iso;
    }
  };

  return (
    <RequireAuth>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.85}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réclamations</Text>
          <TouchableOpacity style={styles.headerButton} onPress={confirmClear} activeOpacity={0.85}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#B22222" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="clipboard-text" size={22} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Historique</Text>
              <Text style={styles.heroSubtitle}>
                {loading ? 'Chargement…' : `${claims.length} réclamation(s) enregistrée(s)`}
              </Text>
            </View>
          </View>

          {claims.length === 0 && !loading ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="inbox" size={26} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Aucune réclamation</Text>
              <Text style={styles.emptySubtitle}>Les réclamations envoyées apparaîtront ici.</Text>
            </View>
          ) : (
            claims.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{c.type === 'lost' ? 'Perdu' : 'Endommagé'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmRemove(c.id)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="delete-outline" size={20} color="#B22222" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.claimId}>{c.id}</Text>
                <Text style={styles.meta}>Date: {formatDate(c.createdAt)}</Text>
                {c.flightNumber ? <Text style={styles.meta}>Vol: {c.flightNumber}</Text> : null}
                {c.baggageTagNumber ? <Text style={styles.meta}>Étiquette: {c.baggageTagNumber}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  headerButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  content: { padding: 16, paddingBottom: 24 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#B22222', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  heroSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '600', color: '#64748B' },
  emptyBox: { backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 14, fontWeight: '900', color: '#1E293B' },
  emptySubtitle: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { backgroundColor: 'rgba(178, 34, 34, 0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '900', color: '#B22222' },
  claimId: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  meta: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 3 },
});
