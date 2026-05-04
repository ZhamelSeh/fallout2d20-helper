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
    <div className="bg-zinc-950 border border-zinc-800 rounded p-2 flex gap-2 flex-wrap items-center text-xs">
      <span className="text-zinc-500">⚠</span>
      {participant.injuries.map(inj => (
        <span
          key={inj.id}
          className="px-2 py-0.5 rounded bg-red-900/60 text-red-200 flex items-center gap-1"
          title={t(`combat.injury.${inj.injuryType}.rule`)}
        >
          {t(`combat.injury.${inj.injuryType}.name`)}
          <button
            type="button"
            onClick={() => onHealInjury(inj.id)}
            className="text-red-300 hover:text-white ml-1"
            title={t('combat.injury.heal')}
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
            className="px-2 py-0.5 rounded bg-yellow-900/60 text-yellow-200"
          >
            {t(`conditions.${condStr}`, condStr)}
          </span>
        );
      })}
    </div>
  );
}
