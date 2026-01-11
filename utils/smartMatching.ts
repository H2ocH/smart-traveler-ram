import { AI_WEIGHT_DB, WeightItem } from '@/data/aiWeightDatabase';

// Normalise le texte (minuscules, sans accents) pour faciliter la recherche
const normalize = (str: string) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

// Calcule la distance de Levenshtein entre deux chaînes
// (Nombre de modifications nécessaires pour transformer a en b)
const levenshteinDistance = (a: string, b: string) => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

// Trouve le meilleur match dans la DB pour un mot donné
const findBestMatch = (word: string): { item: WeightItem; score: number } | null => {
    const normalizedWord = normalize(word);
    let bestMatch: WeightItem | null = null;
    let bestScore = 0; // 0 à 1 (1 = parfait)

    for (const item of AI_WEIGHT_DB) {
        for (const name of item.names) {
            const normalizedName = normalize(name);

            // Match exact
            if (normalizedName === normalizedWord) {
                return { item, score: 1 };
            }

            // Match partiel (mot clé inclus)
            // Empêcher le match sur chaîne vide ou trop courte (1 lettre sauf si exacte)
            if (normalizedWord.length > 1 && (normalizedName.includes(normalizedWord) || normalizedWord.includes(normalizedName))) {
                // Pénalité légère pour la différence de longueur
                const lenDiff = Math.abs(normalizedName.length - normalizedWord.length);
                const score = 0.9 - (lenDiff * 0.05);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                }
            }

            // Fuzzy Match (Levenshtein) pour les fautes de frappe
            // On ne le fait que si les mots sont assez proches en longueur
            if (Math.abs(normalizedName.length - normalizedWord.length) < 3) {
                const dist = levenshteinDistance(normalizedWord, normalizedName);
                const maxLen = Math.max(normalizedWord.length, normalizedName.length);
                const score = 1 - (dist / maxLen);

                // Seuil de tolérance (ex: 70% de ressemblance)
                if (score > 0.7 && score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                }
            }
        }
    }

    // Seuil minimum pour accepter un match
    if (bestScore > 0.6) {
        return { item: bestMatch!, score: bestScore };
    }

    return null;
};

// Fonction principale : Analyse une phrase complète
export const estimateWeightLocal = (query: string) => {
    const cleanQuery = normalize(query);

    // 1. Découpage intelligent (Greedy Keyword Hunting)
    const foundItems: { item: WeightItem; count: number; matchName: string }[] = [];

    // Extraction des quantités (ex: "2 pantalons")
    const words = cleanQuery.split(/[\s,.]+/);

    // Trier la DB pour matcher les noms longs d'abord
    // (Note: Idéalement on sortirait ça de la fonction pour la perf, mais ok ici)
    const sortedDB = [...AI_WEIGHT_DB].sort((a, b) => { // Optimisation : on pourrait pre-sort
        const maxLenA = Math.max(...a.names.map(n => n.length));
        const maxLenB = Math.max(...b.names.map(n => n.length));
        return maxLenB - maxLenA;
    });

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Ignorer les stopwords
        if (['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'avec', 'plus', 'mon', 'ma', 'mes'].includes(word)) {
            continue;
        }

        // Si c'est un nombre pur, c'est probablement une quantité, on skip (traité avec le mot suivant)
        if (!isNaN(parseInt(word))) continue;

        // Tenter de matcher 1, 2 ou 3 mots
        let bestLocalMatch = findBestMatch(word);
        let wordsUsed = 1;

        if (i + 1 < words.length) {
            const bigram = word + ' ' + words[i + 1];
            const bigramMatch = findBestMatch(bigram);
            if (bigramMatch && (!bestLocalMatch || bigramMatch.score > bestLocalMatch.score)) {
                bestLocalMatch = bigramMatch;
                wordsUsed = 2;
            }
        }

        if (i + 2 < words.length) {
            const trigram = word + ' ' + words[i + 1] + ' ' + words[i + 2];
            const trigramMatch = findBestMatch(trigram);
            if (trigramMatch && (!bestLocalMatch || trigramMatch.score > bestLocalMatch.score)) {
                bestLocalMatch = trigramMatch;
                wordsUsed = 3;
            }
        }

        if (bestLocalMatch) {
            // Vérifier la quantité juste avant
            let qty = 1;
            if (i > 0) {
                const prevWord = words[i - 1];
                const parsedQty = parseInt(prevWord);
                if (!isNaN(parsedQty)) {
                    qty = parsedQty;
                }
            }

            foundItems.push({
                item: bestLocalMatch.item,
                count: qty,
                matchName: bestLocalMatch.item.names[0]
            });

            i += (wordsUsed - 1);
        }
    }

    // Si on a trouvé des objets connus, on retourne le calcul classique
    if (foundItems.length > 0) {
        let totalGrams = 0;
        const details = [];
        for (const match of foundItems) {
            totalGrams += match.item.grams * match.count;
            details.push(`${match.count > 1 ? match.count + 'x ' : ''}${match.matchName}`);
        }
        const mainName = details.join(' + ');
        return {
            found: true,
            grams: totalGrams,
            name: mainName.length > 35 ? mainName.substring(0, 35) + '...' : mainName,
            confidence: foundItems.length > 1 ? "Composée" : "Élevée",
            details: foundItems
        };
    }

    // --- LOGIQUE FALLBACK : POIDS EXPLICITE ---
    // Si aucun objet connu n'est trouvé, on regarde si l'utilisateur a écrit un poids explicitement
    // Ex: "objet lourd 4kg", "truc de 300g", "machin 1.5 kg"

    // Regex pour détecter un poids : nombre (entier ou décimal) suivi de "g", "kg", "grammes", "kilos"
    // On gère 300g, 300 g, 1.5kg, 1,5 kg
    const weightRegex = /(\d+(?:[.,]\d+)?)\s*(k?g|grammes?|kilos?)/i;
    const weightMatch = query.match(weightRegex);

    if (weightMatch) {
        let value = parseFloat(weightMatch[1].replace(',', '.'));
        const unit = weightMatch[2].toLowerCase();

        // Conversion en grammes
        if (unit.startsWith('k')) {
            value = value * 1000;
        }

        // On nettoie le nom en enlevant le poids (ex: "truc 300g" -> "Truc")
        const cleanName = query.replace(weightMatch[0], '').trim().replace(/^de\s+/, ''); // enlève aussi le "de" qui traine

        return {
            found: true, // On considère trouvé car le poids est "sûr"
            grams: Math.round(value),
            name: cleanName || "Objet pesé",
            confidence: "Manuelle" // Indique que c'est une saisie directe
        };
    }

    // Vraiment rien trouvé
    return {
        found: false,
        grams: 0,
        name: "Objet inconnu",
        confidence: "Nulle"
    };
};
