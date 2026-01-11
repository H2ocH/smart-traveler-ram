import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Chargement optionnel d'expo-notifications (fallback si non installé)
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  Notifications = null;
}

interface StepInfo {
  step: number;
  name: string;
  nearDutyFree: boolean;
  dutyFreeName?: string;
}

// Étapes proches d’un Duty Free (simulation)
const STEP_DUTY_FREE_MAP: Record<number, StepInfo> = {
  5: { step: 5, name: 'Duty_Free', nearDutyFree: true, dutyFreeName: 'Duty Free Atlas' },
  6: { step: 6, name: 'Porte_Embarquement', nearDutyFree: true, dutyFreeName: 'Duty Free Atlas' },
};

// Évite d’envoyer plusieurs fois la même notification
const NOTIFICATION_COOLDOWN = 10 * 60 * 1000; // 10 minutes
const lastNotificationRef = new Map<number, number>();

export async function requestNotificationPermission() {
  if (Platform.OS !== 'web' && Notifications) {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  return false;
}

export function useDutyFreeNotification(currentStep: number) {
  const hasPermission = useRef(false);

  useEffect(() => {
    requestNotificationPermission()
      .then((granted) => {
        hasPermission.current = granted;
      })
      .catch(() => {
        hasPermission.current = false;
      });
  }, []);

  useEffect(() => {
    if (!hasPermission.current || !Notifications) return;

    const stepInfo = STEP_DUTY_FREE_MAP[currentStep];
    if (!stepInfo?.nearDutyFree) return;

    const now = Date.now();
    const lastSent = lastNotificationRef.get(currentStep) || 0;

    if (now - lastSent < NOTIFICATION_COOLDOWN) return;

    Notifications.scheduleNotificationAsync({
      content: {
        title: '🛍️ Duty Free à proximité',
        body: `Vous approchez de ${stepInfo.dutyFreeName} ! Profitez de nos offres exclusives avant votre vol.`,
        data: { step: currentStep, shop: stepInfo.dutyFreeName },
      },
      trigger: null,
    });

    lastNotificationRef.set(currentStep, now);
  }, [currentStep]);
}
