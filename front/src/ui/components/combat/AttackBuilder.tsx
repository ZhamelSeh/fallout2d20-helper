import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

type Zone = 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight';
type DiceMode = 'app' | 'manual';

interface AttackBuilderProps {
  attacker: SessionParticipantApi;
  target: SessionParticipantApi | null;
  onResolve: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  canUndo: boolean;
}

export function AttackBuilder({ attacker, target, onResolve, onUndo, canUndo }: AttackBuilderProps) {
  const { t } = useTranslation();

  // The backend already returns ALL weapons in inventory under `equippedWeapons`
  // (the field is misnamed — see sessions.ts "Get all weapons in inventory").
  // Also fall back to `inventory` filtered to weapon items when needed.
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
    }));
  const inventoryWeapons: any[] =
    equippedWeaponsApi.length > 0 ? equippedWeaponsApi : inventoryWeaponsFromInv;

  const [weaponId, setWeaponId] = useState<number | null>(
    inventoryWeapons[0]?.itemId ?? inventoryWeapons[0]?.id ?? null,
  );
  const [zone, setZone] = useState<Zone>('torso');
  const [diceMode, setDiceMode] = useState<DiceMode>('app');
  const [manual, setManual] = useState({
    successes: 0,
    d20Critical: false,
    rawDamage: 0,
    effectsRolled: 0,
  });
  const [previewResult, setPreviewResult] = useState<AttackResult | null>(null);

  const weapon = useMemo(
    () => inventoryWeapons.find((w: any) => (w.itemId ?? w.id) === weaponId) ?? null,
    [inventoryWeapons, weaponId],
  );

  const computeDR = (z: Zone) => {
    if (!target) return { drPhysical: 0, drEnergy: 0 };
    const drList = (target.character as any).dr ?? (target as any).dr ?? [];
    const drEntry = drList.find((d: any) => d.location === z);
    return drEntry ?? { drPhysical: 0, drEnergy: 0 };
  };

  const armLocked = useMemo(() => {
    if (!weapon?.equippedHand) return false;
    return weaponBlockedByInjuries(weapon.equippedHand, attacker.injuries ?? []);
  }, [weapon, attacker.injuries]);

  const computePreview = () => {
    if (!weapon) return;
    const qualities = ((weapon.qualities ?? []) as any[]).map(q => ({
      quality: q.quality ?? q.id ?? String(q),
      value: q.value,
    }));
    // Merge mod-derived qualities (gainQuality / loseQuality)
    const modEffects = ((weapon.installedMods ?? []) as any[]).flatMap((m: any) => m.effects ?? []);
    for (const eff of modEffects) {
      if (eff.effectType === 'gainQuality' && eff.qualityName) {
        qualities.push({ quality: eff.qualityName, value: eff.qualityValue ?? undefined });
      } else if (eff.effectType === 'loseQuality' && eff.qualityName) {
        const idx = qualities.findIndex(q => q.quality === eff.qualityName);
        if (idx !== -1) qualities.splice(idx, 1);
      }
    }
    const damageKind = ((weapon.damageType as DamageKind) ?? 'physical');
    const stats = computeEffectiveWeaponStats(weapon as any);
    const baseCDCount = stats.damage ?? 1;

    let actualZone: Zone = zone;
    if (diceMode === 'app') {
      const zones: Zone[] = ['head', 'torso', 'armLeft', 'armRight', 'legLeft', 'legRight'];
      actualZone = zones[Math.floor(Math.random() * zones.length)];
      setZone(actualZone);
    }

    const dr = computeDR(actualZone);

    if (diceMode === 'app') {
      // TODO: real TN computation from skill + SPECIAL.
      const r = resolveAttackFromAppRoll({
        tn: 10,
        focus: 1,
        baseCDCount,
        zoneDR: dr,
        damageKind,
        qualities,
      });
      setPreviewResult(r);
    } else {
      const r = resolveAttackFromManualInput({
        rawDamage: manual.rawDamage,
        d20Critical: manual.d20Critical,
        effectsRolled: manual.effectsRolled,
        zoneDR: dr,
        damageKind,
        qualities,
      });
      setPreviewResult(r);
    }
  };

  const handleResolve = async () => {
    if (!previewResult || !weaponId) return;
    await onResolve(previewResult, weaponId, zone);
    setPreviewResult(null);
  };

  if (inventoryWeapons.length === 0) {
    return (
      <div className="p-4 text-center text-vault-yellow-dark">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  if (!weapon) {
    return (
      <div className="p-4 text-center text-vault-yellow-dark">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.weapon')}</label>
          <select
            value={weaponId ?? ''}
            onChange={e => setWeaponId(Number(e.target.value))}
            className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm"
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
          {armLocked && (
            <p className="text-xs text-vault-danger mt-1">⚠ {t('combat.attackFlow.armBroken')}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-vault-yellow-dark">{t('combat.attackFlow.target')}</label>
          <div className="bg-vault-gray text-vault-yellow-light rounded px-2 py-1 text-sm min-h-[28px]">
            {target ? String(t(target.character.name, target.character.name)) : <span className="text-vault-yellow-dark italic">—</span>}
          </div>
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

      {weapon.qualities && weapon.qualities.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {weapon.qualities.map((q: any, i: number) => {
            const id = q.quality ?? q.id ?? String(q);
            return (
              <span
                key={`${id}-${i}`}
                title={String(t(`effects.weaponQualities.${id}.rules.0`, id))}
                className="text-xs px-2 py-0.5 bg-vault-gray rounded-full text-vault-yellow-light cursor-help"
              >
                💡 {id}{q.value ? ` ${q.value}` : ''}
              </span>
            );
          })}
        </div>
      )}

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

      {diceMode === 'manual' && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-vault-yellow-dark">Succès</label>
            <input
              type="number"
              value={manual.successes}
              onChange={e => setManual(m => ({ ...m, successes: +e.target.value }))}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-vault-yellow-dark">d20 crit</label>
            <input
              type="checkbox"
              checked={manual.d20Critical}
              onChange={e => setManual(m => ({ ...m, d20Critical: e.target.checked }))}
            />
          </div>
          <div>
            <label className="text-vault-yellow-dark">Dégâts bruts</label>
            <input
              type="number"
              value={manual.rawDamage}
              onChange={e => setManual(m => ({ ...m, rawDamage: +e.target.value }))}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-vault-yellow-dark">Effects</label>
            <input
              type="number"
              value={manual.effectsRolled}
              onChange={e => setManual(m => ({ ...m, effectsRolled: +e.target.value }))}
              className="w-full bg-vault-gray text-vault-yellow-light rounded px-2 py-1"
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
    </div>
  );
}
