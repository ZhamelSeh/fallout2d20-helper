import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/Modal';
import { Plus, Trash2, ChevronDown, ChevronRight, Star, Heart, Shield, Zap, Swords, Sparkles, Package } from 'lucide-react';
import {
  SPECIAL_ATTRIBUTES, SKILL_NAMES, SKILL_ATTRIBUTES,
  calculateMaxHp, calculateDefense, calculateInitiative,
  calculateMeleeDamageBonus, calculateMaxLuckPoints, calculateCarryCapacity,
} from '../../../data/characters';
import { SPECIAL_COLORS } from '../../../data/specialColors';
import { SpecialInput } from '../character/SpecialInput';
import { ItemSelector } from '../inventory/ItemSelector';
import { EmojiPickerInput } from '../common/EmojiPickerInput';
import { itemsApi } from '../../../services/api';
import type {
  CreateBestiaryEntryData,
  BestiaryEntryApi,
  CreatureCategory,
  BodyType,
  StatBlockType,
} from '../../../services/api';

const CATEGORIES: CreatureCategory[] = ['human', 'ghoul', 'superMutant', 'synth', 'robot', 'animal', 'abomination', 'insect', 'alien'];
const BODY_TYPES: BodyType[] = ['humanoid', 'quadruped', 'insect', 'serpentine', 'robot'];
const STAT_BLOCK_TYPES: StatBlockType[] = ['normal', 'creature'];
const DAMAGE_TYPES = ['physical', 'energy', 'radiation', 'poison'];
const RANGES = ['close', 'medium', 'long', 'extreme'];
const CREATURE_SKILLS = ['melee', 'ranged', 'other'];
const CREATURE_ATTRIBUTES = ['body', 'mind'];
const BODY_LOCATIONS = ['head', 'torso', 'armLeft', 'armRight', 'legLeft', 'legRight'];
const WEAPON_QUALITIES = [
  'accurate', 'blast', 'breaking', 'burst', 'closeQuarters', 'concealed', 'debilitating',
  'gatling', 'inaccurate', 'mine', 'nightVision', 'parry', 'persistent',
  'piercing', 'radioactive', 'reliable', 'recon', 'spread', 'stun',
  'thrown', 'twoHanded', 'unreliable', 'vicious', 'silent',
];
const CREATURE_ATTR_COLORS: Record<string, string> = {
  body: SPECIAL_COLORS.strength,
  mind: SPECIAL_COLORS.intelligence,
};

interface AttackForm {
  name: string;
  skill: string;
  damage: number;
  damageType: string;
  damageBonus: number;
  fireRate: number;
  range: string;
  twoHanded: boolean;
  qualities: { quality: string; value?: number }[];
}

interface AbilityForm {
  name: string;
  description: string;
}

interface InventoryItemForm {
  itemId: number;
  itemName: string;
  quantity: number;
  equipped: boolean;
}

interface BestiaryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBestiaryEntryData) => Promise<void>;
  editEntry?: BestiaryEntryApi | null;
}

function createEmptyAttack(): AttackForm {
  return { name: '', skill: 'melee', damage: 1, damageType: 'physical', damageBonus: 0, fireRate: 0, range: 'close', twoHanded: false, qualities: [] };
}

export function BestiaryCreateModal({ isOpen, onClose, onSave, editEntry }: BestiaryCreateModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editEntry;

  // Section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true, stats: true, attributes: true, skills: false, dr: false, attacks: false, abilities: false, inventory: false,
  });

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreatureCategory>('human');
  const [bodyType, setBodyType] = useState<BodyType>('humanoid');
  const [statBlockType, setStatBlockType] = useState<StatBlockType>('creature');

  const [level, setLevel] = useState(1);
  const [xpReward, setXpReward] = useState(0);
  const [hp, setHp] = useState(10);
  const [defense, setDefense] = useState(1);
  const [initiative, setInitiative] = useState(0);
  const [meleeDamageBonus, setMeleeDamageBonus] = useState(0);
  const [carryCapacity, setCarryCapacity] = useState(0);
  const [maxLuckPoints, setMaxLuckPoints] = useState(0);
  const [wealth, setWealth] = useState<number | null>(null);

  // Attributes (dynamic based on statBlockType)
  const [attributes, setAttributes] = useState<Record<string, number>>({});

  // Skills
  const [skills, setSkills] = useState<{ skill: string; rank: number; isTagSkill: boolean }[]>([]);

  // DR
  const [drMode, setDrMode] = useState<'uniform' | 'detailed'>('uniform');
  const [drEntries, setDrEntries] = useState<{ location: string; drPhysical: number; drEnergy: number; drRadiation: number; drPoison: number }[]>([
    { location: 'all', drPhysical: 0, drEnergy: 0, drRadiation: 0, drPoison: 0 },
  ]);

  // Attacks
  const [attacks, setAttacks] = useState<AttackForm[]>([]);

  // Abilities
  const [abilities, setAbilities] = useState<AbilityForm[]>([]);

  // Inventory
  const [inventoryItems, setInventoryItems] = useState<InventoryItemForm[]>([]);
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
  const [allItems, setAllItems] = useState<{ id: number; name: string; nameKey?: string; itemType: string }[]>([]);

  const [saving, setSaving] = useState(false);

  // Auto-calculate derived stats for normal stat block
  const derivedStats = useMemo(() => {
    if (statBlockType !== 'normal') return null;
    const str = attributes.strength ?? 5;
    const per = attributes.perception ?? 5;
    const end = attributes.endurance ?? 5;
    const agi = attributes.agility ?? 5;
    const lck = attributes.luck ?? 5;
    return {
      hp: calculateMaxHp(end, lck, level),
      defense: calculateDefense(agi),
      initiative: calculateInitiative(per, agi),
      meleeDamageBonus: calculateMeleeDamageBonus(str),
      maxLuckPoints: calculateMaxLuckPoints(lck),
      carryCapacity: calculateCarryCapacity(str),
    };
  }, [statBlockType, attributes, level]);

  // Sync derived stats into form state when normal type
  useEffect(() => {
    if (!derivedStats) return;
    setHp(derivedStats.hp);
    setDefense(derivedStats.defense);
    setInitiative(derivedStats.initiative);
    setMeleeDamageBonus(derivedStats.meleeDamageBonus);
    setMaxLuckPoints(derivedStats.maxLuckPoints);
    setCarryCapacity(derivedStats.carryCapacity);
  }, [derivedStats]);

  // Initialize attributes/skills when statBlockType changes
  useEffect(() => {
    if (editEntry) return; // Don't reset when editing
    if (statBlockType === 'creature') {
      setAttributes({ body: 5, mind: 5 });
      setSkills(CREATURE_SKILLS.map(s => ({ skill: s, rank: 0, isTagSkill: false })));
    } else {
      const attrs: Record<string, number> = {};
      SPECIAL_ATTRIBUTES.forEach(a => { attrs[a] = 5; });
      setAttributes(attrs);
      setSkills(SKILL_NAMES.map(s => ({ skill: s, rank: 0, isTagSkill: false })));
    }
  }, [statBlockType, editEntry]);

  // Populate form when editing
  useEffect(() => {
    if (!editEntry) {
      // Reset form for create mode
      setName('');
      setEmoji('');
      setDescription('');
      setCategory('human');
      setBodyType('humanoid');
      setStatBlockType('creature');
      setLevel(1);
      setXpReward(0);
      setHp(10);
      setDefense(1);
      setInitiative(0);
      setMeleeDamageBonus(0);
      setCarryCapacity(0);
      setMaxLuckPoints(0);
      setWealth(null);
      setAttacks([]);
      setAbilities([]);
      setInventoryItems([]);
      setDrMode('uniform');
      setDrEntries([{ location: 'all', drPhysical: 0, drEnergy: 0, drRadiation: 0, drPoison: 0 }]);
      return;
    }

    setName(editEntry.nameKey);
    setEmoji(editEntry.emoji ?? '');
    setDescription(editEntry.descriptionKey ?? '');
    setCategory(editEntry.category);
    setBodyType(editEntry.bodyType);
    setStatBlockType(editEntry.statBlockType);
    setLevel(editEntry.level);
    setXpReward(editEntry.xpReward);
    setHp(editEntry.hp);
    setDefense(editEntry.defense);
    setInitiative(editEntry.initiative);
    setMeleeDamageBonus(editEntry.meleeDamageBonus);
    setCarryCapacity(editEntry.carryCapacity);
    setMaxLuckPoints(editEntry.maxLuckPoints);
    setWealth(editEntry.wealth ?? null);
    setAttributes(editEntry.attributes);
    setSkills(editEntry.skills.map(s => ({ skill: s.skill, rank: s.rank, isTagSkill: s.isTagSkill })));

    // DR
    if (editEntry.dr.length === 1 && editEntry.dr[0].location === 'all') {
      setDrMode('uniform');
      setDrEntries(editEntry.dr);
    } else {
      setDrMode('detailed');
      setDrEntries(editEntry.dr);
    }

    // Attacks
    setAttacks(editEntry.attacks.map(a => ({
      name: a.nameKey,
      skill: a.skill,
      damage: a.damage,
      damageType: a.damageType,
      damageBonus: a.damageBonus ?? 0,
      fireRate: a.fireRate ?? 0,
      range: a.range,
      twoHanded: a.twoHanded,
      qualities: a.qualities.map(q => ({ quality: q.quality, value: q.value ?? undefined })),
    })));

    // Abilities
    setAbilities(editEntry.abilities.map(a => ({
      name: a.nameKey,
      description: a.descriptionKey,
    })));

    // Inventory
    setInventoryItems(editEntry.inventory.map(inv => ({
      itemId: inv.itemId,
      itemName: inv.item?.name ?? `Item #${inv.itemId}`,
      quantity: inv.quantity,
      equipped: inv.equipped,
    })));
  }, [editEntry]);

  // Load all items for inventory search
  useEffect(() => {
    if (!isOpen) return;
    itemsApi.getAllItems().then(data => {
      const all: { id: number; name: string; nameKey?: string; itemType: string }[] = [];
      for (const [, itemList] of Object.entries(data)) {
        if (Array.isArray(itemList)) {
          for (const item of itemList) {
            if (item.id && item.name) {
              all.push({ id: item.id, name: item.name, nameKey: item.nameKey, itemType: item.itemType ?? 'general' });
            }
          }
        }
      }
      setAllItems(all);
    }).catch(() => { /* ignore */ });
  }, [isOpen]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDrModeChange = (mode: 'uniform' | 'detailed') => {
    setDrMode(mode);
    if (mode === 'uniform') {
      setDrEntries([{ location: 'all', drPhysical: 0, drEnergy: 0, drRadiation: 0, drPoison: 0 }]);
    } else {
      setDrEntries(BODY_LOCATIONS.map(loc => ({ location: loc, drPhysical: 0, drEnergy: 0, drRadiation: 0, drPoison: 0 })));
    }
  };

  const handleItemSelect = (itemId: number, quantity: number) => {
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      const existing = inventoryItems.findIndex(inv => inv.itemId === itemId);
      if (existing >= 0) {
        const updated = [...inventoryItems];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + quantity };
        setInventoryItems(updated);
      } else {
        setInventoryItems(prev => [...prev, {
          itemId: item.id,
          itemName: resolveItemName(item),
          quantity,
          equipped: false,
        }]);
      }
    }
    setItemSelectorOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data: CreateBestiaryEntryData = {
        name: name.trim(),
        description: description.trim() || undefined,
        emoji: emoji.trim() || undefined,
        statBlockType,
        category,
        bodyType,
        level,
        xpReward,
        hp,
        defense,
        initiative,
        meleeDamageBonus,
        carryCapacity,
        maxLuckPoints,
        wealth,
        attributes,
        skills: skills.filter(s => s.rank > 0 || s.isTagSkill),
        dr: drEntries,
        attacks: attacks.map(a => ({
          name: a.name,
          skill: a.skill,
          damage: a.damage,
          damageType: a.damageType,
          damageBonus: a.damageBonus || undefined,
          fireRate: a.fireRate || undefined,
          range: a.range,
          twoHanded: a.twoHanded,
          qualities: a.qualities,
        })),
        abilities: abilities.filter(a => a.name.trim()),
        inventory: inventoryItems.map(inv => ({
          itemId: inv.itemId,
          quantity: inv.quantity,
          equipped: inv.equipped,
        })),
      };
      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const resolveItemName = useCallback((item: { name: string; nameKey?: string }) => {
    if (item.nameKey) {
      const translated = t(item.nameKey);
      if (translated !== item.nameKey) return translated;
    }
    return item.name;
  }, [t]);

  const sectionHeader = (key: string, label: string) => (
    <button
      type="button"
      onClick={() => toggleSection(key)}
      className="flex items-center gap-2 w-full text-left text-vault-yellow font-bold text-sm uppercase tracking-wide py-2"
    >
      {openSections[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      {label}
    </button>
  );

  const inputClass = 'w-full bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-3 py-1.5 text-sm placeholder:text-vault-yellow-dark/60 focus:border-vault-yellow outline-none';
  const selectClass = 'bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-3 py-1.5 text-sm focus:border-vault-yellow outline-none';
  const numberClass = 'w-20 bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-2 py-1.5 text-sm text-center focus:border-vault-yellow outline-none';
  const labelClass = 'text-xs text-gray-400 block mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('bestiary.form.editTitle') : t('bestiary.form.createTitle')}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

        {/* === IDENTITY === */}
        {sectionHeader('identity', t('bestiary.form.sectionIdentity'))}
        {openSections.identity && (
          <div className="space-y-3 pl-6">
            <div>
              <label className={labelClass}>{t('bestiary.form.name')} *</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder={t('bestiary.form.namePlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('bestiary.form.emoji')}</label>
                <EmojiPickerInput value={emoji} onChange={setEmoji} placeholder={t('bestiary.form.emojiPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('bestiary.form.statBlockType')}</label>
                <select className={`${selectClass} w-full`} value={statBlockType} onChange={e => setStatBlockType(e.target.value as StatBlockType)}>
                  {STAT_BLOCK_TYPES.map(s => <option key={s} value={s}>{t(`bestiary.statBlockTypes.${s}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('bestiary.form.category')}</label>
                <select className={`${selectClass} w-full`} value={category} onChange={e => setCategory(e.target.value as CreatureCategory)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`bestiary.categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('bestiary.form.bodyType')}</label>
                <select className={`${selectClass} w-full`} value={bodyType} onChange={e => setBodyType(e.target.value as BodyType)}>
                  {BODY_TYPES.map(b => <option key={b} value={b}>{t(`bestiary.bodyTypes.${b}`)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('bestiary.form.description')}</label>
              <textarea className={`${inputClass} h-16 resize-none`} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('bestiary.form.descriptionPlaceholder')} />
            </div>
          </div>
        )}

        {/* === BASE STATS === */}
        {sectionHeader('stats', t('bestiary.form.sectionStats'))}
        {openSections.stats && (
          <div className="pl-6 space-y-4">
            {/* Common editable stats */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>{t('bestiary.form.level')}</label>
                <input type="number" className={numberClass} value={level} onChange={e => setLevel(+e.target.value)} min={0} />
              </div>
              <div>
                <label className={labelClass}>{t('bestiary.form.xpReward')}</label>
                <input type="number" className={numberClass} value={xpReward} onChange={e => setXpReward(+e.target.value)} min={0} />
              </div>
              <div>
                <label className={labelClass}>{t('bestiary.form.wealth')}</label>
                <input type="number" className={numberClass} value={wealth ?? ''} onChange={e => setWealth(e.target.value === '' ? null : +e.target.value)} min={0} />
              </div>
            </div>

            {statBlockType === 'normal' && derivedStats ? (
              /* Derived stats — auto-calculated, read-only display with icons */
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Heart size={20} style={{ color: 'var(--color-special-endurance)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.hp')}</span>
                    <span className="text-white font-bold">{derivedStats.hp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Shield size={20} style={{ color: 'var(--color-special-agility)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.defense')}</span>
                    <span className="text-white font-bold">{derivedStats.defense}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Zap size={20} style={{ color: 'var(--color-special-perception)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.initiative')}</span>
                    <span className="text-white font-bold">{derivedStats.initiative}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Swords size={20} style={{ color: 'var(--color-special-strength)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.meleeDamageBonus')}</span>
                    <span className="text-white font-bold">+{derivedStats.meleeDamageBonus} CD</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Sparkles size={20} style={{ color: 'var(--color-special-luck)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.maxLuckPoints')}</span>
                    <span className="text-white font-bold">{derivedStats.maxLuckPoints}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Package size={20} style={{ color: 'var(--color-special-charisma)' }} />
                  <div>
                    <span className="text-xs text-gray-400 block">{t('bestiary.form.carryCapacity')}</span>
                    <span className="text-white font-bold">{derivedStats.carryCapacity} {t('common.labels.lbs')}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Creature stats — all editable */
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>{t('bestiary.form.hp')}</label>
                  <input type="number" className={numberClass} value={hp} onChange={e => setHp(+e.target.value)} min={1} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.defense')}</label>
                  <input type="number" className={numberClass} value={defense} onChange={e => setDefense(+e.target.value)} min={0} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.initiative')}</label>
                  <input type="number" className={numberClass} value={initiative} onChange={e => setInitiative(+e.target.value)} min={0} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.meleeDamageBonus')}</label>
                  <input type="number" className={numberClass} value={meleeDamageBonus} onChange={e => setMeleeDamageBonus(+e.target.value)} min={0} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.carryCapacity')}</label>
                  <input type="number" className={numberClass} value={carryCapacity} onChange={e => setCarryCapacity(+e.target.value)} min={0} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.maxLuckPoints')}</label>
                  <input type="number" className={numberClass} value={maxLuckPoints} onChange={e => setMaxLuckPoints(+e.target.value)} min={0} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* === ATTRIBUTES === */}
        {sectionHeader('attributes', t('bestiary.form.sectionAttributes'))}
        {openSections.attributes && (
          <div className="pl-6 space-y-1">
            {statBlockType === 'normal' ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {SPECIAL_ATTRIBUTES.map(attr => (
                  <SpecialInput
                    key={attr}
                    label={t(`special.${attr}`)}
                    value={attributes[attr] ?? 5}
                    onChange={val => setAttributes(prev => ({ ...prev, [attr]: val }))}
                    min={1}
                    max={10}
                    color={SPECIAL_COLORS[attr]}
                  />
                ))}
              </div>
            ) : (
              CREATURE_ATTRIBUTES.map(attr => (
                <SpecialInput
                  key={attr}
                  label={t(`bestiary.creatureAttributes.${attr}`)}
                  value={attributes[attr] ?? 5}
                  onChange={val => setAttributes(prev => ({ ...prev, [attr]: val }))}
                  min={0}
                  max={20}
                  color={CREATURE_ATTR_COLORS[attr]}
                />
              ))
            )}
          </div>
        )}

        {/* === SKILLS === */}
        {sectionHeader('skills', t('bestiary.form.sectionSkills'))}
        {openSections.skills && (
          <div className="pl-6">
            {statBlockType === 'normal' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skills.map((s, i) => {
                  const linkedAttr = SKILL_ATTRIBUTES[s.skill as keyof typeof SKILL_ATTRIBUTES];
                  const attrValue = linkedAttr ? (attributes[linkedAttr] ?? 0) : 0;
                  const tn = attrValue + s.rank;

                  return (
                    <div
                      key={s.skill}
                      className={`flex items-center gap-2 p-2 rounded ${
                        s.isTagSkill ? 'bg-vault-blue border border-vault-yellow-dark' : 'bg-gray-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...skills];
                          updated[i] = { ...updated[i], isTagSkill: !updated[i].isTagSkill };
                          setSkills(updated);
                        }}
                        className={`p-1 rounded transition-colors ${
                          s.isTagSkill ? 'text-vault-yellow' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Star size={16} fill={s.isTagSkill ? 'currentColor' : 'none'} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block truncate ${s.isTagSkill ? 'text-vault-yellow font-bold' : 'text-white'}`}>
                          {t(`skills.${s.skill}`)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {linkedAttr ? t(`special.${linkedAttr}`).substring(0, 3).toUpperCase() : ''} | TN: {tn}
                        </span>
                      </div>
                      <select
                        value={s.rank}
                        onChange={e => {
                          const updated = [...skills];
                          updated[i] = { ...updated[i], rank: +e.target.value };
                          setSkills(updated);
                        }}
                        className="w-14 px-1 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm text-center"
                      >
                        {Array.from({ length: 7 }, (_, r) => r).map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {skills.map((s, i) => (
                  <div key={s.skill} className="flex items-center gap-2 bg-vault-blue/30 rounded px-3 py-2">
                    <span className="text-sm text-gray-300 flex-1">
                      {t(`bestiary.creatureSkills.${s.skill}`)}
                    </span>
                    <input
                      type="number"
                      className="w-14 bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-1 py-1 text-center text-sm focus:border-vault-yellow outline-none"
                      value={s.rank}
                      onChange={e => {
                        const updated = [...skills];
                        updated[i] = { ...updated[i], rank: +e.target.value };
                        setSkills(updated);
                      }}
                      min={0}
                      max={6}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === DR === */}
        {sectionHeader('dr', t('bestiary.form.sectionDr'))}
        {openSections.dr && (
          <div className="pl-6 space-y-2">
            {statBlockType === 'creature' && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleDrModeChange('uniform')}
                  className={`px-2 py-1 rounded text-xs ${drMode === 'uniform' ? 'bg-vault-yellow text-vault-blue' : 'bg-vault-blue text-vault-yellow-dark border border-vault-yellow-dark'}`}
                >
                  {t('bestiary.form.drUniform')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDrModeChange('detailed')}
                  className={`px-2 py-1 rounded text-xs ${drMode === 'detailed' ? 'bg-vault-yellow text-vault-blue' : 'bg-vault-blue text-vault-yellow-dark border border-vault-yellow-dark'}`}
                >
                  {t('bestiary.form.drDetailed')}
                </button>
              </div>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-vault-yellow-dark">
                  <th className="text-left py-1 w-24"></th>
                  <th className="text-center py-1">{t('bestiary.physical')}</th>
                  <th className="text-center py-1">{t('bestiary.energy')}</th>
                  <th className="text-center py-1">{t('bestiary.radiation')}</th>
                  <th className="text-center py-1">{t('bestiary.poison')}</th>
                </tr>
              </thead>
              <tbody>
                {drEntries.map((dr, i) => (
                  <tr key={dr.location}>
                    <td className="text-gray-300 py-1">{t(`bestiary.bodyLocations.${dr.location}`)}</td>
                    {(['drPhysical', 'drEnergy', 'drRadiation', 'drPoison'] as const).map(field => (
                      <td key={field} className="text-center py-1">
                        <input
                          type="number"
                          className="w-12 bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-1 py-0.5 text-center text-xs focus:border-vault-yellow outline-none"
                          value={dr[field]}
                          onChange={e => {
                            const updated = [...drEntries];
                            updated[i] = { ...updated[i], [field]: +e.target.value };
                            setDrEntries(updated);
                          }}
                          min={-1}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === ATTACKS (creatures only) === */}
        {statBlockType === 'creature' && sectionHeader('attacks', t('bestiary.form.sectionAttacks'))}
        {statBlockType === 'creature' && openSections.attacks && (
          <div className="pl-6 space-y-3">
            {attacks.map((attack, ai) => (
              <div key={ai} className="bg-vault-blue/30 rounded p-3 space-y-2 relative">
                <button
                  type="button"
                  onClick={() => setAttacks(prev => prev.filter((_, j) => j !== ai))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackName')}</label>
                    <input className={inputClass} value={attack.name} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], name: e.target.value }; setAttacks(updated);
                    }} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackSkill')}</label>
                    <select className={`${selectClass} w-full`} value={attack.skill} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], skill: e.target.value }; setAttacks(updated);
                    }}>
                      {(statBlockType === 'creature' ? CREATURE_SKILLS : [...SKILL_NAMES]).map(s => (
                        <option key={s} value={s}>{statBlockType === 'creature' ? t(`bestiary.creatureSkills.${s}`) : t(`skills.${s}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackDamage')}</label>
                    <input type="number" className={numberClass} value={attack.damage} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], damage: +e.target.value }; setAttacks(updated);
                    }} min={0} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackDamageType')}</label>
                    <select className={`${selectClass} w-full text-xs`} value={attack.damageType} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], damageType: e.target.value }; setAttacks(updated);
                    }}>
                      {DAMAGE_TYPES.map(dt => <option key={dt} value={dt}>{t(`bestiary.damageTypeShort.${dt}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackFireRate')}</label>
                    <input type="number" className={numberClass} value={attack.fireRate} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], fireRate: +e.target.value }; setAttacks(updated);
                    }} min={0} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('bestiary.form.attackRange')}</label>
                    <select className={`${selectClass} w-full text-xs`} value={attack.range} onChange={e => {
                      const updated = [...attacks]; updated[ai] = { ...updated[ai], range: e.target.value }; setAttacks(updated);
                    }}>
                      {RANGES.map(r => <option key={r} value={r}>{t(`ranges.${r}`)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Qualities */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t('bestiary.qualities')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...attacks];
                        updated[ai] = { ...updated[ai], qualities: [...updated[ai].qualities, { quality: 'piercing', value: undefined }] };
                        setAttacks(updated);
                      }}
                      className="text-xs text-vault-yellow hover:text-vault-yellow-light flex items-center gap-1"
                    >
                      <Plus size={12} /> {t('bestiary.form.addQuality')}
                    </button>
                  </div>
                  {attack.qualities.map((q, qi) => (
                    <div key={qi} className="flex items-center gap-2">
                      <select
                        className={`${selectClass} flex-1 text-xs`}
                        value={q.quality}
                        onChange={e => {
                          const updated = [...attacks];
                          const qualities = [...updated[ai].qualities];
                          qualities[qi] = { ...qualities[qi], quality: e.target.value };
                          updated[ai] = { ...updated[ai], qualities };
                          setAttacks(updated);
                        }}
                      >
                        {WEAPON_QUALITIES.map(wq => <option key={wq} value={wq}>{t(`qualities.${wq}.name`)}</option>)}
                      </select>
                      <input
                        type="number"
                        className="w-12 bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-1 py-0.5 text-center text-xs"
                        placeholder="#"
                        value={q.value ?? ''}
                        onChange={e => {
                          const updated = [...attacks];
                          const qualities = [...updated[ai].qualities];
                          qualities[qi] = { ...qualities[qi], value: e.target.value === '' ? undefined : +e.target.value };
                          updated[ai] = { ...updated[ai], qualities };
                          setAttacks(updated);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...attacks];
                          updated[ai] = { ...updated[ai], qualities: updated[ai].qualities.filter((_, j) => j !== qi) };
                          setAttacks(updated);
                        }}
                        className="text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAttacks(prev => [...prev, createEmptyAttack()])}
              className="flex items-center gap-1 text-sm text-vault-yellow hover:text-vault-yellow-light"
            >
              <Plus size={16} /> {t('bestiary.form.addAttack')}
            </button>
          </div>
        )}

        {/* === ABILITIES === */}
        {sectionHeader('abilities', t('bestiary.form.sectionAbilities'))}
        {openSections.abilities && (
          <div className="pl-6 space-y-2">
            {abilities.map((ability, i) => (
              <div key={i} className="bg-vault-blue/30 rounded p-3 space-y-2 relative">
                <button
                  type="button"
                  onClick={() => setAbilities(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
                <div>
                  <label className={labelClass}>{t('bestiary.form.abilityName')}</label>
                  <input className={inputClass} value={ability.name} onChange={e => {
                    const updated = [...abilities]; updated[i] = { ...updated[i], name: e.target.value }; setAbilities(updated);
                  }} />
                </div>
                <div>
                  <label className={labelClass}>{t('bestiary.form.abilityDescription')}</label>
                  <textarea className={`${inputClass} h-14 resize-none`} value={ability.description} onChange={e => {
                    const updated = [...abilities]; updated[i] = { ...updated[i], description: e.target.value }; setAbilities(updated);
                  }} />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAbilities(prev => [...prev, { name: '', description: '' }])}
              className="flex items-center gap-1 text-sm text-vault-yellow hover:text-vault-yellow-light"
            >
              <Plus size={16} /> {t('bestiary.form.addAbility')}
            </button>
          </div>
        )}

        {/* === INVENTORY === */}
        {sectionHeader('inventory', t('bestiary.form.sectionInventory'))}
        {openSections.inventory && (
          <div className="pl-6 space-y-2">
            <button
              type="button"
              onClick={() => setItemSelectorOpen(true)}
              className="flex items-center gap-1 text-sm text-vault-yellow hover:text-vault-yellow-light"
            >
              <Plus size={16} /> {t('inventory.addItem')}
            </button>

            {/* Inventory items */}
            {inventoryItems.map((inv, i) => (
              <div key={i} className="flex items-center gap-2 bg-vault-blue/30 rounded px-3 py-1.5">
                <span className="text-sm text-gray-300 flex-1 truncate">{inv.itemName}</span>
                <input
                  type="number"
                  className="w-12 bg-vault-blue border border-vault-yellow-dark text-vault-yellow rounded px-1 py-0.5 text-center text-xs"
                  value={inv.quantity}
                  onChange={e => {
                    const updated = [...inventoryItems];
                    updated[i] = { ...updated[i], quantity: Math.max(1, +e.target.value) };
                    setInventoryItems(updated);
                  }}
                  min={1}
                />
                <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inv.equipped}
                    onChange={e => {
                      const updated = [...inventoryItems];
                      updated[i] = { ...updated[i], equipped: e.target.checked };
                      setInventoryItems(updated);
                    }}
                    className="w-3 h-3 accent-vault-yellow"
                  />
                  E
                </label>
                <button
                  type="button"
                  onClick={() => setInventoryItems(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* === SAVE / CANCEL === */}
        <div className="flex gap-3 pt-4 border-t border-vault-yellow-dark">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded bg-vault-gray border border-vault-yellow-dark text-vault-yellow-dark hover:text-vault-yellow hover:border-vault-yellow text-sm"
          >
            {t('bestiary.form.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2 rounded bg-vault-yellow text-vault-blue font-bold text-sm hover:bg-vault-yellow-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '...' : t('bestiary.form.save')}
          </button>
        </div>
      </div>

      <ItemSelector
        isOpen={itemSelectorOpen}
        onClose={() => setItemSelectorOpen(false)}
        onSelect={handleItemSelect}
      />
    </Modal>
  );
}
