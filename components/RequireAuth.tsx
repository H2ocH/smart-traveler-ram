import { usePassenger } from '@/context/PassengerContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
    const { passenger, hydrated } = usePassenger();

    if (!hydrated) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="progress-clock" size={48} color="#B22222" />
                    </View>
                    <Text style={styles.title}>Chargement</Text>
                    <Text style={styles.subtitle}>Récupération de votre session…</Text>
                </View>
            </View>
        );
    }

    if (!passenger.isLoggedIn) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="lock" size={48} color="#B22222" />
                    </View>
                    <Text style={styles.title}>Connexion requise</Text>
                    <Text style={styles.subtitle}>
                        Veuillez vous connecter avec votre numéro de vol pour accéder à cette fonctionnalité
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.replace('/home')}
                        activeOpacity={0.9}
                    >
                        <MaterialCommunityIcons name="home" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    iconBox: {
        width: 90,
        height: 90,
        borderRadius: 28,
        backgroundColor: 'rgba(178, 34, 34, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#B22222',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
