
import { Player } from "../types";

const SAVE_KEY = "pcs_save_v1";
const HOF_KEY = "pcs_hof_v1";

export const saveGame = (player: Player, year: number, gameState: any, midSeasonData: any) => {
    const data = {
        player,
        year,
        gameState,
        midSeasonData,
        timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
};

export const loadGame = (): any | null => {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
};

export const clearSave = () => {
    localStorage.removeItem(SAVE_KEY);
};

export const addToHallOfFame = (player: Player) => {
    const hofData = getHallOfFame();
    // Check if player already exists to avoid dupes on re-save/load
    const exists = hofData.find(p => p.name === player.name && p.history.length === player.history.length);
    if (!exists) {
        hofData.push(player);
        localStorage.setItem(HOF_KEY, JSON.stringify(hofData));
    }
};

export const getHallOfFame = (): Player[] => {
    const data = localStorage.getItem(HOF_KEY);
    if (!data) return [];
    return JSON.parse(data);
};

export const clearHallOfFame = () => {
    localStorage.removeItem(HOF_KEY);
};

export const exportHallOfFame = () => {
    const hofData = getHallOfFame();
    const blob = new Blob([JSON.stringify(hofData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProCareerSim_HallOfFame.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- FILE EXPORT / IMPORT ---

export const exportSaveFile = (player: Player, year: number, gameState: any, midSeasonData: any) => {
    const hofData = getHallOfFame();
    
    const saveData = {
        player,
        year,
        gameState,
        midSeasonData,
        timestamp: Date.now(),
        hallOfFame: hofData // Include HoF in the export
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareerSim_${player.name.replace(/\s+/g, '_')}_${year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
