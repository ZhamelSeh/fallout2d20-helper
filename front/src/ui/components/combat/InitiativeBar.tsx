import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';

interface InitiativeBarProps {
  participants: SessionParticipantApi[];
  activeParticipantId: number | null;
  temporaryActiveId: number | null;
  currentRound: number;
  onActivateOutOfOrder: (participantId: number) => void;
  onEndTurn: () => void;
  onReturnToNormalOrder: () => void;
}

export function InitiativeBar({
  participants,
  activeParticipantId,
  temporaryActiveId,
  currentRound,
  onActivateOutOfOrder,
  onEndTurn,
  onReturnToNormalOrder,
}: InitiativeBarProps) {
  const { t } = useTranslation();
  const sorted = [...participants]
    .filter(
      (p) =>
        p.turnOrder != null &&
        p.combatStatus !== 'dead' &&
        p.combatStatus !== 'fled'
    )
    .sort((a, b) => (b.turnOrder ?? 0) - (a.turnOrder ?? 0));

  return (
    <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 p-2 flex gap-2 items-center overflow-x-auto">
      <span className="text-xs text-zinc-400 whitespace-nowrap">
        {t('combat.round')} {currentRound} · {t('combat.initiative.label')}:
      </span>
      <div className="flex gap-1">
        {sorted.map((p, idx) => {
          const isActive = p.id === activeParticipantId;
          const order = idx + 1;
          const name = p.character?.name ?? '';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !isActive && onActivateOutOfOrder(p.id)}
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                isActive
                  ? 'bg-green-600 text-white'
                  : p.combatStatus === 'dying'
                  ? 'bg-red-900 text-white'
                  : p.combatStatus === 'unconscious'
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
              }`}
            >
              {isActive && '▶ '}
              {order} {name} {p.turnOrder}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex gap-2">
        {temporaryActiveId != null && (
          <button
            type="button"
            onClick={onReturnToNormalOrder}
            className="text-xs px-2 py-1 rounded bg-zinc-700 text-blue-300 hover:bg-zinc-600"
          >
            ↩ {t('combat.initiative.returnToOrder')}
          </button>
        )}
        <button
          type="button"
          onClick={onEndTurn}
          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          ▶ {t('combat.initiative.endTurn')}
        </button>
      </div>
    </div>
  );
}
