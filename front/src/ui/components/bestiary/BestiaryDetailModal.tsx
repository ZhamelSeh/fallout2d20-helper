import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/Modal';
import { Shield, Swords, Sparkles, Package } from 'lucide-react';
import type { BestiaryEntryApi } from '../../../services/api';

interface BestiaryDetailModalProps {
  entry: BestiaryEntryApi | null;
  isOpen: boolean;
  onClose: () => void;
  onInstantiate?: (entry: BestiaryEntryApi) => void;
}

const SPECIAL_ORDER = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
const SPECIAL_LETTERS = { strength: 'S', perception: 'P', endurance: 'E', charisma: 'C', intelligence: 'I', agility: 'A', luck: 'L' };

export function BestiaryDetailModal({ entry, isOpen, onClose, onInstantiate }: BestiaryDetailModalProps) {
  const { t } = useTranslation();

  if (!entry) return null;

  const isCreature = entry.statBlockType === 'creature';

  // Compute target number for an attack
  const getTargetNumber = (attack: BestiaryEntryApi['attacks'][0]) => {
    if (isCreature) {
      // Body + melee, or Body + ranged depending on skill
      const attr = attack.skill === 'melee' ? (entry.attributes['body'] ?? 0) : (entry.attributes['body'] ?? 0);
      const skillData = entry.skills.find(s => s.skill === attack.skill);
      return attr + (skillData?.rank ?? 0);
    } else {
      // SPECIAL attribute linked to skill + skill rank
      const skillToSpecial: Record<string, string> = {
        smallGuns: 'agility',
        bigGuns: 'endurance',
        energyWeapons: 'perception',
        meleeWeapons: 'strength',
        unarmed: 'strength',
        throwing: 'agility',
        explosives: 'perception',
      };
      const attrKey = skillToSpecial[attack.skill] ?? 'perception';
      const attrValue = entry.attributes[attrKey] ?? 0;
      const skillData = entry.skills.find(s => s.skill === attack.skill);
      return attrValue + (skillData?.rank ?? 0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(entry.nameKey)}>
      <div className="space-y-6">
        {/* Description */}
        {entry.descriptionKey && (
          <p className="text-gray-300 italic">{t(entry.descriptionKey)}</p>
        )}

        {/* Base Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge label={t('bestiary.level')} value={entry.level} />
          <StatBadge label={t('bestiary.xpReward')} value={entry.xpReward} />
          <StatBadge label={t('bestiary.hp')} value={entry.hp} />
          <StatBadge label={t('bestiary.defense')} value={entry.defense} />
          <StatBadge label={t('bestiary.initiative')} value={entry.initiative} />
          {entry.meleeDamageBonus > 0 && (
            <StatBadge label={t('bestiary.meleeDamageBonus')} value={`+${entry.meleeDamageBonus}`} />
          )}
          {entry.wealth !== null && entry.wealth !== undefined && (
            <StatBadge label={t('bestiary.wealth')} value={entry.wealth} />
          )}
        </div>

        {/* Attributes */}
        <Section title={t('bestiary.attributes')}>
          {isCreature ? (
            <div className="flex gap-4">
              {Object.entries(entry.attributes).map(([key, val]) => (
                <div key={key} className="bg-vault-blue rounded px-4 py-2 text-center">
                  <div className="text-vault-yellow-dark text-xs uppercase">{t(`bestiary.creatureAttributes.${key}`)}</div>
                  <div className="text-vault-yellow text-xl font-bold">{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {SPECIAL_ORDER.map(attr => (
                <div key={attr} className="bg-vault-blue rounded px-3 py-2 text-center min-w-[48px]">
                  <div className="text-vault-yellow-dark text-xs font-bold">
                    {(SPECIAL_LETTERS as any)[attr]}
                  </div>
                  <div className="text-vault-yellow text-lg font-bold">
                    {entry.attributes[attr] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Skills */}
        <Section title={t('bestiary.skills')}>
          {isCreature ? (
            <div className="flex gap-4 flex-wrap">
              {entry.skills.map(s => (
                <div key={s.skill} className="bg-vault-blue rounded px-4 py-2 text-center">
                  <div className="text-vault-yellow-dark text-xs">{t(`bestiary.creatureSkills.${s.skill}`)}</div>
                  <div className="text-vault-yellow text-lg font-bold">{s.rank}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {entry.skills.map(s => (
                <div key={s.skill} className="flex items-center justify-between bg-vault-blue/50 rounded px-2 py-1">
                  <span className="text-gray-300 text-sm">
                    {t(`skills.${s.skill}`)}
                    {s.isTagSkill && <span className="text-vault-yellow ml-1">*</span>}
                  </span>
                  <span className="text-vault-yellow font-bold text-sm">{s.rank}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Damage Resistance */}
        <Section title={t('bestiary.damageResistance')} icon={<Shield size={18} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-vault-yellow-dark border-b border-vault-yellow-dark">
                  <th className="text-left py-1 px-2"></th>
                  <th className="text-center py-1 px-2">{t('bestiary.physical')}</th>
                  <th className="text-center py-1 px-2">{t('bestiary.energy')}</th>
                  <th className="text-center py-1 px-2">{t('bestiary.radiation')}</th>
                  <th className="text-center py-1 px-2">{t('bestiary.poison')}</th>
                </tr>
              </thead>
              <tbody>
                {entry.dr.map(d => (
                  <tr key={d.location} className="border-b border-vault-gray-light/20">
                    <td className="text-gray-300 py-1 px-2">{t(`bestiary.bodyLocations.${d.location}`)}</td>
                    <td className="text-center text-vault-yellow py-1 px-2">{d.drPhysical}</td>
                    <td className="text-center text-vault-yellow py-1 px-2">{d.drEnergy}</td>
                    <td className="text-center text-vault-yellow py-1 px-2">{d.drRadiation}</td>
                    <td className="text-center text-vault-yellow py-1 px-2">{d.drPoison}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Attacks */}
        {entry.attacks.length > 0 && (
          <Section title={t('bestiary.attacksTitle')} icon={<Swords size={18} />}>
            <div className="space-y-3">
              {entry.attacks.map(attack => (
                <div key={attack.id} className="bg-vault-blue/50 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-vault-yellow font-bold">{t(attack.nameKey)}</span>
                    <span className="text-xs bg-vault-blue px-2 py-0.5 rounded text-vault-yellow-dark">
                      {t('bestiary.targetNumber')} {getTargetNumber(attack)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-vault-yellow-dark">{t('bestiary.damage')}: </span>
                      <span className="text-gray-200">{attack.damage} CD</span>
                      {attack.damageBonus ? <span className="text-gray-400"> +{attack.damageBonus}</span> : null}
                    </div>
                    <div>
                      <span className="text-vault-yellow-dark">{t('bestiary.range')}: </span>
                      <span className="text-gray-200">{t(`combat.ranges.${attack.range}`, attack.range)}</span>
                    </div>
                    {attack.fireRate !== null && attack.fireRate !== undefined && (
                      <div>
                        <span className="text-vault-yellow-dark">{t('bestiary.fireRate')}: </span>
                        <span className="text-gray-200">{attack.fireRate}</span>
                      </div>
                    )}
                    {attack.twoHanded && (
                      <div className="text-gray-400 italic">{t('bestiary.twoHanded')}</div>
                    )}
                  </div>
                  {attack.qualities.length > 0 && (
                    <div className="mt-1.5 flex gap-1.5 flex-wrap">
                      {attack.qualities.map((q, i) => (
                        <span key={i} className="bg-vault-yellow/20 text-vault-yellow text-xs px-2 py-0.5 rounded">
                          {q.quality}{q.value ? ` ${q.value}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Abilities */}
        {entry.abilities.length > 0 && (
          <Section title={t('bestiary.abilitiesTitle')} icon={<Sparkles size={18} />}>
            <div className="space-y-2">
              {entry.abilities.map((ability, i) => (
                <div key={i} className="bg-vault-blue/50 rounded p-3">
                  <div className="text-vault-yellow font-bold text-sm">{t(ability.nameKey)}</div>
                  <div className="text-gray-300 text-sm mt-1">{t(ability.descriptionKey)}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Inventory */}
        {entry.inventory.length > 0 && (
          <Section title={t('bestiary.inventory')} icon={<Package size={18} />}>
            <div className="space-y-1">
              {entry.inventory.map((inv, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-vault-blue/30 rounded px-3 py-1.5">
                  <span className="text-gray-300">
                    {inv.item.nameKey ? t(`items.${inv.item.itemType === 'weapon' ? 'weapons' : 'armor'}.${inv.item.nameKey}`, inv.item.name) : inv.item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {inv.quantity > 1 && (
                      <span className="text-vault-yellow-dark">x{inv.quantity}</span>
                    )}
                    {inv.equipped && (
                      <span className="text-xs bg-vault-yellow/20 text-vault-yellow px-1.5 py-0.5 rounded">E</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Instantiate button */}
        {onInstantiate && (
          <div className="pt-2 border-t border-vault-yellow-dark">
            <button
              onClick={() => onInstantiate(entry)}
              className="w-full bg-vault-yellow text-vault-blue font-bold py-2 rounded hover:bg-vault-yellow-light transition-colors"
            >
              {t('bestiary.addToSession')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-vault-yellow font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-vault-blue rounded px-3 py-2 text-center">
      <div className="text-vault-yellow-dark text-xs">{label}</div>
      <div className="text-vault-yellow text-lg font-bold">{value}</div>
    </div>
  );
}
