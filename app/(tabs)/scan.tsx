import BaggageClaimModal from '@/components/BaggageClaimModal';
import RequireAuth from '@/components/RequireAuth';
import { useJourney } from '@/context/JourneyContext';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

import { useLocalSearchParams } from 'expo-router';
// ... previous imports ...

function QRScannerScreenContent() {
  const { mode } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [baggages, setBaggages] = useState<any[]>([]);
  const [currentMode, setCurrentMode] = useState(mode === 'checkout' ? 'checkout' : 'checkin');
  const [maysPoints, setMaysPoints] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Connexion avec le Smart Guide
  const { completeStepByQR } = useJourney();
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    loadMaysPoints();
    if (!permission) {
      requestPermission();
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [permission, requestPermission]);

  const loadMaysPoints = async () => {
    try {
      const savedPoints = await AsyncStorage.getItem('maysPoints');
      if (savedPoints) {
        setMaysPoints(parseInt(savedPoints));
      }
    } catch (error) {
      console.log('Erreur chargement Mays:', error);
    }
  };

  const saveMaysPoints = async (points: number) => {
    try {
      await AsyncStorage.setItem('maysPoints', points.toString());
    } catch (error) {
      console.log('Erreur sauvegarde Mays:', error);
    }
  };

  const earnMays = async (points: number) => {
    const newTotal = maysPoints + points;
    setMaysPoints(newTotal);
    await saveMaysPoints(newTotal);
  };

  const handleBarCodeScanned = (scanningResult: { data: string }) => {
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;

    if (timeSinceLastScan < 3000) {
      return;
    }

    if (scanningResult.data === lastScannedCodeRef.current && timeSinceLastScan < 5000) {
      return;
    }

    if (scanned) return;

    setScanned(true);
    Vibration.vibrate();

    lastScannedCodeRef.current = scanningResult.data;
    lastScanTimeRef.current = now;

    console.log('QR Code scanné:', scanningResult.data);

    try {
      const qrData = JSON.parse(scanningResult.data);
      processQRCode(qrData);
    } catch (error) {
      console.log('Erreur parsing QR:', error);
      Alert.alert(
        'Format non reconnu',
        'Le QR code doit être au format JSON.'
      );
      resetScanner();
    }

    scanTimeoutRef.current = setTimeout(() => {
      setScanned(false);
    }, 3000);
  };

  const processQRCode = (qrData: any) => {
    const scanRecord = {
      id: Date.now().toString(),
      type: currentMode,
      data: qrData,
      timestamp: new Date().toLocaleString('fr-FR'),
    };

    setScanHistory(prev => [scanRecord, ...prev.slice(0, 9)]);

    if (currentMode === 'checkin') {
      handleCheckInScan(qrData);
    } else {
      handleCheckOutScan(qrData);
    }
  };

  const handleCheckInScan = async (data: any) => {
    const baggageId = data.baggageId;

    if (!baggageId) {
      Alert.alert('QR invalide', 'ID de bagage manquant dans le QR code.');
      resetScanner();
      return;
    }

    const existingBaggage = baggages.find(b => b.id === baggageId);
    if (existingBaggage) {
      Alert.alert(
        'Bagage déjà enregistré',
        `Le bagage ${baggageId} est déjà enregistré.`
      );
      resetScanner();
      return;
    }

    const newBaggage = {
      id: baggageId,
      passengerName: data.passengerName || 'Passager Inconnu',
      flight: data.flightNumber || 'Vol Inconnu',
      status: 'checked_in',
      checkinTime: new Date().toLocaleString('fr-FR'),
      checkoutTime: null,
      originalData: data
    };

    setBaggages(prev => [...prev, newBaggage]);

    await earnMays(10);

    // Valider l'étape bagages dans le Smart Guide
    completeStepByQR('baggage');

    Alert.alert(
      'Check-in Réussi',
      `Bagage ${newBaggage.id} enregistré pour ${newBaggage.passengerName}\n\n+10 Mays!\n\nÉtape "Bagages" validée!`,
      [{ text: 'OK', onPress: resetScanner }]
    );
  };

  const handleCheckOutScan = async (data: any) => {
    const baggageId = data.baggageId;

    if (!baggageId) {
      Alert.alert('QR invalide', 'ID de bagage manquant dans le QR code.');
      resetScanner();
      return;
    }

    const baggage = baggages.find(b => b.id === baggageId);

    if (!baggage) {
      Alert.alert(
        'Bagage non trouvé',
        `Aucun bagage trouvé avec l'ID ${baggageId}.\nVeuillez d'abord effectuer le check-in.`
      );
      resetScanner();
      return;
    }

    if (baggage.status === 'checked_out') {
      Alert.alert(
        'Déjà livré',
        `Ce bagage a déjà été remis au passager le ${baggage.checkoutTime}.`
      );
      resetScanner();
      return;
    }

    const isMatch = compareWithCheckinData(baggage, data);

    if (isMatch) {
      const updatedBaggages = baggages.map(b =>
        b.id === baggageId
          ? {
            ...b,
            status: 'checked_out',
            checkoutTime: new Date().toLocaleString('fr-FR'),
            checkoutData: data
          }
          : b
      );

      setBaggages(updatedBaggages);

      await earnMays(15);

      Alert.alert(
        'Check-out Réussi',
        `Bagage ${baggageId} validé pour ${baggage.passengerName}\n\nLes données correspondent\n\n+15 Mays!`,
        [{ text: 'OK', onPress: resetScanner }]
      );
    } else {
      Alert.alert(
        'Données incompatibles',
        `Les données scannées ne correspondent pas à l'enregistrement check-in.\n\nVeuillez vérifier le bagage.`,
        [{ text: 'OK', onPress: resetScanner }]
      );
    }
  };

  const compareWithCheckinData = (baggage: any, checkoutData: any) => {
    const checkinData = baggage.originalData;

    if (checkoutData.baggageId !== baggage.id) {
      return false;
    }

    if (checkoutData.passengerName && checkinData.passengerName) {
      const normalizedCheckoutName = checkoutData.passengerName.trim().toLowerCase();
      const normalizedCheckinName = checkinData.passengerName.trim().toLowerCase();

      if (normalizedCheckoutName !== normalizedCheckinName) {
        return false;
      }
    }

    if (checkoutData.flightNumber && checkinData.flightNumber) {
      const normalizedCheckoutFlight = checkoutData.flightNumber.trim().toUpperCase();
      const normalizedCheckinFlight = checkinData.flightNumber.trim().toUpperCase();

      if (normalizedCheckoutFlight !== normalizedCheckinFlight) {
        return false;
      }
    }

    return true;
  };

  const resetScanner = () => {
    setScanned(false);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Effacer toutes les données',
      'Voulez-vous vraiment effacer tous les bagages, l\'historique et les points Mays ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            // Réinitialiser tous les états
            setBaggages([]);
            setScanHistory([]);
            setMaysPoints(0);
            lastScannedCodeRef.current = '';
            lastScanTimeRef.current = 0;

            // Effacer AsyncStorage
            AsyncStorage.multiRemove(['maysPoints', 'baggages', 'scanHistory'])
              .then(() => {
                Alert.alert('Succès', 'Toutes les données ont été effacées');
              })
              .catch((error) => {
                console.log('Erreur effacement données:', error);
                Alert.alert('Succès', 'Données effacées');
              });
          }
        }
      ]
    );
  };

  const getBaggageStats = () => {
    const checkedIn = baggages.filter(b => b.status === 'checked_in').length;
    const checkedOut = baggages.filter(b => b.status === 'checked_out').length;
    const total = baggages.length;

    return { checkedIn, checkedOut, total };
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Demande de permission caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Permission caméra requise</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getBaggageStats();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.titleContainer}>
        <MaterialCommunityIcons name="bag-suitcase" size={28} color="#B22222" />
        <Text style={styles.title}>Suivi des Bagages</Text>
      </View>

      {/* SUPPRIMÉ : Section Mays avec bouton de récupération */}

      {/* SUPPRIMÉ : Modal de récupération des Mays */}

      {/* Sélecteur de mode */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            currentMode === 'checkin' && styles.modeButtonActive
          ]}
          onPress={() => setCurrentMode('checkin')}
        >
          <Text style={[
            styles.modeButtonText,
            currentMode === 'checkin' && styles.modeButtonTextActive
          ]}>
            Check-in
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            currentMode === 'checkout' && styles.modeButtonActive
          ]}
          onPress={() => setCurrentMode('checkout')}
        >
          <Text style={[
            styles.modeButtonText,
            currentMode === 'checkout' && styles.modeButtonTextActive
          ]}>
            Check-out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur de mode */}
      <View style={[
        styles.modeIndicator,
        currentMode === 'checkin' ? styles.modeCheckin : styles.modeCheckout
      ]}>
        <Text style={styles.modeIndicatorText}>
          {currentMode === 'checkin' ? 'Mode Check-in' : 'Mode Check-out'}
        </Text>
        <Text style={styles.modeDescription}>
          {currentMode === 'checkin'
            ? 'Scannez le QR code pour enregistrer un nouveau bagage'
            : 'Scannez le QR code pour vérifier et valider la récupération'}
        </Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.statPending]}>{stats.checkedIn}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.statDelivered]}>{stats.checkedOut}</Text>
          <Text style={styles.statLabel}>Livrés</Text>
        </View>
      </View>

      {/* Liste des bagages */}
      {baggages.length > 0 && (
        <View style={styles.baggagesSection}>
          <Text style={styles.sectionTitle}>Liste des Bagages</Text>
          <View style={styles.baggagesList}>
            {baggages.map((baggage) => (
              <View key={baggage.id} style={[
                styles.baggageCard,
                baggage.status === 'checked_out' && styles.checkedOutCard
              ]}>
                <View style={styles.baggageHeader}>
                  <Text style={styles.baggageId}>
                    <MaterialCommunityIcons name="barcode-scan" size={16} color="#333" /> {baggage.id}
                  </Text>
                  <Text style={[
                    styles.baggageStatus,
                    baggage.status === 'checked_in' && styles.statusCheckin,
                    baggage.status === 'checked_out' && styles.statusCheckout
                  ]}>
                    {baggage.status === 'checked_in' ? 'En attente' : 'Livré'}
                  </Text>
                </View>
                <View style={styles.baggageRow}>
                  <MaterialCommunityIcons name="account" size={14} color="#666" />
                  <Text style={styles.baggagePassenger}> {baggage.passengerName}</Text>
                </View>
                <View style={styles.baggageRow}>
                  <MaterialCommunityIcons name="airplane" size={14} color="#888" />
                  <Text style={styles.baggageFlight}> {baggage.flight}</Text>
                </View>
                <Text style={styles.baggageTime}>
                  Check-in: {baggage.checkinTime}
                  {baggage.checkoutTime && `\nCheck-out: ${baggage.checkoutTime}`}
                </Text>
                {baggage.status === 'checked_out' && (
                  <View style={styles.validationContainer}>
                    <MaterialCommunityIcons name="check-circle" size={14} color="#2E7D32" />
                    <Text style={styles.validationIndicator}> Données vérifiées</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Caméra */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.scanFrame}>
          <Text style={styles.scanText}>
            {scanned ? 'Code scanné' : 'Scanner le QR code'}
          </Text>
          <Text style={styles.scanSubtext}>
            {scanned ? 'Traitement en cours...' : 'Placez le code dans le cadre'}
          </Text>
        </View>
      </View>

      {/* Indicateur de délai */}
      {scanned && (
        <View style={styles.delayIndicator}>
          <MaterialCommunityIcons name="timer-sand" size={16} color="white" />
          <Text style={styles.delayText}> Attendez 3 secondes...</Text>
        </View>
      )}

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={resetScanner}>
          <MaterialIcons name="camera-alt" size={24} color="white" />
          <Text style={styles.buttonText}>
            {scanned ? 'Scanner à nouveau' : 'Prêt à scanner'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
          <MaterialCommunityIcons name="delete-sweep" size={20} color="white" />
          <Text style={styles.clearButtonText}>Effacer Tout</Text>
        </TouchableOpacity>

      </View>



      {/* Baggage Claim Modal */}
      <BaggageClaimModal
        visible={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />

      {/* Historique des scans */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <MaterialCommunityIcons name="clipboard-list" size={18} color="#333" />
            <Text style={styles.historyTitle}>Historique des Scans</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.historyCount}>({scanHistory.length})</Text>
            {scanHistory.length > 0 && (
              <TouchableOpacity onPress={() => {
                setScanHistory([]);
                setBaggages([]);
                Alert.alert('Succès', 'Historique et bagages effacés');
              }}>
                <MaterialCommunityIcons name="delete-sweep" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.historyList}>
          {scanHistory.map((scan) => (
            <View key={scan.id} style={styles.scanItem}>
              <View style={styles.scanHeader}>
                <Text style={[
                  styles.scanType,
                  scan.type === 'checkin' ? styles.scanCheckin : styles.scanCheckout
                ]}>
                  {scan.type === 'checkin' ? 'CHECK-IN' : 'CHECK-OUT'}
                </Text>
                <Text style={styles.scanPoints}>
                  {scan.type === 'checkin' ? 'Enregistrement' : 'Validation'}
                </Text>
              </View>
              <Text style={styles.scanData}>
                Bagage: {scan.data.baggageId} | Passager: {scan.data.passengerName}
              </Text>
              <Text style={styles.scanTime}>{scan.timestamp}</Text>
            </View>
          ))}
          {scanHistory.length === 0 && (
            <Text style={styles.emptyText}>Aucun scan effectué</Text>
          )}
        </View>
      </View>

      {currentMode === 'checkout' && (
        <TouchableOpacity style={styles.claimLink} onPress={() => setShowClaimModal(true)}>
          <Text style={styles.claimLinkText}>Bagage introuvable ? Réclamer ici</Text>
        </TouchableOpacity>
      )}

      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain" />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#333',
  },
  modeSelector: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    elevation: 3,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#B22222',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  modeIndicator: {
    padding: 12,
    margin: 10,
    borderRadius: 8,
  },
  modeCheckin: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  modeCheckout: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  modeIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: '#666',
  }, logoContainer: {
    position: 'absolute',
    top: 37,
    right: 10,
    zIndex: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B22222',
  },
  statPending: {
    color: '#FF9800',
  },
  statDelivered: {
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  baggagesSection: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  baggagesList: {},
  baggageCard: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  checkedOutCard: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  baggageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  baggageId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  baggageStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCheckin: {
    backgroundColor: '#FFE0B2',
    color: '#E65100',
  },
  statusCheckout: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  baggagePassenger: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  baggageFlight: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  baggageTime: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  validationIndicator: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#E8F5E8',
    padding: 4,
    borderRadius: 4,
  },
  cameraContainer: {
    height: 250,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '25%',
    borderWidth: 2,
    borderColor: '#B22222',
    borderRadius: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'rgba(177, 47, 47, 0.7)',
    padding: 8,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 5,
  },
  scanSubtext: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 3,
    textAlign: 'center',
    fontSize: 10,
  },
  delayIndicator: {
    backgroundColor: '#FF9800',
    padding: 8,
    margin: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  delayText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  controls: {
    padding: 15,
  },
  button: {
    backgroundColor: '#B22222',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  historyCount: {
    color: '#666',
    fontSize: 14,
  },
  historyList: {
    padding: 10,
    maxHeight: 200,
  },
  scanItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scanType: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scanCheckin: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
  scanCheckout: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  scanPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  scanData: {
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
  },
  scanTime: {
    fontSize: 10,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },


  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
    gap: 10,
  },
  baggageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
    gap: 6,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  claimLink: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  claimLinkText: {
    color: '#B22222',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default function QRScannerScreen() {
  return (
    <RequireAuth>
      <QRScannerScreenContent />
    </RequireAuth>
  );
}