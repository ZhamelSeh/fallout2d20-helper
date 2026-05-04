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

  // attacker.equippedWeapons may not exist on all SessionParticipantApi shapes.
  // Defensive access:
  const equippedWeapons: any[] = (attacker as any).equippedWeapons ?? (attacker.character as any).equippedWeapons ?? [];

  const [weaponId, setWeaponId] = useState<number | null>(
    equippedWeapons[0]?.itemId ?? equippedWeapons[0]?.id ?? null,
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
    () => equippedWeapons.find((w: any) => (w.itemId ?? w.id) === weaponId) ?? null,
    [equippedWeapons, weaponId],
  );

  const targetDR = useMemo(() => {
    if (!target) return { drPhysical: 0, drEnergy: 0 };
    const drList = (target.character as any).dr ?? (target as any).dr ?? [];
    const drEntry = drList.find((d: any) => d.location === zone);
    return drEntry ?? { drPhysical: 0, drEnergy: 0 };
  }, [target, zone]);

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
    const damageKind = ((weapon.damageType as DamageKind) ?? 'physical');
    const baseCDCount = weapon.damage ?? weapon.damageRating ?? 1;

    if (diceMode === 'app') {
      // TODO: real TN computation from skill + SPECIAL.
      const r = resolveAttackFromAppRoll({
        tn: 10,
        focus: 1,
        baseCDCount,
        zoneDR: targetDR,
        damageKind,
        qualities,
      });
      setPreviewResult(r);
    } else {
      const r = resolveAttackFromManualInput({
        rawDamage: manual.rawDamage,
        d20Critical: manual.d20Critical,
        effectsRolled: manual.effectsRolled,
        zoneDR: targetDR,
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

  if (equippedWeapons.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  if (!weapon) {
    return (
      <div className="p-4 text-center text-zinc-500">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.weapon')}</label>
          <select
            value={weaponId ?? ''}
            onChange={e => setWeaponId(Number(e.target.value))}
            className="w-full bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            {equippedWeapons.map((w: any) => {
              const id = w.itemId ?? w.id;
              const blocked = weaponBlockedByInjuries(w.equippedHand, attacker.injuries ?? []);
              return (
                <option key={id} value={id} disabled={blocked}>
                  🔫 {w.name}{blocked ? ' (bras cassé)' : ''}
                </option>
              );
            })}
          </select>
          {armLocked && (
            <p className="text-xs text-red-400 mt-1">⚠ {t('combat.attackFlow.armBroken')}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.target')}</label>
          <div className="bg-zinc-800 rounded px-2 py-1 text-sm min-h-[28px]">
            {target ? target.character.name : <span className="text-zinc-500 italic">—</span>}
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.zone')}</label>
          <select
            value={zone}
            onChange={e => setZone(e.target.value as Zone)}
            className="w-full bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            <option value="head">{t('body.head')}</option>
            <option value="torso">{t('body.torso')}</option>
            <option value="armLeft">{t('body.armLeft')}</option>
            <option value="armRight">{t('body.armRight')}</option>
            <option value="legLeft">{t('body.legLeft')}</option>
            <option value="legRight">{t('body.legRight')}</option>
          </select>
        </div>
      </div>

      {weapon.qualities && weapon.qualities.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {weapon.qualities.map((q: any, i: number) => {
            const id = q.quality ?? q.id ?? String(q);
            return (
              <span
                key={`${id}-${i}`}
                title={t(`effects.weaponQualities.${id}.rules.0`, id)}
                className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-purple-300 cursor-help"
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
          className={`text-xs px-3 py-1 rounded ${diceMode === 'app' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
        >
          🎲 {t('combat.attackFlow.rollApp')}
        </button>
        <button
          type="button"
          onClick={() => setDiceMode('manual')}
          className={`text-xs px-3 py-1 rounded ${diceMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
        >
          ✏ {t('combat.attackFlow.manual')}
        </button>
      </div>

      {diceMode === 'manual' && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-zinc-400">Succès</label>
            <input
              type="number"
              value={manual.successes}
              onChange={e => setManual(m => ({ ...m, successes: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-zinc-400">d20 crit</label>
            <input
              type="checkbox"
              checked={manual.d20Critical}
              onChange={e => setManual(m => ({ ...m, d20Critical: e.target.checked }))}
            />
          </div>
          <div>
            <label className="text-zinc-400">Dégâts bruts</label>
            <input
              type="number"
              value={manual.rawDamage}
              onChange={e => setManual(m => ({ ...m, rawDamage: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-zinc-400">Effects</label>
            <input
              type="number"
              value={manual.effectsRolled}
              onChange={e => setManual(m => ({ ...m, effectsRolled: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={computePreview}
        disabled={!target || armLocked}
        className="text-xs px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50"
      >
        {t('combat.attackFlow.computePreview')}
      </button>

      <DamageBreakdown result={previewResult} zoneLabel={t(`body.${zone}`)} />

      <div className="flex gap-2 justify-end">
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="text-xs px-3 py-1 bg-zinc-700 text-yellow-400 rounded hover:bg-zinc-600"
          >
            ↶ {t('combat.attackFlow.undo')}
          </button>
        )}
        <button
          type="button"
          onClick={handleResolve}
          disabled={!previewResult || !target}
          className="text-xs px-4 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          ✓ {t('combat.attackFlow.resolve')}
        </button>
      </div>
    </div>
  );
}
