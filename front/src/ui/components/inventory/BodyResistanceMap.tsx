import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import type { InventoryItemApi, CharacterDrApi } from '../../../services/api';
import { damageTypeColor, damageTypeIcon } from '../../../domain/rules/damageTypes';
import { computeBodyDR, type BodyLocation } from '../../../domain/rules/bodyResistance';

interface BodyResistanceMapProps {
  inventory: InventoryItemApi[];
  showPoison?: boolean;
  originId?: string;
  onPieceHpChange?: (inventoryId: number, newHp: number) => void;
  /** Fixed DR for NPCs — when provided, displays these values directly instead of calculating from inventory */
  fixedDr?: CharacterDrApi[];
}

// Hit location ranges for reference
const HIT_LOCATIONS: Record<BodyLocation, string> = {
  head: '1-2',
  torso: '3-8',
  armLeft: '9-11',
  armRight: '12-14',
  legLeft: '15-17',
  legRight: '18-20',
};

export function BodyResistanceMap({ inventory, showPoison = false, originId, onPieceHpChange, fixedDr }: BodyResistanceMapProps) {
  const { t } = useTranslation();
  const isMisterHandy = originId === 'misterHandy';
  const isFixedDr = fixedDr && fixedDr.length > 0;

  // Calculate DR for each body location based on equipped items (or use fixedDr for NPCs)
  const locationDR = useMemo(() => {
    return computeBodyDR({ inventory, fixedDr });
  }, [inventory, fixedDr]);

  // Handle HP change for power armor pieces
  const handleHpChange = (inventoryId: number, currentHp: number, maxHp: number, delta: number) => {
    if (!onPieceHpChange) return;
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));
    onPieceHpChange(inventoryId, newHp);
  };

  const getLabel = (location: BodyLocation): string => {
    if (isMisterHandy) {
      return t(`bodyLocations.misterHandy.${location}`);
    }
    return t(`bodyLocations.${location}`);
  };

  // Format a DR value — handle -1 as "Imm." (immune)
  const formatDrValue = (value: number): string => {
    if (value === -1) return t('bodyResistance.immune', 'Imm.');
    return String(value);
  };

  const getDrColor = (value: number, normalColor: string): string => {
    if (value === -1) return 'text-purple-400';
    if (value > 0) return normalColor;
    return 'text-gray-600';
  };

  // Render a single location box
  const LocationBox = ({ location }: { location: BodyLocation }) => {
    const data = locationDR[location];
    const hasValues = data.physical > 0 || data.physical === -1 || data.energy > 0 || data.energy === -1 || data.radiation > 0 || data.radiation === -1;
    const hasPowerArmor = !isFixedDr && data.paMaxHp !== undefined;
    const isDamaged = !isFixedDr && data.paDamaged;
    const showPoisonCell = isFixedDr || showPoison;

    return (
      <div className={`bg-vault-gray border rounded-lg overflow-hidden ${
        isDamaged ? 'border-red-600 opacity-60' :
        hasValues ? 'border-vault-yellow-dark' : 'border-gray-700'
      }`}>
        {/* Header */}
        <div className={`px-2 py-1 text-center ${isDamaged ? 'bg-red-900' : 'bg-vault-blue'}`}>
          <span className={`text-xs font-bold uppercase ${isDamaged ? 'text-red-400' : 'text-vault-yellow'}`}>
            {getLabel(location)}
          </span>
          <span className={`text-xs ml-1 ${isDamaged ? 'text-red-600' : 'text-vault-yellow-dark'}`}>
            ({HIT_LOCATIONS[location]})
          </span>
        </div>

        {/* DR Grid */}
        <div className="p-2 grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between">
            <span className={`flex items-center gap-1 ${damageTypeColor('physical')}`}>
              {(() => { const I = damageTypeIcon('physical'); return I ? <I size={12} /> : null; })()}
              <span className="text-gray-400">{t('bodyResistance.drPhysical')}</span>
            </span>
            <span className={`font-mono font-bold ${
              isDamaged ? 'text-gray-600 line-through' : getDrColor(data.physical, damageTypeColor('physical'))
            }`}>
              {formatDrValue(data.physical)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={`flex items-center gap-1 ${damageTypeColor('radiation')}`}>
              {(() => { const I = damageTypeIcon('radiation'); return I ? <I size={12} /> : null; })()}
              <span className="text-gray-400">{t('bodyResistance.drRadiation')}</span>
            </span>
            <span className={`font-mono font-bold ${
              isDamaged ? 'text-gray-600 line-through' : getDrColor(data.radiation, damageTypeColor('radiation'))
            }`}>
              {formatDrValue(data.radiation)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={`flex items-center gap-1 ${damageTypeColor('energy')}`}>
              {(() => { const I = damageTypeIcon('energy'); return I ? <I size={12} /> : null; })()}
              <span className="text-gray-400">{t('bodyResistance.drEnergy')}</span>
            </span>
            <span className={`font-mono font-bold ${
              isDamaged ? 'text-gray-600 line-through' : getDrColor(data.energy, damageTypeColor('energy'))
            }`}>
              {formatDrValue(data.energy)}
            </span>
          </div>

          {/* Power Armor HP or Poison DR */}
          {hasPowerArmor ? (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('bodyResistance.hp')}</span>
              <span className={`font-mono font-bold ${
                isDamaged ? 'text-red-500' :
                (data.paCurrentHp ?? 0) < (data.paMaxHp ?? 0) ? 'text-orange-400' : 'text-green-400'
              }`}>
                {data.paCurrentHp ?? data.paMaxHp}/{data.paMaxHp}
              </span>
            </div>
          ) : showPoisonCell ? (
            <div className="flex justify-between">
              <span className={`flex items-center gap-1 ${damageTypeColor('poison')}`}>
                {(() => { const I = damageTypeIcon('poison'); return I ? <I size={12} /> : null; })()}
                <span className="text-gray-400">{t('bodyResistance.drPoison')}</span>
              </span>
              <span className={`font-mono font-bold ${getDrColor(data.poison, damageTypeColor('poison'))}`}>
                {formatDrValue(data.poison)}
              </span>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Power Armor HP Controls */}
        {hasPowerArmor && onPieceHpChange && data.paInventoryId && (
          <div className="px-2 pb-2 flex items-center justify-center gap-1 border-t border-gray-700 pt-2">
            {isDamaged && (
              <AlertTriangle size={14} className="text-red-500 mr-1" />
            )}
            <button
              type="button"
              onClick={() => handleHpChange(data.paInventoryId!, data.paCurrentHp ?? data.paMaxHp!, data.paMaxHp!, -1)}
              disabled={data.paCurrentHp === 0}
              className="p-1 text-red-400 hover:bg-red-900/30 active:bg-red-900/50 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleHpChange(data.paInventoryId!, data.paCurrentHp ?? data.paMaxHp!, data.paMaxHp!, 1)}
              disabled={(data.paCurrentHp ?? data.paMaxHp) === data.paMaxHp}
              className="p-1 text-green-400 hover:bg-green-900/30 active:bg-green-900/50 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {/* Damaged indicator */}
        {isDamaged && (
          <div className="bg-red-900/50 px-2 py-1 text-center">
            <span className="text-red-400 text-xs font-bold uppercase">
              {t('bodyResistance.damaged')}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isMisterHandy) {
    return (
      <div className="space-y-3">
        {/* Optique - centered top */}
        <div className="flex justify-center">
          <div className="w-48">
            <LocationBox location="head" />
          </div>
        </div>

        {/* Bras 1 | Bras 2 */}
        <div className="grid grid-cols-2 gap-2">
          <LocationBox location="armLeft" />
          <LocationBox location="armRight" />
        </div>

        {/* Corps - centered */}
        <div className="flex justify-center">
          <div className="w-48">
            <LocationBox location="torso" />
          </div>
        </div>

        {/* Bras 3 | Propulseur */}
        <div className="grid grid-cols-2 gap-2">
          <LocationBox location="legLeft" />
          <LocationBox location="legRight" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Head - centered */}
      <div className="flex justify-center">
        <div className="w-32">
          <LocationBox location="head" />
        </div>
      </div>

      {/* Arms and Torso row */}
      <div className="grid grid-cols-3 gap-2">
        <LocationBox location="armLeft" />
        <LocationBox location="torso" />
        <LocationBox location="armRight" />
      </div>

      {/* Legs row */}
      <div className="grid grid-cols-3 gap-2">
        <LocationBox location="legLeft" />
        <div /> {/* Empty center */}
        <LocationBox location="legRight" />
      </div>
    </div>
  );
}
