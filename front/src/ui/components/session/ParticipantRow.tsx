import { useState } from 'react';
import { Skull, AlertCircle, LogOut, Eye, Trash2, Sparkles, ChevronDown, ChevronRight, Crosshair, Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi, CombatantStatus, InstalledModSummary } from '../../../services/api';
import { HPBar } from '../character/HPBar';
import { OriginIcon } from '../character/OriginIcon';
import { ItemDetailModal } from '../../../components/ItemDetailModal';
import { SKILL_ATTRIBUTES } from '../../../domain/rules/skillRules';
import { SPECIAL_COLORS } from '../../../data/specialColors';

const CREATURE_ATTR_COLORS: Record<string, string> = {
  body: 'var(--color-special-strength)',
  mind: 'var(--color-special-intelligence)',
};

interface ParticipantRowProps {
  participant: SessionParticipantApi;
  isActive?: boolean;
  showCombatControls?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onDamage?: (amount: number) => void;
  onHeal?: (amount: number) => void;
  onRadiation?: (amount: number) => void;
  onLuckChange?: (amount: number) => void;
  onRemove?: () => void;
  onViewSheet?: () => void;
  onCombatStatusChange?: (status: CombatantStatus) => void;
  onInitiativeChange?: (value: number) => void;
  className?: string;
}

export function ParticipantRow({
  participant,
  isActive = false,
  showCombatControls = false,
  collapsed = false,
  onToggleCollapse,
  onDamage,
  onHeal,
  onRadiation,
  onLuckChange,
  onRemove,
  onViewSheet,
  onCombatStatusChange,
  onInitiativeChange: _onInitiativeChange,
  className = '',
}: ParticipantRowProps) {
  const { t } = useTranslation();
  const [selectedWeapon, setSelectedWeapon] = useState<{ itemId: number; installedMods?: InstalledModSummary[] } | null>(null);

  const { character, combatStatus, turnOrder } = participant;
  const isCreature = character.statBlockType === 'creature';

  const statusIcons: Record<CombatantStatus, React.ElementType | null> = {
    active: null,
    unconscious: AlertCircle,
    dead: Skull,
    fled: LogOut,
  };

  const statusColors: Record<CombatantStatus, string> = {
    active: '',
    unconscious: 'opacity-60',
    dead: 'opacity-40 grayscale',
    fled: 'opacity-50',
  };

  const StatusIcon = statusIcons[combatStatus];

  // SPECIAL letters
  const specialLetters = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];
  const specialKeys = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];

  return (
    <div
      className={`bg-vault-gray border-2 rounded-lg overflow-hidden transition-all ${
        isActive
          ? 'border-vault-yellow shadow-lg shadow-vault-yellow/20'
          : 'border-vault-yellow-dark'
      } ${statusColors[combatStatus]} ${className}`}
    >
      {/* Header row */}
      <div
        className={`flex items-center gap-3 p-3 ${onToggleCollapse && !isActive ? 'cursor-pointer' : ''}`}
        onClick={() => !isActive && onToggleCollapse?.()}
      >
        {/* Collapse chevron (in combat, not for active) */}
        {showCombatControls && onToggleCollapse && (
          <div className="flex-shrink-0 text-vault-yellow-dark">
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
        )}

        {/* Turn order (in combat) */}
        {showCombatControls && turnOrder !== null && (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-vault-blue border border-vault-yellow-dark">
            <span className="text-vault-yellow font-bold text-sm">{turnOrder}</span>
          </div>
        )}

        {/* Icon with status indicator */}
        <div className="relative flex-shrink-0">
          <OriginIcon originId={character.originId} emoji={character.emoji} type={character.type} size="md" />
          {StatusIcon && (
            <StatusIcon
              size={14}
              className="absolute -top-1 -right-1 text-red-500"
            />
          )}
        </div>

        {/* Name and type */}
        <div className="flex-1 min-w-0">
          <h4 className="text-vault-yellow font-bold truncate">
            {(() => { const tr = t(character.name); return tr !== character.name ? tr : character.name; })()}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{character.type === 'pc' ? t('characters.pc') : t('characters.npc')}</span>
            <span>Nv. {character.level}</span>
            {character.conditions.length > 0 && (
              <span className="text-orange-400">
                {character.conditions.map((c) => t(`conditions.${c}`)).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Attributes mini summary */}
        {isCreature && character.creatureAttributes ? (
          <div className="hidden md:flex gap-2">
            {Object.entries(character.creatureAttributes).map(([key, val]) => {
              const color = CREATURE_ATTR_COLORS[key] ?? '#4DBDB8';
              return (
                <div key={key} className="text-center" style={{ borderBottom: `2px solid ${color}` }}>
                  <span className="text-[10px] font-bold block" style={{ color }}>{t(`bestiary.creatureAttributes.${key}`)}</span>
                  <span className="text-xs text-white font-mono font-bold">{val}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hidden md:flex gap-1">
            {specialLetters.map((letter, i) => {
              const color = SPECIAL_COLORS[specialKeys[i]];
              return (
                <div key={letter} className="text-center w-5" style={{ borderBottom: `2px solid ${color}` }}>
                  <span className="text-[10px] font-bold block" style={{ color }}>{letter}</span>
                  <span className="text-xs text-white font-mono">{character.special?.[specialKeys[i]] ?? 5}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* HP Bar */}
        <div className="w-28">
          <HPBar
            current={character.currentHp}
            max={character.maxHp}
            radiation={character.radiationDamage}
            size="sm"
          />
        </div>

        {/* Key stats */}
        <div className="flex gap-2 text-center">
          <div className="px-1">
            <span className="text-[10px] text-gray-400 block">{t('characters.defenseShort')}</span>
            <span className="text-vault-yellow font-bold text-sm">{character.defense}</span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-gray-400 block">Init</span>
            <span className="text-vault-yellow font-bold text-sm">{character.initiative}</span>
          </div>
          {/* Luck points for PCs */}
          {character.type === 'pc' && (
            <div className="px-1">
              <span className="text-[10px] text-purple-400 block flex items-center justify-center gap-0.5">
                <Sparkles size={8} />
              </span>
              <span className="text-purple-400 font-bold text-sm">
                {character.currentLuckPoints}/{character.maxLuckPoints}
              </span>
            </div>
          )}
        </div>

        {/* View sheet button */}
        {onViewSheet && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewSheet(); }}
            className="p-2 text-vault-yellow-dark hover:text-vault-yellow active:text-vault-yellow transition-colors cursor-pointer"
            title={t('sessions.participants.viewSheet')}
          >
            <Eye size={20} />
          </button>
        )}
      </div>

      {/* Equipped weapons with TN (visible when expanded) */}
      {isActive && character.equippedWeapons?.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-700 pt-2">
          {character.equippedWeapons.map((weapon, weaponIdx) => {
            const skillKey = weapon.skill as keyof typeof SKILL_ATTRIBUTES;
            const attribute = SKILL_ATTRIBUTES[skillKey];
            const tn = attribute
              ? (character.special?.[attribute] ?? 0) + (character.skills?.[skillKey] ?? 0)
              : 0;
            // Translate weapon name: try nameKey, then items.weapons.Name, then items.Name
            let weaponName = weapon.name;
            if (weapon.nameKey) {
              const tr = t(weapon.nameKey);
              if (tr !== weapon.nameKey) weaponName = tr;
            }
            if (weaponName === weapon.name) {
              const tr = t(`items.weapons.${weapon.name}`);
              if (tr !== `items.weapons.${weapon.name}`) weaponName = tr;
            }
            if (weaponName === weapon.name) {
              const tr = t(`items.${weapon.name}`);
              if (tr !== `items.${weapon.name}`) weaponName = tr;
            }
            // Apply mod name transforms (same logic as InventoryManager)
            const mods = weapon.installedMods;
            if (mods && mods.length > 0) {
              const RENAME_SLOTS = ['crosse', 'carburant'];
              const renameMod = mods.find(m => RENAME_SLOTS.includes(m.slot));
              if (renameMod) {
                const stocked = t(`items.stockedNames.${weapon.name}`, { defaultValue: '' });
                if (stocked) weaponName = stocked;
              }
              const FULL_RENAME_SLOTS = ['amelioration'];
              const fullRenameMod = mods.find(m => FULL_RENAME_SLOTS.includes(m.slot));
              if (fullRenameMod?.nameAddKey) {
                const renamed = t(fullRenameMod.nameAddKey, { defaultValue: '' });
                if (renamed) {
                  weaponName = renamed;
                } else {
                  const suffixes = mods
                    .filter(m => !FULL_RENAME_SLOTS.includes(m.slot))
                    .map(m => m.nameAddKey ? t(m.nameAddKey, { defaultValue: '' }) : '')
                    .filter(Boolean);
                  if (suffixes.length > 0) weaponName = `${weaponName} (${suffixes.join(', ')})`;
                }
              } else {
                const suffixes = mods
                  .map(m => m.nameAddKey ? t(m.nameAddKey, { defaultValue: '' }) : '')
                  .filter(Boolean);
                if (suffixes.length > 0) weaponName = `${weaponName} (${suffixes.join(', ')})`;
              }
            }
            // Compute effective stats from mod effects
            let effectiveDamage = weapon.damage;
            let effectiveRange = weapon.range;
            let effectiveFireRate = weapon.fireRate;
            let damageModified = false;
            let rangeModified = false;
            let fireRateModified = false;
            if (mods && mods.length > 0) {
              const allEffects = mods.flatMap(m => m.effects ?? []);
              for (const eff of allEffects) {
                switch (eff.effectType) {
                  case 'setDamage':
                    if (eff.numericValue != null) { effectiveDamage = eff.numericValue; damageModified = true; }
                    break;
                  case 'damageBonus':
                    if (eff.numericValue != null) { effectiveDamage += eff.numericValue; damageModified = true; }
                    break;
                  case 'setFireRate':
                    if (eff.numericValue != null) { effectiveFireRate = eff.numericValue; fireRateModified = true; }
                    break;
                  case 'fireRateBonus':
                    if (eff.numericValue != null) { effectiveFireRate = (effectiveFireRate ?? 0) + eff.numericValue; fireRateModified = true; }
                    break;
                  case 'rangeChange': {
                    const rangeOrder = ['close', 'medium', 'long', 'extreme'];
                    const curIdx = rangeOrder.indexOf(effectiveRange);
                    if (curIdx !== -1 && eff.numericValue != null) {
                      const newIdx = Math.max(0, Math.min(rangeOrder.length - 1, curIdx + eff.numericValue));
                      effectiveRange = rangeOrder[newIdx];
                      if (newIdx !== curIdx) rangeModified = true;
                    }
                    break;
                  }
                }
              }
            }
            return (
              <div key={`${weapon.itemId}-${weaponIdx}`} className="flex items-center gap-2 text-xs">
                <Crosshair size={12} className="text-vault-yellow-dark flex-shrink-0" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedWeapon({ itemId: weapon.itemId, installedMods: weapon.installedMods }); }}
                  className="text-white hover:text-vault-yellow underline decoration-dotted cursor-pointer"
                >
                  {weaponName}
                </button>
                <span className="text-vault-yellow font-bold">TN {tn}</span>
                <span className={damageModified ? 'text-cyan-400' : 'text-gray-400'}>
                  {effectiveDamage}
                  <span className="text-[10px] ml-0.5">
                    {t(`damageTypes.${weapon.damageType}`)}
                  </span>
                </span>
                <span className={rangeModified ? 'text-cyan-400' : 'text-gray-500'}>{t(`ranges.${effectiveRange}`)}</span>
                {effectiveFireRate != null && effectiveFireRate > 0 && (
                  <span className={fireRateModified ? 'text-cyan-400' : 'text-gray-500'}>
                    {t('weapons.fireRate')}: {effectiveFireRate}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Creature attacks (visible when expanded, for creature stat blocks) */}
      {isActive && isCreature && character.creatureAttacks && character.creatureAttacks.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-700 pt-2">
          {character.creatureAttacks.map((attack, idx) => {
            const attackName = attack.nameKey
              ? (t(attack.nameKey) !== attack.nameKey ? t(attack.nameKey) : attack.name)
              : attack.name;
            const bodyAttr = character.creatureAttributes?.body ?? 0;
            const skillRank = character.creatureSkills?.[attack.skill] ?? 0;
            const tn = bodyAttr + skillRank;
            const qualitiesParts = (attack.qualities ?? []).map(q => {
              const name = t(`qualities.${q.quality}.name`);
              return q.value ? `${name} ${q.value}` : name;
            });
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <Swords size={12} className="text-vault-yellow-dark flex-shrink-0" />
                <span className="text-white font-bold">{attackName}</span>
                <span className="text-vault-yellow font-bold">TN {tn}</span>
                <span className="text-gray-400">
                  {attack.damage}
                  <span className="text-[10px] ml-0.5">
                    {t(`damageTypes.${attack.damageType}`)}
                  </span>
                </span>
                <span className="text-gray-500">{t(`ranges.${attack.range}`)}</span>
                {qualitiesParts.length > 0 && (
                  <span className="text-gray-500 italic">{qualitiesParts.join(', ')}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Controls row - larger touch targets for tablet */}
      {!collapsed && <div className="px-3 pb-3 flex flex-wrap items-center gap-3 border-t border-gray-700 pt-3">
        {/* HP Controls */}
        {(onDamage || onHeal) && combatStatus !== 'dead' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 w-8">PV</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              {onDamage && (
                <>
                  <button
                    type="button"
                    onClick={() => onDamage(5)}
                    className="px-3 py-2 text-sm font-bold text-red-400 bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/70 border-r border-gray-600 cursor-pointer min-w-[44px]"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => onDamage(1)}
                    className="px-3 py-2 text-sm font-bold text-red-400 bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/70 border-r border-gray-600 cursor-pointer min-w-[44px]"
                  >
                    -1
                  </button>
                </>
              )}
              {onHeal && (
                <>
                  <button
                    type="button"
                    onClick={() => onHeal(1)}
                    className="px-3 py-2 text-sm font-bold text-green-400 bg-green-900/30 hover:bg-green-900/50 active:bg-green-900/70 border-r border-gray-600 cursor-pointer min-w-[44px]"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => onHeal(5)}
                    className="px-3 py-2 text-sm font-bold text-green-400 bg-green-900/30 hover:bg-green-900/50 active:bg-green-900/70 cursor-pointer min-w-[44px]"
                  >
                    +5
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Radiation Controls */}
        {onRadiation && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-yellow-500 w-8">RAD</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                type="button"
                onClick={() => onRadiation(-1)}
                disabled={character.radiationDamage <= 0}
                className="px-3 py-2 text-sm font-bold text-blue-400 bg-blue-900/30 hover:bg-blue-900/50 active:bg-blue-900/70 border-r border-gray-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px]"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => onRadiation(1)}
                disabled={character.radiationDamage >= character.maxHp - 1}
                className="px-3 py-2 text-sm font-bold text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50 active:bg-yellow-900/70 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px]"
              >
                +1
              </button>
            </div>
            <span className="text-sm text-yellow-400 font-mono">{character.radiationDamage}</span>
          </div>
        )}

        {/* Luck points for PCs */}
        {character.type === 'pc' && onLuckChange && (
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                type="button"
                onClick={() => onLuckChange(-1)}
                disabled={character.currentLuckPoints <= 0}
                className="px-3 py-2 text-sm font-bold text-purple-400 bg-purple-900/30 hover:bg-purple-900/50 active:bg-purple-900/70 border-r border-gray-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px]"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => onLuckChange(1)}
                disabled={character.currentLuckPoints >= character.maxLuckPoints}
                className="px-3 py-2 text-sm font-bold text-purple-400 bg-purple-900/30 hover:bg-purple-900/50 active:bg-purple-900/70 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px]"
              >
                +1
              </button>
            </div>
          </div>
        )}

        {/* Combat Status buttons (in combat) */}
        {showCombatControls && onCombatStatusChange && (
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            {(['active', 'unconscious', 'dead', 'fled'] as CombatantStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onCombatStatusChange(status)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  combatStatus === status
                    ? 'bg-vault-yellow text-vault-blue font-bold'
                    : 'bg-vault-blue border border-vault-yellow-dark text-vault-yellow-dark hover:text-vault-yellow hover:border-vault-yellow'
                }`}
              >
                {t(`sessions.combat.combatStatus.${status}`)}
              </button>
            ))}
          </div>
        )}

        {/* Remove button */}
        {onRemove && !showCombatControls && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-900 hover:bg-red-900/30 active:bg-red-900/50 rounded-lg transition-colors ml-auto cursor-pointer"
          >
            <Trash2 size={16} />
            {t('common.remove')}
          </button>
        )}
      </div>}

      {/* Weapon detail modal */}
      <ItemDetailModal
        isOpen={selectedWeapon !== null}
        onClose={() => setSelectedWeapon(null)}
        itemId={selectedWeapon?.itemId ?? null}
        itemType="weapon"
        installedMods={selectedWeapon?.installedMods}
      />
    </div>
  );
}
