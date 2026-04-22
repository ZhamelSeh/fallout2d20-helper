import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';

interface ActiveTurnPanelProps {
  active: SessionParticipantApi | null;
  selectedTargetId: number | null;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
}

export function ActiveTurnPanel({ active, selectedTargetId, onDamage, onHeal }: ActiveTurnPanelProps) {
  const { t } = useTranslation();

  if (!active) {
    return (
      <div className="p-6 text-center text-zinc-500">
        {t('combat.activeTurn.noActive')}
      </div>
    );
  }

  const c = active.character;
  const allianceColor = active.isAlly ? 'border-green-600' : 'border-red-600';
  const allianceLabel = active.isAlly ? t('combat.alliance.ally') : t('combat.alliance.enemy');
  // AP isn't currently tracked per-participant on SessionParticipantApi (only groupAP/gmAP on
  // the session). Read defensively so this shell works if/when per-participant fields land.
  const activeAny = active as unknown as { currentAP?: number; maxAP?: number };

  return (
    <div className={`m-3 p-4 bg-zinc-900 border-2 rounded-lg ${allianceColor}`}>
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-800">
        <span className="text-green-400 font-bold">▶ {t('combat.activeTurn.title')}</span>
        <span className="text-lg font-bold">{c.name}</span>
        <span className="text-xs text-zinc-400">({allianceLabel})</span>
        <div className="ml-auto flex gap-4 text-xs text-zinc-300">
          <span>HP {c.currentHp}/{c.maxHp}</span>
          <span>AP {activeAny.currentAP ?? 0}/{activeAny.maxAP ?? 0}</span>
          <span>Luck {c.currentLuckPoints ?? 0}/{c.maxLuckPoints ?? 0}</span>
        </div>
      </div>

      {/* Placeholder for attack flow — replaced in Plan 2 */}
      <div className="p-6 text-center border-2 border-dashed border-zinc-700 rounded bg-zinc-950">
        <p className="text-zinc-500 italic">
          {t('combat.activeTurn.attackPlaceholder')}
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Target: {selectedTargetId ? `participant #${selectedTargetId}` : '—'}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button
            type="button"
            onClick={() => onDamage(1)}
            className="text-xs px-3 py-1 bg-red-700 text-white rounded"
          >
            HP −1 (temp)
          </button>
          <button
            type="button"
            onClick={() => onHeal(1)}
            className="text-xs px-3 py-1 bg-green-700 text-white rounded"
          >
            HP +1 (temp)
          </button>
        </div>
      </div>
    </div>
  );
}
