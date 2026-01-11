export type WeightItem = {
    names: string[]; // Variations of the name (e.g. ['t-shirt', 'tee shirt', 'tshirt'])
    grams: number;
    category: 'Vêtements' | 'Toiletries' | 'Tech' | 'Divers' | 'Accessoires' | 'Chaussures';
};

export const AI_WEIGHT_DB: WeightItem[] = [
    // ==========================================
    // VÊTEMENTS HOMME / FEMME / UNISEXE
    // ==========================================
    // Hauts
    { names: ['t-shirt', 'tshirt', 'tee shirt', 'top', 'ti shirt', 'ticheurte', 'maj', 'khayt', 'kamis'], grams: 150, category: 'Vêtements' },
    { names: ['t-shirt manches longues', 'long sleeve', 'kamis twil'], grams: 200, category: 'Vêtements' },
    { names: ['chemise', 'chemisier', 'shirt', 'button down', 'qamija', 'kamija', 'chemisa'], grams: 250, category: 'Vêtements' },
    { names: ['chemise flanelle', 'flannel'], grams: 400, category: 'Vêtements' },
    { names: ['polo', 'polo shirt'], grams: 250, category: 'Vêtements' },
    { names: ['pull', 'pull-over', 'pullover', 'chandail', 'sweater', 'tricot', 'triko'], grams: 500, category: 'Vêtements' },
    { names: ['pull laine', 'wool sweater', 'triko sof'], grams: 700, category: 'Vêtements' },
    { names: ['pull cachemire'], grams: 300, category: 'Vêtements' },
    { names: ['sweat', 'sweatshirt', 'hoodie', 'kangourou', 'polaire', 'kabbous', 'capuche'], grams: 600, category: 'Vêtements' },
    { names: ['gilet', 'cardigan', 'gilette', 'jilet'], grams: 400, category: 'Vêtements' },
    { names: ['debardeur', 'marcel', 'tank top', 'camisole', 'debari'], grams: 100, category: 'Vêtements' },
    { names: ['tunique', 'tunic', 'tunica'], grams: 200, category: 'Vêtements' },
    { names: ['blouse', 'blousa'], grams: 150, category: 'Vêtements' },
    { names: ['crop top'], grams: 80, category: 'Vêtements' },
    { names: ['body', 'bodysuit'], grams: 150, category: 'Vêtements' },

    // Bas
    { names: ['jean', 'jeans', 'denim', 'serwaljean', 'djean', 'sarwal jean'], grams: 700, category: 'Vêtements' },
    { names: ['jean slim', 'skinny jeans'], grams: 600, category: 'Vêtements' },
    { names: ['pantalon', 'pants', 'trousers', 'chino', 'sarwal', 'serwal', 'pantalon'], grams: 500, category: 'Vêtements' },
    { names: ['pantalon costume', 'dress pants', 'serwal costume'], grams: 400, category: 'Vêtements' },
    { names: ['pantalon lin', 'linen pants', 'serwal ketan'], grams: 300, category: 'Vêtements' },
    { names: ['pantalon cargo', 'cargo'], grams: 700, category: 'Vêtements' },
    { names: ['short', 'shorts', 'bermuda', 'chort', 'short'], grams: 300, category: 'Vêtements' },
    { names: ['short jean', 'denim shorts'], grams: 400, category: 'Vêtements' },
    { names: ['jupe', 'skirt', 'minijupe', 'saya', 'jupe'], grams: 250, category: 'Vêtements' },
    { names: ['jupe longue', 'maxi skirt', 'jupe midi', 'saya twila'], grams: 400, category: 'Vêtements' },
    { names: ['jupe jean', 'saya jean'], grams: 500, category: 'Vêtements' },
    { names: ['legging', 'leggings', 'yoga pants', 'collant', 'ligging'], grams: 200, category: 'Vêtements' },
    { names: ['jogging', 'survetement', 'sweatpants', 'tracksuit', 'jogging', 'survet'], grams: 500, category: 'Vêtements' },

    // Robes & Combis
    { names: ['robe', 'dress', 'robe estivale', 'keswa', 'roba'], grams: 350, category: 'Vêtements' },
    { names: ['robe longue', 'maxi dress', 'keswa twila'], grams: 500, category: 'Vêtements' },
    { names: ['robe soiree', 'robe cocktail', 'robe de gala', 'keswa sahriya'], grams: 800, category: 'Vêtements' },
    { names: ['robe pull'], grams: 600, category: 'Vêtements' },
    { names: ['combinaison', 'jumpsuit', 'combinaison'], grams: 500, category: 'Vêtements' },
    { names: ['salopette', 'overalls', 'salopette'], grams: 700, category: 'Vêtements' },
    { names: ['combishort', 'romper'], grams: 300, category: 'Vêtements' },
    { names: ['djellaba', 'jellaba'], grams: 800, category: 'Vêtements' },
    { names: ['caftan', 'kaftan'], grams: 1000, category: 'Vêtements' },
    { names: ['abaya', 'abya'], grams: 600, category: 'Vêtements' },
    { names: ['gandoura', 'qandora'], grams: 400, category: 'Vêtements' },
    { names: ['hijab', 'foulard', 'voile', 'khimar', 'chale'], grams: 150, category: 'Accessoires' },

    // Vestes & Manteaux
    { names: ['veste', 'jacket', 'blouson', 'fista', 'vesta'], grams: 800, category: 'Vêtements' },
    { names: ['veste jean', 'denim jacket', 'fista jean'], grams: 900, category: 'Vêtements' },
    { names: ['veste cuir', 'leather jacket', 'perfecto', 'cuir'], grams: 1500, category: 'Vêtements' },
    { names: ['manteau', 'coat', 'parka', 'doudoune', 'manto', 'kebbot'], grams: 1200, category: 'Vêtements' },
    { names: ['manteau long', 'trench', 'trench coat'], grams: 1000, category: 'Vêtements' },
    { names: ['doudoune legere'], grams: 300, category: 'Vêtements' },
    { names: ['impermeable', 'k-way', 'coupe-vent', 'raincoat'], grams: 300, category: 'Vêtements' },
    { names: ['blazer', 'costume', 'veston', 'costume'], grams: 700, category: 'Vêtements' },
    { names: ['poncho'], grams: 400, category: 'Vêtements' },

    // Nuit & Sous-vêtements
    { names: ['pyjama', 'pyjama long', 'bijama'], grams: 400, category: 'Vêtements' },
    { names: ['pyjama court', 'shorty'], grams: 200, category: 'Vêtements' },
    { names: ['chemise de nuit', 'nightgown'], grams: 200, category: 'Vêtements' },
    { names: ['peignoir', 'robe de chambre', 'binoir'], grams: 800, category: 'Vêtements' },
    { names: ['slip', 'calecon', 'boxer', 'culotte', 'string', 'sous-vetement', 'underwear', 'slip'], grams: 50, category: 'Vêtements' },
    { names: ['soutien-gorge', 'brassiere', 'bra', 'soutien'], grams: 80, category: 'Vêtements' },
    { names: ['chaussettes', 'socquettes', 'socks', 'kachet', 'kawachir', 'tqacher'], grams: 50, category: 'Vêtements' },
    { names: ['chaussettes ski', 'chaussettes laine', 'grosses chaussettes'], grams: 150, category: 'Vêtements' },
    { names: ['collants nylon', 'bas'], grams: 30, category: 'Vêtements' },

    // Bain
    { names: ['short de bain', 'maillot de bain homme', 'swim trunks', 'mayo', 'mayo de bain'], grams: 200, category: 'Vêtements' },
    { names: ['maillot de bain', 'bikini', '1 piece', 'maillot'], grams: 150, category: 'Vêtements' },
    { names: ['pareo', 'sarong'], grams: 150, category: 'Vêtements' },
    { names: ['bonnet de bain', 'bonnet'], grams: 30, category: 'Vêtements' },

    // ==========================================
    // CHAUSSURES
    // ==========================================
    { names: ['chaussures', 'shoes', 'souliers', 'sebbat', 'hidaa'], grams: 800, category: 'Chaussures' },
    { names: ['baskets', 'sneakers', 'tennis', 'running', 'sbardila', 'basquette'], grams: 700, category: 'Chaussures' },
    { names: ['grosses baskets', 'chunky sneakers', 'jordan'], grams: 1000, category: 'Chaussures' },
    { names: ['bottes', 'boots', 'bottes'], grams: 1200, category: 'Chaussures' },
    { names: ['bottines', 'ankle boots', 'chelsea'], grams: 900, category: 'Chaussures' },
    { names: ['bottes de neige', 'apres-ski'], grams: 1500, category: 'Chaussures' },
    { names: ['sandales', 'nu-pieds', 'sandalettes', 'sandala'], grams: 400, category: 'Chaussures' },
    { names: ['sandales cuir', 'birkenstock'], grams: 600, category: 'Chaussures' },
    { names: ['tongs', 'claquettes', 'flip flops', 'slides', 'claquette', 'mchaya'], grams: 300, category: 'Chaussures' },
    { names: ['talons', 'escarpins', 'heels', 'stilettos', 'talon'], grams: 600, category: 'Chaussures' },
    { names: ['mocassins', 'loafers', 'bateau', 'mocassin'], grams: 500, category: 'Chaussures' },
    { names: ['chaussures de randonnee', 'hiking boots', 'marche'], grams: 1500, category: 'Chaussures' },
    { names: ['chaussons', 'pantoufles', 'slippers', 'balgha', 'belgha', 'babouche'], grams: 300, category: 'Chaussures' },
    { names: ['ballerines', 'flats', 'ballerine'], grams: 300, category: 'Chaussures' },
    { names: ['espadrilles', 'espadrille'], grams: 400, category: 'Chaussures' },
    { names: ['chaussures eau', 'aquashoes'], grams: 300, category: 'Chaussures' },

    // ==========================================
    // BEBE & ENFANT
    // ==========================================
    { names: ['couche', 'couches', 'diaper', 'pampers', 'lkouch'], grams: 50, category: 'Divers' }, // Unité
    { names: ['paquet couches', 'pack couches', 'bakya'], grams: 1000, category: 'Divers' },
    { names: ['lingettes', 'wipes', 'lingette'], grams: 500, category: 'Toiletries' },
    { names: ['biberon', 'baby bottle', 'radaa'], grams: 150, category: 'Divers' }, // Vide
    { names: ['biberon plein'], grams: 400, category: 'Divers' },
    { names: ['tetine', 'sucette', 'pacifier', 'ssossette', 'skata'], grams: 20, category: 'Divers' },
    { names: ['bavoir', 'bib'], grams: 50, category: 'Vêtements' },
    { names: ['body bebe', 'onesie', 'body'], grams: 80, category: 'Vêtements' },
    { names: ['pyjama bebe', 'dormeuse'], grams: 150, category: 'Vêtements' },
    { names: ['gigoteuse', 'turbulette', 'sleep sack'], grams: 400, category: 'Vêtements' },
    { names: ['chaussures bebe', 'chaussons bebe', 'sebbat bebe'], grams: 100, category: 'Chaussures' },
    { names: ['peluche bebe', 'doudou'], grams: 150, category: 'Divers' },
    { names: ['poussette', 'stroller', 'poussette'], grams: 7000, category: 'Divers' }, // Pliable compacte
    { names: ['poussette yoyo', 'poussette cabine'], grams: 6000, category: 'Divers' },
    { names: ['porte-bebe', 'baby carrier', 'echarpe portage'], grams: 600, category: 'Divers' },
    { names: ['lit parapluie', 'travel crib'], grams: 5000, category: 'Divers' },
    { names: ['lait en poudre', 'boite lait', 'lait'], grams: 900, category: 'Divers' },
    { names: ['pot bebe', 'potty'], grams: 400, category: 'Divers' },

    // ==========================================
    // TOILETRIES / HYGIÈNE / BEAUTÉ
    // ==========================================
    // Contenants & Kits
    { names: ['trousse de toilette', 'dopp kit', 'vanity', 'trousse'], grams: 300, category: 'Toiletries' }, // Vide
    { names: ['trousse toilette pleine'], grams: 1500, category: 'Toiletries' },
    // Dentaire
    { names: ['brosse a dents', 'toothbrush', 'chita snan', 'brosse dent'], grams: 30, category: 'Toiletries' },
    { names: ['brosse a dents electrique'], grams: 300, category: 'Toiletries' },
    { names: ['tete brosse a dents'], grams: 10, category: 'Toiletries' },
    { names: ['dentifrice', 'toothpaste', 'tube dentifrice', 'maajoun', 'dentifrice'], grams: 150, category: 'Toiletries' },
    { names: ['fil dentaire', 'floss'], grams: 20, category: 'Toiletries' },
    { names: ['bain de bouche'], grams: 550, category: 'Toiletries' },
    // Douche & Cheveux
    { names: ['shampoing', 'shampoo', 'shampoing'], grams: 300, category: 'Toiletries' },
    { names: ['as', 'apres-shampoing', 'conditioner', 'demelant'], grams: 300, category: 'Toiletries' },
    { names: ['gel douche', 'body wash', 'savon liquide', 'gel douche'], grams: 300, category: 'Toiletries' },
    { names: ['savon', 'soap', 'pain de savon', 'saboun'], grams: 120, category: 'Toiletries' },
    { names: ['gant de toilette', 'gant', 'kays', 'kiss'], grams: 50, category: 'Toiletries' },
    { names: ['bonnet de douche'], grams: 20, category: 'Toiletries' },
    { names: ['shampoing solide'], grams: 80, category: 'Toiletries' },
    // Soins
    { names: ['deodorant', 'deo', 'stick', 'deo'], grams: 100, category: 'Toiletries' },
    { names: ['deo spray', 'aerosol'], grams: 150, category: 'Toiletries' },
    { names: ['parfum', 'perfume', 'eau de toilette', 'riha', 'parfum'], grams: 300, category: 'Toiletries' },
    { names: ['creme', 'lotion', 'hydratant', 'moisturizer', 'pomada', 'crema'], grams: 250, category: 'Toiletries' },
    { names: ['creme visage', 'face cream'], grams: 150, category: 'Toiletries' },
    { names: ['creme mains', 'hand cream'], grams: 80, category: 'Toiletries' },
    { names: ['creme solaire', 'sunscreen', 'solaire', 'ecran total'], grams: 250, category: 'Toiletries' },
    { names: ['apres soleil', 'after sun'], grams: 250, category: 'Toiletries' },
    { names: ['huile', 'oil', 'monoi', 'zit'], grams: 200, category: 'Toiletries' },
    // Rasage & Coiffure
    { names: ['rasoir', 'razor', 'bic', 'rasoir'], grams: 50, category: 'Toiletries' },
    { names: ['lames rasoir'], grams: 20, category: 'Toiletries' },
    { names: ['mousse a raser', 'shaving cream'], grams: 300, category: 'Toiletries' },
    { names: ['rasoir electrique', 'tondeuse', 'trimmer', 'makina'], grams: 400, category: 'Toiletries' },
    { names: ['seche-cheveux', 'hair dryer', 'sechoir'], grams: 800, category: 'Toiletries' },
    { names: ['lisseur', 'fer a lisser', 'hair straightener', 'lisseur'], grams: 400, category: 'Toiletries' },
    { names: ['boucleur', 'fer a boucler'], grams: 400, category: 'Toiletries' },
    { names: ['brosse a cheveux', 'hairbrush', 'peigne', 'chita', 'mechta'], grams: 100, category: 'Toiletries' },
    { names: ['elastiques', 'chouchous', 'barrettes'], grams: 20, category: 'Toiletries' },
    { names: ['gel', 'cire', 'wax', 'gel'], grams: 150, category: 'Toiletries' },
    { names: ['laque', 'hairspray', 'laque'], grams: 250, category: 'Toiletries' },
    // Maquillage
    { names: ['trousse maquillage'], grams: 600, category: 'Toiletries' },
    { names: ['maquillage', 'makeup', 'makiyaj'], grams: 100, category: 'Toiletries' },
    { names: ['rouge a levres', 'lipstick', 'gloss', 'akker'], grams: 30, category: 'Toiletries' },
    { names: ['mascara', 'rimel'], grams: 30, category: 'Toiletries' },
    { names: ['fond de teint', 'foundation', 'font de teint'], grams: 150, category: 'Toiletries' },
    { names: ['poudre', 'powder', 'blush'], grams: 80, category: 'Toiletries' },
    { names: ['palette maquillage', 'palette'], grams: 200, category: 'Toiletries' },
    { names: ['eyeliner', 'crayon yeux', 'khoul'], grams: 10, category: 'Toiletries' },
    { names: ['fard a paupieres'], grams: 50, category: 'Toiletries' },
    { names: ['vernis', 'nail polish', 'vernis'], grams: 50, category: 'Toiletries' },
    { names: ['dissolvant'], grams: 150, category: 'Toiletries' },
    { names: ['pinceaux maquillage', 'brushes'], grams: 100, category: 'Toiletries' },
    // Hygiène féminine
    { names: ['tampons', 'serviettes hygieniques', 'pads', 'lekotex'], grams: 100, category: 'Toiletries' },
    { names: ['cup', 'coupe menstruelle'], grams: 30, category: 'Toiletries' },
    // Divers Hygiène
    { names: ['coton', 'coton-tige', 'disques', 'coton'], grams: 50, category: 'Toiletries' },
    { names: ['serviette', 'towel', 'drap de bain', 'fouta'], grams: 500, category: 'Toiletries' },
    { names: ['serviette microfibre'], grams: 200, category: 'Toiletries' },
    { names: ['mouchoirs', 'kleenex', 'mouchoir'], grams: 30, category: 'Toiletries' },
    { names: ['papier toilette', 'papier'], grams: 100, category: 'Toiletries' },
    { names: ['pince a epiler', 'nettaf'], grams: 20, category: 'Toiletries' },
    { names: ['coupe-ongles', 'mqass'], grams: 30, category: 'Toiletries' },
    { names: ['tapis priere', 'sajjada', 'sajad'], grams: 400, category: 'Divers' },
    { names: ['masbaha', 'chapelet'], grams: 50, category: 'Divers' },
    { names: ['coran', 'moushaf'], grams: 300, category: 'Divers' },

    // ==========================================
    // SANTÉ & MÉDICAL
    // ==========================================
    { names: ['trousse pharmacie', 'first aid kit', 'secours', 'dwa'], grams: 400, category: 'Divers' },
    { names: ['medicaments', 'medocs', 'pills', 'kina'], grams: 30, category: 'Divers' },
    { names: ['doliprane', 'aspirine', 'paracetamol'], grams: 20, category: 'Divers' },
    { names: ['pansements', 'bandaids'], grams: 20, category: 'Divers' },
    { names: ['desinfectant', 'antiseptique', 'biseptine'], grams: 100, category: 'Divers' },
    { names: ['thermometre'], grams: 50, category: 'Divers' },
    { names: ['masque', 'masque chirurgical', 'ffp2', 'kmama'], grams: 10, category: 'Divers' },
    { names: ['gel hydroalcoolique', 'sanitizer', 'gel'], grams: 100, category: 'Divers' },
    { names: ['lentilles', 'contact lenses'], grams: 50, category: 'Divers' },
    { names: ['produit lentilles', 'lens solution'], grams: 300, category: 'Divers' },
    { names: ['vitamines', 'complements'], grams: 100, category: 'Divers' },
    { names: ['preservatifs', 'condoms'], grams: 20, category: 'Divers' },
    { names: ['antimoustique', 'mosquito repellent'], grams: 150, category: 'Divers' },

    // ==========================================
    // TECH & ÉLECTRONIQUE
    // ==========================================
    // Ordinateurs
    { names: ['ordinateur', 'pc', 'laptop', 'ordinateur portable', 'pc portable', 'ordi', 'computer', 'notebook'], grams: 2000, category: 'Tech' },
    { names: ['macbook', 'macbook pro', 'mac'], grams: 1800, category: 'Tech' },
    { names: ['macbook air'], grams: 1300, category: 'Tech' },
    { names: ['chargeur ordinateur', 'chargeur mac', 'chargeur pc', 'charijor'], grams: 300, category: 'Tech' },
    { names: ['housse ordinateur', 'laptop sleeve'], grams: 200, category: 'Tech' },
    { names: ['souris', 'mouse', 'souri'], grams: 100, category: 'Tech' },
    { names: ['tapis de souris'], grams: 50, category: 'Tech' },
    { names: ['clavier', 'keyboard', 'clavier'], grams: 500, category: 'Tech' },
    { names: ['disque dur', 'hard drive', 'ssd', 'disk dur'], grams: 200, category: 'Tech' },
    { names: ['cle usb', 'usb stick', 'usb'], grams: 15, category: 'Tech' },
    // Tablettes & Liseuses
    { names: ['tablette', 'glaxy tab', 'tablette'], grams: 500, category: 'Tech' },
    { names: ['ipad', 'ipad pro', 'ipad'], grams: 600, category: 'Tech' },
    { names: ['ipad mini'], grams: 300, category: 'Tech' },
    { names: ['liseuse', 'kindle', 'kobo', 'ebook'], grams: 200, category: 'Tech' },
    { names: ['etui tablette'], grams: 200, category: 'Tech' },
    // Téléphonie
    { names: ['telephone', 'smartphone', 'mobile', 'cellphone', 'telephone', 'portable', 'tili'], grams: 200, category: 'Tech' },
    { names: ['iphone', 'iphone pro max', 'samsung', 'galaxy'], grams: 230, category: 'Tech' },
    { names: ['chargeur telephone', 'chargeur', 'prise secteur', 'charijor'], grams: 100, category: 'Tech' },
    { names: ['cable', 'cable usb', 'lightning', 'usb-c', 'cable'], grams: 40, category: 'Tech' },
    { names: ['batterie externe', 'powerbank', 'batterie portative', 'power bank'], grams: 350, category: 'Tech' },
    { names: ['grosse batterie externe', 'powerbank 20000'], grams: 500, category: 'Tech' },
    { names: ['coque telephone'], grams: 40, category: 'Tech' },
    { names: ['perche a selfie', 'selfie stick'], grams: 150, category: 'Tech' },
    { names: ['stabilisateur', 'gimbal', 'dji osmo'], grams: 500, category: 'Tech' },
    // Audio
    { names: ['ecouteurs', 'earbuds', 'ecouteurs filaires', 'kit'], grams: 20, category: 'Tech' },
    { names: ['airpods', 'ecouteurs sans fil', 'galaxy buds', 'airpods'], grams: 50, category: 'Tech' },
    { names: ['casque', 'casque audio', 'headphones', 'casque'], grams: 300, category: 'Tech' },
    { names: ['casque bose', 'casque sony', 'noise cancelling'], grams: 350, category: 'Tech' },
    { names: ['enceinte', 'speaker', 'baffle', 'baf'], grams: 600, category: 'Tech' },
    { names: ['enceinte jbl', 'grosse enceinte'], grams: 1000, category: 'Tech' },
    { names: ['mini enceinte'], grams: 300, category: 'Tech' },
    // Photo & Vidéo
    { names: ['appareil photo', 'camera', 'apn', 'camera'], grams: 500, category: 'Tech' },
    { names: ['reflex', 'dslr'], grams: 1000, category: 'Tech' },
    { names: ['hybride', 'mirrorless', 'sony alpha'], grams: 700, category: 'Tech' },
    { names: ['objectif', 'lens', 'zoom'], grams: 600, category: 'Tech' },
    { names: ['gros objectif', 'teleobjectif'], grams: 1500, category: 'Tech' },
    { names: ['gopro', 'action cam'], grams: 150, category: 'Tech' },
    { names: ['accessoires gopro', 'fixation'], grams: 200, category: 'Tech' },
    { names: ['trépied', 'tripod', 'trepied'], grams: 1500, category: 'Tech' },
    { names: ['mini trepied', 'gorillapod'], grams: 300, category: 'Tech' },
    { names: ['drone', 'dji', 'mavic', 'drone'], grams: 900, category: 'Tech' },
    { names: ['mini drone', 'dji mini'], grams: 250, category: 'Tech' },
    { names: ['batterie drone'], grams: 200, category: 'Tech' },
    { names: ['telecommande drone'], grams: 300, category: 'Tech' },
    { names: ['polaroid', 'instax'], grams: 400, category: 'Tech' },
    { names: ['pellicules', 'film'], grams: 30, category: 'Tech' },
    // Gaming & Autres
    { names: ['console', 'nintendo switch', 'switch', 'console'], grams: 400, category: 'Tech' },
    { names: ['dock switch'], grams: 300, category: 'Tech' },
    { names: ['manette', 'controller', 'gamepad', 'manette'], grams: 300, category: 'Tech' },
    { names: ['gameboy', 'ds', '3ds', 'psp'], grams: 300, category: 'Tech' },
    { names: ['steam deck', 'asus rog'], grams: 700, category: 'Tech' },
    { names: ['adaptateur', 'prise', 'adaptateur universel', 'adaptateur voyage'], grams: 150, category: 'Tech' },
    { names: ['multiprise', 'power strip'], grams: 400, category: 'Tech' },
    { names: ['rallonge'], grams: 300, category: 'Tech' },
    { names: ['montre connectee', 'apple watch', 'garmin', 'saaa'], grams: 80, category: 'Tech' },
    { names: ['chargeur montre'], grams: 30, category: 'Tech' },

    // ==========================================
    // ACCESSOIRES DE VOYAGE
    // ==========================================
    // Bagages
    { names: ['valise', 'suitcase', 'bagage', 'valiza', 'baliza'], grams: 4000, category: 'Accessoires' },
    { names: ['valise cabine', 'carry on'], grams: 2800, category: 'Accessoires' },
    { names: ['valise soute', 'large suitcase'], grams: 5000, category: 'Accessoires' },
    { names: ['sac a dos', 'backpack', 'sac', 'cartable', 'sacados', 'sak'], grams: 800, category: 'Accessoires' },
    { names: ['sac a dos rando', 'hiking bag', 'trekking bag'], grams: 2000, category: 'Accessoires' },
    { names: ['sac a main', 'handbag', 'purse', 'sac a main'], grams: 600, category: 'Accessoires' },
    { names: ['gros sac a main', 'tote', 'cabas'], grams: 900, category: 'Accessoires' },
    { names: ['sac banane', 'fanny pack', 'belt bag', 'banane'], grams: 200, category: 'Accessoires' },
    { names: ['tote bag', 'sac toile'], grams: 150, category: 'Accessoires' },
    { names: ['sac de sport', 'duffel bag', 'sac sport'], grams: 1000, category: 'Accessoires' },
    { names: ['pochette ordinateur'], grams: 200, category: 'Accessoires' },
    { names: ['organisateurs', 'packing cubes'], grams: 100, category: 'Accessoires' },
    { names: ['housse vetement', 'garment bag'], grams: 500, category: 'Accessoires' },
    { names: ['sac plastique', 'sac linge sale', 'mika'], grams: 20, category: 'Accessoires' },
    // Accessoires portés
    { names: ['ceinture', 'belt', 'semta'], grams: 200, category: 'Accessoires' },
    { names: ['echarpe', 'foulard', 'scarf', 'chal', 'foulard'], grams: 150, category: 'Accessoires' },
    { names: ['grosse echarpe', 'echarpe laine'], grams: 300, category: 'Accessoires' },
    { names: ['gants', 'gloves', 'mitaines', 'ligat'], grams: 100, category: 'Accessoires' },
    { names: ['gants cuir'], grams: 150, category: 'Accessoires' },
    { names: ['gants ski'], grams: 250, category: 'Accessoires' },
    { names: ['bonnet', 'beanie', 'hat', 'bonnet'], grams: 100, category: 'Accessoires' },
    { names: ['casquette', 'cap', 'casquette'], grams: 100, category: 'Accessoires' },
    { names: ['chapeau', 'panama', 'fedora', 'chapeau paille', 'chapo'], grams: 200, category: 'Accessoires' },
    { names: ['lunettes', 'glasses', 'lunettes vue', 'ndader'], grams: 30, category: 'Accessoires' },
    { names: ['lunettes de soleil', 'sunglasses', 'rayban', 'ndader chamss'], grams: 50, category: 'Accessoires' },
    { names: ['etui lunettes', 'boite lunettes'], grams: 100, category: 'Accessoires' },
    { names: ['montre', 'watch', 'saaa', 'magana'], grams: 100, category: 'Accessoires' },
    { names: ['bijoux', 'jewelry', 'bijou', 'dhhab'], grams: 50, category: 'Accessoires' },
    { names: ['collier', 'necklace', 'salsla'], grams: 30, category: 'Accessoires' },
    { names: ['bracelet', 'grumette'], grams: 30, category: 'Accessoires' },
    { names: ['boucles doreilles', 'earrings', 'hwalek'], grams: 10, category: 'Accessoires' },
    { names: ['bague', 'ring', 'khatem'], grams: 10, category: 'Accessoires' },
    { names: ['boite bijoux'], grams: 150, category: 'Accessoires' },
    { names: ['parapluie', 'umbrella', 'mdal'], grams: 400, category: 'Accessoires' },
    { names: ['petit parapluie'], grams: 250, category: 'Accessoires' },
    { names: ['cravate', 'tie', 'noeud papillon', 'cravata'], grams: 50, category: 'Accessoires' },
    { names: ['bretelles'], grams: 100, category: 'Accessoires' },

    // ==========================================
    // LOISIRS / SPORT / PLAGE
    // ==========================================
    // Plage
    { names: ['serviette plage', 'beach towel', 'fouta bhar'], grams: 600, category: 'Divers' },
    { names: ['natte de plage', 'hsira'], grams: 300, category: 'Divers' },
    { names: ['creme solaire'], grams: 250, category: 'Toiletries' },
    { names: ['masque tuba', 'snorrkel', 'masque plongee'], grams: 400, category: 'Divers' },
    { names: ['palmes', 'fins', 'palme'], grams: 1000, category: 'Divers' },
    { names: ['bouee', 'floatie', 'bouya'], grams: 500, category: 'Divers' }, // Dégonflée
    { names: ['jeux de plage', 'pelle seau', 'siyasa'], grams: 400, category: 'Divers' },
    { names: ['parasol', 'parasol'], grams: 1500, category: 'Divers' },
    // Sport
    { names: ['tapis yoga', 'yoga mat'], grams: 1000, category: 'Divers' },
    { names: ['basket', 'ballon basket', 'koora'], grams: 600, category: 'Divers' },
    { names: ['foot', 'ballon foot', 'soccer ball', 'ballon'], grams: 450, category: 'Divers' },
    { names: ['raquette tennis', 'raquette'], grams: 300, category: 'Divers' },
    { names: ['raquette badminton'], grams: 100, category: 'Divers' },
    { names: ['balles tennis'], grams: 200, category: 'Divers' }, // Boite
    { names: ['gourde sport', 'qaraa'], grams: 200, category: 'Divers' },
    { names: ['proteines', 'shaker'], grams: 200, category: 'Divers' },
    { names: ['casque velo', 'helmet'], grams: 300, category: 'Divers' },
    { names: ['antivol'], grams: 500, category: 'Divers' },
    // Camping
    { names: ['tente', 'tent', 'khima'], grams: 3000, category: 'Divers' }, // 2 places légère
    { names: ['duvet', 'sac de couchage', 'sleeping bag'], grams: 1500, category: 'Divers' },
    { names: ['matelas gonflable'], grams: 1000, category: 'Divers' },
    { names: ['lampe torche', 'frontale', 'flashlight', 'pil'], grams: 150, category: 'Divers' },
    { names: ['couchage', 'oreiller gonflable'], grams: 100, category: 'Divers' },
    { names: ['popote', 'casserole camping', 'gamila'], grams: 500, category: 'Divers' },
    { names: ['gourde filtrante'], grams: 200, category: 'Divers' },
    { names: ['couteau suisse', 'opinel', 'knife', 'mouss'], grams: 100, category: 'Divers' },

    // ==========================================
    // DIVERS / QUOTIDIEN
    // ==========================================
    // Papeterie / Lecture
    { names: ['livre', 'book', 'roman', 'poche', 'ktab'], grams: 300, category: 'Divers' },
    { names: ['gros livre', 'encyclopedie'], grams: 1000, category: 'Divers' },
    { names: ['guide voyage', 'lonely planet', 'guide', 'routard'], grams: 400, category: 'Divers' },
    { names: ['magazine', 'revue', 'journal', 'majalla'], grams: 200, category: 'Divers' },
    { names: ['cahier', 'carnet', 'notebook', 'agenda', 'daftar'], grams: 300, category: 'Divers' },
    { names: ['stylo', 'pen', 'crayon', 'stilo'], grams: 10, category: 'Divers' },
    { names: ['trousse ecole', 'pencil case', 'trousse'], grams: 150, category: 'Divers' },
    { names: ['classeur', 'binder'], grams: 400, category: 'Divers' },
    { names: ['documents', 'papiers', 'dossier', 'wraq'], grams: 200, category: 'Divers' },
    // Nourriture & Boisson
    { names: ['gourde', 'bouteille eau', 'water bottle', 'qaraa el ma'], grams: 200, category: 'Divers' }, // Vide
    { names: ['bouteille 50cl', 'eau 50cl'], grams: 550, category: 'Divers' }, // Pleine
    { names: ['bouteille 1l', 'eau 1l'], grams: 1100, category: 'Divers' }, // Pleine
    { names: ['bouteille 1.5l', 'eau 1.5l'], grams: 1600, category: 'Divers' }, // Pleine
    { names: ['thermos', 'mug voyage', 'thermos'], grams: 350, category: 'Divers' },
    { names: ['sandwich', 'cascrout'], grams: 250, category: 'Divers' },
    { names: ['pomme', 'fruit', 'tofah'], grams: 150, category: 'Divers' },
    { names: ['banane', 'banan'], grams: 150, category: 'Divers' },
    { names: ['snacks', 'gouter', 'biscuits', 'chips', 'bimo'], grams: 150, category: 'Divers' },
    { names: ['barre cereales', 'granola'], grams: 50, category: 'Divers' },
    { names: ['chocolat', 'tablette chocolat', 'chocola'], grams: 100, category: 'Divers' },
    { names: ['bonbons', 'candy', 'fanid', 'halwa'], grams: 200, category: 'Divers' },
    { names: ['chewing gum', 'meska'], grams: 20, category: 'Divers' },
    { names: ['bouteille vin', 'bouteille alcool', 'chrab'], grams: 1300, category: 'Divers' },
    { names: ['the', 'atay', 'pack the'], grams: 250, category: 'Divers' },
    { names: ['cafe', 'coffee', 'qahwa'], grams: 250, category: 'Divers' },
    { names: ['epices', 'spices', 'atria'], grams: 200, category: 'Divers' },
    // Confort Avion
    { names: ['oreiller', 'coussin', 'pillow', 'mkhadda', 'wsada'], grams: 500, category: 'Divers' },
    { names: ['coussin voyage', 'tour de cou', 'travel pillow'], grams: 300, category: 'Divers' },
    { names: ['masque nuit', 'eye mask', 'masque sommeil'], grams: 20, category: 'Divers' },
    { names: ['boules quies', 'earplugs', 'bouchons'], grams: 5, category: 'Divers' },
    { names: ['plaid', 'couverture', 'manta', 'kacha'], grams: 600, category: 'Divers' },
    // Fumeur
    { names: ['cigarettes', 'paquet cigarettes', 'garro', 'karo'], grams: 30, category: 'Divers' },
    { names: ['cartouche cigarettes', 'cartouche'], grams: 300, category: 'Divers' },
    { names: ['briquet', 'lighter', 'feu', 'brika'], grams: 20, category: 'Divers' },
    { names: ['vapoteuse', 'cigarette electronique', 'vape', 'chich'], grams: 150, category: 'Divers' },
    { names: ['eliquide'], grams: 50, category: 'Divers' },
    // Autres
    { names: ['cles', 'clefs', 'keys', 'trousseau', 'sarout', 'mfateh'], grams: 100, category: 'Divers' },
    { names: ['cadenas', 'lock', 'qfal'], grams: 80, category: 'Divers' },
    { names: ['passeport', 'passport', 'passeport'], grams: 50, category: 'Divers' },
    { names: ['portefeuille', 'wallet', 'porte-monnaie', 'bezdam'], grams: 150, category: 'Divers' },
    { names: ['cadeau', 'gift', 'souvenir', 'kado'], grams: 500, category: 'Divers' },
    { names: ['aimant', 'magnet'], grams: 30, category: 'Divers' },
    { names: ['carte postale'], grams: 5, category: 'Divers' },
    { names: ['porte-cles souvenir'], grams: 20, category: 'Divers' },
    { names: ['sac linge sale'], grams: 50, category: 'Divers' },
    { names: ['fer a repasser voyage', 'haddada'], grams: 600, category: 'Divers' },
    { names: ['balance voyage', 'prese valise', 'mizan'], grams: 150, category: 'Divers' },
    { names: ['parapluie plage', 'parasol'], grams: 2000, category: 'Divers' },
    { names: ['tapis', 'zerbiya'], grams: 3000, category: 'Divers' },
    { names: ['tajine', 'tagine'], grams: 1500, category: 'Divers' },
];
