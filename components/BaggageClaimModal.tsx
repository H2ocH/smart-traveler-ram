import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    baggageId?: string;
}

type ClaimType = 'lost' | 'damaged';

interface ClaimData {
    id: string;
    type: ClaimType;
    baggageId: string;
    name: string;
    email: string;
    phone: string;
    residence: string;
    description: string;
    timestamp: string;
    status: 'pending' | 'investigating' | 'resolved';
}

export default function BaggageClaimModal({ visible, onClose, baggageId = '' }: Props) {
    const [claimType, setClaimType] = useState<ClaimType>('lost');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [residence, setResidence] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setClaimType('lost');
        setName('');
        setEmail('');
        setPhone('');
        setResidence('');
        setDescription('');
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre nom');
            return;
        }
        if (!email.trim() || !validateEmail(email)) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
            return;
        }
        if (!phone.trim() || phone.length < 10) {
            Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Erreur', 'Veuillez décrire le problème');
            return;
        }

        setLoading(true);

        try {
            const claim: ClaimData = {
                id: Date.now().toString(),
                type: claimType,
                baggageId: baggageId || 'Non spécifié',
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                residence: residence.trim(),
                description: description.trim(),
                timestamp: new Date().toISOString(),
                status: 'pending',
            };

            // Get existing claims
            const existingClaims = await AsyncStorage.getItem('baggageClaims');
            const claims: ClaimData[] = existingClaims ? JSON.parse(existingClaims) : [];

            // Add new claim
            claims.push(claim);
            await AsyncStorage.setItem('baggageClaims', JSON.stringify(claims));

            Alert.alert(
                'Réclamation envoyée',
                `Votre réclamation a été enregistrée avec succès.\n\nNuméro de référence: ${claim.id}\n\nNous vous contacterons sous 24-48h.`,
                [{ text: 'OK', onPress: () => { resetForm(); onClose(); } }]
            );
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="bag-suitcase-off" size={28} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Réclamation Bagage</Text>
                            <Text style={styles.headerSubtitle}>Signalez un problème</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={22} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Claim Type Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Type de problème</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, claimType === 'lost' && styles.typeBtnActive]}
                                onPress={() => setClaimType('lost')}
                            >
                                <MaterialCommunityIcons
                                    name="help-circle"
                                    size={24}
                                    color={claimType === 'lost' ? '#fff' : '#64748B'}
                                />
                                <Text style={[styles.typeBtnText, claimType === 'lost' && styles.typeBtnTextActive]}>
                                    Bagage perdu
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, claimType === 'damaged' && styles.typeBtnActive]}
                                onPress={() => setClaimType('damaged')}
                            >
                                <MaterialCommunityIcons
                                    name="alert-circle"
                                    size={24}
                                    color={claimType === 'damaged' ? '#fff' : '#64748B'}
                                />
                                <Text style={[styles.typeBtnText, claimType === 'damaged' && styles.typeBtnTextActive]}>
                                    Bagage endommagé
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vos informations</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nom complet *</Text>
                            <View style={styles.inputBox}>
                                <MaterialCommunityIcons name="account" size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Prénom et Nom"
                                    placeholderTextColor="#CBD5E1"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email *</Text>
                            <View style={styles.inputBox}>
                                <MaterialCommunityIcons name="email" size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#CBD5E1"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Téléphone *</Text>
                            <View style={styles.inputBox}>
                                <MaterialCommunityIcons name="phone" size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="+212 6XX XXX XXX"
                                    placeholderTextColor="#CBD5E1"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Adresse de résidence</Text>
                            <View style={styles.inputBox}>
                                <MaterialCommunityIcons name="home" size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ville, Pays"
                                    placeholderTextColor="#CBD5E1"
                                    value={residence}
                                    onChangeText={setResidence}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description du problème *</Text>
                        <View style={styles.textAreaBox}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Décrivez votre bagage (couleur, taille, marque...) et le problème rencontré"
                                placeholderTextColor="#CBD5E1"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#0369A1" />
                        <Text style={styles.infoText}>
                            Votre réclamation sera traitée dans un délai de 24 à 48 heures. Vous recevrez une confirmation par email.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <MaterialCommunityIcons name="send" size={22} color="#fff" />
                        <Text style={styles.submitBtnText}>
                            {loading ? 'Envoi en cours...' : 'Envoyer la réclamation'}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#B22222',
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 2,
    },
    closeBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E8ECF0',
    },
    typeBtnActive: {
        backgroundColor: '#B22222',
        borderColor: '#B22222',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8ECF0',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    textAreaBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8ECF0',
        padding: 14,
    },
    textArea: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1E293B',
        height: 100,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#E0F2FE',
        padding: 16,
        borderRadius: 14,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#0369A1',
        lineHeight: 20,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#B22222',
        paddingVertical: 18,
        borderRadius: 16,
    },
    submitBtnLoading: {
        opacity: 0.7,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
});
