import RequireAuth from '@/components/RequireAuth';
import { usePassenger } from '@/context/PassengerContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Définition des tiers de fidélité avec prix d'upgrade
const LOYALTY_TIERS = {
  standard: {
    name: 'Standard',
    color: '#64748B',
    bgColor: '#F1F5F9',
    minMiles: 0,
    nextTier: 'silver',
    nextTierMiles: 15000,
    upgradePrice: 0,
    benefits: [
      'Accumulation de miles sur vos vols',
      'Accès aux offres promotionnelles',
      'Réservation en ligne simplifiée',
    ],
  },
  silver: {
    name: 'Silver',
    color: '#94A3B8',
    bgColor: '#E2E8F0',
    minMiles: 15000,
    nextTier: 'gold',
    nextTierMiles: 35000,
    upgradePrice: 1500,
    benefits: [
      'Tous les avantages Standard',
      'Priorité sur liste d\'attente',
      'Bagage supplémentaire gratuit (+10kg)',
      'Enregistrement prioritaire',
    ],
  },
  gold: {
    name: 'Gold',
    color: '#D4AF37',
    bgColor: '#FEF3C7',
    minMiles: 35000,
    nextTier: 'platinum',
    nextTierMiles: 75000,
    upgradePrice: 3500,
    benefits: [
      'Tous les avantages Silver',
      'Accès aux salons VIP',
      'Surclassement prioritaire',
      'Bagage supplémentaire (+20kg)',
      'Embarquement prioritaire',
      'Service client dédié',
    ],
  },
  platinum: {
    name: 'Platinum',
    color: '#1E293B',
    bgColor: '#E2E8F0',
    minMiles: 75000,
    nextTier: null,
    nextTierMiles: null,
    upgradePrice: 8000,
    benefits: [
      'Tous les avantages Gold',
      'Accès illimité aux salons VIP',
      'Surclassement garanti (si disponible)',
      'Bagages illimités',
      'Chauffeur aéroport',
      'Conciergerie 24/7',
      'Invité en salon VIP',
    ],
  },
};

// Ordre des tiers pour l'upgrade
const TIER_ORDER = ['standard', 'silver', 'gold', 'platinum'] as const;

// Historique des vols simulé
const FLIGHT_HISTORY = [
  { id: 1, date: '2025-12-15', route: 'CMN → CDG', miles: 1850, status: 'completed' },
  { id: 2, date: '2025-12-20', route: 'CDG → CMN', miles: 1850, status: 'completed' },
  { id: 3, date: '2025-11-08', route: 'CMN → DXB', miles: 4200, status: 'completed' },
  { id: 4, date: '2025-11-15', route: 'DXB → CMN', miles: 4200, status: 'completed' },
  { id: 5, date: '2025-10-22', route: 'CMN → JFK', miles: 5800, status: 'completed' },
];

// Comment gagner des miles
const EARN_MILES = [
  { icon: 'airplane', title: 'Vols RAM', desc: 'Jusqu\'à 150% des miles parcourus', color: '#B22222' },
  { icon: 'credit-card', title: 'Carte bancaire', desc: '1 mile par 10 MAD dépensés', color: '#1565C0' },
  { icon: 'car', title: 'Location voiture', desc: 'Jusqu\'à 500 miles par location', color: '#2E7D32' },
  { icon: 'bed', title: 'Hôtels partenaires', desc: '250 à 1000 miles par nuit', color: '#9C27B0' },
];

// Récompenses disponibles
const REWARDS = [
  { id: 1, name: 'Vol domestique A/R', miles: 5000, icon: 'airplane', category: 'Vols', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200' },
  { id: 2, name: 'Surclassement Business', miles: 15000, icon: 'seat-recline-extra', category: 'Vols', image: 'https://images.unsplash.com/photo-1540339832862-474599807836?w=200' },
  { id: 3, name: 'Accès salon VIP', miles: 3000, icon: 'sofa', category: 'Services', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200' },
  { id: 4, name: 'Bagage supplémentaire', miles: 2000, icon: 'bag-suitcase', category: 'Services', image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=200' },
  { id: 5, name: 'Bon Duty Free 500 MAD', miles: 4000, icon: 'shopping', category: 'Shopping', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200' },
  { id: 6, name: 'Nuit d\'hôtel partenaire', miles: 8000, icon: 'bed', category: 'Hôtels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200' },
];

// Options de transfert
const TRANSFER_OPTIONS = [
  { id: 1, name: 'Famille / Ami', icon: 'account-group', desc: 'Transférez vos miles à un proche' },
  { id: 2, name: 'Don caritatif', icon: 'hand-heart', desc: 'Faites un don à une association' },
  { id: 3, name: 'Compte secondaire', icon: 'account-switch', desc: 'Vers un autre compte Safar Flyer' },
];

export default function LoyaltyScreen() {
  const { passenger, setPassenger } = usePassenger();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<keyof typeof LOYALTY_TIERS | null>(null);
  const [showUseMilesModal, setShowUseMilesModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<typeof REWARDS[0] | null>(null);
  const [transferAmount, setTransferAmount] = useState(1000);
  
  // Utiliser le statut du contexte partagé
  const tierStatus = passenger.loyaltyTier as keyof typeof LOYALTY_TIERS;
  const tier = LOYALTY_TIERS[tierStatus];
  
  // Calculer le total des miles de l'historique des vols
  const flightHistoryMiles = FLIGHT_HISTORY.reduce((sum, flight) => sum + flight.miles, 0);
  
  // Initialiser les miles si pas encore fait (au premier chargement)
  useEffect(() => {
    if (passenger.totalMilesEarned === 0 && passenger.isLoggedIn) {
      // Initialiser avec les miles de l'historique des vols
      setPassenger({ totalMilesEarned: flightHistoryMiles });
    }
  }, [passenger.isLoggedIn]);

  // Passage automatique au niveau supérieur quand les miles atteignent le seuil
  useEffect(() => {
    if (!passenger.isLoggedIn) return;
    
    const currentTotalMiles = passenger.totalMilesEarned || 0;
    const currentTierIndex = TIER_ORDER.indexOf(tierStatus);
    
    // Vérifier chaque tier supérieur
    for (let i = TIER_ORDER.length - 1; i > currentTierIndex; i--) {
      const targetTierKey = TIER_ORDER[i];
      const targetTier = LOYALTY_TIERS[targetTierKey];
      
      if (currentTotalMiles >= targetTier.minMiles) {
        // L'utilisateur a assez de miles pour ce tier
        setPassenger({ loyaltyTier: targetTierKey });
        Alert.alert(
          '🎉 Félicitations !',
          `Vous avez atteint ${currentTotalMiles.toLocaleString()} miles ! Vous passez automatiquement au statut ${targetTier.name}. Profitez de vos nouveaux avantages !`,
          [{ text: 'Super !' }]
        );
        break;
      }
    }
  }, [passenger.totalMilesEarned, passenger.isLoggedIn]);
  
  // Miles disponibles = Total gagné - Miles utilisés
  const totalMilesEarned = passenger.totalMilesEarned || flightHistoryMiles;
  const milesUsed = passenger.milesUsed || 0;
  const currentMiles = totalMilesEarned - milesUsed;
  
  // Calcul progression vers le prochain tier
  const progressToNext = tier.nextTierMiles 
    ? ((totalMilesEarned - tier.minMiles) / (tier.nextTierMiles - tier.minMiles)) * 100
    : 100;
  const milesToNext = tier.nextTierMiles ? tier.nextTierMiles - totalMilesEarned : 0;

  // Fonction pour obtenir les tiers disponibles pour l'upgrade
  const getAvailableUpgrades = () => {
    const currentIndex = TIER_ORDER.indexOf(tierStatus);
    return TIER_ORDER.slice(currentIndex + 1);
  };

  // Fonction pour confirmer l'upgrade
  const handleUpgrade = (targetTier: keyof typeof LOYALTY_TIERS) => {
    setSelectedUpgrade(targetTier);
    setShowUpgradeModal(true);
  };

  // Confirmer le paiement
  const confirmUpgrade = () => {
    if (selectedUpgrade) {
      const targetTier = LOYALTY_TIERS[selectedUpgrade];
      // Ajouter les miles minimum du tier pour atteindre le nouveau statut
      const newTotalMiles = Math.max(passenger.totalMilesEarned || 0, targetTier.minMiles);
      
      setPassenger({ 
        loyaltyTier: selectedUpgrade,
        totalMilesEarned: newTotalMiles
      });
      setShowUpgradeModal(false);
      Alert.alert(
        '🎉 Félicitations !',
        `Votre statut a été mis à jour vers ${targetTier.name}. Vous disposez maintenant de ${newTotalMiles.toLocaleString()} miles ! Profitez de vos nouveaux avantages !`,
        [{ text: 'Super !' }]
      );
    }
  };

  // Sélectionner une récompense
  const handleSelectReward = (reward: typeof REWARDS[0]) => {
    if (currentMiles >= reward.miles) {
      setSelectedReward(reward);
    } else {
      Alert.alert(
        'Miles insuffisants',
        `Il vous manque ${(reward.miles - currentMiles).toLocaleString()} miles pour cette récompense.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Confirmer l'utilisation des miles
  const confirmUseReward = () => {
    if (selectedReward) {
      const newMilesUsed = (passenger.milesUsed || 0) + selectedReward.miles;
      const newReward = {
        id: Date.now().toString(),
        name: selectedReward.name,
        miles: selectedReward.miles,
        category: selectedReward.category,
        date: new Date().toISOString(),
        type: 'reward' as const,
      };
      const updatedHistory = [...(passenger.rewardsHistory || []), newReward];
      setPassenger({ milesUsed: newMilesUsed, rewardsHistory: updatedHistory });
      setSelectedReward(null);
      setShowUseMilesModal(false);
      Alert.alert(
        '🎁 Récompense obtenue !',
        `Vous avez échangé ${selectedReward.miles.toLocaleString()} miles contre "${selectedReward.name}". Un email de confirmation vous a été envoyé.`,
        [{ text: 'Super !' }]
      );
    }
  };

  // Confirmer le transfert de miles
  const confirmTransfer = () => {
    if (transferAmount > 0 && transferAmount <= currentMiles) {
      const newMilesUsed = (passenger.milesUsed || 0) + transferAmount;
      const newTransfer = {
        id: Date.now().toString(),
        name: 'Transfert de miles',
        miles: transferAmount,
        category: 'Transfert',
        date: new Date().toISOString(),
        type: 'transfer' as const,
      };
      const updatedHistory = [...(passenger.rewardsHistory || []), newTransfer];
      setPassenger({ milesUsed: newMilesUsed, rewardsHistory: updatedHistory });
      setShowTransferModal(false);
      Alert.alert(
        '✅ Transfert effectué !',
        `${transferAmount.toLocaleString()} miles ont été transférés avec succès.`,
        [{ text: 'OK' }]
      );
      setTransferAmount(1000);
    } else {
      Alert.alert('Erreur', 'Montant invalide ou miles insuffisants.');
    }
  };

  return (
    <RequireAuth>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/explore')}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Safar Flyer</Text>
            <Text style={styles.headerSubtitle}>Programme de fidélité</Text>
          </View>
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Royal_Air_Maroc_logo.svg/200px-Royal_Air_Maroc_logo.svg.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Carte de fidélité */}
          <View style={[styles.loyaltyCard, { backgroundColor: tier.color }]}>
            <View style={styles.cardPattern}>
              <MaterialCommunityIcons name="airplane" size={120} color="rgba(255,255,255,0.1)" />
            </View>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>Membre</Text>
                <Text style={styles.cardName}>{passenger.passengerName || 'Voyageur'}</Text>
              </View>
              <View style={styles.tierBadge}>
                <MaterialCommunityIcons name="crown" size={16} color={tier.color} />
                <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.name}</Text>
              </View>
            </View>
            
            <View style={styles.cardMiles}>
              <Text style={styles.milesValue}>{currentMiles.toLocaleString()}</Text>
              <Text style={styles.milesLabel}>Miles disponibles</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardStat}>
                <Text style={styles.statValue}>{totalMilesEarned.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Miles gagnés</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardStat}>
                <Text style={styles.statValue}>{milesUsed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Miles utilisés</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardStat}>
                <Text style={styles.statValue}>{FLIGHT_HISTORY.length}</Text>
                <Text style={styles.statLabel}>Vols</Text>
              </View>
            </View>
          </View>

          {/* Progression vers le prochain tier */}
          {tier.nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progression vers {LOYALTY_TIERS[tier.nextTier as keyof typeof LOYALTY_TIERS].name}</Text>
                <Text style={styles.progressMiles}>{milesToNext.toLocaleString()} miles restants</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(progressToNext, 100)}%`, backgroundColor: LOYALTY_TIERS[tier.nextTier as keyof typeof LOYALTY_TIERS].color }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelLeft}>{tier.name}</Text>
                <Text style={styles.progressLabelRight}>{LOYALTY_TIERS[tier.nextTier as keyof typeof LOYALTY_TIERS].name}</Text>
              </View>
            </View>
          )}

          {/* Avantages du statut */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons name="star" size={18} color="#B22222" />
              </View>
              <Text style={styles.sectionTitle}>Vos avantages {tier.name}</Text>
            </View>
            <View style={styles.benefitsCard}>
              {tier.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={[styles.benefitCheck, { backgroundColor: `${tier.color}20` }]}>
                    <MaterialCommunityIcons name="check" size={14} color={tier.color} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Comment gagner des miles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons name="plus-circle" size={18} color="#B22222" />
              </View>
              <Text style={styles.sectionTitle}>Gagnez des miles</Text>
            </View>
            <View style={styles.earnGrid}>
              {EARN_MILES.map((item, index) => (
                <View key={index} style={styles.earnCard}>
                  <View style={[styles.earnIcon, { backgroundColor: `${item.color}15` }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={styles.earnTitle}>{item.title}</Text>
                  <Text style={styles.earnDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Historique des vols */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons name="history" size={18} color="#B22222" />
              </View>
              <Text style={styles.sectionTitle}>Historique récent</Text>
            </View>
            <View style={styles.historyCard}>
              {FLIGHT_HISTORY.slice(0, 4).map((flight) => (
                <View key={flight.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIcon}>
                      <MaterialCommunityIcons name="airplane-takeoff" size={18} color="#64748B" />
                    </View>
                    <View>
                      <Text style={styles.historyRoute}>{flight.route}</Text>
                      <Text style={styles.historyDate}>{new Date(flight.date).toLocaleDateString('fr-FR')}</Text>
                    </View>
                  </View>
                  <View style={styles.historyMiles}>
                    <Text style={styles.historyMilesValue}>+{flight.miles.toLocaleString()}</Text>
                    <Text style={styles.historyMilesLabel}>miles</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Mes récompenses obtenues */}
          {(passenger.rewardsHistory || []).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <MaterialCommunityIcons name="gift" size={18} color="#B22222" />
                </View>
                <Text style={styles.sectionTitle}>Mes récompenses</Text>
              </View>
              <View style={styles.historyCard}>
                {(passenger.rewardsHistory || []).slice().reverse().map((reward) => (
                  <View key={reward.id} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={[styles.historyIcon, { backgroundColor: reward.type === 'transfer' ? '#E0F2FE' : '#FEF3C7' }]}>
                        <MaterialCommunityIcons 
                          name={reward.type === 'transfer' ? 'transfer' : 'gift'} 
                          size={18} 
                          color={reward.type === 'transfer' ? '#0284C7' : '#D97706'} 
                        />
                      </View>
                      <View>
                        <Text style={styles.historyRoute}>{reward.name}</Text>
                        <Text style={styles.historyDate}>
                          {reward.category} • {new Date(reward.date).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyMiles}>
                      <Text style={[styles.historyMilesValue, { color: '#EF4444' }]}>-{reward.miles.toLocaleString()}</Text>
                      <Text style={styles.historyMilesLabel}>miles</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tous les statuts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialCommunityIcons name="medal" size={18} color="#B22222" />
              </View>
              <Text style={styles.sectionTitle}>Niveaux Safar Flyer</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiersScroll}>
              {Object.entries(LOYALTY_TIERS).map(([key, tierInfo]) => (
                <View 
                  key={key} 
                  style={[
                    styles.tierCard, 
                    { borderColor: tierInfo.color },
                    key === tierStatus && styles.tierCardActive
                  ]}
                >
                  <View style={[styles.tierCardIcon, { backgroundColor: tierInfo.bgColor }]}>
                    <MaterialCommunityIcons 
                      name={key === 'platinum' ? 'diamond-stone' : key === 'gold' ? 'crown' : key === 'silver' ? 'shield-star' : 'account'} 
                      size={24} 
                      color={tierInfo.color} 
                    />
                  </View>
                  <Text style={[styles.tierCardName, { color: tierInfo.color }]}>{tierInfo.name}</Text>
                  <Text style={styles.tierCardMiles}>{tierInfo.minMiles.toLocaleString()}+ miles</Text>
                  {key === tierStatus && (
                    <View style={[styles.currentBadge, { backgroundColor: tierInfo.color }]}>
                      <Text style={styles.currentBadgeText}>Actuel</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section Upgrade Payant */}
          {getAvailableUpgrades().length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <MaterialCommunityIcons name="rocket-launch" size={18} color="#B22222" />
                </View>
                <Text style={styles.sectionTitle}>Passer au niveau supérieur</Text>
              </View>
              <View style={styles.upgradeCard}>
                <Text style={styles.upgradeSubtitle}>
                  Accédez instantanément à plus d'avantages sans attendre d'accumuler les miles
                </Text>
                {getAvailableUpgrades().map((upgradeKey) => {
                  const upgradeTier = LOYALTY_TIERS[upgradeKey];
                  return (
                    <TouchableOpacity 
                      key={upgradeKey}
                      style={styles.upgradeOption}
                      onPress={() => handleUpgrade(upgradeKey)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.upgradeIconBox, { backgroundColor: upgradeTier.bgColor }]}>
                        <MaterialCommunityIcons 
                          name={upgradeKey === 'platinum' ? 'diamond-stone' : upgradeKey === 'gold' ? 'crown' : 'shield-star'} 
                          size={24} 
                          color={upgradeTier.color} 
                        />
                      </View>
                      <View style={styles.upgradeInfo}>
                        <Text style={[styles.upgradeName, { color: upgradeTier.color }]}>{upgradeTier.name}</Text>
                        <Text style={styles.upgradeBenefitPreview}>
                          {upgradeTier.benefits.length} avantages exclusifs
                        </Text>
                      </View>
                      <View style={styles.upgradePriceBox}>
                        <Text style={styles.upgradePrice}>{upgradeTier.upgradePrice.toLocaleString()}</Text>
                        <Text style={styles.upgradeCurrency}>MAD</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowUseMilesModal(true)}>
              <MaterialCommunityIcons name="gift" size={22} color="#B22222" />
              <Text style={styles.actionText}>Utiliser mes miles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonFilled]} onPress={() => setShowTransferModal(true)}>
              <MaterialCommunityIcons name="transfer" size={22} color="#fff" />
              <Text style={[styles.actionText, { color: '#fff' }]}>Transférer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal de confirmation d'upgrade */}
        <Modal
          visible={showUpgradeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUpgradeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedUpgrade && (
                <>
                  <View style={[styles.modalIconBox, { backgroundColor: LOYALTY_TIERS[selectedUpgrade].bgColor }]}>
                    <MaterialCommunityIcons 
                      name={selectedUpgrade === 'platinum' ? 'diamond-stone' : selectedUpgrade === 'gold' ? 'crown' : 'shield-star'} 
                      size={40} 
                      color={LOYALTY_TIERS[selectedUpgrade].color} 
                    />
                  </View>
                  <Text style={styles.modalTitle}>Passer à {LOYALTY_TIERS[selectedUpgrade].name}</Text>
                  <Text style={styles.modalSubtitle}>
                    Confirmez votre upgrade pour profiter immédiatement de tous les avantages
                  </Text>
                  
                  <View style={styles.modalBenefits}>
                    {LOYALTY_TIERS[selectedUpgrade].benefits.slice(0, 4).map((benefit, index) => (
                      <View key={index} style={styles.modalBenefitRow}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                        <Text style={styles.modalBenefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalPriceLabel}>Montant à payer</Text>
                    <Text style={styles.modalPriceValue}>
                      {LOYALTY_TIERS[selectedUpgrade].upgradePrice.toLocaleString()} MAD
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.modalCancelBtn}
                      onPress={() => setShowUpgradeModal(false)}
                    >
                      <Text style={styles.modalCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalConfirmBtn, { backgroundColor: LOYALTY_TIERS[selectedUpgrade].color }]}
                      onPress={confirmUpgrade}
                    >
                      <MaterialCommunityIcons name="credit-card" size={18} color="#fff" />
                      <Text style={styles.modalConfirmText}>Payer maintenant</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal Utiliser mes miles */}
        <Modal
          visible={showUseMilesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowUseMilesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎁 Utiliser mes miles</Text>
                <TouchableOpacity onPress={() => setShowUseMilesModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Vous avez <Text style={{ fontWeight: '700', color: '#B22222' }}>{currentMiles.toLocaleString()} miles</Text> disponibles
              </Text>
              
              <ScrollView style={styles.rewardsScrollView} showsVerticalScrollIndicator={false}>
                {selectedReward ? (
                  // Confirmation de la récompense sélectionnée
                  <View style={styles.rewardConfirmation}>
                    <Image source={{ uri: selectedReward.image }} style={styles.rewardConfirmImage} />
                    <Text style={styles.rewardConfirmName}>{selectedReward.name}</Text>
                    <Text style={styles.rewardConfirmMiles}>{selectedReward.miles.toLocaleString()} miles</Text>
                    <Text style={styles.rewardConfirmDesc}>
                      Après cet échange, il vous restera {(currentMiles - selectedReward.miles).toLocaleString()} miles.
                    </Text>
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.modalCancelBtn}
                        onPress={() => setSelectedReward(null)}
                      >
                        <Text style={styles.modalCancelText}>Retour</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalConfirmBtn, { backgroundColor: '#B22222' }]}
                        onPress={confirmUseReward}
                      >
                        <MaterialCommunityIcons name="check" size={18} color="#fff" />
                        <Text style={styles.modalConfirmText}>Confirmer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Liste des récompenses
                  <View style={styles.rewardsList}>
                    {REWARDS.map((reward) => (
                      <TouchableOpacity 
                        key={reward.id}
                        style={[
                          styles.rewardCard,
                          currentMiles < reward.miles && styles.rewardCardDisabled
                        ]}
                        onPress={() => handleSelectReward(reward)}
                        activeOpacity={currentMiles >= reward.miles ? 0.7 : 1}
                      >
                        <Image source={{ uri: reward.image }} style={styles.rewardImage} />
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardCategory}>{reward.category}</Text>
                          <Text style={styles.rewardName}>{reward.name}</Text>
                          <View style={styles.rewardMilesRow}>
                            <MaterialCommunityIcons name="star-circle" size={16} color="#D4AF37" />
                            <Text style={styles.rewardMiles}>{reward.miles.toLocaleString()} miles</Text>
                          </View>
                        </View>
                        {currentMiles >= reward.miles ? (
                          <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
                        ) : (
                          <View style={styles.rewardLocked}>
                            <MaterialCommunityIcons name="lock" size={16} color="#94A3B8" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Transférer des miles */}
        <Modal
          visible={showTransferModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTransferModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💸 Transférer des miles</Text>
                <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Miles disponibles : <Text style={{ fontWeight: '700', color: '#B22222' }}>{currentMiles.toLocaleString()}</Text>
              </Text>
              
              {/* Options de transfert */}
              <View style={styles.transferOptions}>
                {TRANSFER_OPTIONS.map((option) => (
                  <View key={option.id} style={styles.transferOption}>
                    <View style={styles.transferOptionIcon}>
                      <MaterialCommunityIcons name={option.icon as any} size={24} color="#B22222" />
                    </View>
                    <View style={styles.transferOptionInfo}>
                      <Text style={styles.transferOptionName}>{option.name}</Text>
                      <Text style={styles.transferOptionDesc}>{option.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Sélecteur de montant */}
              <View style={styles.transferAmountSection}>
                <Text style={styles.transferAmountLabel}>Montant à transférer</Text>
                <View style={styles.transferAmountRow}>
                  <TouchableOpacity 
                    style={styles.transferAmountBtn}
                    onPress={() => setTransferAmount(Math.max(500, transferAmount - 500))}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#B22222" />
                  </TouchableOpacity>
                  <View style={styles.transferAmountValue}>
                    <Text style={styles.transferAmountText}>{transferAmount.toLocaleString()}</Text>
                    <Text style={styles.transferAmountUnit}>miles</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.transferAmountBtn}
                    onPress={() => setTransferAmount(Math.min(currentMiles, transferAmount + 500))}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#B22222" />
                  </TouchableOpacity>
                </View>
                <View style={styles.transferQuickAmounts}>
                  {[1000, 2500, 5000].map((amount) => (
                    <TouchableOpacity 
                      key={amount}
                      style={[
                        styles.transferQuickBtn,
                        transferAmount === amount && styles.transferQuickBtnActive,
                        amount > currentMiles && styles.transferQuickBtnDisabled
                      ]}
                      onPress={() => amount <= currentMiles && setTransferAmount(amount)}
                    >
                      <Text style={[
                        styles.transferQuickText,
                        transferAmount === amount && styles.transferQuickTextActive
                      ]}>{amount.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setShowTransferModal(false)}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalConfirmBtn, { backgroundColor: '#B22222' }]}
                  onPress={confirmTransfer}
                >
                  <MaterialCommunityIcons name="send" size={18} color="#fff" />
                  <Text style={styles.modalConfirmText}>Transférer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loyaltyCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPattern: {
    position: 'absolute',
    right: -20,
    top: -20,
    transform: [{ rotate: '15deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardMiles: {
    marginBottom: 24,
  },
  milesValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
  },
  milesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  cardStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  cardDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressMiles: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabelLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressLabelRight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  benefitCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  earnCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  earnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  earnDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  historyMiles: {
    alignItems: 'flex-end',
  },
  historyMilesValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  historyMilesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tiersScroll: {
    gap: 12,
    paddingRight: 20,
  },
  tierCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  tierCardActive: {
    borderWidth: 3,
  },
  tierCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tierCardName: {
    fontSize: 14,
    fontWeight: '800',
  },
  tierCardMiles: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  currentBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  upgradeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  upgradeSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upgradeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  upgradeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  upgradeBenefitPreview: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  upgradePriceBox: {
    alignItems: 'flex-end',
  },
  upgradePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  upgradeCurrency: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#B22222',
  },
  actionButtonFilled: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B22222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBenefits: {
    width: '100%',
    marginBottom: 20,
  },
  modalBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  modalBenefitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  modalPriceRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  modalPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalPriceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  rewardsScrollView: {
    width: '100%',
    maxHeight: 400,
  },
  rewardsList: {
    gap: 12,
    paddingBottom: 16,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  rewardInfo: {
    flex: 1,
    gap: 2,
  },
  rewardCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B22222',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rewardMilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rewardMiles: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  rewardLocked: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardConfirmation: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  rewardConfirmImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  rewardConfirmName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  rewardConfirmMiles: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
  },
  rewardConfirmDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  transferOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  transferOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  transferOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FECACA20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferOptionInfo: {
    flex: 1,
  },
  transferOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  transferOptionDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  transferAmountSection: {
    width: '100%',
    marginBottom: 20,
  },
  transferAmountLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  transferAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  transferAmountBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferAmountValue: {
    alignItems: 'center',
    minWidth: 100,
  },
  transferAmountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
  },
  transferAmountUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  transferQuickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  transferQuickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  transferQuickBtnActive: {
    backgroundColor: '#B22222',
  },
  transferQuickBtnDisabled: {
    opacity: 0.4,
  },
  transferQuickText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  transferQuickTextActive: {
    color: '#fff',
  },
});
