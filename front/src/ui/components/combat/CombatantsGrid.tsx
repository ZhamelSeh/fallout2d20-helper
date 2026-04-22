import { useTranslation } from 'react-i18next';
import { CombatantCard } from './CombatantCard';
import type { SessionParticipantApi } from '../../../services/api';

interface CombatantsGridProps {
  participants: SessionParticipantApi[];
  activeParticipantId: number | null;
  selectedTargetId: number | null;
  onSelectTarget: (participantId: number) => void;
}

export function CombatantsGrid({
  participants,
  activeParticipantId,
  selectedTargetId,
  onSelectTarget,
}: CombatantsGridProps) {
  const { t } = useTranslation();
  const active = participants.find(p => p.id === activeParticipantId);
  const others = participants.filter(p => p.id !== activeParticipantId);
  // From the attacker's POV: allies are the same isAlly; enemies the opposite.
  const allies = active
    ? others.filter(p => p.isAlly === active.isAlly)
    : others.filter(p => p.isAlly);
  const enemies = active
    ? others.filter(p => p.isAlly !== active.isAlly)
    : others.filter(p => !p.isAlly);

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      <div>
        <h4 className="text-xs font-bold text-green-500 mb-2 uppercase tracking-wide">
          🛡 {t('combat.grid.allies')} ({allies.length})
        </h4>
        <div className="space-y-2">
          {allies.map(p => (
            <CombatantCard
              key={p.id}
              participant={p}
              isTargetable={false}
              onClick={() => onSelectTarget(p.id)}
            />
          ))}
          {allies.length === 0 && (
            <p className="text-xs text-zinc-500 italic">—</p>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wide">
          ⚔ {t('combat.grid.enemies')} ({enemies.length})
        </h4>
        <div className="space-y-2">
          {enemies.map(p => (
            <CombatantCard
              key={p.id}
              participant={p}
              isSelected={p.id === selectedTargetId}
              isTargetable={true}
              onClick={() => onSelectTarget(p.id)}
            />
          ))}
          {enemies.length === 0 && (
            <p className="text-xs text-zinc-500 italic">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
