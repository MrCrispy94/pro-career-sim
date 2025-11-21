
import React, { useState, useEffect } from 'react';
import { Position, GameConfig, Club, GameModifiers } from '../types';
import { COUNTRIES } from '../utils/constants';
import { getLeaguesByCountry, getClubsByTier, REAL_CLUBS } from '../utils/clubData';
import { generateRandomName } from '../utils/names';

interface Props {
  onStart: (name: string, age: number, nationality: string, position: Position, config: GameConfig) => void;
  onLoad: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHallOfFame: () => void;
  onOptions: () => void;
  isGenerating: boolean;
  hasSave: boolean;
}

const StartScreen: React.FC<Props> = ({ onStart, onLoad, onImport, onHallOfFame, onOptions, isGenerating, hasSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(15);
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position | 'RANDOM'>('RANDOM');
  
  // Advanced Mode States
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [startAbility, setStartAbility] = useState(45);
  const [randomAbility, setRandomAbility] = useState(false); 
  const [potentialAbility, setPotentialAbility] = useState(80);
  const [randomPotential, setRandomPotential] = useState(false); // New State
  const [injuryProneness, setInjuryProneness] = useState(5);
  
  // Team Selector States
  const [selectTeam, setSelectTeam] = useState(false);
  const [selectedNation, setSelectedNation] = useState('England');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedClubName, setSelectedClubName] = useState('');

  // Modifiers
  const [modifiers, setModifiers] = useState<GameModifiers>({
      noTransfers: false,
      noStartsUnder21: false,
      forceMoveEveryYear: false,
      randomLifeEvents: true,
      injuriesOff: false,
      dislikedTeams: []
  });
  
  const [dislikedInput, setDislikedInput] = useState('');
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);

  useEffect(() => {
      const leagues = getLeaguesByCountry(selectedNation);
      setAvailableLeagues(leagues);
      if (leagues.length > 0) setSelectedLeague(leagues[0]);
      else setSelectedLeague('');
  }, [selectedNation]);

  useEffect(() => {
      if (selectedLeague) {
          const clubs = REAL_CLUBS.filter(c => c.league === selectedLeague);
          setAvailableClubs(clubs);
          if (clubs.length > 0) setSelectedClubName(clubs[0].name);
      } else {
          setAvailableClubs([]);
      }
  }, [selectedLeague]);

  const handleRandomName = () => {
      const newName = generateRandomName(nationality);
      setName(newName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalPosition = position;
    if (position === 'RANDOM') {
        const positions = Object.values(Position);
        finalPosition = positions[Math.floor(Math.random() * positions.length)];
    }

    let chosenClub: Club | undefined = undefined;
    if (isAdvanced && selectTeam && selectedClubName) {
        chosenClub = REAL_CLUBS.find(c => c.name === selectedClubName);
    }

    const config: GameConfig = {
        modifiers,
        startingAbility: (isAdvanced && !randomAbility) ? startAbility : undefined,
        potentialAbility: (isAdvanced && !randomPotential) ? potentialAbility : undefined,
        injuryProneness: isAdvanced ? injuryProneness : undefined,
        startingClub: chosenClub
    };

    onStart(name, age, nationality, finalPosition as Position, config);
  };

  const handleModifierChange = (key: keyof GameModifiers) => {
      setModifiers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addDislikedTeam = () => {
      if (dislikedInput && !modifiers.dislikedTeams.includes(dislikedInput)) {
          setModifiers(prev => ({ ...prev, dislikedTeams: [...prev.dislikedTeams, dislikedInput] }));
          setDislikedInput('');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-green-900 p-4 py-10">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 my-10 relative">
        <button 
            onClick={onOptions}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition p-2 rounded-full hover:bg-slate-700"
            title="Game Options"
        >
            ⚙️
        </button>
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight text-center">CAREER SIM <span className="text-green-500">PRO</span></h1>
        <p className="text-slate-400 mb-6 text-center">Begin your journey to football stardom.</p>

        <div className="flex gap-3 mb-6">
             <button 
                onClick={onLoad}
                disabled={!hasSave}
                className="flex-1 py-2 bg-blue-900/50 border border-blue-700 hover:bg-blue-900 text-blue-100 rounded-lg text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
             >
                 Quick Load
             </button>
             <label className="flex-1 py-2 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-bold transition text-center cursor-pointer">
                 Import JSON Save
                 <input type="file" accept=".json" onChange={onImport} className="hidden" />
             </label>
             <button 
                onClick={onHallOfFame}
                className="flex-1 py-2 bg-yellow-900/50 border border-yellow-700 hover:bg-yellow-900 text-yellow-100 rounded-lg text-sm font-bold transition"
             >
                 Hall of Fame
             </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border-t border-slate-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Col: Basic Info */}
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nationality</label>
                    <select 
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none mb-3"
                    >
                        {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                          placeholder="e.g. Jamie Tartt"
                        />
                        <button 
                            type="button" 
                            onClick={handleRandomName}
                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-3 rounded-lg text-xl"
                            title="Generate Random Name"
                        >
                            🎲
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Age</label>
                      <input 
                        type="number" 
                        min="15" max="40"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                    <select 
                        value={position}
                        onChange={(e) => setPosition(e.target.value as any)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                        <option value="RANDOM">🎲 Randomly Assigned</option>
                        {Object.values(Position).map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                  </div>
              </div>
              
              {/* Right Col: Modifiers Preview or Simple Graphic */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                   <div className="flex items-center justify-between mb-4">
                       <span className="text-white font-bold">Advanced Setup</span>
                       <button 
                        type="button"
                        onClick={() => setIsAdvanced(!isAdvanced)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isAdvanced ? 'bg-green-500' : 'bg-slate-600'}`}
                       >
                           <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isAdvanced ? 'translate-x-6' : ''}`}></div>
                       </button>
                   </div>
                   
                   {!isAdvanced && <p className="text-slate-500 text-sm italic">Enable advanced setup to customize starting ability, club, and game rules.</p>}
                   
                   {isAdvanced && (
                       <div className="space-y-4 text-sm">
                           <div className="space-y-2">
                               <label className="flex justify-between text-slate-300">
                                   <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={randomAbility} onChange={() => setRandomAbility(!randomAbility)} className="rounded bg-slate-700 border-slate-500 text-green-500 focus:ring-0"/>
                                      <span>Random Start Ability?</span>
                                   </div>
                                   {!randomAbility && <span className="font-bold text-white">{startAbility}</span>}
                               </label>
                               {!randomAbility && <input type="range" min="20" max="90" value={startAbility} onChange={(e) => setStartAbility(Number(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg accent-green-500 appearance-none" />}
                               
                               <label className="flex justify-between text-slate-300">
                                   <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={randomPotential} onChange={() => setRandomPotential(!randomPotential)} className="rounded bg-slate-700 border-slate-500 text-green-500 focus:ring-0"/>
                                      <span>Random Potential?</span>
                                   </div>
                                   {!randomPotential && <span className="font-bold text-white">{potentialAbility}</span>}
                               </label>
                               {!randomPotential && <input type="range" min="40" max="99" value={potentialAbility} onChange={(e) => setPotentialAbility(Number(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg accent-blue-500 appearance-none" />}
                           
                               <label className="flex justify-between text-slate-300">
                                   <span>Injury Prone</span>
                                   <span className="font-bold text-red-400">{injuryProneness}</span>
                               </label>
                               <input type="range" min="1" max="20" value={injuryProneness} onChange={(e) => setInjuryProneness(Number(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg accent-red-500 appearance-none" />
                           </div>
                           
                           <div className="border-t border-slate-700 pt-4">
                               <label className="flex items-center gap-2 text-slate-300 mb-2 cursor-pointer">
                                   <input type="checkbox" checked={selectTeam} onChange={() => setSelectTeam(!selectTeam)} className="rounded bg-slate-700 border-slate-500 text-green-500 focus:ring-0" />
                                   <span>Pick Starting Club</span>
                               </label>
                               
                               {selectTeam && (
                                   <div className="space-y-2 animate-fade-in">
                                       <select value={selectedNation} onChange={(e) => setSelectedNation(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white">
                                           {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                       <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white" disabled={!selectedNation}>
                                            {availableLeagues.length === 0 && <option>No leagues found</option>}
                                            {availableLeagues.map(l => <option key={l} value={l}>{l}</option>)}
                                       </select>
                                       <select value={selectedClubName} onChange={(e) => setSelectedClubName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white" disabled={!selectedLeague}>
                                           {availableClubs.length === 0 && <option>No clubs</option>}
                                           {availableClubs.map(c => <option key={c.name} value={c.name}>{c.name} ({c.strength})</option>)}
                                       </select>
                                   </div>
                               )}
                           </div>
                       </div>
                   )}
              </div>
          </div>

          {/* Modifiers Section */}
          {isAdvanced && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-600">
                  <h3 className="text-white font-bold mb-3">Game Modifiers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer p-2 hover:bg-slate-700 rounded">
                          <input type="checkbox" checked={modifiers.noTransfers} onChange={() => handleModifierChange('noTransfers')} className="rounded bg-slate-600 border-slate-500 text-green-500 focus:ring-0" />
                          One Club Man (No Transfers)
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer p-2 hover:bg-slate-700 rounded">
                          <input type="checkbox" checked={modifiers.noStartsUnder21} onChange={() => handleModifierChange('noStartsUnder21')} className="rounded bg-slate-600 border-slate-500 text-green-500 focus:ring-0" />
                          Strict Youth (No senior starts {'<'} 21 unless loaned)
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer p-2 hover:bg-slate-700 rounded">
                          <input type="checkbox" checked={modifiers.forceMoveEveryYear} onChange={() => handleModifierChange('forceMoveEveryYear')} className="rounded bg-slate-600 border-slate-500 text-green-500 focus:ring-0" />
                          Journeyman (Force move every season)
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer p-2 hover:bg-slate-700 rounded">
                          <input type="checkbox" checked={modifiers.injuriesOff} onChange={() => handleModifierChange('injuriesOff')} className="rounded bg-slate-600 border-slate-500 text-green-500 focus:ring-0" />
                          Disable Injuries
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer p-2 hover:bg-slate-700 rounded">
                          <input type="checkbox" checked={modifiers.randomLifeEvents} onChange={() => handleModifierChange('randomLifeEvents')} className="rounded bg-slate-600 border-slate-500 text-green-500 focus:ring-0" />
                          Random Life Events
                      </label>
                      
                      {/* Disliked Teams */}
                      <div className="col-span-1 sm:col-span-2 bg-slate-900/50 p-3 rounded border border-slate-700 mt-2">
                          <label className="block text-xs text-slate-400 mb-1">Disliked Teams (Will not accept offers from)</label>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={dislikedInput} 
                                onChange={(e) => setDislikedInput(e.target.value)} 
                                placeholder="e.g. Tottenham"
                                className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                              />
                              <button type="button" onClick={addDislikedTeam} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-500">Add</button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                              {modifiers.dislikedTeams.map(t => (
                                  <span key={t} className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-800 flex items-center gap-2">
                                      {t} <button type="button" onClick={() => setModifiers(prev => ({...prev, dislikedTeams: prev.dislikedTeams.filter(x => x !== t)}))}>×</button>
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-white/10"
          >
            {isGenerating ? (
              <span className="animate-pulse">Setting up Season...</span>
            ) : (
              "Start Career"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartScreen;
