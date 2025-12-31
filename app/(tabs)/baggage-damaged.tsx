import RequireAuth from '@/components/RequireAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type DamagedBaggageForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  baggageTagNumber: string;
  pirReference: string;
  baggageDescription: string;
  damageType: string;
  damageDescription: string;
  whereNoticed: string;
  missingItems: string;
  estimatedCost: string;
  preferredResolution: string;
  photoLinks: string;
};

export default function BaggageDamagedScreen() {
  const [form, setForm] = useState<DamagedBaggageForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    flightNumber: '',
    flightDate: '',
    departureAirport: '',
    arrivalAirport: '',
    baggageTagNumber: '',
    pirReference: '',
    baggageDescription: '',
    damageType: '',
    damageDescription: '',
    whereNoticed: '',
    missingItems: '',
    estimatedCost: '',
    preferredResolution: 'Réparation',
    photoLinks: '',
  });

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.firstName.trim()) missing.push('Prénom');
    if (!form.lastName.trim()) missing.push('Nom');
    if (!form.email.trim()) missing.push('Email');
    if (!form.flightNumber.trim()) missing.push('Numéro de vol');
    if (!form.flightDate.trim()) missing.push('Date du vol');
    if (!form.baggageTagNumber.trim()) missing.push('Numéro étiquette bagage');
    if (!form.damageDescription.trim()) missing.push('Description des dommages');
    return missing;
  }, [form]);

  const setField = (key: keyof DamagedBaggageForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    if (requiredMissing.length > 0) {
      Alert.alert('Champs requis', `Merci de compléter: ${requiredMissing.join(', ')}`);
      return;
    }

    Alert.alert(
      'Réclamation envoyée',
      "Votre déclaration de bagage endommagé a été enregistrée. Conservez votre référence et vos preuves (photos, reçus).",
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <RequireAuth>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: '#1565C0' }]}>
              <MaterialCommunityIcons name="bag-suitcase" size={26} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Bagage endommagé</Text>
              <Text style={styles.subtitle}>Déclare un bagage abîmé pour accélérer la prise en charge.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Coordonnées</Text>

            <Text style={styles.label}>Prénom *</Text>
            <TextInput style={styles.input} value={form.firstName} onChangeText={(t) => setField('firstName', t)} placeholder="Prénom" />

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={form.lastName} onChangeText={(t) => setField('lastName', t)} placeholder="Nom" />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              placeholder="nom@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Téléphone</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setField('phone', t)} placeholder="+212 ..." keyboardType="phone-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations de vol</Text>

            <Text style={styles.label}>Numéro de vol *</Text>
            <TextInput style={styles.input} value={form.flightNumber} onChangeText={(t) => setField('flightNumber', t)} placeholder="AT205" autoCapitalize="characters" />

            <Text style={styles.label}>Date du vol *</Text>
            <TextInput style={styles.input} value={form.flightDate} onChangeText={(t) => setField('flightDate', t)} placeholder="JJ/MM/AAAA" />

            <Text style={styles.label}>Départ</Text>
            <TextInput style={styles.input} value={form.departureAirport} onChangeText={(t) => setField('departureAirport', t)} placeholder="CMN" autoCapitalize="characters" />

            <Text style={styles.label}>Arrivée</Text>
            <TextInput style={styles.input} value={form.arrivalAirport} onChangeText={(t) => setField('arrivalAirport', t)} placeholder="CDG" autoCapitalize="characters" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bagage & dommages</Text>

            <Text style={styles.label}>Numéro d'étiquette bagage *</Text>
            <TextInput style={styles.input} value={form.baggageTagNumber} onChangeText={(t) => setField('baggageTagNumber', t)} placeholder="Ex: 1234 567890" />

            <Text style={styles.label}>Référence PIR (si disponible)</Text>
            <TextInput style={styles.input} value={form.pirReference} onChangeText={(t) => setField('pirReference', t)} placeholder="Ex: CMNAT12345" autoCapitalize="characters" />

            <Text style={styles.label}>Description du bagage</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.baggageDescription}
              onChangeText={(t) => setField('baggageDescription', t)}
              placeholder="Couleur, marque, taille, signes distinctifs"
              multiline
            />

            <Text style={styles.label}>Type de dommage</Text>
            <TextInput style={styles.input} value={form.damageType} onChangeText={(t) => setField('damageType', t)} placeholder="Ex: roulette cassée, coque fissurée" />

            <Text style={styles.label}>Description des dommages *</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.damageDescription}
              onChangeText={(t) => setField('damageDescription', t)}
              placeholder="Décris précisément les dommages et leur gravité"
              multiline
            />

            <Text style={styles.label}>Où le dommage a été constaté ?</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.whereNoticed}
              onChangeText={(t) => setField('whereNoticed', t)}
              placeholder="Ex: tapis bagages, sortie douane, domicile"
              multiline
            />

            <Text style={styles.label}>Objets manquants (si applicable)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.missingItems}
              onChangeText={(t) => setField('missingItems', t)}
              placeholder="Liste d'objets manquants + valeur approximative"
              multiline
            />

            <Text style={styles.label}>Coût estimé (MAD/EUR)</Text>
            <TextInput style={styles.input} value={form.estimatedCost} onChangeText={(t) => setField('estimatedCost', t)} placeholder="Ex: 400" keyboardType="numeric" />

            <Text style={styles.label}>Photos (liens) </Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.photoLinks}
              onChangeText={(t) => setField('photoLinks', t)}
              placeholder="Colle un ou plusieurs liens (Drive/Dropbox) si tu en as"
              multiline
            />

            <Text style={styles.label}>Solution souhaitée</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceChip, form.preferredResolution === 'Réparation' && styles.choiceChipActive]}
                onPress={() => setField('preferredResolution', 'Réparation')}
                activeOpacity={0.85}
              >
                <Text style={[styles.choiceText, form.preferredResolution === 'Réparation' && styles.choiceTextActive]}>Réparation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceChip, form.preferredResolution === 'Remplacement' && styles.choiceChipActive]}
                onPress={() => setField('preferredResolution', 'Remplacement')}
                activeOpacity={0.85}
              >
                <Text style={[styles.choiceText, form.preferredResolution === 'Remplacement' && styles.choiceTextActive]}>Remplacement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceChip, form.preferredResolution === 'Indemnisation' && styles.choiceChipActive]}
                onPress={() => setField('preferredResolution', 'Indemnisation')}
                activeOpacity={0.85}
              >
                <Text style={[styles.choiceText, form.preferredResolution === 'Indemnisation' && styles.choiceTextActive]}>Indemnisation</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#1565C0' }]} onPress={submit} activeOpacity={0.9}>
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>Envoyer la réclamation</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  headerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '500', color: '#64748B', lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E8ECF0', fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  choiceChip: { flexGrow: 1, borderWidth: 1, borderColor: '#E8ECF0', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center' },
  choiceChipActive: { backgroundColor: 'rgba(21, 101, 192, 0.08)', borderColor: 'rgba(21, 101, 192, 0.35)' },
  choiceText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  choiceTextActive: { color: '#1565C0' },
  submitButton: { flexDirection: 'row', gap: 10, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
