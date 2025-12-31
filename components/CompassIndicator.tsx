import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface Props {
    targetDirection?: number; // Target direction in degrees (0-360)
    size?: number;
    zoneName?: string; // Name of destination zone
}

export default function CompassIndicator({ targetDirection = 0, size = 140, zoneName }: Props) {
    const [heading, setHeading] = useState(0);
    const [subscription, setSubscription] = useState<any>(null);
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: heading,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [heading]);

    const _subscribe = async () => {
        try {
            const isAvailable = await Magnetometer.isAvailableAsync();
            if (!isAvailable) {
                console.log('Magnetometer not available');
                return;
            }

            Magnetometer.setUpdateInterval(100);
            const sub = Magnetometer.addListener((data) => {
                let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
                angle = (angle + 360) % 360;
                setHeading(Math.round(angle));
            });
            setSubscription(sub);
        } catch (error) {
            console.log('Error checking/subscribing to magnetometer:', error);
        }
    };

    const _unsubscribe = () => {
        try {
            subscription && subscription.remove();
            setSubscription(null);
        } catch (error) {
            console.log('Error unsubscribing:', error);
        }
    };

    // Calculate the angle to point to target
    const targetRotation = ((targetDirection - heading + 360) % 360);

    return (
        <View style={styles.container}>
            {/* Outer Ring */}
            <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]}>
                {/* Direction Arrow - Points to next destination */}
                <Animated.View style={[
                    styles.arrowContainer,
                    { transform: [{ rotate: `${targetRotation}deg` }] }
                ]}>
                    <View style={styles.arrow}>
                        <MaterialCommunityIcons name="navigation" size={36} color="#B22222" />
                    </View>
                </Animated.View>

                {/* Center Circle */}
                <View style={styles.centerCircle}>
                    <Text style={styles.headingText}>{heading}°</Text>
                </View>
            </View>

            {/* Destination Label */}
            {zoneName && (
                <View style={styles.destinationLabel}>
                    <Text style={styles.destinationText}>Vers: {zoneName}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        backgroundColor: '#fff',
        borderWidth: 4,
        borderColor: '#B22222',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#B22222',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    arrowContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 8,
    },
    arrow: {
        transform: [{ rotate: '0deg' }],
    },
    centerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(178, 34, 34, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#B22222',
    },
    destinationLabel: {
        marginTop: 16,
        backgroundColor: '#B22222',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    destinationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    headingText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#B22222',
    },
});
