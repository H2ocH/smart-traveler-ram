import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface Props {
    targetDirection?: number; // Target direction in degrees (0-360)
    size?: number;
}

export default function CompassIndicator({ targetDirection = 0, size = 120 }: Props) {
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

    const _subscribe = () => {
        Magnetometer.setUpdateInterval(100);
        const sub = Magnetometer.addListener((data) => {
            let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
            angle = (angle + 360) % 360;
            setHeading(Math.round(angle));
        });
        setSubscription(sub);
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const getCardinalDirection = (deg: number): string => {
        if (deg >= 337.5 || deg < 22.5) return 'N';
        if (deg >= 22.5 && deg < 67.5) return 'NE';
        if (deg >= 67.5 && deg < 112.5) return 'E';
        if (deg >= 112.5 && deg < 157.5) return 'SE';
        if (deg >= 157.5 && deg < 202.5) return 'S';
        if (deg >= 202.5 && deg < 247.5) return 'SO';
        if (deg >= 247.5 && deg < 292.5) return 'O';
        return 'NO';
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['360deg', '0deg'],
    });

    const targetRotation = ((targetDirection - heading + 360) % 360);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Compass Ring */}
            <View style={[styles.compassRing, { width: size, height: size, borderRadius: size / 2 }]}>
                <Animated.View style={[styles.compassInner, { transform: [{ rotate: rotation }] }]}>
                    {/* Cardinal Points */}
                    <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
                    <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
                    <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
                    <Text style={[styles.cardinal, styles.cardinalO]}>O</Text>
                </Animated.View>
            </View>

            {/* Target Arrow */}
            <View style={[
                styles.targetArrow,
                { transform: [{ rotate: `${targetRotation}deg` }] }
            ]}>
                <View style={styles.arrowHead}>
                    <MaterialCommunityIcons name="navigation" size={32} color="#B22222" />
                </View>
            </View>

            {/* Center */}
            <View style={styles.centerDot}>
                <Text style={styles.headingText}>{heading}°</Text>
                <Text style={styles.directionText}>{getCardinalDirection(heading)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    compassRing: {
        backgroundColor: 'rgba(178, 34, 34, 0.08)',
        borderWidth: 3,
        borderColor: '#B22222',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    compassInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardinal: {
        position: 'absolute',
        fontSize: 14,
        fontWeight: '800',
        color: '#64748B',
    },
    cardinalN: {
        top: 8,
        color: '#B22222',
        fontWeight: '900',
    },
    cardinalE: {
        right: 8,
    },
    cardinalS: {
        bottom: 8,
    },
    cardinalO: {
        left: 8,
    },
    targetArrow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    arrowHead: {
        marginTop: 4,
    },
    centerDot: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headingText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    directionText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
});
