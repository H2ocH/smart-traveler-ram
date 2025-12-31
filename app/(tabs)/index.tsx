import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* --- Logo --- */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* --- Cards --- */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => navigation.navigate('explore')}
          >
            <Image
              source={require('../../assets/images/airport_map.png')}
              style={styles.cardIcon}
              resizeMode="contain"
            />
            <Text style={styles.cardTitle}>Airport Map</Text>
            <Text style={styles.cardSubtitle}>Explore your terminal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, styles.cardScan]}
            onPress={() => navigation.navigate('scan')}
          >
            <Image
              source={require('../../assets/images/qr_icon.png')}
              style={styles.cardIcon}
              resizeMode="contain"
            />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Scan QR Code</Text>
            <Text style={[styles.cardSubtitle, { color: '#f5f5f5' }]}>
              Identify your baggage
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  cardsContainer: {
    width: width * 0.85,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 28,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardScan: {
    backgroundColor: '#C62828', // rouge RAM profond
  },
  cardIcon: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
  },
});
