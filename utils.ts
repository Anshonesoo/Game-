
import { GRID_COLS, GRID_ROWS, P1_HQ, P2_HQ, RIVER_X, UNIT_STATS, COMMAND_TOWERS } from "./constants";
import { GameState, Position, Unit, UnitClass, PlayerId, TimeOfDay } from "./types";

// --- Spatial Helpers ---

export const isSamePos = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

export const isValidPos = (p: Position) => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS;

export const getDistance = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Center point is (9, 6) for 19x13 grid
export const getSymmetricPos = (p: Position): Position => ({
    x: 18 - p.x,
    y: 12 - p.y
});

// --- Game Logic Helpers ---

export const isSafeZone = (pos: Position, player: PlayerId) => {
  if (player === 'P1') return pos.x === 0;
  if (player === 'P2') return pos.x === GRID_COLS - 1;
  return false;
};

export const isAnySafeZone = (pos: Position) => pos.x === 0 || pos.x === GRID_COLS - 1;

export const isHQ = (pos: Position) => isSamePos(pos, P1_HQ) || isSamePos(pos, P2_HQ);

export const isTower = (pos: Position) => COMMAND_TOWERS.some(t => isSamePos(t, pos));

export const isTrench = (pos: Position, trenches: Position[]) => trenches.some(t => isSamePos(t, pos));

export const getUnitAt = (pos: Position, units: Unit[]) => units.find(u => isSamePos(u.pos, pos));

export const getRandomTrenchTemplates = (count: number): Position[][] => {
    // Generate larger, semi-random shapes
    const shapes: Position[][] = [];
    
    for(let i=0; i<count; i++) {
        const shape: Position[] = [];
        const start = {x: 2, y: 2};
        shape.push(start);
        
        let attempts = 0;
        while(shape.length < 9 && attempts < 50) {
            const base = shape[Math.floor(Math.random() * shape.length)];
            const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const next = {x: base.x + dir.x, y: base.y + dir.y};
            
            if(next.x >= 0 && next.x < 5 && next.y >= 0 && next.y < 5) {
                if(!shape.some(p => p.x === next.x && p.y === next.y)) {
                    shape.push(next);
                }
            }
            attempts++;
        }
        const minX = Math.min(...shape.map(p => p.x));
        const minY = Math.min(...shape.map(p => p.y));
        const normalized = shape.map(p => ({x: p.x - minX, y: p.y - minY}));

        shapes.push(normalized);
    }
    return shapes;
}

// --- Movement Logic ---

export const getValidMoves = (unit: Unit, units: Unit[], trenches: Position[]): Position[] => {
  if (unit.ap <= 0 || unit.status === 'GARRISONED' || unit.status === 'DONE') return [];
  // If unit attacked after moving, it cannot move again
  if (unit.hasAttacked && unit.hasMovedThisTurn) return [];

  const validMoves: Position[] = [];
  const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];

  // 1. Check Standard Adjacent Moves
  for (const dir of dirs) {
      const nextPos = { x: unit.pos.x + dir.x, y: unit.pos.y + dir.y };

      if (!isValidPos(nextPos)) continue;
      
      // OBSTACLES: River(9) and Towers(0,6 / 18,6)
      if (nextPos.x === RIVER_X) continue;
      if (isTower(nextPos)) continue;

      // Obstacle check
      const unitAtNext = getUnitAt(nextPos, units);
      if (unitAtNext) continue; // Cannot step on any unit

      // Safe Zone check
      if (unit.owner === 'P1' && nextPos.x === GRID_COLS - 1) continue;
      if (unit.owner === 'P2' && nextPos.x === 0) continue;

      // TRENCH LOGIC:
      // Trench <-> Trench = Normal Cost (1)
      // Flat <-> Trench = Ends Turn (Cost All)
      // We check if AP is sufficient.
      
      const inTrenchNow = isTrench(unit.pos, trenches);
      const inTrenchNext = isTrench(nextPos, trenches);
      
      let cost = 1;
      
      // If moving between different terrain types (Flat <-> Trench), consume all remaining AP
      if (inTrenchNow !== inTrenchNext) {
          cost = unit.ap; // Consumes all
      }

      if (unit.ap >= cost) {
          validMoves.push(nextPos);
      }
  }

  // 2. Check River Jump (Bank to Bank)
  // If at X=8, can jump to X=10. If at X=10, can jump to X=8.
  // Requires AP >= 2.
  if (unit.ap >= 2) {
      let jumpPos: Position | null = null;
      if (unit.pos.x === 8) jumpPos = { x: 10, y: unit.pos.y };
      if (unit.pos.x === 10) jumpPos = { x: 8, y: unit.pos.y };

      if (jumpPos && isValidPos(jumpPos) && !isTower(jumpPos)) {
          const unitAtJump = getUnitAt(jumpPos, units);
          if (!unitAtJump) {
               if (!(unit.owner === 'P1' && jumpPos.x === GRID_COLS - 1) && 
                   !(unit.owner === 'P2' && jumpPos.x === 0)) {
                   validMoves.push(jumpPos);
               }
          }
      }
  }

  return validMoves;
};

// --- Combat Helpers ---

export const getAttackableTargets = (attacker: Unit, allUnits: Unit[], trenches: Position[]): Position[] => {
  if (attacker.hasAttacked) return [];
  
  const isMedic = attacker.type === 'MEDIC';
  const stats = UNIT_STATS[attacker.type];
  
  if (attacker.hasMovedAcrossRiver && attacker.type !== 'ARMOR') return [];
  if (attacker.buffs.some(b => b.type === 'ROOT')) return [];

  const targets: Position[] = [];

  allUnits.forEach(target => {
    if (target.status === 'RECOVERING' || target.hp <= 0) return;
    
    // NEW RULE: Different assigned time units cannot target each other
    // e.g., Day Unit cannot attack Night Unit
    if (attacker.assignedTime !== target.assignedTime) return;

    if (isMedic) {
      if (target.owner !== attacker.owner) return; 
      if (target.id === attacker.id) return; 
    } else {
      if (target.owner === attacker.owner) return; 
      if (isSafeZone(target.pos, target.owner)) return; 
    }

    const dist = getDistance(attacker.pos, target.pos);
    if (dist > stats.range) return;

    // Line of Sight
    if (attacker.type === 'SNIPER' || attacker.type === 'MACHINE_GUN' || attacker.type === 'ARTILLERY') {
       const dx = Math.abs(attacker.pos.x - target.pos.x);
       const dy = Math.abs(attacker.pos.y - target.pos.y);
       if (dx !== 0 && dy !== 0) return; 

       if (hasObstruction(attacker.pos, target.pos, allUnits, trenches, attacker.owner)) return;
    }

    targets.push(target.pos);
  });

  return targets;
};

const hasObstruction = (start: Position, end: Position, units: Unit[], trenches: Position[], attackerOwner: PlayerId): boolean => {
    const dx = Math.sign(end.x - start.x);
    const dy = Math.sign(end.y - start.y);
    
    let currX = start.x + dx;
    let currY = start.y + dy;

    // Iterate until just before the target
    while (currX !== end.x || currY !== end.y) {
        const currPos = { x: currX, y: currY };
        
        // Command Tower Blocks LoS
        if (isTower(currPos)) return true;

        const unit = getUnitAt(currPos, units);
        if (unit && unit.owner !== attackerOwner) return true;

        if (isTrench(currPos, trenches)) return true;
        if (isHQ(currPos)) return true; 

        currX += dx;
        currY += dy;
    }
    return false;
};

// --- Frontline Logic ---

export const calculateFrontlineX = (player: PlayerId, units: Unit[], targetTime: TimeOfDay): number => {
    const squadUnits = units.filter(u => u.owner === player && u.assignedTime === targetTime && u.status !== 'DONE' && u.hp > 0);
    
    // Default fallback
    if (squadUnits.length === 0) {
        return player === 'P1' ? 0.5 : 17.5;
    }

    const xCoords = squadUnits.map(u => u.pos.x);
    
    if (player === 'P1') {
        xCoords.sort((a, b) => b - a); // Descending (Max first)
    } else {
        xCoords.sort((a, b) => a - b); // Ascending (Min first)
    }

    // Rule: Between Furthest (Index 0) and 2nd Furthest (Index 1)
    
    if (xCoords.length === 1) {
        return player === 'P1' ? xCoords[0] + 0.5 : xCoords[0] - 0.5;
    }

    const first = xCoords[0];
    const second = xCoords[1];
    
    // Average
    return (first + second) / 2;
};
