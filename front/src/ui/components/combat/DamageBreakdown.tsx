import { useTranslation } from 'react-i18next';
import type { AttackResult } from '../../../domain/rules/attackResolution';

interface DamageBreakdownProps {
  result: AttackResult | null;
  zoneLabel: string;
}

export function DamageBreakdown({ result, zoneLabel }: DamageBreakdownProps) {
  const { t } = useTranslation();

  if (!result) {
    return (
      <div className="text-xs text-zinc-500 p-3 border border-dashed border-zinc-700 rounded">
        {t('combat.attackFlow.noPreview')}
      </div>
    );
  }

  return (
    <div className="text-xs bg-zinc-900 p-3 rounded border border-zinc-700 space-y-1 font-mono">
      <div className="text-zinc-400">🎯 {zoneLabel}</div>
      {result.cdResults && (
        <div>
          CD rolled:{' '}
          {result.cdResults.map((cd, i) => (
            <span key={i} className="mx-0.5">
              [{cd.damage}{cd.effect ? '★' : ''}]
            </span>
          ))}
        </div>
      )}
      {result.viciousBonusCD !== undefined && result.viciousBonusCD > 0 && (
        <div className="text-orange-400">+{result.viciousBonusCD} CD (Vicious crit)</div>
      )}
      <div className="border-t border-zinc-700 pt-1 mt-1">
        {t('combat.attackFlow.raw')}: <b>{result.rawDamage}</b>
      </div>
      <div>
        {t('combat.attackFlow.dr')}: <b className="text-red-400">−{result.effectiveDR}</b>
      </div>
      <div className="text-sm">
        {t('combat.attackFlow.final')}: <b className="text-red-400">{result.finalDamage}</b>
      </div>
      {result.injuryTriggered && (
        <div className="text-orange-400 mt-1">
          ⚠ {t('combat.attackFlow.injuryTriggered')}
        </div>
      )}
      {result.appliedConditions.length > 0 && (
        <div className="text-yellow-400">
          ⚡ {result.appliedConditions.join(', ')}
        </div>
      )}
      {result.persistentCondition && (
        <div className="text-orange-400">
          🩸 {result.persistentCondition.type} ({result.persistentCondition.damage}/turn)
        </div>
      )}
    </div>
  );
}
