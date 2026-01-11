# Project Training – Survival Analysis for Airport Passenger Journey

Ce projet génère des données synthétiques réalistes de parcours passagers, les prépare pour la modélisation de durée (survival analysis) et entraîne un modèle par étape (1 à 9) pour prédire le temps restant dans l’étape courante.

## Structure
```
project_training/
├── data/
│   ├── raw/
│   │   └── passengers_simulated.csv
│   └── processed/
│       └── survival_dataset.csv
├── models/
│   └── checkpoints/
├── outputs/
│   ├── metrics.txt
│   └── plots/
├── src/
│   ├── generate_data.py
│   ├── preprocess.py
│   ├── train_models.py
│   ├── predict.py
│   └── utils.py
├── requirements.txt
└── README.md
```

## Prérequis
- Python 3.10+
- Installer les dépendances :
```bash
pip install -r requirements.txt
```

## 1) Génération des données
```bash
python src/generate_data.py --n 3000 --seed 42
```
Produit `data/raw/passengers_simulated.csv` avec ~3000 instantanés de passagers et une cible `target_time_remaining` + `event_observed` (censure partielle).

## 2) Prétraitement survival
```bash
python src/preprocess.py
```
- Calcule `hour_of_day`
- Encode `flight_type` et `airport` (one-hot)
- Sauvegarde `data/processed/survival_dataset.csv`
- Sauvegarde les catégories dans `data/processed/meta.json` (pour l’inférence)

## 3) Entraînement des modèles (par étape)
```bash
python src/train_models.py --model-type cox
```
- Entraîne un Cox Proportional Hazards par étape (1→9)
- Évalue C-index et log-likelihood, écrit `outputs/metrics.txt`
- Sauvegarde les checkpoints dans `models/checkpoints/cox_step_{k}.pkl`
- Génère des courbes de survie de référence dans `outputs/plots/step_{k}_survival.png`

Option AFT Weibull :
```bash
python src/train_models.py --model-type weibull
```
Sauvegardes dans `models/checkpoints/weibull_step_{k}.pkl`.

## 4) Prédire le temps restant pour un passager
Exemple minimal (utilise les modèles entraînés et les métadonnées d’encodage) :
```bash
python src/predict.py --model-type cox \
  --step 3 \
  --airport CDG \
  --flight-type international \
  --entry-time "2025-01-15T09:30:00" \
  --time-spent 12 \
  --active-users 30 \
  --avg-step-duration 25
```
La commande affiche la durée restante attendue et la médiane de survie pour l’étape.

## 5) Synchronisation temps réel avec le dashboard

### Fichier d'entrée (état dashboard)
Le module temps réel lit un fichier JSON `data/dashboard_state.json` contenant :
- `timestamp` : horodatage de l'état
- `active_users_by_step` : nombre de passagers actifs par étape (congestion)
- `avg_durations_by_step` : durées moyennes observées par étape
- `passengers` : liste des passagers avec leur état courant

### Exécution ponctuelle
```bash
python src/realtime.py --model-type cox --input data/dashboard_state.json --output outputs/predictions.json
```
Génère `outputs/predictions.json` avec les prédictions pour tous les passagers.

### Mode surveillance continue (watch)
```bash
python src/realtime.py --model-type cox --watch --input data/dashboard_state.json --interval 5
```
- Relit le fichier d'entrée toutes les 5 secondes
- Met à jour `outputs/predictions.json` à chaque cycle
- Ctrl+C pour arrêter

### Structure de sortie JSON
```json
{
  "timestamp": "2025-01-15T09:30:00",
  "prediction_time": "2025-01-15T09:30:05",
  "model_type": "cox",
  "total_passengers": 10,
  "avg_total_remaining_minutes": 85.3,
  "passengers_by_step": {"Controle_Securite": 2, "Vol": 1, ...},
  "predictions": [
    {
      "passenger_id": "P00001",
      "current_step": 3,
      "current_step_name": "Controle_Securite",
      "time_spent_current_step": 12.5,
      "remaining_current_step_mean": 8.2,
      "remaining_current_step_median": 7.5,
      "future_steps": {
        "Controle_Passeport": 12.1,
        "Duty_Free": 19.5,
        ...
      },
      "total_remaining_minutes": 95.3,
      ...
    }
  ]
}
```

### Intégration dashboard
Le dashboard peut :
1. Écrire l'état courant dans `data/dashboard_state.json`
2. Lire les prédictions depuis `outputs/predictions.json`
3. Afficher le temps restant par passager et par étape

## Notes de réalisme
- Durées lognormales (positives, asymétriques) avec congestion horaire (pics 6–9h, 17–20h) et week-end.
- Vols internationaux : contrôle passeport plus long, vols plus longs.
- Censure aléatoire (10–20%) : certains passagers sont encore dans l’étape observée.
- Caractéristiques disponibles : `time_spent_current_step`, `active_users_in_step`, `avg_step_duration`, `hour_of_day`, `flight_type`, `airport`.

## License
Usage académique / PFE.
