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
          ? 'bg-vault-danger/40 border-vault-yellow'
          : participant.isAlly
          ? 'bg-vault-blue border-vault-yellow-dark'
          : 'bg-vault-blue-dark border-vault-yellow-dark'
      } ${clickable ? 'cursor-pointer hover:border-vault-yellow' : ''} ${
        !isTargetable && !status ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {status && <span title={status.label}>{status.emoji}</span>}
        <span className="font-medium text-sm flex-1 truncate text-vault-yellow-light">{String(t(c.name, c.name))}</span>
        <span className="text-xs text-vault-yellow-light">
          HP {c.currentHp}/{c.maxHp}
        </span>
      </div>
      <div className="w-full h-1 bg-vault-gray-light rounded mt-1 overflow-hidden">
        <div
          className={`h-full ${hpPct > 50 ? 'bg-vault-success' : hpPct > 20 ? 'bg-vault-yellow' : 'bg-vault-danger'}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      {participant.combatStatus === 'dying' && (
        <div className="mt-1 text-xs bg-vault-danger text-vault-yellow-light px-2 py-0.5 rounded inline-block">
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
