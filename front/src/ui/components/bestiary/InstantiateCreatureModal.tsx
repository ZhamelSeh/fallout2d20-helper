import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { sessionsApi } from '../../../services/api';
import type { SessionApi, BestiaryEntryApi } from '../../../services/api';

interface InstantiateCreatureModalProps {
  entry: BestiaryEntryApi | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entry: BestiaryEntryApi, sessionId: number, name?: string) => Promise<void>;
}

export function InstantiateCreatureModal({ entry, isOpen, onClose, onConfirm }: InstantiateCreatureModalProps) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<SessionApi[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      sessionsApi.list({ status: 'active', full: false }).then(setSessions).catch(() => {});
      setCustomName('');
      setSelectedSessionId(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!entry) return null;

  const handleConfirm = async () => {
    if (!selectedSessionId || !entry) return;
    setLoading(true);
    try {
      await onConfirm(entry, selectedSessionId, customName || undefined);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Instantiate failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bestiary.instantiateModal.title')}>
      <div className="space-y-4">
        {success ? (
          <div className="text-center py-8">
            <div className="text-vault-yellow text-lg font-bold">{t('bestiary.instantiateModal.success')}</div>
          </div>
        ) : (
          <>
            <div className="text-gray-300 text-sm">
              {t(entry.nameKey)} — {t(`bestiary.statBlockTypes.${entry.statBlockType}`)}
            </div>

            {/* Session selector */}
            <div>
              <label className="block text-vault-yellow-dark text-sm mb-1">
                {t('bestiary.instantiateModal.selectSession')}
              </label>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('bestiary.instantiateModal.noSessions')}</p>
              ) : (
                <select
                  className="w-full bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-3 py-2"
                  value={selectedSessionId ?? ''}
                  onChange={e => setSelectedSessionId(e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                  <option value="">{t('bestiary.instantiateModal.selectSession')}</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Custom name */}
            <div>
              <label className="block text-vault-yellow-dark text-sm mb-1">
                {t('bestiary.instantiateModal.customName')}
              </label>
              <input
                type="text"
                className="w-full bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-3 py-2"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={t(entry.nameKey)}
              />
            </div>

            {/* Confirm */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedSessionId || loading}
              >
                {t('bestiary.instantiateModal.confirm')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
