import { View, Image, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function SplashScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/home'); // va vers ton Home
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash.jpeg')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B5001A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '85%',
    height: '85%',
  },
});
