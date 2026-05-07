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
      <div className="text-xs text-vault-yellow-dark p-3 border border-dashed border-vault-yellow-dark rounded">
        {t('combat.attackFlow.noPreview')}
      </div>
    );
  }

  return (
    <div className="text-xs bg-vault-blue p-3 rounded border border-vault-yellow-dark space-y-1 font-mono text-vault-yellow-light">
      <div className="text-vault-yellow-dark">🎯 {zoneLabel}</div>
      {result.cdResults && (
        <div>
          {t('combat.attackFlow.cdRolled')}:{' '}
          {result.cdResults.map((cd, i) => (
            <span key={i} className="mx-0.5">
              [{cd.damage}{cd.effect ? '★' : ''}]
            </span>
          ))}
        </div>
      )}
      {result.effectsRolled > 0 && (
        <div className="text-vault-yellow-dark">
          ★ {result.effectsRolled} {t(result.effectsRolled > 1 ? 'combat.attackFlow.effectsLabel_plural' : 'combat.attackFlow.effectsLabel')}
        </div>
      )}
      <div className="border-t border-vault-yellow-dark pt-1 mt-1">
        {t('combat.attackFlow.raw')}: <b>{result.rawDamage}</b>
      </div>
      <div>
        {t('combat.attackFlow.dr')} {String(t(`damageTypes.${result.damageKind}`, result.damageKind))}: <b className="text-vault-danger">−{result.effectiveDR}</b>
      </div>
      <div className="text-sm">
        {t('combat.attackFlow.final')}: <b className="text-vault-danger">{result.finalDamage}</b>
      </div>
      {result.injuryTriggered && (
        <div className="text-vault-yellow-dark mt-1">
          ⚠ {t('combat.attackFlow.injuryTriggered')}
        </div>
      )}
      {result.appliedConditions.length > 0 && (
        <div className="text-vault-yellow">
          ⚡ {result.appliedConditions.join(', ')}
        </div>
      )}
      {result.persistentCondition && (
        <div className="text-vault-yellow-dark">
          🩸 {String(t(`conditions.${result.persistentCondition.type}`, result.persistentCondition.type))} ({result.persistentCondition.damage}/{t('combat.attackFlow.perTurn')})
        </div>
      )}
    </div>
  );
}
