export default {
  perks: {
    // A
    animalFriend: {
      name: 'Animal Friend',
      effect: 'Rank 1: Mammal, Lizard or Insect creatures roll 1 CD before attacking you. No Effect = they don\'t attack. Rank 2: CHR+Survival test difficulty 2 to befriend an animal.',
    },
    aquaboy: {
      name: 'Aquaboy/Aquagirl',
      effect: 'Rank 1: Immune to radiation damage in irradiated water, hold breath 2x longer. Rank 2: +2 difficulty to spot you underwater.',
    },
    radResistant: {
      name: 'Rad Resistance',
      effect: 'Your radiation damage resistance increases by +1 per rank.',
    },
    armorer: {
      name: 'Armorer',
      effect: 'You can modify armor with mods. Each rank unlocks mods of that rank.',
    },
    // B
    barbarian: {
      name: 'Barbarian',
      effect: 'Your Strength affects your ballistic DR. STR 7-8: +1, STR 9-10: +2, STR 11+: +3. Doesn\'t work in power armor.',
    },
    gunFu: {
      name: 'Center Mass',
      effect: 'When making a ranged attack, you can target the Torso without increasing difficulty. You can reroll 1d20 of your attack.',
    },
    silverTongue: {
      name: 'Smooth Talker',
      effect: 'Re-roll 1d20 on opposed tests involving Barter or Speech.',
    },
    blitz: {
      name: 'Blitz',
      effect: 'Rank 1: When you move into reach and make a melee attack, reroll 1d20. Rank 2: +1 CD damage.',
    },
    leadBelly: {
      name: 'Lead Belly',
      effect: 'Rank 1: Reroll radiation CD from irradiated food/drink. Rank 2: Immune to radiation from food/drink.',
    },
    juryRigging: {
      name: 'Jury Rigging',
      effect: 'You can repair an item without spare parts. The repair is temporary: the item breaks on the next complication.',
    },
    // C
    scoundrel: {
      name: 'Scoundrel',
      effect: 'You can ignore the first complication on any CHR+Speech test to convince someone of a lie.',
    },
    dogmeat: {
      name: 'Dogmeat',
      effect: 'You have a dog companion (see Dogmeat profile). Its level increases with yours.',
    },
    hunter: {
      name: 'Hunter',
      effect: 'Your attacks against Mammals, Lizards, Insects and Mutants gain the Vicious effect if they don\'t already have it.',
    },
    chemist: {
      name: 'Chemist',
      effect: 'The effect duration of drugs you create is doubled. You unlock recipes requiring this perk.',
    },
    shotgunSurgeon: {
      name: 'Shotgun Surgeon',
      effect: 'Shotgun attacks gain Piercing 1. If already Piercing, the value increases by 1.',
    },
    movingTarget: {
      name: 'Moving Target',
      effect: 'When you sprint, +1 Defense until the start of your next turn.',
    },
    basher: {
      name: 'Basher',
      effect: 'When you make a melee attack by bashing with your firearm, the attack gains the Vicious effect.',
    },
    laserCommander: {
      name: 'Laser Commander',
      effect: 'With a ranged energy weapon, +1 CD damage per rank.',
    },
    commando: {
      name: 'Commando',
      effect: 'With a ranged weapon with fire rate ≥3 (except heavy weapons), +1 CD damage per rank.',
    },
    comprehension: {
      name: 'Comprehension',
      effect: 'After using a magazine bonus, roll 1 CD. On Effect, use it one more time.',
    },
    canOpener: {
      name: 'Can Do!',
      effect: 'When scavenging a location with food, you find one additional food item for free.',
    },
    betterCriticals: {
      name: 'Better Criticals',
      effect: 'When you deal damage, spend 1 luck point to automatically inflict a critical hit.',
    },
    // D
    quickDraw: {
      name: 'Quick Draw',
      effect: 'Each turn, draw one weapon or item without using a minor action.',
    },
    fortuneFinder: {
      name: 'Fortune Finder',
      effect: 'When you find caps: Rank 1: +3 CD, Rank 2: +6 CD, Rank 3: +10 CD.',
    },
    // E
    solarPowered: {
      name: 'Solar Powered',
      effect: 'You heal 1 radiation damage per hour in direct sunlight.',
    },
    entomologist: {
      name: 'Entomologist',
      effect: 'Your attacks against Insects gain Piercing 1. If already Piercing, the value increases by 1.',
    },
    intenseTraining: {
      name: 'Intense Training',
      effect: 'Increase one S.P.E.C.I.A.L. attribute by 1 (max 10).',
    },
    demolitionExpert: {
      name: 'Demolition Expert',
      effect: 'Attacks with Blast gain Vicious. You unlock explosive recipes.',
    },
    roboticsExpert: {
      name: 'Robotics Expert',
      effect: 'Rank 1: Modify robots with rank 1 mods. Rank 2: Rank 2 mods, -1 difficulty robot repair. Rank 3: Rank 3 mods, reprogramming possible.',
    },
    // F
    gunNut: {
      name: 'Gun Nut',
      effect: 'You can modify small guns. Each rank unlocks mods of that rank.',
    },
    capCollector: {
      name: 'Cap Collector',
      effect: 'You can modify buy/sell prices by 10%.',
    },
    ghost: {
      name: 'Ghost',
      effect: 'On AGI+Sneak test in shadow/darkness, the first extra d20 is free.',
    },
    scrounger: {
      name: 'Scrounger',
      effect: 'When you find ammo: Rank 1: +3 CD, Rank 2: +6 CD, Rank 3: +10 CD (same type as found).',
    },
    pharmaFarmer: {
      name: 'Pharma Farma',
      effect: 'When scavenging a location with medicine/chems, you find one additional item for free.',
    },
    partyBoy: {
      name: 'Party Boy/Girl',
      effect: 'You cannot become addicted to alcoholic beverages. Each alcoholic drink heals +2 HP.',
    },
    finesse: {
      name: 'Finesse',
      effect: 'Once per combat, reroll all CD of a damage roll without spending a luck point.',
    },
    heavyHitter: {
      name: 'Big Leagues',
      effect: 'Two-handed melee attacks gain the Vicious effect.',
    },
    blacksmith: {
      name: 'Blacksmith',
      effect: 'You can modify melee weapons. Each rank unlocks mods of that rank.',
    },
    piercingStrike: {
      name: 'Piercing Strike',
      effect: 'Your unarmed or bladed melee weapon attacks gain Piercing 1. If already Piercing, +1.',
    },
    rifleman: {
      name: 'Rifleman',
      effect: 'With a two-handed weapon with fire rate ≤2 (except heavy weapons), +1 CD per rank. Rank 2: +Piercing 1.',
    },
    meltdown: {
      name: 'Meltdown',
      effect: 'When you kill an enemy with an energy weapon, they explode. Nearby creatures take energy damage.',
    },
    // G
    fastHealer: {
      name: 'Faster Healing',
      effect: 'On END+Survival test to heal yourself, the first extra d20 is free.',
    },
    medic: {
      name: 'Healer',
      effect: 'When you heal with First Aid, +1 HP healed per rank.',
    },
    // H
    heaveHo: {
      name: 'Heave Ho!',
      effect: 'With a thrown ranged attack, spend 1 AP to increase range by one step.',
    },
    actionBoy: {
      name: 'Action Boy/Girl',
      effect: 'When you spend AP for an additional major action, no difficulty increase.',
    },
    // I
    infiltrator: {
      name: 'Infiltrator',
      effect: 'Reroll 1d20 on any Lockpick test for a door or container.',
    },
    nurse: {
      name: 'Medic',
      effect: 'Re-roll 1d20 on First Aid actions.',
    },
    // L
    sizeMatters: {
      name: 'Size Matters',
      effect: 'Ranged attack with a heavy weapon, +1 CD damage per rank.',
    },
    bullRush: {
      name: 'Pain Train',
      effect: 'Rank 1: Gain Charge major action to damage and knock prone enemies with a Str + Athletics test. Rank 2: +1 CD damage and Stun damage effect.',
    },
    // M
    quickHands: {
      name: 'Quick Hands',
      effect: 'Reload faster. On ranged attack, spend 2 AP for +2 fire rate for this attack.',
    },
    masterThief: {
      name: 'Master Thief',
      effect: 'On tests to pick locks or pick pockets, +1 difficulty for others to spot you.',
    },
    sandman: {
      name: 'Mister Sandman',
      effect: 'On sneak attack with silenced weapon, +2 CD damage. Doesn\'t work in power armor.',
    },
    fastMetabolism: {
      name: 'Fast Metabolism',
      effect: 'When you recover HP by means other than rest, +1 HP recovered per rank.',
    },
    mysteriousStranger: {
      name: 'Mysterious Stranger',
      effect: 'At the start of combat, spend 1 luck point. The Mysterious Stranger appears and attacks an enemy.',
    },
    // N
    daringNature: {
      name: 'Daring Nature',
      effect: 'On skill test with 1d20 while granting AP to GM, reroll 1d20. Incompatible with Cautious Nature.',
    },
    cautiousNature: {
      name: 'Cautious Nature',
      effect: 'On skill test with at least 1d20 bought with AP, reroll 1d20. Incompatible with Daring Nature.',
    },
    ninja: {
      name: 'Ninja',
      effect: 'On sneak attack unarmed or melee, +2 CD damage. Doesn\'t work in power armor.',
    },
    nightPerson: {
      name: 'Night Person',
      effect: 'Reduce by 1 the difficulty increase due to darkness.',
    },
    // P
    paralyzingPalm: {
      name: 'Paralyzing Palm',
      effect: 'On unarmed attack targeting a location, the attack gains the Stun effect.',
    },
    nuclearPhysicist: {
      name: 'Nuclear Physicist',
      effect: 'With a radiation weapon or Radioactive, each Effect deals +1 radiation damage. Fusion cores have +3 charges.',
    },
    pickpocket: {
      name: 'Pickpocket',
      effect: 'Rank 1: Ignore first AGI+Sneak complication when stealing. Rank 2: Reroll 1d20 for pickpocketing. Rank 3: -1 difficulty.',
    },
    lightStep: {
      name: 'Light Step',
      effect: 'On AGI test based on complication, ignore one complication per AP. Reroll 1d20 to avoid pressure plate traps.',
    },
    hacker: {
      name: 'Hacker',
      effect: 'Reduce by 1 (min 0) the difficulty of your tests to hack computers.',
    },
    pathfinder: {
      name: 'Pathfinder',
      effect: 'On long distance travel, a successful PER+Survival test halves travel time.',
    },
    gunslinger: {
      name: 'Gunslinger',
      effect: 'With a one-handed ranged weapon with fire rate ≤2, +1 CD per rank. Reroll the location die.',
    },
    ironFist: {
      name: 'Iron Fist',
      effect: 'Rank 1: +1 CD to unarmed attacks. Rank 2: +Vicious effect.',
    },
    adrenalineRush: {
      name: 'Adrenaline Rush',
      effect: 'When your HP is not at maximum, consider STR = 10 for tests and melee attacks.',
    },
    intimidation: {
      name: 'Terrifying Presence',
      effect: 'Rank 1: Reroll 1d20 to threaten/frighten. Rank 2: Major action to threaten, STR+Speech test difficulty 2.',
    },
    pyromaniac: {
      name: 'Pyromaniac',
      effect: 'With a fire-based weapon, +1 CD damage per rank.',
    },
    // R
    nerdRage: {
      name: 'Nerd Rage!',
      effect: 'When below 1/4 max HP, +1 ballistic and energy DR and +1 CD damage per rank.',
    },
    snakeater: {
      name: 'Snakeater',
      effect: 'Your poison damage resistance increases by 2.',
    },
    scrapper: {
      name: 'Scrapper',
      effect: 'Rank 1: When scrapping, also get uncommon components. Rank 2: Also get rare components.',
    },
    refractor: {
      name: 'Refractor',
      effect: 'Your energy damage resistance increases by +1 per rank.',
    },
    strongBack: {
      name: 'Strong Back',
      effect: 'Your maximum carry weight increases by 12.5 kg per rank.',
    },
    chemResistant: {
      name: 'Chem Resistant',
      effect: 'Rank 1: Roll 1 fewer CD to determine addiction. Rank 2: Immune to drug addiction.',
    },
    ricochet: {
      name: 'Ricochet',
      effect: 'If an enemy gets a complication attacking you at range, spend 1 luck point to have the ricochet hit them.',
    },
    toughness: {
      name: 'Toughness',
      effect: 'Your ballistic damage resistance increases by +1 per rank.',
    },
    // S
    bloodyMess: {
      name: 'Bloody Mess',
      effect: 'On a critical hit, roll 1 CD. On Effect, inflict an additional injury to a random location.',
    },
    science: {
      name: 'Science!',
      effect: 'You can modify energy weapons and craft certain advanced armor mods. Each rank unlocks mods of that rank.',
    },
    awareness: {
      name: 'Awareness',
      effect: 'When Aiming at a target at short range or less, the next attack gains Piercing 1 (or +1 if already).',
    },
    sniper: {
      name: 'Sniper',
      effect: 'When Aiming with a two-handed Accurate weapon, choose the hit location without increasing difficulty.',
    },
    inspirational: {
      name: 'Inspirational',
      effect: 'The group AP pool can hold 1 additional AP thanks to you.',
    },
    tag: {
      name: 'Tag!',
      effect: 'Choose an additional tag skill. Increase that skill by 2 ranks (max 6) and check the "tag skill" box.',
    },
    adamantiumSkeleton: {
      name: 'Adamantium Skeleton',
      effect: 'The damage required to inflict a critical hit on you increases by your ranks in this perk.',
    },
    educated: {
      name: 'Skilled',
      effect: 'Add +1 to two skills or +2 to any skill as long as it does not go above 6.',
    },
    // T
    concentratedFire: {
      name: 'Concentrated Fire',
      effect: 'On ranged attack with extra ammo, reroll up to 3 damage CD.',
    },
    slacker: {
      name: 'Dodger',
      effect: 'Rank 1: On Defend action, -1 difficulty to test. Rank 2: Improving defense costs only 1 AP.',
    },
    triggerRush: {
      name: 'Gun Fu',
      effect: 'On successful ranged attack, spend 1 AP and 1 ammo to hit an additional target at short range. +1 target per rank.',
    },
    slayer: {
      name: 'Slayer',
      effect: 'On unarmed or melee attack with at least 1 damage, spend 1 luck point to inflict a critical hit.',
    },
    killer: {
      name: "Grim Reaper's Sprint",
      effect: 'When you kill an enemy, roll 1 CD. On Effect, +2 AP to group pool.',
    },
    // V
    junktownVendor: {
      name: 'Junktown Vendor',
      effect: 'Reduce by 1 (min 0) the difficulty of any CHR+Barter test to buy or sell.',
    },
    blackWidow: {
      name: 'Black Widow/Lady Killer',
      effect: 'Reroll 1d20 on any CHR test to influence a character of the chosen gender. Your attacks deal +1 CD to them.',
    },
    steadyAim: {
      name: 'Steady Aim',
      effect: 'When Aiming, reroll 2d20 of your first attack this turn OR reroll 1d20 of all your attacks this turn.',
    },
    lifeGiver: {
      name: 'Lifegiver',
      effect: 'Add your Endurance value to your maximum hit points.',
    },

    // ===== Guide to the Colonies + extended core perks =====
    allNightLong: { name: 'All Night Long', effect: 'You do not get more hungry or thirsty at nighttime.' },
    ammosmith: { name: 'Ammosmith', effect: 'You can craft ammunition.' },
    archer: { name: 'Archer', effect: 'Increases the damage of bows and crossbows.' },
    blocker: { name: 'Blocker', effect: 'Increases your damage resistance against melee attacks.' },
    bloodsucker: { name: 'Bloodsucker', effect: 'Blood packs heal you more effectively and also quench your thirst.' },
    bodyguards: { name: 'Bodyguards', effect: 'Nearby allies increase your damage resistance.' },
    bornSurvivor: { name: 'Born Survivor', effect: 'You automatically use a Stimpak when falling below 25% of your maximum health.' },
    bowBeforeMe: { name: 'Bow Before Me', effect: 'Adds or increases the Piercing effect of bows and crossbows.' },
    bulletShield: { name: 'Bullet Shield', effect: 'Increases damage resistance while wielding a big gun.' },
    butchersBounty: { name: "Butcher's Bounty", effect: 'Find additional portions of meat when butchering animals.' },
    cannibal: { name: 'Cannibal', effect: 'Allows you to butcher and eat the flesh of dead humanoids.' },
    colaNut: { name: 'Cola Nut', effect: 'Nuka-Cola beverages heal you twice as much.' },
    communityOrganizer: { name: 'Community Organizer', effect: 'Improves defense, food and resource gathering in your settlement.' },
    contractor: { name: 'Contractor', effect: 'Improves the efficiency of building objects and structures in settlements.' },
    covertOperator: { name: 'Covert Operator', effect: 'Improves damage with ranged sneak attacks.' },
    crackShot: { name: 'Crack Shot', effect: 'Increases range and accuracy when aiming one-handed ranged weapons.' },
    deadManSprinting: { name: 'Dead Man Sprinting', effect: 'When sprinting while injured, you can spend 1 AP to move faster.' },
    dromedary: { name: 'Dromedary', effect: 'Drinking relieves thirst more effectively.' },
    dryNurse: { name: 'Dry Nurse', effect: 'Stimpaks are sometimes not used up when used to stabilize an ally.' },
    emt: { name: 'EMT', effect: 'Provides health regeneration to revived players.' },
    enforcer: { name: 'Enforcer', effect: 'Adds the Debilitating effect to targeted shotgun attacks.' },
    escapeArtist: { name: 'Escape Artist', effect: 'You can attempt to hide during combat, so long as no enemies can see you.' },
    evasive: { name: 'Evasive', effect: 'Increases Physical and Energy damage resistance based on your Agility.' },
    fieldSurgeon: { name: 'Field Surgeon', effect: 'Improves the efficiency of Stimpaks and RadAway used in First Aid.' },
    fireInTheHole: { name: 'Fire in the Hole', effect: 'Reduces the difficulty of attacks with thrown Blast weapons.' },
    fireproof: { name: 'Fireproof', effect: 'Increases damage resistance against fire and Blast weapons.' },
    ghoulish: { name: 'Ghoulish', effect: 'Radiation heals you. (Not available to ghouls or robots.)' },
    gladiator: { name: 'Gladiator', effect: 'Increases damage with one-handed melee weapons.' },
    glowSight: { name: 'Glow Sight', effect: 'Deal extra damage to glowing enemies.' },
    goatLegs: { name: 'Goat Legs', effect: 'Increases resistance to falling damage.' },
    greenThumb: { name: 'Green Thumb', effect: 'Find twice as much food when foraging in the wilderness.' },
    gunRunner: { name: 'Gun Runner', effect: 'Increases distance moved when sprinting while holding a one-handed ranged weapon.' },
    happyCamper: { name: 'Happy Camper', effect: "Don't get more hungry or thirsty while camping if sated or hydrated." },
    happyGoLucky: { name: 'Happy Go Lucky', effect: 'Regain a Luck point when drinking alcohol.' },
    healingHands: { name: 'Healing Hands', effect: 'Automatically remove Radiation damage when stabilizing a dying ally.' },
    hiredHelp: { name: 'Hired Help', effect: 'Recruit a humanoid NPC companion.' },
    homeDefense: { name: 'Home Defense', effect: 'Craft and set traps.' },
    homebody: { name: 'Homebody', effect: 'Recuperate in a home settlement without sleeping.' },
    incisor: { name: 'Incisor', effect: 'Adds or improves the Piercing effect for melee weapons.' },
    ironclad: { name: 'Ironclad', effect: 'Improves damage resistance when wearing armor.' },
    junkShield: { name: 'Junk Shield', effect: 'Carried junk provides additional Physical and Energy damage resistance.' },
    licensedPlumber: { name: 'Licensed Plumber', effect: 'Your pipe weapons are not Unreliable.' },
    localLeader: { name: 'Local Leader', effect: 'Establish supply lines between settlements, and build stores and workbenches.' },
    lockAndLoad: { name: 'Lock and Load', effect: 'Increases the fire rate of big guns.' },
    martialArtist: { name: 'Martial Artist', effect: 'Spend 1 AP to make a second melee attack.' },
    mechanicalMenace: { name: 'Mechanical Menace', effect: 'Robots OR mutated humans may refuse to attack you, and you find it easier to influence them.' },
    modernRenegade: { name: 'Modern Renegade', effect: 'Grants additional action points when firing one-handed weapons from the hip.' },
    mysteriousSavior: { name: 'Mysterious Savior', effect: 'After spending a Luck point, a Mysterious Stranger may appear to revive you.' },
    naturalResistance: { name: 'Natural Resistance', effect: 'Protects you from toxic fumes and sleeping rough.' },
    nightEyes: { name: 'Night Eyes', effect: 'When attempting to be stealthy, ignore difficulty penalties for darkness.' },
    nocturnalFortitude: { name: 'Nocturnal Fortitude', effect: 'Your maximum HP increases at nighttime.' },
    overlyGenerous: { name: 'Overly Generous', effect: 'When sufficiently irradiated, your melee attacks become Radioactive.' },
    packRat: { name: 'Pack Rat', effect: 'Reduces the carry weight of junk items.' },
    pannapictagraphist: { name: 'Pannapictagraphist', effect: 'You can re-roll if you find a random magazine you have already read.' },
    pharmacist: { name: 'Pharmacist', effect: 'RadAway administered by you heals more Radiation.' },
    photosynthetic: { name: 'Photosynthetic', effect: 'You slowly regenerate HP while in direct sunlight.' },
    powerPatcher: { name: 'Power Patcher', effect: 'You repair power armor more efficiently.' },
    powerUser: { name: 'Power User', effect: 'Your fusion cores contain more charges.' },
    psychopath: { name: 'Psychopath', effect: 'Chance to regain Luck points each time you kill an enemy.' },
    quackSurgeon: { name: 'Quack Surgeon', effect: 'You can use alcoholic beverages to administer first aid.' },
    radicool: { name: 'Radicool', effect: 'Boosts Strength-based rolls and melee damage while irradiated.' },
    rejuvenated: { name: 'Rejuvenated', effect: 'You gain additional benefits from being full or quenched, and remain full or quenched longer.' },
    responder: { name: 'Responder', effect: 'When you give First Aid, you wake and heal your patient much more efficiently.' },
    retribution: { name: 'Retribution', effect: 'Recover HP and AP when your damage reduction prevents all damage from an attack.' },
    revenant: { name: 'Revenant', effect: 'Increased damage after being revived.' },
    robotWrangler: { name: 'Robot Wrangler', effect: 'Recruit a robot NPC companion.' },
    scattershot: { name: 'Scattershot', effect: 'Spend 1 AP to make a second attack with a shotgun.' },
    secretAgent: { name: 'Secret Agent', effect: 'Stealth Boys last longer.' },
    serendipity: { name: 'Serendipity', effect: 'While injured, you can spend Luck points to have attacks against you miss.' },
    slowMetabolizer: { name: 'Slow Metabolizer', effect: 'Eating relieves hunger more effectively.' },
    spiritualHealer: { name: 'Spiritual Healer', effect: 'Successfully stabilizing a dying ally also heals yourself.' },
    squadManeuvers: { name: 'Squad Maneuvers', effect: 'You can maintain a hurried pace for longer and coordinate movements in combat with allies.' },
    stabilized: { name: 'Stabilized', effect: 'Improves accuracy and Piercing effects with big guns used while wearing power armor.' },
    stormChaser: { name: 'Storm Chaser', effect: 'Rain and rad storms heal you.' },
    sturdyFrame: { name: 'Sturdy Frame', effect: 'Reduces the weight of armor you wear.' },
    superDuper: { name: 'Super Duper', effect: 'Items you craft have a chance to use up half as many components.' },
    suppressor: { name: 'Suppressor', effect: 'On a successful attack, spend 1 AP to reduce the damage your target deals for one turn.' },
    takingOneForTheTeam: { name: 'Taking One for the Team', effect: 'You have a chance to take damage for nearby allies, granting you AP and improving your accuracy against the attacker.' },
    tenderizer: { name: 'Tenderizer', effect: 'When you hit an enemy, spend 1 AP to increase the damage they take for one turn.' },
    thirstQuencher: { name: 'Thirst Quencher', effect: 'You cannot catch diseases from dirty water.' },
    tinkerer: { name: 'Tinkerer', effect: 'You repair robots more easily and temporarily increase their maximum HP.' },
    trueFriends: { name: 'True Friends', effect: 'You have a chance to avoid reputation loss and to increase reputation gain with individuals, factions and settlements.' },
    vaccinated: { name: 'Vaccinated', effect: 'You cannot catch diseases from animal attacks.' },
  },
};
