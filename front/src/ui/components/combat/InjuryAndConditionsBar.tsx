import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';

interface InjuryAndConditionsBarProps {
  participant: SessionParticipantApi;
  onHealInjury: (injuryId: number) => void;
}

export function InjuryAndConditionsBar({ participant, onHealInjury }: InjuryAndConditionsBarProps) {
  const { t } = useTranslation();
  const c = participant.character;
  const hasInjuries = participant.injuries && participant.injuries.length > 0;
  const hasConditions = c.conditions && c.conditions.length > 0;
  if (!hasInjuries && !hasConditions) return null;

  return (
    <div className="bg-vault-blue-dark border border-vault-yellow-dark rounded p-2 flex gap-2 flex-wrap items-center text-xs">
      <span className="text-vault-yellow-dark">⚠</span>
      {participant.injuries.map(inj => (
        <span
          key={inj.id}
          className="px-2 py-0.5 rounded bg-vault-danger text-vault-yellow-light flex items-center gap-1"
          title={String(t(`combat.injury.${inj.injuryType}.rule`))}
        >
          {String(t(`combat.injury.${inj.injuryType}.name`))}
          <button
            type="button"
            onClick={() => onHealInjury(inj.id)}
            className="text-vault-yellow-light hover:text-vault-yellow ml-1"
            title={String(t('combat.injury.heal'))}
          >
            ✕
          </button>
        </span>
      ))}
      {(c.conditions ?? []).map((cond, idx) => {
        const condStr = typeof cond === 'string' ? cond : (cond as any).condition ?? String(cond);
        return (
          <span
            key={`${condStr}-${idx}`}
            className="px-2 py-0.5 rounded bg-vault-gray text-vault-yellow-light"
          >
            {String(t(`conditions.${condStr}`, condStr))}
          </span>
        );
      })}
    </div>
  );
}
