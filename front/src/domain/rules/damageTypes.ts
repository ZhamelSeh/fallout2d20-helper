import { Crosshair, Zap, Radiation, FlaskConical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DamageTypeKind = 'physical' | 'energy' | 'radiation' | 'poison';

/**
 * Couleur Tailwind associée à chaque type de dégâts (et résistance).
 * Référence visuelle utilisée dans la fiche perso, le combat et l'inventaire.
 */
export const DAMAGE_TYPE_COLOR_CLASS: Record<DamageTypeKind, string> = {
  physical: 'text-vault-yellow',     // ballistique / jaune
  energy: 'text-blue-400',           // énergie / bleu
  radiation: 'text-green-400',       // radiation / vert clair
  poison: 'text-purple-400',         // poison / violet
};

/** Variante border/background si besoin. */
export const DAMAGE_TYPE_BORDER_CLASS: Record<DamageTypeKind, string> = {
  physical: 'border-vault-yellow',
  energy: 'border-blue-400',
  radiation: 'border-green-400',
  poison: 'border-purple-400',
};

/**
 * Icône Lucide associée à chaque type. Utilisable comme composant React :
 * <Icon size={14} className={damageTypeColor(kind)} />
 * Les icônes Lucide héritent de `currentColor`, donc la classe text-* les colore.
 */
export const DAMAGE_TYPE_ICON: Record<DamageTypeKind, LucideIcon> = {
  physical: Crosshair,
  energy: Zap,
  radiation: Radiation,
  poison: FlaskConical,
};

export function damageTypeColor(kind: string | undefined | null): string {
  if (!kind) return 'text-vault-yellow-light';
  return DAMAGE_TYPE_COLOR_CLASS[kind as DamageTypeKind] ?? 'text-vault-yellow-light';
}

export function damageTypeIcon(kind: string | undefined | null): LucideIcon | null {
  if (!kind) return null;
  return DAMAGE_TYPE_ICON[kind as DamageTypeKind] ?? null;
}
