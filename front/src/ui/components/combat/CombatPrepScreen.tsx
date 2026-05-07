import { useTranslation } from 'react-i18next';
import { Play, Shield, Swords } from 'lucide-react';
import type { SessionParticipantApi } from '../../../services/api';
import { OriginIcon } from '../character/OriginIcon';

interface CombatPrepScreenProps {
  participants: SessionParticipantApi[];
  onToggleParticipant: (participantId: number, included: boolean) => void;
  onToggleAlliance: (participantId: number, isAlly: boolean) => void;
  onStartCombat: () => void;
  isParticipantIncluded: (participantId: number) => boolean;
  canStartCombat?: boolean;
}

export function CombatPrepScreen({
  participants,
  onToggleParticipant,
  onToggleAlliance,
  onStartCombat,
  isParticipantIncluded,
  canStartCombat = true,
}: CombatPrepScreenProps) {
  const { t } = useTranslation();

  const sorted = [...participants].sort(
    (a, b) => (b.character.initiative ?? 0) - (a.character.initiative ?? 0)
  );
  const pcs = sorted.filter((p) => p.character.type === 'pc');
  const npcs = sorted.filter((p) => p.character.type === 'npc');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-vault-yellow font-bold">
          {t('sessions.combat.prepareCombat')}
        </h3>
        <button
          type="button"
          onClick={onStartCombat}
          disabled={!canStartCombat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vault-yellow text-vault-blue font-bold hover:bg-vault-yellow-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Play size={18} />
          {t('sessions.combat.startCombat')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipantColumn
          title={t('combat.prep.pcs')}
          fallbackTitle={`${t('characters.pc')}s`}
          emptyLabel={t('sessions.participants.noPCs')}
          participants={pcs}
          onToggleParticipant={onToggleParticipant}
          onToggleAlliance={onToggleAlliance}
          isParticipantIncluded={isParticipantIncluded}
        />
        <ParticipantColumn
          title={t('combat.prep.npcs')}
          fallbackTitle={`${t('characters.npc')}s`}
          emptyLabel={t('sessions.participants.noNPCs')}
          participants={npcs}
          onToggleParticipant={onToggleParticipant}
          onToggleAlliance={onToggleAlliance}
          isParticipantIncluded={isParticipantIncluded}
        />
      </div>
    </div>
  );
}

interface ParticipantColumnProps {
  title: string;
  fallbackTitle: string;
  emptyLabel: string;
  participants: SessionParticipantApi[];
  onToggleParticipant: (id: number, included: boolean) => void;
  onToggleAlliance: (id: number, isAlly: boolean) => void;
  isParticipantIncluded: (id: number) => boolean;
}

function ParticipantColumn({
  title,
  fallbackTitle,
  emptyLabel,
  participants,
  onToggleParticipant,
  onToggleAlliance,
  isParticipantIncluded,
}: ParticipantColumnProps) {
  // If i18n key is missing, useTranslation returns the key itself — fall back.
  const displayTitle = title.startsWith('combat.prep.') ? fallbackTitle : title;

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-vault-yellow-dark">{displayTitle}</h4>
      {participants.length === 0 ? (
        <div className="text-xs text-gray-500 px-3 py-2">{emptyLabel}</div>
      ) : (
        participants.map((p) => (
          <ParticipantPrepRow
            key={p.id}
            participant={p}
            included={isParticipantIncluded(p.id)}
            onToggleParticipant={onToggleParticipant}
            onToggleAlliance={onToggleAlliance}
          />
        ))
      )}
    </div>
  );
}

interface ParticipantPrepRowProps {
  participant: SessionParticipantApi;
  included: boolean;
  onToggleParticipant: (id: number, included: boolean) => void;
  onToggleAlliance: (id: number, isAlly: boolean) => void;
}

function ParticipantPrepRow({
  participant,
  included,
  onToggleParticipant,
  onToggleAlliance,
}: ParticipantPrepRowProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 bg-vault-blue rounded transition-opacity ${
        included ? '' : 'opacity-40'
      }`}
    >
      <input
        type="checkbox"
        checked={included}
        onChange={(e) => onToggleParticipant(participant.id, e.target.checked)}
        className="w-4 h-4 accent-vault-yellow cursor-pointer"
      />
      <OriginIcon
        originId={participant.character.originId}
        emoji={participant.character.emoji}
        type={participant.character.type}
        size="sm"
      />
      <span className="w-6 text-center font-bold text-vault-yellow text-sm">
        {participant.character.initiative}
      </span>
      <span className="text-white text-sm flex-1 truncate">
        {String(t(participant.character.name, participant.character.name))}
      </span>
      <AllianceToggle
        isAlly={participant.isAlly}
        onChange={(isAlly) => onToggleAlliance(participant.id, isAlly)}
      />
    </div>
  );
}

interface AllianceToggleProps {
  isAlly: boolean;
  onChange: (isAlly: boolean) => void;
}

function AllianceToggle({ isAlly, onChange }: AllianceToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!isAlly)}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium cursor-pointer transition-colors ${
        isAlly
          ? 'bg-green-700 text-white hover:bg-green-600'
          : 'bg-red-700 text-white hover:bg-red-600'
      }`}
      title={isAlly ? 'Allié' : 'Ennemi'}
    >
      {isAlly ? <Shield size={12} /> : <Swords size={12} />}
      <span>{isAlly ? 'Allié' : 'Ennemi'}</span>
    </button>
  );
}
