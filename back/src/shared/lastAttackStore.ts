export interface LastAttackSnapshot {
  sessionId: number;
  attackerId: number;
  targetCharacterId: number;
  targetHpBefore: number;
  targetCombatStatusBefore: string;
  createdInjuryIds: number[];
  createdConditionIds: number[];
  attackerApBefore?: number;
  timestamp: number;
}

const store = new Map<number, LastAttackSnapshot>();

export function saveLastAttack(snap: LastAttackSnapshot) {
  store.set(snap.sessionId, snap);
}

export function getLastAttack(sessionId: number): LastAttackSnapshot | undefined {
  return store.get(sessionId);
}

export function clearLastAttack(sessionId: number) {
  store.delete(sessionId);
}
