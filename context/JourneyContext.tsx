import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

// Les étapes du parcours aéroport
export const JOURNEY_STEPS = [
    {
        id: 'checkin',
        title: 'Enregistrement',
        instruction: 'Rendez-vous aux comptoirs d\'enregistrement ou utilisez une borne auto-enregistrement.',
        icon: 'desktop-classic',
        action: 'Je suis enregistré',
        tips: ['Préparez votre passeport', 'Imprimez ou téléchargez votre carte d\'embarquement'],
        qrType: 'boarding_pass', // Type de QR qui valide cette étape
    },
    {
        id: 'baggage',
        title: 'Dépose Bagages',
        instruction: 'Déposez vos bagages en soute au comptoir dédié.',
        icon: 'bag-suitcase',
        action: 'Bagages déposés',
        tips: ['Max 23kg par bagage', 'Gardez vos objets de valeur en cabine'],
        qrType: 'baggage', // Scan du QR bagage valide cette étape
    },
    {
        id: 'security',
        title: 'Contrôle Sécurité',
        instruction: 'Passez le contrôle de sécurité. Préparez vos liquides et appareils électroniques.',
        icon: 'shield-check',
        action: 'Sécurité passée',
        tips: ['Liquides < 100ml dans sac transparent', 'Retirez ceinture, veste, montre'],
        qrType: null, // Pas de QR, validation manuelle
    },
    {
        id: 'passport',
        title: 'Contrôle Passeport',
        instruction: 'Passez le contrôle des passeports pour accéder à la zone internationale.',
        icon: 'passport',
        action: 'Passeport vérifié',
        tips: ['Passeport valide 6 mois après le voyage', 'Visa si nécessaire'],
        qrType: null,
    },
    {
        id: 'gate',
        title: 'Direction Porte',
        instruction: 'Dirigez-vous vers votre porte d\'embarquement.',
        icon: 'gate',
        action: 'Arrivé à la porte',
        tips: ['Vérifiez les écrans pour le numéro de porte', 'Comptez 10-15 min de marche'],
        qrType: null,
    },
    {
        id: 'boarding',
        title: 'Embarquement',
        instruction: 'Présentez-vous à la porte. L\'embarquement va commencer !',
        icon: 'airplane-takeoff',
        action: 'Je suis à bord !',
        tips: ['Carte d\'embarquement + passeport prêts', 'Désactivez le mode avion après le décollage'],
        qrType: 'boarding_scan', // Scan final à la porte
    },
];

interface JourneyContextType {
    currentStepIndex: number;
    completedSteps: string[];
    advanceStep: () => void;
    goToStep: (stepIndex: number) => void;
    completeStepByQR: (qrType: string) => boolean; // Retourne true si étape validée
    resetJourney: () => void;
    getCurrentStep: () => typeof JOURNEY_STEPS[0];
    isStepCompleted: (stepId: string) => boolean;
    lastScanResult: { success: boolean; message: string; stepAdvanced: string | null } | null;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [lastScanResult, setLastScanResult] = useState<JourneyContextType['lastScanResult']>(null);

    const advanceStep = useCallback(() => {
        const currentStep = JOURNEY_STEPS[currentStepIndex];
        if (currentStep && !completedSteps.includes(currentStep.id)) {
            setCompletedSteps(prev => [...prev, currentStep.id]);
        }
        if (currentStepIndex < JOURNEY_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [currentStepIndex, completedSteps]);

    const goToStep = useCallback((stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < JOURNEY_STEPS.length) {
            setCurrentStepIndex(stepIndex);
        }
    }, []);

    const completeStepByQR = useCallback((qrType: string): boolean => {
        // Trouver l'étape qui correspond à ce type de QR
        const stepIndex = JOURNEY_STEPS.findIndex(step => step.qrType === qrType);

        if (stepIndex === -1) {
            setLastScanResult({ success: false, message: 'QR code non reconnu pour le parcours', stepAdvanced: null });
            return false;
        }

        const step = JOURNEY_STEPS[stepIndex];

        // Vérifier si l'étape est déjà complétée
        if (completedSteps.includes(step.id)) {
            setLastScanResult({ success: true, message: `${step.title} déjà validé`, stepAdvanced: null });
            return true;
        }

        // Valider l'étape
        setCompletedSteps(prev => [...prev, step.id]);

        // Si c'est l'étape courante ou avant, avancer
        if (stepIndex <= currentStepIndex) {
            // Avancer à l'étape suivante
            const nextStep = stepIndex + 1;
            if (nextStep < JOURNEY_STEPS.length) {
                setCurrentStepIndex(nextStep);
            }
        } else if (stepIndex === currentStepIndex + 1) {
            // L'utilisateur a sauté une étape, le ramener à l'étape suivante
            setCurrentStepIndex(stepIndex + 1);
        }

        setLastScanResult({
            success: true,
            message: `✓ ${step.title} validé !`,
            stepAdvanced: step.id
        });
        return true;
    }, [currentStepIndex, completedSteps]);

    const resetJourney = useCallback(() => {
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        setLastScanResult(null);
    }, []);

    const getCurrentStep = useCallback(() => {
        return JOURNEY_STEPS[currentStepIndex];
    }, [currentStepIndex]);

    const isStepCompleted = useCallback((stepId: string) => {
        return completedSteps.includes(stepId);
    }, [completedSteps]);

    return (
        <JourneyContext.Provider value={{
            currentStepIndex,
            completedSteps,
            advanceStep,
            goToStep,
            completeStepByQR,
            resetJourney,
            getCurrentStep,
            isStepCompleted,
            lastScanResult,
        }}>
            {children}
        </JourneyContext.Provider>
    );
}

export function useJourney() {
    const context = useContext(JourneyContext);
    if (!context) {
        throw new Error('useJourney must be used within a JourneyProvider');
    }
    return context;
}
