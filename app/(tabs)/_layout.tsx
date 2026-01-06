import { Tabs } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#B22222',
          tabBarInactiveTintColor: '#94A3B8',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E8ECF0',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="house.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="qrcode" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="measure"
          options={{
            title: 'Mesure',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="ruler.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="weight"
          options={{
            title: 'Poids',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="scalemass.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: 'Plus',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="ellipsis.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="baggage-lost"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="baggage-damaged"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="claims"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="loyalty"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
