/**
 * Connecteur générique pour lire les prédictions temps réel et les exposer au dashboard.
 * Usage côté frontend (React/Vue/vanilla JS) :
 *   import { loadPredictions, startPolling } from './dashboard_connector.js';
 *
 *   // Lecture unique
 *   const data = await loadPredictions();
 *
 *   // Rafraîchissement automatique
 *   startPolling((data) => {
 *     console.log('Nouvelles prédictions', data);
 *   }, 3000); // toutes les 3s
 */

const PREDICTIONS_URL = '/outputs/predictions.json';

/**
 * Charge le fichier JSON de prédictions (GET simple, compatible avec serveur statique).
 */
export async function loadPredictions() {
  try {
    const res = await fetch(PREDICTIONS_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erreur de chargement des prédictions:', err);
    return null;
  }
}

/**
 * Démarre un polling régulier et appelle `onUpdate` avec les nouvelles données.
 * Retourne une fonction `stop()` pour interrompre le polling.
 */
export function startPolling(onUpdate, intervalMs = 5000) {
  let stopped = false;
  let timeoutId;

  async function tick() {
    if (stopped) return;
    const data = await loadPredictions();
    if (data && onUpdate) {
      onUpdate(data);
    }
    timeoutId = setTimeout(tick, intervalMs);
  }

  tick(); // premier appel immédiat

  return function stop() {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * Utilitaires pour extraire les infos utiles pour le dashboard.
 */
export const DashboardUtils = {
  /** Trouve la prédiction pour un passager donné */
  getPredictionForPassenger(data, passengerId) {
    if (!data || !data.predictions) return null;
    return data.predictions.find(p => p.passenger_id === passengerId);
  },

  /** Formate un temps en minutes vers "X min Ys" ou "Xh Ym" */
  formatMinutes(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m} min`;
  },

  /** Retourne le libellé d'affluence à partir du nombre d'actifs */
  affluenceLabel(activeUsers) {
    if (activeUsers <= 10) return 'Faible';
    if (activeUsers <= 25) return 'Modérée';
    if (activeUsers <= 45) return 'Élevée';
    return 'Très élevée';
  },

  /** Agrégat simple : temps restant moyen par étape */
  avgRemainingByStep(data) {
    const byStep = {};
    if (!data || !data.predictions) return byStep;
    for (const p of data.predictions) {
      const step = p.current_step_name;
      if (!byStep[step]) {
        byStep[step] = { total: 0, count: 0 };
      }
      byStep[step].total += p.remaining_current_step_mean;
      byStep[step].count += 1;
    }
    const result = {};
    for (const [step, agg] of Object.entries(byStep)) {
      result[step] = agg.total / agg.count;
    }
    return result;
  },
};

/* --- Exemple d'intégration React --- */
/*
import React, { useState, useEffect } from 'react';
import { loadPredictions, startPolling, DashboardUtils } from './dashboard_connector.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [passengerId] = useState('P00001'); // à dynamiser

  useEffect(() => {
    // Chargement initial
    loadPredictions().then(setData);

    // Polling toutes les 5s
    const stop = startPolling(setData, 5000);
    return () => stop();
  }, []);

  const pred = data ? DashboardUtils.getPredictionForPassenger(data, passengerId) : null;
  if (!pred) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Étape {pred.current_step}: {pred.current_step_name}</h2>
      <p>Temps restant (étape): {DashboardUtils.formatMinutes(pred.remaining_current_step_mean)}</p>
      <p>Total restant: {DashboardUtils.formatMinutes(pred.total_remaining_minutes)}</p>
      <p>Affluence: {DashboardUtils.affluenceLabel(pred.active_users_in_step)} ({pred.active_users_in_step} actifs)</p>
    </div>
  );
}
*/
