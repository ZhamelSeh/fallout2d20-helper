import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import type { SessionParticipantApi } from '../../../services/api';
import {
  resolveAttackFromAppRoll,
  resolveAttackFromManualInput,
  type AttackResult,
} from '../../../domain/rules/attackResolution';
import type { DamageKind } from '../../../domain/rules/attackQualities';
import { weaponBlockedByInjuries } from '../../../domain/rules/injuryRules';
import { computeModdedWeaponName, computeEffectiveWeaponStats } from '../../../domain/rules/weaponMods';
import { DamageBreakdown } from './DamageBreakdown';
import { ItemDetailModal } from '../../../components/ItemDetailModal';

type Zone = 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight';
type DiceMode = 'app' | 'manual';

const SKILL_TO_SPECIAL: Record<string, string> = {
  smallGuns: 'agility',
  bigGuns: 'endurance',
  energyWeapons: 'perception',
  meleeWeapons: 'strength',
  unarmed: 'strength',
  throwing: 'agility',
  explosives: 'perception',
};

const MELEE_OR_THROWN_SKILLS = new Set(['meleeWeapons', 'unarmed', 'throwing']);

interface AttackBuilderProps {
  attacker: SessionParticipantApi;
  target: SessionParticipantApi | null;
  allParticipants: SessionParticipantApi[];
  onSelectTarget: (participantId: number | null) => void;
  onResolve: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  canUndo: boolean;
}

export function AttackBuilder({ attacker, target, allParticipants, onSelectTarget, onResolve, onUndo, canUndo }: AttackBuilderProps) {
  const { t } = useTranslation();

  const equippedWeaponsApi: any[] =
    (attacker as any).equippedWeapons ?? (attacker.character as any).equippedWeapons ?? [];
  const inventoryRaw: any[] = (attacker.character as any).inventory ?? [];
  const inventoryWeaponsFromInv: any[] = inventoryRaw
    .filter(
      (entry: any) =>
        entry?.item?.itemType === 'weapon' ||
        entry?.itemType === 'weapon' ||
        entry?.weapon != null,
    )
    .map((entry: any) => ({
      itemId: entry.itemId ?? entry.item?.id,
      name: entry.item?.name ?? entry.name,
      nameKey: entry.item?.nameKey ?? entry.nameKey,
      damage: entry.weapon?.damage ?? entry.damage,
      damageType: entry.weapon?.damageType ?? entry.damageType,
      qualities: entry.weapon?.qualities ?? entry.qualities ?? [],
      installedMods: entry.installedMods ?? [],
      skill: entry.weapon?.skill ?? entry.skill,
      fireRate: entry.weapon?.fireRate ?? entry.fireRate,
    }));
  const inventoryWeapons: any[] =
    equippedWeaponsApi.length > 0 ? equippedWeaponsApi : inventoryWeaponsFromInv;

  const [weaponId, setWeaponId] = useState<number | null>(
    inventoryWeapons[0]?.itemId ?? inventoryWeapons[0]?.id ?? null,
  );
  const [zone, setZone] = useState<Zone>('torso');
  const [diceMode, setDiceMode] = useState<DiceMode>('app');
  const [extraBurstAmmo, setExtraBurstAmmo] = useState(0);
  const [extraDamageAP, setExtraDamageAP] = useState(0);
  const [manual, setManual] = useState({ rawDamage: 0, effectsRolled: 0 });
  const [previewResult, setPreviewResult] = useState<AttackResult | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const weapon = useMemo(
    () => inventoryWeapons.find((w: any) => (w.itemId ?? w.id) === weaponId) ?? null,
    [inventoryWeapons, weaponId],
  );

  const armLocked = useMemo(() => {
    if (!weapon?.equippedHand) return false;
    return weaponBlockedByInjuries(weapon.equippedHand, attacker.injuries ?? []);
  }, [weapon, attacker.injuries]);

  // Compute TN = skill rank + SPECIAL value (informational — d20 rolls are physical)
  const tnInfo = useMemo(() => {
    if (!weapon) return null;
    const skill: string | undefined = weapon.skill;
    if (!skill) return null;
    const skills: Record<string, number> = (attacker.character as any).skills ?? {};
    const special: Record<string, number> = (attacker.character as any).special ?? {};
    const specialAttr = SKILL_TO_SPECIAL[skill];
    const skillRank = skills[skill] ?? 0;
    const specialValue = specialAttr ? (special[specialAttr] ?? 0) : 0;
    return {
      skill,
      specialAttr,
      skillRank,
      specialValue,
      tn: skillRank + specialValue,
    };
  }, [weapon, attacker]);

  // Effective weapon stats after mods (damage, fireRate)
  const stats = useMemo(() => {
    if (!weapon) return null;
    return computeEffectiveWeaponStats(weapon as any);
  }, [weapon]);

  // Mod-adjusted qualities (gainQuality / loseQuality from installed mods)
  const effectiveQualities = useMemo((): { quality: string; value?: number }[] => {
    if (!weapon) return [];
    const qualities = ((weapon.qualities ?? []) as any[]).map(q => ({
      quality: q.quality ?? q.id ?? String(q),
      value: q.value,
    }));
    const modEffects = ((weapon.installedMods ?? []) as any[]).flatMap((m: any) => m.effects ?? []);
    for (const eff of modEffects) {
      if (eff.effectType === 'gainQuality' && eff.qualityName) {
        qualities.push({ quality: eff.qualityName, value: eff.qualityValue ?? undefined });
      } else if (eff.effectType === 'loseQuality' && eff.qualityName) {
        const idx = qualities.findIndex(q => q.quality === eff.qualityName);
        if (idx !== -1) qualities.splice(idx, 1);
      }
    }
    return qualities;
  }, [weapon]);

  const isMeleeOrThrown = weapon?.skill ? MELEE_OR_THROWN_SKILLS.has(weapon.skill) : false;
  // Cadence de tir = nombre max de munitions supp pour +CD (règle F2d20).
  // Désactivé pour melee/lancer ou si fireRate non défini.
  const fireRate = weapon?.fireRate ?? 0;
  const burstMax = isMeleeOrThrown ? 0 : fireRate;
  const damageAPMax = isMeleeOrThrown ? 3 : 0;

  // Passive derived stat: meleeDamageBonus auto-adds CDs for melee/unarmed/throwing
  const meleeDamageBonus = (attacker.character as any).meleeDamageBonus ?? 0;
  const meleeBonusApplied = isMeleeOrThrown ? meleeDamageBonus : 0;

  const baseCDCount = stats?.damage ?? 0;
  const totalCDCount = baseCDCount
    + meleeBonusApplied
    + extraBurstAmmo
    + (isMeleeOrThrown ? extraDamageAP : 0);

  // Reset inputs when the weapon changes (so burst from a previous gun doesn't
  // leak into a melee weapon, etc.)
  useEffect(() => {
    setExtraBurstAmmo(0);
    setExtraDamageAP(0);
    setPreviewResult(null);
  }, [weaponId]);

  const viciousQuality = effectiveQualities.find(q => q.quality === 'vicious');
  const viciousBonus = viciousQuality?.value ?? 0;

  const computeDR = (z: Zone) => {
    if (!target) return { drPhysical: 0, drEnergy: 0 };
    const drList = (target.character as any).dr ?? (target as any).dr ?? [];
    const drEntry = drList.find((d: any) => d.location === z);
    return drEntry ?? { drPhysical: 0, drEnergy: 0 };
  };

  const computePreview = () => {
    if (!weapon || !stats) return;
    const damageKind = ((weapon.damageType as DamageKind) ?? 'physical');

    let actualZone: Zone = zone;
    if (diceMode === 'app') {
      const zones: Zone[] = ['head', 'torso', 'armLeft', 'armRight', 'legLeft', 'legRight'];
      actualZone = zones[Math.floor(Math.random() * zones.length)];
      setZone(actualZone);
    }

    const dr = computeDR(actualZone);
    const common = { zoneDR: dr, damageKind, qualities: effectiveQualities, totalCDCount };

    const r = diceMode === 'app'
      ? resolveAttackFromAppRoll(common)
      : resolveAttackFromManualInput({
          ...common,
          rawDamage: manual.rawDamage,
          effectsRolled: manual.effectsRolled,
        });
    setPreviewResult(r);
  };

  const handleResolve = async () => {
    if (!previewResult || !weaponId) return;
    await onResolve(previewResult, weaponId, zone);
    setPreviewResult(null);
  };

  if (inventoryWeapons.length === 0 || !weapon) {
    return (
      <div className="p-4 text-center text-vault-yellow-dark">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Weapon / Target / Zone */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.weapon')}</label>
          <div className="flex gap-1">
            <select
              value={weaponId ?? ''}
              onChange={e => setWeaponId(Number(e.target.value))}
              className="flex-1 bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
            >
              {inventoryWeapons.map((w: any) => {
                const id = w.itemId ?? w.id;
                const blocked = weaponBlockedByInjuries(w.equippedHand, attacker.injuries ?? []);
                const displayName = computeModdedWeaponName(w as any, t as any);
                return (
                  <option key={id} value={id} disabled={blocked}>
                    🔫 {displayName}{blocked ? ' (bras cassé)' : ''}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => setDetailModalOpen(true)}
              disabled={!weaponId}
              className="px-2 py-1 bg-vault-gray text-vault-yellow-dark hover:text-vault-yellow rounded disabled:opacity-50"
              title={String(t('common.details', 'Détails'))}
            >
              <Eye size={16} />
            </button>
          </div>
          {armLocked && (
            <p className="text-xs text-vault-danger mt-1">⚠ {t('combat.attackFlow.armBroken')}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.target')}</label>
          <select
            value={target?.id ?? ''}
            onChange={e => {
              const v = e.target.value;
              onSelectTarget(v === '' ? null : Number(v));
            }}
            className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {allParticipants
              .filter(p =>
                p.id !== attacker.id &&
                p.turnOrder != null &&
                p.combatStatus !== 'dead' &&
                p.combatStatus !== 'fled',
              )
              .map(p => (
                <option key={p.id} value={p.id}>
                  {String(t(p.character.name, p.character.name))} ({p.isAlly ? t('combat.alliance.ally') : t('combat.alliance.enemy')})
                </option>
              ))}
          </select>
        </div>

        {diceMode === 'manual' ? (
          <div>
            <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.zone')}</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value as Zone)}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
            >
              <option value="head">{t('body.head')}</option>
              <option value="torso">{t('body.torso')}</option>
              <option value="armLeft">{t('body.armLeft')}</option>
              <option value="armRight">{t('body.armRight')}</option>
              <option value="legLeft">{t('body.legLeft')}</option>
              <option value="legRight">{t('body.legRight')}</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.zone')}</label>
            <div className="bg-vault-gray rounded px-2 py-1 text-sm min-h-[28px] italic text-vault-yellow-dark">
              {previewResult ? `🎲 ${t(`body.${zone}`)}` : '—'}
            </div>
          </div>
        )}
      </div>

      {/* TN info */}
      {tnInfo && (
        <div className="text-xs text-vault-yellow-dark bg-vault-blue-dark border border-vault-yellow-dark rounded px-2 py-1">
          🎯 <b className="text-vault-yellow">TN du jet d'attaque : {tnInfo.tn}</b>
          {' '}({String(t(`skills.${tnInfo.skill}`, tnInfo.skill))} {tnInfo.skillRank}
          {tnInfo.specialAttr ? ` + ${String(t(`special.${tnInfo.specialAttr}`, tnInfo.specialAttr))} ${tnInfo.specialValue}` : ''})
        </div>
      )}

      {/* Weapon qualities chips (with mod-derived qualities included) */}
      {effectiveQualities.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {effectiveQualities.map((q, i: number) => (
            <span
              key={`${q.quality}-${i}`}
              title={String(t(`effects.weaponQualities.${q.quality}.rules.0`, q.quality))}
              className="text-xs px-2 py-0.5 bg-vault-gray rounded-full text-vault-yellow-light cursor-help"
            >
              💡 {q.quality}{q.value ? ` ${q.value}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Player choices: burst + damage AP */}
      <div className="grid grid-cols-2 gap-3 border border-vault-yellow-dark rounded p-2 bg-vault-blue-dark">
        <div>
          <label className="text-xs text-vault-yellow-dark">
            ⚡ Cadence de tir (munitions extra) {burstMax > 0 ? `— max ${burstMax}` : '— indispo'}
          </label>
          <input
            type="number"
            min={0}
            max={burstMax}
            value={extraBurstAmmo}
            onChange={e => setExtraBurstAmmo(Math.max(0, Math.min(burstMax, +e.target.value || 0)))}
            disabled={burstMax === 0}
            className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs text-vault-yellow-dark">
            🥊 Dégâts supp. (1-3 PA) — {isMeleeOrThrown ? 'melee/lancer' : 'indispo'}
          </label>
          <input
            type="number"
            min={0}
            max={damageAPMax}
            value={extraDamageAP}
            onChange={e => setExtraDamageAP(Math.max(0, Math.min(damageAPMax, +e.target.value || 0)))}
            disabled={!isMeleeOrThrown}
            className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* CD count breakdown */}
      <div className="bg-vault-blue-dark border border-vault-yellow rounded p-3">
        <div className="text-vault-yellow font-bold text-sm mb-1">
          🎲 Le joueur doit lancer <span className="text-lg">{totalCDCount}</span> CD
        </div>
        <div className="text-xs text-vault-yellow-light space-y-0.5 font-mono">
          <div>Base (arme + mods) : <b>{baseCDCount}</b>{stats?.damageModified ? ' (modifié)' : ''}</div>
          {meleeBonusApplied > 0 && <div>+ Bonus dégâts CaC (passif) : <b>+{meleeBonusApplied}</b></div>}
          {extraBurstAmmo > 0 && <div>+ Cadence de tir : <b>+{extraBurstAmmo}</b></div>}
          {isMeleeOrThrown && extraDamageAP > 0 && <div>+ Dégâts supp. (PA) : <b>+{extraDamageAP}</b></div>}
        </div>
        {viciousBonus > 0 && (
          <div className="text-xs text-vault-yellow-dark mt-2 italic">
            ⚠ Si le d20 d'attaque est un critique, ajoute <b>+{viciousBonus}</b> CD pour Vicious
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDiceMode('app')}
          className={`text-xs px-3 py-1 rounded ${diceMode === 'app' ? 'bg-vault-yellow text-vault-blue font-bold' : 'bg-vault-gray text-vault-yellow-light'}`}
        >
          🎲 {t('combat.attackFlow.rollApp')}
        </button>
        <button
          type="button"
          onClick={() => setDiceMode('manual')}
          className={`text-xs px-3 py-1 rounded ${diceMode === 'manual' ? 'bg-vault-yellow text-vault-blue font-bold' : 'bg-vault-gray text-vault-yellow-light'}`}
        >
          ✏ {t('combat.attackFlow.manual')}
        </button>
      </div>

      {/* Manual input — only raw damage + effects */}
      {diceMode === 'manual' && (
        <div className="grid grid-cols-2 gap-3 border border-vault-yellow-dark rounded p-2 bg-vault-blue-dark">
          <div>
            <label className="text-xs text-vault-yellow-dark">Dégâts totaux (somme des CD)</label>
            <input
              type="number"
              min={0}
              value={manual.rawDamage}
              onChange={e => setManual(m => ({ ...m, rawDamage: Math.max(0, +e.target.value || 0) }))}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-vault-yellow-dark">Effects rollés (CD = 5 ou 6)</label>
            <input
              type="number"
              min={0}
              value={manual.effectsRolled}
              onChange={e => setManual(m => ({ ...m, effectsRolled: Math.max(0, +e.target.value || 0) }))}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={computePreview}
        disabled={!target || armLocked}
        className="text-xs px-3 py-1 bg-vault-gray text-vault-yellow-light rounded hover:bg-vault-gray-light disabled:opacity-50"
      >
        {t('combat.attackFlow.computePreview')}
      </button>

      <DamageBreakdown result={previewResult} zoneLabel={String(t(`body.${zone}`))} />

      <div className="flex gap-2 justify-end">
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="text-xs px-3 py-1 bg-vault-gray text-vault-yellow rounded hover:bg-vault-gray-light"
          >
            ↶ {t('combat.attackFlow.undo')}
          </button>
        )}
        <button
          type="button"
          onClick={handleResolve}
          disabled={!previewResult || !target}
          className="text-xs px-4 py-1 bg-vault-yellow text-vault-blue rounded hover:bg-vault-yellow-dark font-bold disabled:opacity-50"
        >
          ✓ {t('combat.attackFlow.resolve')}
        </button>
      </div>

      <ItemDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        itemId={weaponId}
        itemType={weaponId ? 'weapon' : null}
        installedMods={weapon?.installedMods}
      />
    </div>
  );
}
