
import { Position, UnitClass, UnitStats } from "./types";

export const GRID_ROWS = 13;
export const GRID_COLS = 19;
export const RIVER_X = 9;
export const P1_HQ: Position = { x: 1, y: 6 };
export const P2_HQ: Position = { x: 17, y: 6 };
export const COMMAND_TOWERS: Position[] = [{ x: 0, y: 6 }, { x: 18, y: 6 }];

export const UNIT_STATS: Record<UnitClass, UnitStats> = {
  SNIPER: {
    name: '狙击手',
    maxHp: 100,
    maxAp: 3,
    range: 6,
    damage: 15,
    description: "目标血量<50%时造成双倍暴击。击杀会降低敌方士气。"
  },
  ARMOR: {
    name: '装甲兵',
    maxHp: 100,
    maxAp: 2,
    range: 3,
    damage: 25,
    description: "攻击禁锢敌人。自身受到的伤害减少10点。"
  },
  MACHINE_GUN: {
    name: '机枪兵',
    maxHp: 100,
    maxAp: 2,
    range: 4,
    damage: 15,
    description: "直线范围攻击。对路径上所有单位造成伤害。"
  },
  ARTILLERY: {
    name: '炮兵',
    maxHp: 100,
    maxAp: 3,
    range: 5,
    damage: 15,
    description: "造成十字形溅射伤害。射击后本回合无法移动。"
  },
  SCOUT: {
    name: '侦察兵',
    maxHp: 100,
    maxAp: 4,
    range: 3,
    damage: 10,
    description: "攻击减速敌人。自身高血量时拥有更高行动力。"
  },
  MEDIC: {
    name: '医疗兵',
    maxHp: 100,
    maxAp: 3,
    range: 2,
    damage: 0, // Heals 20
    description: "治疗友军。溢出的治疗量会恢复自身血量。"
  }
};

export const ALL_UNIT_TYPES: UnitClass[] = ['SNIPER', 'ARMOR', 'MACHINE_GUN', 'ARTILLERY', 'SCOUT', 'MEDIC'];

// Initial template placeholder, actual generation logic is in utils
export const TRENCH_TEMPLATES: Position[][] = [];
