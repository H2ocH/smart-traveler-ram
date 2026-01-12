import { useCrowd } from '@/context/CrowdContext';
import { formatDuration } from '@/data/crowdData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function DashboardScreen() {
    const { dataset, activeUsers, isConnected, getTotalRecords, getRealRecords } = useCrowd();

    // Prendre les 30 derniers enregistrements pour le tableau
    const recentRecords = dataset.slice(0, 30);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <MaterialCommunityIcons name="table" size={28} color="#fff" />
                <Text style={styles.headerTitle}>Dataset Voyageurs</Text>
                <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4ADE80' : '#EF4444' }]} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{getTotalRecords()}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{getRealRecords()}</Text>
                    <Text style={styles.statLabel}>Réels</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{dataset.length}</Text>
                    <Text style={styles.statLabel}>Records</Text>
                </View>
            </View>

            {/* Data Table */}
            <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>Tableau des Temps par Étape</Text>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 0.8 }]}>Passager</Text>
                    <Text style={[styles.headerCell, { flex: 0.6 }]}>Voyage</Text>
                    <Text style={[styles.headerCell, { flex: 1.2 }]}>De</Text>
                    <Text style={[styles.headerCell, { flex: 1.2 }]}>Vers</Text>
                    <Text style={[styles.headerCell, { flex: 0.8 }]}>Durée</Text>
                    <Text style={[styles.headerCell, { flex: 0.6 }]}>Type</Text>
                </View>

                {/* Table Rows */}
                {recentRecords.map((record, index) => (
                    <View
                        key={record.id}
                        style={[
                            styles.tableRow,
                            index % 2 === 0 && styles.evenRow,
                            !record.isSimulated && styles.realRow
                        ]}
                    >
                        <Text style={[styles.cell, { flex: 0.8, fontSize: 9 }]} numberOfLines={1}>
                            {record.passengerId ? record.passengerId.substring(0, 8) : '-'}
                        </Text>
                        <Text style={[styles.cell, { flex: 0.6, fontSize: 9 }]} numberOfLines={1}>
                            {record.journeyId ? record.journeyId.substring(0, 6) : '-'}
                        </Text>
                        <Text style={[styles.cell, { flex: 1.2 }]}>{record.stepFrom}</Text>
                        <Text style={[styles.cell, { flex: 1.2 }]}>{record.stepTo}</Text>
                        <Text style={[styles.cell, styles.durationCell, { flex: 0.8 }]}>
                            {formatDuration(record.durationSeconds)}
                        </Text>
                        <View style={{ flex: 0.6, alignItems: 'center' }}>
                            <Text style={[
                                styles.typeBadge,
                                record.isSimulated ? styles.simBadge : styles.realBadge
                            ]}>
                                {record.isSimulated ? 'SIM' : 'RÉEL'}
                            </Text>
                        </View>
                    </View>
                ))}

                {recentRecords.length === 0 && (
                    <View style={styles.emptyRow}>
                        <Text style={styles.emptyText}>Aucune donnée. Lancez une simulation ou parcourez le guide.</Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Dashboard PC • Actualisation automatique
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E293B',
    },
    content: {
        padding: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#334155',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNum: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F1F5F9',
    },
    statLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    tableContainer: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    tableTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F1F5F9',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    headerCell: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
        alignItems: 'center',
    },
    evenRow: {
        backgroundColor: '#1E293B',
    },
    realRow: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#22C55E',
    },
    cell: {
        fontSize: 13,
        color: '#CBD5E1',
    },
    durationCell: {
        fontWeight: '700',
        color: '#3B82F6',
    },
    typeBadge: {
        fontSize: 9,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    simBadge: {
        backgroundColor: '#475569',
        color: '#94A3B8',
    },
    realBadge: {
        backgroundColor: '#166534',
        color: '#4ADE80',
    },
    emptyRow: {
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontStyle: 'italic',
    },
    footer: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 12,
        marginTop: 10,
    },
});
