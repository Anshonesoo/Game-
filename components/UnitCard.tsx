import React from 'react';
import { Unit } from '../types';
import { UNIT_STATS } from '../constants';
import { Shield, Crosshair, Zap, Heart, Activity, BedDouble } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  onClick?: () => void;
  onRest?: (e: React.MouseEvent) => void;
  small?: boolean;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, onClick, onRest, small }) => {
  const stats = UNIT_STATS[unit.type];
  const isP1 = unit.owner === 'P1';
  
  const baseColor = isP1 ? 'bg-blue-600' : 'bg-red-600';
  
  let Icon = Shield;
  if (unit.type === 'SNIPER') Icon = Crosshair;
  if (unit.type === 'MACHINE_GUN') Icon = Zap;
  if (unit.type === 'MEDIC') Icon = Heart;
  if (unit.type === 'SCOUT') Icon = Activity;
  
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  const canAttack = !unit.hasAttacked && unit.status === 'ACTIVE';
  const showRest = onRest && unit.status === 'ACTIVE' && unit.ap > 0 && !unit.hasAttacked;

  if (small) {
    return (
      <div onClick={onClick} className={`
        relative w-8 h-8 sm:w-16 sm:h-16 rounded-md ${baseColor} 
        flex flex-col items-center justify-center text-white shadow-lg cursor-pointer
        ${unit.status === 'GARRISONED' ? 'opacity-40 grayscale' : ''}
        ${unit.status === 'RECOVERING' ? 'opacity-70 animate-pulse' : ''}
        hover:scale-110 transition-transform
      `}>
         <Icon size={24} />
         <span className="text-[10px] font-bold mt-1">{stats.name}</span>
      </div>
    );
  }

  // Full Unit Render for Grid
  return (
    <div 
        onClick={onClick}
        className={`
            relative w-[90%] h-[90%] rounded-md flex flex-col items-center justify-center
            ${baseColor} text-white shadow-md cursor-pointer transition-all duration-200 group
            ${unit.status === 'GARRISONED' ? 'opacity-40 grayscale border border-dashed border-gray-500' : ''}
            ${unit.status === 'RECOVERING' ? 'opacity-60 bg-stone-700' : ''}
            ${unit.status === 'DONE' ? 'brightness-50' : ''}
            ${canAttack && unit.status === 'ACTIVE' ? 'ring-2 ring-yellow-300 ring-offset-1 ring-offset-transparent shadow-[0_0_10px_rgba(253,224,71,0.8)]' : ''}
            hover:z-30 hover:scale-105
        `}
    >
        {unit.status === 'RECOVERING' && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-red-300 rounded-md">
                康复中 {unit.recoveryTurns}T
            </span>
        )}
        
        {/* Rest Button (Top Right) */}
        {showRest && (
            <button 
                onClick={(e) => { e.stopPropagation(); onRest && onRest(e); }}
                className="absolute -top-2 -right-2 bg-stone-700 hover:bg-green-600 text-white rounded-full p-1 shadow-md z-40 transition-colors"
                title="立即休整"
            >
                <BedDouble size={10} />
            </button>
        )}

        <div className="flex flex-col items-center -mt-2">
            <Icon size={16} className="drop-shadow-sm mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold leading-none tracking-tighter shadow-black drop-shadow-md">
                {stats.name}
            </span>
        </div>
        
        {/* HP Bar & Text */}
        <div className="absolute bottom-1 w-[85%] flex flex-col items-center">
            <div className="w-full h-1.5 bg-gray-900/80 rounded-full overflow-hidden mb-px">
                <div 
                    className={`h-full ${unit.hp < 30 ? 'bg-red-500' : 'bg-green-400'}`} 
                    style={{ width: `${hpPercent}%` }} 
                />
            </div>
            <span className="text-[7px] leading-none font-mono opacity-90">{unit.hp}/{unit.maxHp}</span>
        </div>
        
        {/* Buff Indicators */}
        <div className="absolute -top-1 -left-1 flex flex-col gap-0.5">
            {unit.buffs.map((b, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 border border-white" title={b.type} />
            ))}
        </div>
    </div>
  );
};