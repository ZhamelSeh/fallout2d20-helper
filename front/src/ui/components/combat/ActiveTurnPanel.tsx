import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';
import type { AttackResult } from '../../../domain/rules/attackResolution';
import type { SurvivalTestResult } from '../../../domain/rules/dyingRules';
import { AttackBuilder } from './AttackBuilder';
import { InjuryAndConditionsBar } from './InjuryAndConditionsBar';
import { DyingSurvivalTest } from './DyingSurvivalTest';

interface ActiveTurnPanelProps {
  active: SessionParticipantApi | null;
  target: SessionParticipantApi | null;
  canUndo: boolean;
  onResolveAttack: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onHealInjury: (injuryId: number) => void;
  onSubmitSurvivalTest: (result: SurvivalTestResult) => Promise<void>;
  onStabilize: () => Promise<void>;
}

export function ActiveTurnPanel({
  active,
  target,
  canUndo,
  onResolveAttack,
  onUndo,
  onHealInjury,
  onSubmitSurvivalTest,
  onStabilize,
}: ActiveTurnPanelProps) {
  const { t } = useTranslation();

  if (!active) {
    return (
      <div className="p-6 text-center text-vault-yellow-dark">
        {t('combat.activeTurn.noActive')}
      </div>
    );
  }

  const c = active.character;
  const allianceColor = active.isAlly ? 'border-vault-success' : 'border-vault-danger';
  const allianceLabel = active.isAlly ? t('combat.alliance.ally') : t('combat.alliance.enemy');
  const activeAny = active as unknown as { currentAP?: number; maxAP?: number };

  return (
    <div className={`m-3 p-4 bg-vault-blue border-2 rounded-lg ${allianceColor}`}>
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-vault-yellow-dark">
        <span className="text-vault-yellow font-bold">▶ {t('combat.activeTurn.title')}</span>
        <span className="text-lg font-bold text-vault-yellow-light">{String(t(c.name, c.name))}</span>
        <span className="text-xs text-vault-yellow-dark">({allianceLabel})</span>
        <div className="ml-auto flex gap-4 text-xs text-vault-yellow-light">
          <span>HP {c.currentHp}/{c.maxHp}</span>
          <span>AP {activeAny.currentAP ?? 0}/{activeAny.maxAP ?? 0}</span>
          <span>Luck {c.currentLuckPoints ?? 0}/{c.maxLuckPoints ?? 0}</span>
        </div>
      </div>

      <InjuryAndConditionsBar participant={active} onHealInjury={onHealInjury} />

      <div className="mt-3">
        {active.combatStatus === 'dying' ? (
          <DyingSurvivalTest
            mourant={active}
            onSubmit={onSubmitSurvivalTest}
            onStabilize={onStabilize}
          />
        ) : (
          <>
            {active.skipNormalActions && (
              <div className="bg-vault-blue-dark border border-vault-yellow-dark p-2 rounded text-xs text-vault-yellow-light mb-2">
                ⚠ {t('combat.activeTurn.skipNormalActions')}
              </div>
            )}
            <AttackBuilder
              attacker={active}
              target={target}
              onResolve={onResolveAttack}
              onUndo={onUndo}
              canUndo={canUndo}
            />
          </>
        )}
      </div>
    </div>
  );
}
