import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '../../../services/api';
import {
  computeSurvivalDifficulty,
  resolveSurvivalTestFromManualInput,
  resolveSurvivalTestFromAppRoll,
  type SurvivalTestResult,
} from '../../../domain/rules/dyingRules';

interface DyingSurvivalTestProps {
  mourant: SessionParticipantApi;
  onSubmit: (result: SurvivalTestResult) => Promise<void>;
  onStabilize: () => Promise<void>;
}

export function DyingSurvivalTest({ mourant, onSubmit, onStabilize }: DyingSurvivalTestProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'app' | 'manual'>('app');
  const [manual, setManual] = useState({ successes: 0, complication: false });
  const [result, setResult] = useState<SurvivalTestResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const difficulty = computeSurvivalDifficulty(mourant.injuries ?? []);
  const c = mourant.character as any;
  const enduranceStat = c.special?.endurance ?? c.endurance ?? 5;
  const survivalSkill = (c.skills ?? []).find((s: any) => s.skill === 'survival' || s.name === 'survival')?.rank ?? 0;
  const tn = enduranceStat + survivalSkill;

  const runAppRoll = () => {
    const r = resolveSurvivalTestFromAppRoll({ tn, focus: 1, difficulty });
    setResult(r);
  };

  const runManual = () => {
    const r = resolveSurvivalTestFromManualInput({
      successes: manual.successes,
      difficulty,
      complication: manual.complication,
    });
    setResult(r);
  };

  const handleSubmit = async () => {
    if (!result) return;
    setSubmitted(true);
    await onSubmit(result);
  };

  return (
    <div className="border-2 border-red-700 bg-red-950/30 p-4 rounded">
      <h3 className="text-red-400 font-bold mb-2">💀 {t('combat.dying.title')}</h3>
      <div className="text-sm text-zinc-300 mb-3 space-y-1">
        <div>{t('combat.dying.injuries')}: <b>{difficulty}</b></div>
        <div>{t('combat.dying.tn')}: <b>{tn}</b> (Endurance {enduranceStat} + Survival {survivalSkill})</div>
        <div>{t('combat.dying.difficulty')}: <b>{difficulty}</b></div>
        <div className="text-xs text-zinc-500">{t('combat.dying.complicationRange')}: 19–20</div>
      </div>

      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => setMode('app')} className={`text-xs px-3 py-1 rounded ${mode === 'app' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
          🎲 {t('combat.attackFlow.rollApp')}
        </button>
        <button type="button" onClick={() => setMode('manual')} className={`text-xs px-3 py-1 rounded ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
          ✏ {t('combat.attackFlow.manual')}
        </button>
      </div>

      {mode === 'manual' && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <label className="text-zinc-400">Succès</label>
            <input type="number" value={manual.successes} onChange={e => setManual(m => ({ ...m, successes: +e.target.value }))} className="w-full bg-zinc-800 rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-zinc-400">Complication ?</label>
            <input type="checkbox" checked={manual.complication} onChange={e => setManual(m => ({ ...m, complication: e.target.checked }))} />
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button type="button" onClick={mode === 'app' ? runAppRoll : runManual} disabled={submitted} className="text-xs px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50">
          {t('combat.dying.roll')}
        </button>
        <button type="button" onClick={onStabilize} className="text-xs px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 ml-auto">
          🩹 {t('combat.dying.stabilize')}
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 p-3 rounded text-sm space-y-1">
          {result.d20Rolls && (
            <div className="font-mono text-xs text-zinc-400">
              d20: {result.d20Rolls.join(', ')} · {t('combat.dying.successes')}: {result.successes}
            </div>
          )}
          <div className={result.success ? 'text-green-400' : 'text-red-400'}>
            {result.success ? `✓ ${t('combat.dying.survived')}` : `✗ ${t('combat.dying.died')}`}
          </div>
          {result.complication && <div className="text-yellow-400">⚠ {t('combat.dying.complication')}</div>}
          {!submitted && (
            <button type="button" onClick={handleSubmit} className="mt-2 text-xs px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800">
              {t('combat.dying.apply')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
