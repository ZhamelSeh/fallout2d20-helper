import type { InventoryItemApi, CharacterDrApi } from '../../services/api';

export type BodyLocation = 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight' | 'wheel';

export interface LocationDR {
  physical: number;
  energy: number;
  radiation: number;
  poison: number;
  // PA piece info (optional, for UI display)
  paCurrentHp?: number;
  paMaxHp?: number;
  paDamaged?: boolean;
  paInventoryId?: number;
  paPieceName?: string;
}

export interface ComputeBodyDRInput {
  inventory?: InventoryItemApi[];
  fixedDr?: CharacterDrApi[];
}

/**
 * Compute DR by body zone:
 * - If `fixedDr` is provided (typically NPC), uses those values directly.
 * - Otherwise iterates `inventory` to sum up DR from equipped armor / power armor / clothing.
 *   Power Armor pieces with HP <= 0 are excluded.
 *
 * Mirrors the existing logic in BodyResistanceMap.tsx.
 */
export function computeBodyDR(input: ComputeBodyDRInput): Record<BodyLocation, LocationDR> {
  const { inventory, fixedDr } = input;
  const dr: Record<BodyLocation, LocationDR> = {
    head: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    torso: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    armLeft: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    armRight: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    legLeft: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    legRight: { physical: 0, energy: 0, radiation: 0, poison: 0 },
    // Securitron-only zone (Guide des Colonies)
    wheel: { physical: 0, energy: 0, radiation: 0, poison: 0 },
  };

  // If fixedDr is provided (NPC), use those values directly
  if (fixedDr && fixedDr.length > 0) {
    for (const fd of fixedDr) {
      if (fd.location in dr) {
        const loc = fd.location as BodyLocation;
        dr[loc].physical = fd.drPhysical;
        dr[loc].energy = fd.drEnergy;
        dr[loc].radiation = fd.drRadiation;
        dr[loc].poison = fd.drPoison;
      }
    }
    return dr;
  }

  // Process equipped items
  for (const inv of inventory ?? []) {
    if (!inv.equipped) continue;

    // Power Armor piece - separate type with powerArmorDetails
    if (inv.item.itemType === 'powerArmor' && inv.powerArmorDetails) {
      const location = inv.equippedLocation || inv.powerArmorDetails.location;
      if (location && location in dr) {
        const loc = location as BodyLocation;
        const maxHp = inv.maxHp ?? inv.powerArmorDetails.hp;
        const currentHp = inv.currentHp ?? maxHp; // If null, piece is at full HP
        const isDamaged = currentHp <= 0;

        dr[loc].paMaxHp = maxHp;
        dr[loc].paCurrentHp = currentHp;
        dr[loc].paDamaged = isDamaged;
        dr[loc].paInventoryId = inv.id;
        dr[loc].paPieceName = inv.item.name;

        // Only add DR if piece is not damaged
        if (!isDamaged) {
          dr[loc].physical += inv.powerArmorDetails.drPhysical;
          dr[loc].energy += inv.powerArmorDetails.drEnergy;
          dr[loc].radiation += inv.powerArmorDetails.drRadiation;
        }
      }
    }

    // Armor piece - applies to specific location
    if (inv.item.itemType === 'armor' && inv.armorDetails) {
      const location = inv.equippedLocation || inv.armorDetails.location;
      if (location && location in dr) {
        const loc = location as BodyLocation;

        // Check if this is a Power Armor piece (has HP) - legacy support
        const maxHp = inv.maxHp ?? inv.armorDetails.hp;
        if (maxHp) {
          // Power Armor piece stored in armor table
          const currentHp = inv.currentHp ?? maxHp; // If null, piece is at full HP
          const isDamaged = currentHp <= 0;

          dr[loc].paMaxHp = maxHp;
          dr[loc].paCurrentHp = currentHp;
          dr[loc].paDamaged = isDamaged;
          dr[loc].paInventoryId = inv.id;
          dr[loc].paPieceName = inv.item.name;

          // Only add DR if piece is not damaged
          if (!isDamaged) {
            dr[loc].physical += inv.armorDetails.drPhysical;
            dr[loc].energy += inv.armorDetails.drEnergy;
            dr[loc].radiation += inv.armorDetails.drRadiation;
            dr[loc].poison += inv.armorDetails.drPoison ?? 0;
          }
        } else {
          // Regular armor piece
          dr[loc].physical += inv.armorDetails.drPhysical;
          dr[loc].energy += inv.armorDetails.drEnergy;
          dr[loc].radiation += inv.armorDetails.drRadiation;
          dr[loc].poison += inv.armorDetails.drPoison ?? 0;
        }
      }
    }

    // Clothing - can cover multiple locations
    if (inv.item.itemType === 'clothing' && inv.clothingDetails) {
      const locations = inv.clothingDetails.locations;
      for (const location of locations) {
        if (location in dr) {
          const loc = location as BodyLocation;
          dr[loc].physical += inv.clothingDetails.drPhysical;
          dr[loc].energy += inv.clothingDetails.drEnergy;
          dr[loc].radiation += inv.clothingDetails.drRadiation;
          dr[loc].poison += inv.clothingDetails.drPoison ?? 0;
        }
      }
    }
  }

  return dr;
}
