import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';

interface CombatantCardProps {
  participant: SessionParticipantApi;
  isSelected?: boolean;        // currently selected target
  isTargetable?: boolean;      // clickable (opposite alliance)
  onClick?: () => void;
}

const INJURY_EMOJI: Record<string, string> = {
  arm_broken_left: '🦾',
  arm_broken_right: '🦾',
  leg_broken: '🦵',
  torso_bleeding: '🩸',
  head_dazed: '😵',
};

const STATUS_OVERLAY: Record<string, { emoji: string; label: string }> = {
  dying: { emoji: '💀', label: 'Mourant' },
  unconscious: { emoji: '😵', label: 'Inconscient' },
  dead: { emoji: '☠', label: 'Mort' },
  fled: { emoji: '🏃', label: 'Fui' },
};

export function CombatantCard({ participant, isSelected, isTargetable, onClick }: CombatantCardProps) {
  const { t } = useTranslation();
  const c = participant.character;
  const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
  const status = STATUS_OVERLAY[participant.combatStatus];
  const clickable = isTargetable && !status;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`p-2 rounded border transition ${
        isSelected
          ? 'bg-red-900/40 border-orange-600'
          : participant.isAlly
          ? 'bg-green-950/30 border-zinc-700'
          : 'bg-red-950/20 border-zinc-700'
      } ${clickable ? 'cursor-pointer hover:border-orange-500' : ''} ${
        !isTargetable && !status ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {status && <span title={status.label}>{status.emoji}</span>}
        <span className="font-medium text-sm flex-1 truncate">{c.name}</span>
        <span className="text-xs text-zinc-300">
          HP {c.currentHp}/{c.maxHp}
        </span>
      </div>
      <div className="w-full h-1 bg-zinc-700 rounded mt-1 overflow-hidden">
        <div
          className={`h-full ${hpPct > 50 ? 'bg-green-600' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      {participant.combatStatus === 'dying' && (
        <div className="mt-1 text-xs bg-red-900/60 text-red-200 px-2 py-0.5 rounded inline-block">
          💀 {participant.injuries.length} {t('combat.dying.injuriesShort')}
        </div>
      )}
      {participant.injuries && participant.injuries.length > 0 && (
        <div className="mt-1 flex gap-1 flex-wrap">
          {participant.injuries.map(inj => (
            <span
              key={inj.id}
              title={t(`combat.injury.${inj.injuryType}.name`)}
              className="text-xs"
            >
              {INJURY_EMOJI[inj.injuryType]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
