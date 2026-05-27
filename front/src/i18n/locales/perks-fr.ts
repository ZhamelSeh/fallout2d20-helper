export default {
  perks: {
    // A
    animalFriend: {
      name: 'Ami des Animaux',
      effect: 'Rang 1: Les créatures Mammifère, Lézard ou Insecte jettent 1 CD avant de vous attaquer. Si pas d\'Effet, elles ne vous attaquent pas. Rang 2: Test CHR+Survie difficulté 2 pour apprivoiser un animal.',
    },
    aquaboy: {
      name: 'Amphibie',
      effect: 'Rang 1: Immunisé aux dégâts de radiation en eau irradiée, retenez votre souffle 2x plus longtemps. Rang 2: +2 difficulté pour vous repérer immergé.',
    },
    radResistant: {
      name: 'Antiradiations',
      effect: 'Votre résistance aux dégâts de radiation augmente de +1 par rang.',
    },
    armorer: {
      name: 'Armurier',
      effect: 'Vous pouvez modifier les armures avec des mods. Chaque rang débloque les mods de ce rang.',
    },
    // B
    barbarian: {
      name: 'Barbare',
      effect: 'Votre Force influe sur vos RD balistiques. FOR 7-8: +1, FOR 9-10: +2, FOR 11+: +3. Ne fonctionne pas en armure assistée.',
    },
    gunFu: {
      name: 'Barycentre',
      effect: 'Lors d\'une attaque à distance, vous pouvez viser le Buste sans augmenter la difficulté. Vous pouvez relancer 1d20 de votre attaque.',
    },
    silverTongue: {
      name: 'Beau Parleur',
      effect: 'Vous pouvez relancer 1d20 lors de tout test de Troc ou Discours en opposition.',
    },
    blitz: {
      name: 'Blitz',
      effect: 'Rang 1: Quand vous vous placez à portée de main et attaquez au corps à corps, relancez 1d20. Rang 2: +1 CD de dégâts.',
    },
    leadBelly: {
      name: 'Boyaux Plombés',
      effect: 'Rang 1: Relancez le CD de radiation de la nourriture/boisson irradiée. Rang 2: Immunisé aux radiations de la nourriture/boisson.',
    },
    juryRigging: {
      name: 'Bricolage',
      effect: 'Vous pouvez réparer un objet sans pièces détachées. La réparation est temporaire: l\'objet se brise à la prochaine complication.',
    },
    // C
    scoundrel: {
      name: 'Canaille',
      effect: 'Vous pouvez ignorer la première complication sur tout test de CHR+Discours pour convaincre d\'un mensonge.',
    },
    dogmeat: {
      name: 'Canigou',
      effect: 'Vous avez un chien compagnon (voir profil Canigou). Son niveau augmente avec le vôtre.',
    },
    hunter: {
      name: 'Chasseur',
      effect: 'Vos attaques contre les Mammifères, Lézards, Insectes et Mutants obtiennent l\'effet Brutal si elles ne l\'ont pas déjà.',
    },
    chemist: {
      name: 'Chimie',
      effect: 'La durée d\'effet des drogues que vous créez est doublée. Vous débloquez les recettes nécessitant cette aptitude.',
    },
    shotgunSurgeon: {
      name: 'Chirurgien de la Chevrotine',
      effect: 'Les attaques au fusil à pompe obtiennent Perforant 1. Si déjà Perforant, la valeur augmente de 1.',
    },
    movingTarget: {
      name: 'Cible Mouvante',
      effect: 'Lorsque vous sprintez, +1 Défense jusqu\'au début de votre prochain tour.',
    },
    basher: {
      name: 'Cogneur',
      effect: 'Lorsque vous attaquez au corps à corps en cognant avec votre arme à feu, l\'attaque obtient l\'effet Brutal.',
    },
    laserCommander: {
      name: 'Commandant Laser',
      effect: 'Avec une arme à énergie, +1 CD aux dégâts par rang.',
    },
    commando: {
      name: 'Commando',
      effect: 'Avec une arme de cadence ≥3 (sauf armes lourdes), +1 CD aux dégâts par rang.',
    },
    comprehension: {
      name: 'Compréhension',
      effect: 'Après avoir utilisé un bonus de magazine, jetez 1 CD. Sur Effet, utilisez-le une fois de plus.',
    },
    canOpener: {
      name: 'Concerto de Conserves',
      effect: 'En fouillant un lieu avec de la nourriture, vous trouvez un aliment supplémentaire gratuit.',
    },
    betterCriticals: {
      name: 'Coups Super Critiques',
      effect: 'Quand vous infligez des dégâts, dépensez 1 point de chance pour infliger automatiquement un coup critique.',
    },
    // D
    quickDraw: {
      name: 'Dégainage Rapide',
      effect: 'Chaque tour, dégainez une arme ou un objet sans y consacrer une action mineure.',
    },
    fortuneFinder: {
      name: 'Dénicheur de Trésors',
      effect: 'Quand vous trouvez des capsules: Rang 1: +3 CD, Rang 2: +6 CD, Rang 3: +10 CD.',
    },
    // E
    solarPowered: {
      name: 'Énergie Solaire',
      effect: 'Vous éliminez 1 point de dégâts de radiation par heure au soleil.',
    },
    entomologist: {
      name: 'Entomologiste',
      effect: 'Vos attaques contre les Insectes obtiennent Perforant 1. Si déjà Perforant, la valeur augmente de 1.',
    },
    intenseTraining: {
      name: 'Exercice',
      effect: 'Augmentez un attribut S.P.E.C.I.A.L. de 1 (max 10).',
    },
    demolitionExpert: {
      name: 'Expert en Démolition',
      effect: 'Les attaques avec Zone d\'impact obtiennent Brutal. Vous débloquez les recettes d\'explosifs.',
    },
    roboticsExpert: {
      name: 'Expert en Robotique',
      effect: 'Rang 1: Modifiez les robots avec mods rang 1. Rang 2: Mods rang 2, -1 difficulté réparation robots. Rang 3: Mods rang 3, reprogrammation possible.',
    },
    // F
    gunNut: {
      name: 'Fana d\'Armes',
      effect: 'Vous pouvez modifier les armes légères. Chaque rang débloque les mods de ce rang.',
    },
    capCollector: {
      name: 'Fana de Capsules',
      effect: 'Vous pouvez modifier les prix de vente/achat de 10%.',
    },
    ghost: {
      name: 'Fantôme',
      effect: 'En test AGI+Discrétion dans l\'ombre/obscurité, le premier d20 supplémentaire est gratuit.',
    },
    scrounger: {
      name: 'Farfouilleur',
      effect: 'Quand vous trouvez des munitions: Rang 1: +3 CD, Rang 2: +6 CD, Rang 3: +10 CD (même type que trouvées).',
    },
    pharmaFarmer: {
      name: 'Farmer la Pharma',
      effect: 'En fouillant un lieu avec des médicaments/drogues, vous trouvez un objet supplémentaire gratuit.',
    },
    partyBoy: {
      name: 'Fêtard/Fêtarde',
      effect: 'Vous ne pouvez pas devenir dépendant aux boissons alcoolisées. Chaque boisson alcoolisée vous rend +2 PV.',
    },
    finesse: {
      name: 'Finesse',
      effect: 'Une fois par combat, relancez tous les CD d\'un jet de dégâts sans dépenser de point de chance.',
    },
    heavyHitter: {
      name: 'Force de Frappe',
      effect: 'Les attaques au corps à corps avec une arme à deux mains obtiennent l\'effet Brutal.',
    },
    blacksmith: {
      name: 'Forgeron',
      effect: 'Vous pouvez modifier les armes de corps à corps. Chaque rang débloque les mods de ce rang.',
    },
    piercingStrike: {
      name: 'Frappe Perforante',
      effect: 'Vos attaques à mains nues ou arme de corps à corps à lames obtiennent Perforant 1. Si déjà Perforant, +1.',
    },
    rifleman: {
      name: 'Fusilier',
      effect: 'Avec une arme à deux mains de cadence ≤2 (sauf armes lourdes), +1 CD par rang. Rang 2: +Perforant 1.',
    },
    meltdown: {
      name: 'Fusion',
      effect: 'Quand vous tuez un ennemi avec une arme à énergie, il explose. Les créatures proches subissent des dégâts énergétiques.',
    },
    // G
    fastHealer: {
      name: 'Guérison Rapide',
      effect: 'En test END+Survie pour vous soigner, le premier d20 supplémentaire est gratuit.',
    },
    medic: {
      name: 'Guérisseur',
      effect: 'Quand vous soignez avec Porter secours, +1 PV soigné par rang.',
    },
    // H
    heaveHo: {
      name: 'Ho-Hisse!',
      effect: 'Avec une attaque à distance projectile, dépensez 1 PA pour augmenter la portée d\'un niveau.',
    },
    actionBoy: {
      name: 'Homme/Femme d\'Action',
      effect: 'Quand vous dépensez des PA pour une action capitale supplémentaire, pas d\'augmentation de difficulté.',
    },
    // I
    infiltrator: {
      name: 'Infiltrateur',
      effect: 'Relancez 1d20 lors de tout test de Crochetage pour une porte ou conteneur.',
    },
    nurse: {
      name: 'Infirmier',
      effect: 'Quand vous utilisez Porter secours pour soigner, vous pouvez relancer 1d20.',
    },
    // L
    sizeMatters: {
      name: 'La Taille Compte',
      effect: 'Avec une arme lourde, +1 CD aux dégâts par rang.',
    },
    bullRush: {
      name: 'Locomotive',
      effect: 'Action capitale: chargez en armure assistée ou super mutant. Test FOR+Athlétisme difficulté 2. Réussite: dégâts mains nues + renversement.',
    },
    // M
    quickHands: {
      name: 'Mains Lestes',
      effect: 'Rechargez plus vite. En attaque à distance, dépensez 2 PA pour +2 cadence de tir pour cette attaque.',
    },
    masterThief: {
      name: 'Maître-Voleur',
      effect: 'En test pour crocheter ou faire les poches, +1 difficulté pour vous repérer.',
    },
    sandman: {
      name: 'Marchand de Sable',
      effect: 'En attaque furtive avec arme silencieuse, +2 CD aux dégâts. Ne fonctionne pas en armure assistée.',
    },
    fastMetabolism: {
      name: 'Métabolisme Rapide',
      effect: 'Quand vous récupérez des PV par un moyen autre que le repos, +1 PV récupéré par rang.',
    },
    mysteriousStranger: {
      name: 'Mystérieux Étranger',
      effect: 'Au début d\'un combat, dépensez 1 point de chance. Le Mystérieux Étranger apparaît et attaque un adversaire.',
    },
    // N
    daringNature: {
      name: 'Nature Audacieuse',
      effect: 'En test de compétence avec 1d20 en octroyant des PA au MJ, relancez 1d20. Incompatible avec Nature Prudente.',
    },
    cautiousNature: {
      name: 'Nature Prudente',
      effect: 'En test de compétence avec au moins 1d20 acheté avec PA, relancez 1d20. Incompatible avec Nature Audacieuse.',
    },
    ninja: {
      name: 'Ninja',
      effect: 'En attaque furtive à mains nues ou arme de corps à corps, +2 CD aux dégâts. Ne fonctionne pas en armure assistée.',
    },
    nightPerson: {
      name: 'Nyctalope',
      effect: 'Réduisez de 1 l\'augmentation de difficulté due à l\'obscurité.',
    },
    // P
    paralyzingPalm: {
      name: 'Paume Paralysante',
      effect: 'En attaque à mains nues ciblant une localisation, l\'attaque obtient l\'effet Étourdissant.',
    },
    nuclearPhysicist: {
      name: 'Physicien Nucléaire',
      effect: 'Avec une arme à radiation ou Radioactive, chaque Effet inflige +1 point de dégâts de radiation. Les réacteurs à fusion ont +3 charges.',
    },
    pickpocket: {
      name: 'Pickpocket',
      effect: 'Rang 1: Ignorez la première complication AGI+Discrétion pour voler. Rang 2: Relancez 1d20 pour faire les poches. Rang 3: -1 difficulté.',
    },
    lightStep: {
      name: 'Pied Léger',
      effect: 'En test AGI basé sur complication, ignorez une complication par PA. Relancez 1d20 pour éviter les pièges à pression.',
    },
    hacker: {
      name: 'Pirate',
      effect: 'Réduisez de 1 (min 0) la difficulté de vos tests pour pirater les ordinateurs.',
    },
    pathfinder: {
      name: 'Pisteur',
      effect: 'En voyage longue distance, un test PER+Survie réussi divise le temps de trajet par deux.',
    },
    gunslinger: {
      name: 'Pistolero',
      effect: 'Avec une arme à une main de cadence ≤2, +1 CD par rang. Relancez le dé de localisation.',
    },
    ironFist: {
      name: 'Poing de Fer',
      effect: 'Rang 1: +1 CD aux attaques à mains nues. Rang 2: +effet Brutal.',
    },
    adrenalineRush: {
      name: 'Poussée d\'Adrénaline',
      effect: 'Quand vos PV ne sont pas au maximum, considérez FOR = 10 pour les tests et attaques au corps à corps.',
    },
    intimidation: {
      name: 'Présence Terrifiante',
      effect: 'Rang 1: Relancez 1d20 pour menacer/effrayer. Rang 2: Action capitale pour menacer, test FOR+Discours difficulté 2.',
    },
    pyromaniac: {
      name: 'Pyromane',
      effect: 'Avec une arme basée sur le feu, +1 CD aux dégâts par rang.',
    },
    // R
    nerdRage: {
      name: 'Rage de Nerd!',
      effect: 'Quand vous avez moins de 1/4 de vos PV max, +RD balistiques et énergétiques et +CD aux dégâts par rang.',
    },
    snakeater: {
      name: 'Ragoût de Serpent',
      effect: 'Votre résistance aux dégâts de poison augmente de 2.',
    },
    scrapper: {
      name: 'Recycleur',
      effect: 'Rang 1: En recyclage, obtenez des composants peu fréquents aussi. Rang 2: Obtenez aussi des composants rares.',
    },
    refractor: {
      name: 'Réfracteur',
      effect: 'Votre résistance aux dégâts énergétiques augmente de +1 par rang.',
    },
    strongBack: {
      name: 'Reins d\'Acier',
      effect: 'Votre charge maximale augmente de 12,5 kg par rang.',
    },
    chemResistant: {
      name: 'Résistance Chimique',
      effect: 'Rang 1: Jetez 1 CD de moins pour déterminer l\'addiction. Rang 2: Immunisé à l\'addiction aux drogues.',
    },
    ricochet: {
      name: 'Ricochet',
      effect: 'Si un ennemi obtient une complication en vous attaquant à distance, dépensez 1 point de chance pour que le ricochet le touche.',
    },
    toughness: {
      name: 'Robustesse',
      effect: 'Votre résistance aux dégâts balistiques augmente de +1 par rang.',
    },
    // S
    bloodyMess: {
      name: 'Sanguinaire',
      effect: 'Sur un coup critique, jetez 1 CD. Sur Effet, infligez une blessure supplémentaire de localisation aléatoire.',
    },
    science: {
      name: 'Scientifique',
      effect: 'Vous pouvez modifier les armes à énergie et fabriquer certains mods d\'armure avancés. Chaque rang débloque les mods de ce rang.',
    },
    awareness: {
      name: 'Sens Affûtés',
      effect: 'En action Viser contre une cible à portée courte ou inférieure, la prochaine attaque obtient Perforant 1 (ou +1 si déjà).',
    },
    sniper: {
      name: 'Sniper',
      effect: 'En action Viser avec une arme à deux mains Précise, choisissez la localisation sans augmenter la difficulté.',
    },
    inspirational: {
      name: 'Source d\'Inspiration',
      effect: 'La réserve de PA du groupe peut contenir 1 PA supplémentaire grâce à vous.',
    },
    tag: {
      name: 'Spécialité Bonus!',
      effect: 'Choisissez un atout personnel supplémentaire. Augmentez de 2 rangs la compétence (max 6) et cochez la case "atout personnel".',
    },
    adamantiumSkeleton: {
      name: 'Squelette Adamantin',
      effect: 'Le montant de dégâts pour vous infliger un coup critique augmente de vos rangs dans cette aptitude.',
    },
    educated: {
      name: 'Studieux',
      effect: 'Augmentez deux compétences de 1 rang, ou une compétence de 2 rangs (max 6).',
    },
    // T
    concentratedFire: {
      name: 'Tir Groupé',
      effect: 'En attaque à distance avec munitions supplémentaires, relancez jusqu\'à 3 CD de dégâts.',
    },
    slacker: {
      name: 'Tire-au-Flanc',
      effect: 'Rang 1: En action Se protéger, -1 difficulté au test. Rang 2: Améliorer la défense ne coûte plus que 1 PA.',
    },
    triggerRush: {
      name: 'Tonton Flingueur',
      effect: 'En attaque à distance réussie, dépensez 1 PA et 1 munition pour toucher une cible supplémentaire à portée courte. +1 cible par rang.',
    },
    slayer: {
      name: 'Tueur',
      effect: 'En attaque à mains nues ou arme de corps à corps avec au moins 1 dégât, dépensez 1 point de chance pour infliger un coup critique.',
    },
    killer: {
      name: 'Tueur en Série',
      effect: 'Quand vous tuez un ennemi, jetez 1 CD. Sur Effet, +2 PA à la réserve du groupe.',
    },
    // V
    junktownVendor: {
      name: 'Vendeur de Junktown',
      effect: 'Réduisez de 1 (min 0) la difficulté de tout test CHR+Troc pour vendre ou acheter.',
    },
    blackWidow: {
      name: 'Veuve Noire/Gigolo',
      effect: 'Relancez 1d20 lors de tout test CHR pour influencer un personnage du genre choisi. Vos attaques leur infligent +1 CD.',
    },
    steadyAim: {
      name: 'Visée Stable',
      effect: 'En action Viser, relancez 2d20 de votre première attaque ce tour OU relancez 1d20 de toutes vos attaques ce tour.',
    },
    lifeGiver: {
      name: 'Vitalité',
      effect: 'Ajoutez votre valeur d\'Endurance à votre maximum de points de vie.',
    },

    // ===== Guide des Colonies + perks de base étendus =====
    allNightLong: { name: 'Toute la nuit', effect: 'Vous ne devenez pas plus affamé ni plus assoiffé pendant la nuit.' },
    ammosmith: { name: 'Munitionnaire', effect: 'Vous pouvez fabriquer des munitions.' },
    archer: { name: 'Archer', effect: 'Augmente les dégâts des arcs et arbalètes.' },
    blocker: { name: 'Bloqueur', effect: 'Augmente votre résistance aux dégâts contre les attaques de corps à corps.' },
    bloodsucker: { name: 'Suceur de sang', effect: 'Les poches de sang vous soignent plus efficacement et étanchent aussi votre soif.' },
    bodyguards: { name: 'Gardes du corps', effect: 'Les alliés proches augmentent votre résistance aux dégâts.' },
    bornSurvivor: { name: 'Survivant né', effect: 'Vous utilisez automatiquement un Stimpak quand vous passez sous 25 % de vos points de vie maximum.' },
    bowBeforeMe: { name: 'Inclinez-vous', effect: 'Ajoute ou augmente l\'effet Perforant des arcs et arbalètes.' },
    bulletShield: { name: 'Bouclier de balles', effect: 'Augmente la résistance aux dégâts tant que vous maniez une arme lourde.' },
    butchersBounty: { name: 'Aubaine du boucher', effect: 'Vous trouvez des portions de viande supplémentaires en dépeçant des animaux.' },
    cannibal: { name: 'Cannibale', effect: 'Vous pouvez dépecer et manger la chair de cadavres humanoïdes.' },
    colaNut: { name: 'Accro au Cola', effect: 'Les boissons Nuka-Cola vous soignent deux fois plus.' },
    communityOrganizer: { name: 'Organisateur communautaire', effect: 'Améliore la défense, la nourriture et la récolte de ressources dans votre colonie.' },
    contractor: { name: 'Entrepreneur', effect: 'Améliore l\'efficacité de la construction d\'objets et de structures dans les colonies.' },
    covertOperator: { name: 'Agent infiltré', effect: 'Améliore les dégâts des attaques furtives à distance.' },
    crackShot: { name: 'Fine gâchette', effect: 'Augmente la portée et la précision quand vous visez avec une arme à distance à une main.' },
    deadManSprinting: { name: 'Sprint du condamné', effect: 'En sprintant alors que vous êtes blessé, vous pouvez dépenser 1 PA pour vous déplacer plus vite.' },
    dromedary: { name: 'Dromadaire', effect: 'Boire étanche la soif plus efficacement.' },
    dryNurse: { name: 'Nourrice sèche', effect: 'Les Stimpaks ne sont parfois pas consommés quand vous les utilisez pour stabiliser un allié.' },
    emt: { name: 'Ambulancier', effect: 'Apporte une régénération de santé aux joueurs réanimés.' },
    enforcer: { name: 'Exécuteur', effect: 'Ajoute l\'effet Invalidant aux attaques ciblées de fusil à pompe.' },
    escapeArtist: { name: 'Roi de l\'évasion', effect: 'Vous pouvez tenter de vous cacher en combat tant qu\'aucun ennemi ne vous voit.' },
    evasive: { name: 'Évasif', effect: 'Augmente vos résistances aux dégâts physiques et énergétiques selon votre Agilité.' },
    fieldSurgeon: { name: 'Chirurgien de terrain', effect: 'Améliore l\'efficacité des Stimpaks et du RadAway utilisés en Premiers soins.' },
    fireInTheHole: { name: 'Grenade !', effect: 'Réduit la difficulté des attaques avec des armes à Zone d\'impact lancées.' },
    fireproof: { name: 'Ignifugé', effect: 'Augmente la résistance aux dégâts contre le feu et les armes à Zone d\'impact.' },
    ghoulish: { name: 'Goulesque', effect: 'Les radiations vous soignent. (Indisponible pour les goules et les robots.)' },
    gladiator: { name: 'Gladiateur', effect: 'Augmente les dégâts avec les armes de corps à corps à une main.' },
    glowSight: { name: 'Visée luminescente', effect: 'Inflige des dégâts supplémentaires aux ennemis luminescents.' },
    goatLegs: { name: 'Pattes de bouc', effect: 'Augmente la résistance aux dégâts de chute.' },
    greenThumb: { name: 'Main verte', effect: 'Trouvez deux fois plus de nourriture en fouillant la nature.' },
    gunRunner: { name: 'Coureur armé', effect: 'Augmente la distance parcourue en sprintant avec une arme à distance à une main.' },
    happyCamper: { name: 'Bon campeur', effect: 'Vous ne devenez pas plus affamé ni assoiffé en campant si vous êtes rassasié ou hydraté.' },
    happyGoLucky: { name: 'Insouciant', effect: 'Récupérez un point de Chance en buvant de l\'alcool.' },
    healingHands: { name: 'Mains guérisseuses', effect: 'Retire automatiquement les dégâts de Radiation en stabilisant un allié mourant.' },
    hiredHelp: { name: 'Renfort embauché', effect: 'Recrutez un compagnon PNJ humanoïde.' },
    homeDefense: { name: 'Défense du foyer', effect: 'Fabriquez et posez des pièges.' },
    homebody: { name: 'Casanier', effect: 'Récupérez dans une colonie de base sans dormir.' },
    incisor: { name: 'Incisive', effect: 'Ajoute ou améliore l\'effet Perforant des armes de corps à corps.' },
    ironclad: { name: 'Cuirassé', effect: 'Améliore la résistance aux dégâts quand vous portez une armure.' },
    junkShield: { name: 'Bouclier de bric-à-brac', effect: 'Le bric-à-brac transporté fournit une résistance supplémentaire aux dégâts physiques et énergétiques.' },
    licensedPlumber: { name: 'Plombier agréé', effect: 'Vos armes de fortune ne sont plus Imprévisibles.' },
    localLeader: { name: 'Chef local', effect: 'Établissez des lignes de ravitaillement entre colonies, et construisez des magasins et des établis.' },
    lockAndLoad: { name: 'Chargez !', effect: 'Augmente la cadence de tir des armes lourdes.' },
    martialArtist: { name: 'Artiste martial', effect: 'Dépensez 1 PA pour effectuer une seconde attaque de corps à corps.' },
    mechanicalMenace: { name: 'Menace mécanique', effect: 'Les robots OU les humains mutés peuvent refuser de vous attaquer, et vous les influencez plus facilement.' },
    modernRenegade: { name: 'Renégat moderne', effect: 'Accorde des points d\'action supplémentaires en tirant à la hanche avec une arme à une main.' },
    mysteriousSavior: { name: 'Sauveur mystérieux', effect: 'Après avoir dépensé un point de Chance, un Étranger Mystérieux peut apparaître pour vous réanimer.' },
    naturalResistance: { name: 'Résistance naturelle', effect: 'Vous protège des émanations toxiques et du fait de dormir à la dure.' },
    nightEyes: { name: 'Yeux de nuit', effect: 'En tentant d\'être furtif, ignorez les pénalités de difficulté dues à l\'obscurité.' },
    nocturnalFortitude: { name: 'Vigueur nocturne', effect: 'Votre maximum de points de vie augmente la nuit.' },
    overlyGenerous: { name: 'Trop généreux', effect: 'Quand vous êtes suffisamment irradié, vos attaques de corps à corps deviennent Radioactives.' },
    packRat: { name: 'Rat de réserve', effect: 'Réduit le poids transporté des objets de bric-à-brac.' },
    pannapictagraphist: { name: 'Pannapictagraphiste', effect: 'Vous pouvez relancer si vous trouvez un magazine au hasard que vous avez déjà lu.' },
    pharmacist: { name: 'Pharmacien', effect: 'Le RadAway que vous administrez soigne davantage de Radiation.' },
    photosynthetic: { name: 'Photosynthétique', effect: 'Vous régénérez lentement des PV en plein soleil.' },
    powerPatcher: { name: 'Rapiéceur assisté', effect: 'Vous réparez les armures assistées plus efficacement.' },
    powerUser: { name: 'Utilisateur avancé', effect: 'Vos réacteurs à fusion contiennent plus de charges.' },
    psychopath: { name: 'Psychopathe', effect: 'Chance de récupérer des points de Chance à chaque ennemi tué.' },
    quackSurgeon: { name: 'Charlatan', effect: 'Vous pouvez utiliser des boissons alcoolisées pour administrer des premiers soins.' },
    radicool: { name: 'Radicool', effect: 'Améliore les jets basés sur la Force et les dégâts de corps à corps tant que vous êtes irradié.' },
    rejuvenated: { name: 'Régénéré', effect: 'Vous tirez des bénéfices supplémentaires d\'être rassasié ou hydraté, et le restez plus longtemps.' },
    responder: { name: 'Premier intervenant', effect: 'Quand vous prodiguez des premiers soins, vous réveillez et soignez votre patient bien plus efficacement.' },
    retribution: { name: 'Châtiment', effect: 'Récupérez des PV et des PA quand votre réduction de dégâts annule entièrement une attaque.' },
    revenant: { name: 'Revenant', effect: 'Augmente vos dégâts après avoir été réanimé.' },
    robotWrangler: { name: 'Dresseur de robots', effect: 'Recrutez un compagnon PNJ robot.' },
    scattershot: { name: 'Tir de dispersion', effect: 'Dépensez 1 PA pour effectuer une seconde attaque avec un fusil à pompe.' },
    secretAgent: { name: 'Agent secret', effect: 'Les Stealth Boys durent plus longtemps.' },
    serendipity: { name: 'Sérendipité', effect: 'Tant que vous êtes blessé, vous pouvez dépenser des points de Chance pour faire échouer des attaques contre vous.' },
    slowMetabolizer: { name: 'Métabolisme lent', effect: 'Manger soulage la faim plus efficacement.' },
    spiritualHealer: { name: 'Guérisseur spirituel', effect: 'Stabiliser un allié mourant vous soigne également.' },
    squadManeuvers: { name: 'Manœuvres d\'escouade', effect: 'Vous maintenez un rythme soutenu plus longtemps et coordonnez vos déplacements en combat avec vos alliés.' },
    stabilized: { name: 'Stabilisé', effect: 'Améliore la précision et les effets Perforant des armes lourdes utilisées en armure assistée.' },
    stormChaser: { name: 'Chasseur d\'orages', effect: 'La pluie et les tempêtes de radiation vous soignent.' },
    sturdyFrame: { name: 'Châssis robuste', effect: 'Réduit le poids des armures que vous portez.' },
    superDuper: { name: 'Super extra', effect: 'Les objets que vous fabriquez ont une chance de n\'utiliser que la moitié des composants.' },
    suppressor: { name: 'Suppresseur', effect: 'En cas d\'attaque réussie, dépensez 1 PA pour réduire les dégâts infligés par votre cible pendant un tour.' },
    takingOneForTheTeam: { name: 'Se sacrifier', effect: 'Vous avez une chance d\'encaisser les dégâts à la place d\'un allié proche, ce qui vous accorde des PA et améliore votre précision contre l\'attaquant.' },
    tenderizer: { name: 'Attendrisseur', effect: 'Quand vous touchez un ennemi, dépensez 1 PA pour augmenter les dégâts qu\'il subit pendant un tour.' },
    thirstQuencher: { name: 'Désaltérant', effect: 'Vous ne pouvez pas attraper de maladie en buvant de l\'eau souillée.' },
    tinkerer: { name: 'Bricoleur', effect: 'Vous réparez plus facilement les robots et augmentez temporairement leur maximum de PV.' },
    trueFriends: { name: 'Vrais amis', effect: 'Vous avez une chance d\'éviter les pertes de réputation et d\'augmenter vos gains de réputation avec les individus, factions et colonies.' },
    vaccinated: { name: 'Vacciné', effect: 'Vous ne pouvez pas attraper de maladie par les attaques d\'animaux.' },
  },
};
