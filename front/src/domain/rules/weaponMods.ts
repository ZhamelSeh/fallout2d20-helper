import type { TFunction } from 'i18next';

export interface ModInstalled {
  slot: string;
  nameAddKey?: string;
  effects?: Array<{
    effectType: string;
    numericValue?: number | null;
    qualityName?: string | null;
    qualityValue?: number | null;
    ammoType?: string | null;
    descriptionKey?: string | null;
  }>;
}

export interface WeaponLike {
  name: string;
  damage: number;
  range?: string;
  fireRate?: number | null;
  installedMods?: ModInstalled[];
}

const RENAME_SLOTS = ['crosse', 'carburant'];
const FULL_RENAME_SLOTS = ['amelioration'];

/**
 * Resolve the display name for a weapon, taking installed mods into account:
 * - 'crosse'/'carburant' mods may swap base name via items.stockedNames.<name>
 * - 'amelioration' mods may fully rename via the mod's nameAddKey
 * - Other mods append their nameAddKey as a suffix list "(suffix1, suffix2)"
 */
export function computeModdedWeaponName(weapon: WeaponLike, t: TFunction): string {
  // Try base translation
  let weaponName = weapon.name;
  let tr = t(`items.weapons.${weapon.name}`, { defaultValue: '' });
  if (tr) weaponName = tr;
  if (weaponName === weapon.name) {
    tr = t(`items.${weapon.name}`, { defaultValue: '' });
    if (tr) weaponName = tr;
  }

  const mods = weapon.installedMods;
  if (!mods || mods.length === 0) return weaponName;

  // Stock-rename slots
  const renameMod = mods.find(m => RENAME_SLOTS.includes(m.slot));
  if (renameMod) {
    const stocked = t(`items.stockedNames.${weapon.name}`, { defaultValue: '' });
    if (stocked) weaponName = stocked;
  }

  // Full-rename slot ('amelioration')
  const fullRenameMod = mods.find(m => FULL_RENAME_SLOTS.includes(m.slot));
  if (fullRenameMod?.nameAddKey) {
    const renamed = t(fullRenameMod.nameAddKey, { defaultValue: '' });
    if (renamed) return renamed;
    // If full rename key empty, fall through to suffix logic on remaining mods
    const suffixes = mods
      .filter(m => !FULL_RENAME_SLOTS.includes(m.slot))
      .map(m => m.nameAddKey ? t(m.nameAddKey, { defaultValue: '' }) : '')
      .filter(Boolean);
    if (suffixes.length > 0) return `${weaponName} (${suffixes.join(', ')})`;
    return weaponName;
  }

  // Default: collect suffixes
  const suffixes = mods
    .map(m => m.nameAddKey ? t(m.nameAddKey, { defaultValue: '' }) : '')
    .filter(Boolean);
  if (suffixes.length > 0) return `${weaponName} (${suffixes.join(', ')})`;
  return weaponName;
}

export interface EffectiveWeaponStats {
  damage: number;
  damageModified: boolean;
  fireRate: number | null | undefined;
  fireRateModified: boolean;
  range: string | undefined;
  rangeModified: boolean;
}

export function computeEffectiveWeaponStats(weapon: WeaponLike): EffectiveWeaponStats {
  let damage = weapon.damage;
  let fireRate = weapon.fireRate ?? null;
  let range = weapon.range;
  let damageModified = false;
  let fireRateModified = false;
  let rangeModified = false;

  const mods = weapon.installedMods ?? [];
  const allEffects = mods.flatMap(m => m.effects ?? []);
  for (const eff of allEffects) {
    switch (eff.effectType) {
      case 'setDamage':
        if (eff.numericValue != null) { damage = eff.numericValue; damageModified = true; }
        break;
      case 'damageBonus':
        if (eff.numericValue != null) { damage += eff.numericValue; damageModified = true; }
        break;
      case 'setFireRate':
        if (eff.numericValue != null) { fireRate = eff.numericValue; fireRateModified = true; }
        break;
      case 'fireRateBonus':
        if (eff.numericValue != null) { fireRate = (fireRate ?? 0) + eff.numericValue; fireRateModified = true; }
        break;
      case 'rangeChange':
        // rangeChange logic varies; safest: keep existing range, mark modified
        rangeModified = true;
        break;
    }
  }

  return { damage, damageModified, fireRate, fireRateModified, range, rangeModified };
}
