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
    <div className="sticky top-0 z-10 bg-vault-blue border-b border-vault-yellow-dark p-2 flex gap-2 items-center overflow-x-auto">
      <span className="text-xs text-vault-yellow-dark whitespace-nowrap">
        {t('combat.round')} {currentRound} · {t('combat.initiative.label')}:
      </span>
      <div className="flex gap-1">
        {sorted.map((p, idx) => {
          const isActive = p.id === activeParticipantId;
          const order = idx + 1;
          const rawName = p.character?.name ?? '';
          const name = rawName ? String(t(rawName, rawName)) : '';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !isActive && onActivateOutOfOrder(p.id)}
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                isActive
                  ? 'bg-vault-yellow text-vault-blue'
                  : p.combatStatus === 'dying'
                  ? 'bg-vault-danger text-vault-yellow-light'
                  : p.combatStatus === 'unconscious'
                  ? 'bg-vault-gray text-vault-yellow-dark'
                  : 'bg-vault-gray text-vault-yellow-light hover:bg-vault-gray-light'
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
            className="text-xs px-2 py-1 rounded bg-vault-gray text-vault-yellow-light hover:bg-vault-gray-light"
          >
            ↩ {t('combat.initiative.returnToOrder')}
          </button>
        )}
        <button
          type="button"
          onClick={onEndTurn}
          className="text-xs px-3 py-1 rounded bg-vault-yellow text-vault-blue hover:bg-vault-yellow-dark font-bold"
        >
          ▶ {t('combat.initiative.endTurn')}
        </button>
      </div>
    </div>
  );
}
