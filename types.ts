
export type PlayerId = 'P1' | 'P2';
export type TimeOfDay = 'DAY' | 'NIGHT';
export type UnitClass = 'SNIPER' | 'ARMOR' | 'MACHINE_GUN' | 'ARTILLERY' | 'SCOUT' | 'MEDIC';
export type UnitStatus = 'ACTIVE' | 'GARRISONED' | 'RECOVERING' | 'DONE';

export interface Position {
  x: number;
  y: number;
}

export interface UnitStats {
  maxHp: number;
  maxAp: number;
  range: number;
  damage: number;
  name: string;
  description: string;
}

export interface Unit {
  id: string;
  type: UnitClass;
  owner: PlayerId;
  pos: Position;
  startPos: Position; // The specific tile in safe zone this unit belongs to
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number; // Can be modified by buffs
  assignedTime: TimeOfDay;
  status: UnitStatus;
  recoveryTurns: number;
  buffs: Buff[];
  // Specific tracking
  hasMovedAcrossRiver: boolean; // For attack restriction
  hasAttacked: boolean; // Limits to 1 attack per turn
  hasMovedThisTurn: boolean; // Tracks if unit moved before attacking
  isResting: boolean;
}

export interface Buff {
  id: string;
  type: 'ROOT' | 'SLOW' | 'MORALE_DOWN' | 'SUPPLY_SHORTAGE';
  duration: number; // Turns remaining
  value?: number; // e.g., stacks or magnitude
}

export type GamePhase = 
  | 'SETUP_DRAFT'
  | 'SETUP_PLACEMENT' 
  | 'SETUP_TRENCH_SELECT' // New: Blind selection
  | 'SETUP_TRENCH_PLACE'  // New: Turn based placement
  | 'GAME_LOOP' 
  | 'GAME_OVER';

export interface GameState {
  phase: GamePhase;
  turn: number;
  timeOfDay: TimeOfDay;
  units: Unit[];
  trenches: Position[]; // Array of trench coordinates
  p1MoraleStack: number;
  p2MoraleStack: number;
  currentTurnPlayer: PlayerId | null; // Null during auto-adjustment
  winner: PlayerId | 'DRAW' | null;
  logs: string[];
  
  // Setup phase specific
  p1DayUnits: UnitClass[];
  p1NightUnits: UnitClass[];
  p2DayUnits: UnitClass[];
  p2NightUnits: UnitClass[];
  
  // Placement
  placementQueue: Unit[]; // Units waiting to be placed
  
  // Trench Logic
  trenchOptions: Position[][]; // The 4 random shapes currently available
  p1SelectedTrench: number | null; // Index of option
  p2SelectedTrench: number | null; // Index of option
  setupStep: 'P1_DRAFT' | 'P2_DRAFT' | 'P1_PLACE' | 'P2_PLACE' | 'P1_SELECT_TRENCH' | 'P2_SELECT_TRENCH' | 'P1_PLACE_TRENCH' | 'P2_PLACE_TRENCH' | 'DONE';
}

export interface CombatResult {
  damage: number;
  isKill: boolean;
  isCritical: boolean;
  splashTargets?: Position[];
  healedAmount?: number;
}
