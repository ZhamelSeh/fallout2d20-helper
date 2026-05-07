import { rollD20s, countD20Successes } from './dice';
import type { CharacterInjuryApi } from '../../services/api';

export function computeSurvivalDifficulty(injuries: CharacterInjuryApi[]): number {
  return injuries.filter(i => !i.healedAt).length;
}

export function computeDyingInjuryCount(input: { wasCritical: boolean }): 1 | 2 {
  return input.wasCritical ? 2 : 1;
}

export interface SurvivalManualInput {
  successes: number;
  difficulty: number;
  complication: boolean;
}

export interface SurvivalAppRollInput {
  tn: number;
  focus: number;
  difficulty: number;
}

export interface SurvivalTestResult {
  success: boolean;
  died: boolean;
  complication: boolean;
  d20Rolls?: number[];
  successes?: number;
}

export function resolveSurvivalTestFromManualInput(input: SurvivalManualInput): SurvivalTestResult {
  const success = input.successes >= input.difficulty;
  return {
    success,
    died: !success,
    complication: input.complication,
  };
}

export function resolveSurvivalTestFromAppRoll(input: SurvivalAppRollInput): SurvivalTestResult {
  const d20Rolls = rollD20s(2);
  const successes = countD20Successes(d20Rolls, input.tn, input.focus);
  const complication = d20Rolls.some(r => r >= 19);
  const success = successes >= input.difficulty;
  return {
    success,
    died: !success,
    complication,
    d20Rolls,
    successes,
  };
}
