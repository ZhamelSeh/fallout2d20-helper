// front/src/domain/rules/injuryRules.ts
import type { BodyLocation } from '../models/shared';

export type InjuryType =
  | 'arm_broken_left'
  | 'arm_broken_right'
  | 'leg_broken'
  | 'torso_bleeding'
  | 'head_dazed';

export type InjuryEffectFlag =
  | 'dropHeldItem:left'
  | 'dropHeldItem:right'
  | 'disableArm:left'
  | 'disableArm:right'
  | 'applyProne'
  | 'disableSprint'
  | 'moveBecomesMajor'
  | 'endOfTurnDamage:2:physical:ignoresDR'
  | 'skipNormalActionsNextTurn'
  | 'sightTestsPenalty:2';

export interface InjuryDefinition {
  type: InjuryType;
  i18nNameKey: string;
  i18nRuleKey: string;
  effects: InjuryEffectFlag[];
}

// Note: BodyLocation in shared.ts does not include 'all' (that's RobotLocation).
// So this Record covers all 6 targetable body locations.
export const INJURY_BY_ZONE: Record<BodyLocation, InjuryDefinition> = {
  head: {
    type: 'head_dazed',
    i18nNameKey: 'combat.injury.head_dazed.name',
    i18nRuleKey: 'combat.injury.head_dazed.rule',
    effects: ['skipNormalActionsNextTurn', 'sightTestsPenalty:2'],
  },
  torso: {
    type: 'torso_bleeding',
    i18nNameKey: 'combat.injury.torso_bleeding.name',
    i18nRuleKey: 'combat.injury.torso_bleeding.rule',
    effects: ['endOfTurnDamage:2:physical:ignoresDR'],
  },
  armLeft: {
    type: 'arm_broken_left',
    i18nNameKey: 'combat.injury.arm_broken_left.name',
    i18nRuleKey: 'combat.injury.arm_broken_left.rule',
    effects: ['dropHeldItem:left', 'disableArm:left'],
  },
  armRight: {
    type: 'arm_broken_right',
    i18nNameKey: 'combat.injury.arm_broken_right.name',
    i18nRuleKey: 'combat.injury.arm_broken_right.rule',
    effects: ['dropHeldItem:right', 'disableArm:right'],
  },
  legLeft: {
    type: 'leg_broken',
    i18nNameKey: 'combat.injury.leg_broken.name',
    i18nRuleKey: 'combat.injury.leg_broken.rule',
    effects: ['applyProne', 'disableSprint', 'moveBecomesMajor'],
  },
  legRight: {
    type: 'leg_broken',
    i18nNameKey: 'combat.injury.leg_broken.name',
    i18nRuleKey: 'combat.injury.leg_broken.rule',
    effects: ['applyProne', 'disableSprint', 'moveBecomesMajor'],
  },
};

export const INJURY_THRESHOLD_DAMAGE = 5;
