import type { CombatantStatus, Condition } from './character';

export type SessionStatus = 'active' | 'paused' | 'completed';

export type InjuryZone = 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight';
export type InjuryType =
  | 'arm_broken_left'
  | 'arm_broken_right'
  | 'leg_broken'
  | 'torso_bleeding'
  | 'head_dazed';

export interface Injury {
  id: number;
  characterId: number;
  sessionId: number | null;
  zone: InjuryZone;
  injuryType: InjuryType;
  appliedAtRound: number | null;
  healedAt: string | null;
  createdAt: string;
}

export interface ParticipantCharacter {
  id: number;
  name: string;
  type: 'pc' | 'npc';
  level: number;
  originId?: string;
  maxHp: number;
  currentHp: number;
  defense: number;
  initiative: number;
  radiationDamage: number;
  maxLuckPoints: number;
  currentLuckPoints: number;
  special: Record<string, number>;
  conditions: Condition[];
}

export interface Participant {
  id: number;
  sessionId: number;
  characterId: number;
  turnOrder: number | null;
  combatStatus: CombatantStatus;
  isAlly: boolean;
  temporaryActive: boolean;
  skipNormalActions: boolean;
  injuries: Injury[];
  character: ParticipantCharacter;
}

export interface Session {
  id: number;
  name: string;
  description?: string;
  status: SessionStatus;
  groupAP: number;
  maxGroupAP: number;
  gmAP: number;
  combatActive: boolean;
  currentRound: number;
  currentTurnIndex: number;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
}

export interface CreateSessionData {
  name: string;
  description?: string;
  maxGroupAP?: number;
}

export interface UpdateSessionData {
  name?: string;
  description?: string;
  status?: SessionStatus;
  groupAP?: number;
  maxGroupAP?: number;
}

export interface AddQuickNpcData {
  name?: string;
  level?: number;
  maxHp?: number;
  defense?: number;
  initiative?: number;
}
