
import React, { useState } from 'react';
import { Player, Position } from '../types';
import { exportHallOfFame } from '../utils/storage';

interface Props {
    players: Player[];
    onBack: () => void;
}

const HallOfFame: React.FC<Props> = ({ players, onBack }) => {
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

    const getTotalGoals = (p: Player) => p.history.reduce((acc, h) => acc + h.stats.total.goals, 0);
    const getTotalApps = (p: Player) => p.history.reduce((acc, h) => acc + h.stats.total.matches, 0);

    const toggleSeason = (idx: number) => {
        if (expandedSeason === idx) setExpandedSeason(null);
        else setExpandedSeason(idx);
    };

    const renderPlayerDetail = (p: Player) => (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPlayer(null)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-400 transition">
                        ← Back
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-white">{p.name}</h2>
                        <p className="text-slate-400">{p.nationality} • {p.position} • Retired</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-500">{p.trophyCabinet.length} Trophies</div>
                    <div className="text-sm text-slate-500">{getTotalApps(p)} Apps • {getTotalGoals(p)} Goals</div>
                </div>
            </div>

            {/* Trophy Cabinet */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
                <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Trophy Cabinet</h3>
                {p.trophyCabinet.length === 0 && p.awardsCabinet.length === 0 ? (
                    <p className="text-slate-500 italic">No major honors.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([...p.trophyCabinet, ...p.awardsCabinet])).map((t, i) => {
                             const count = [...p.trophyCabinet, ...p.awardsCabinet].filter(x => x === t).length;
                             return (
                                <span key={i} className="bg-slate-900 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-900/30 text-sm font-bold flex items-center gap-2">
                                    🏆 {t} {count > 1 && <span className="text-white bg-slate-700 px-1.5 rounded text-xs">x{count}</span>}
                                </span>
                             );
                        })}
                    </div>
                )}
            </div>

            {/* Full History Table */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 bg-slate-900 border-b border-slate-700 font-bold text-white">Career History</div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Year</th>
                            <th className="p-4">Age</th>
                            <th className="p-4">Club</th>
                            <th className="p-4 text-center">Apps</th>
                            <th className="p-4 text-center">{p.position === Position.GK ? 'CS' : 'Goals'}</th>
                            <th className="p-4 text-center">Ast</th>
                            <th className="p-4 text-center">Rat</th>
                            <th className="p-4">Honors</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {[...p.history].reverse().map((h, i) => {
                            const isExpanded = expandedSeason === i;
                            return (
                            <React.Fragment key={i}>
                                <tr 
                                    onClick={() => toggleSeason(i)}
                                    className={`cursor-pointer transition ${isExpanded ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                                >
                                    <td className="p-4 font-mono text-slate-300">{h.year}</td>
                                    <td className="p-4 text-slate-400">{h.age}</td>
                                    <td className="p-4 font-bold text-white">
                                        {h.club.name}
                                        {h.isLoan && <span className="ml-2 text-[10px] bg-yellow-600 text-white px-1 rounded">LOAN</span>}
                                        {expandedSeason === i ? <span className="ml-2 text-xs">▼</span> : <span className="ml-2 text-xs text-slate-500">▶</span>}
                                    </td>
                                    <td className="p-4 text-center text-slate-300">{h.stats.total.matches}</td>
                                    <td className="p-4 text-center text-green-400">{p.position === Position.GK ? h.stats.total.cleanSheets : h.stats.total.goals}</td>
                                    <td className="p-4 text-center text-blue-400">{h.stats.total.assists}</td>
                                    <td className="p-4 text-center font-bold text-yellow-400">{h.stats.total.rating > 0 ? h.stats.total.rating : '-'}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {h.trophies.map((t, idx) => (
                                                <span key={idx} className="text-[10px] text-yellow-500" title={t}>🏆</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-slate-900/50">
                                        <td colSpan={8} className="p-4">
                                            <div className="grid grid-cols-5 gap-2 text-xs text-center">
                                                <div className="font-bold text-slate-500 uppercase">Comp</div>
                                                <div className="font-bold text-slate-500 uppercase">Apps</div>
                                                <div className="font-bold text-slate-500 uppercase">Goals</div>
                                                <div className="font-bold text-slate-500 uppercase">Ast</div>
                                                <div className="font-bold text-slate-500 uppercase">Rat</div>

                                                <div className="text-slate-300 text-left pl-2">League</div>
                                                <div className="text-slate-300">{h.stats.league.matches}</div>
                                                <div className="text-slate-300">{h.stats.league.goals}</div>
                                                <div className="text-slate-300">{h.stats.league.assists}</div>
                                                <div className="text-slate-300">{h.stats.league.rating}</div>

                                                <div className="text-slate-300 text-left pl-2">Cup</div>
                                                <div className="text-slate-300">{h.stats.cup.matches}</div>
                                                <div className="text-slate-300">{h.stats.cup.goals}</div>
                                                <div className="text-slate-300">{h.stats.cup.assists}</div>
                                                <div className="text-slate-300">{h.stats.cup.rating}</div>

                                                <div className="text-slate-300 text-left pl-2">Europe</div>
                                                <div className="text-slate-300">{h.stats.europe.matches}</div>
                                                <div className="text-slate-300">{h.stats.europe.goals}</div>
                                                <div className="text-slate-300">{h.stats.europe.assists}</div>
                                                <div className="text-slate-300">{h.stats.europe.rating}</div>

                                                <div className="text-slate-300 text-left pl-2">Intl</div>
                                                <div className="text-slate-300">{h.stats.international.matches}</div>
                                                <div className="text-slate-300">{h.stats.international.goals}</div>
                                                <div className="text-slate-300">{h.stats.international.assists}</div>
                                                <div className="text-slate-300">{h.stats.international.rating}</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (selectedPlayer) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-6">
                <header className="max-w-6xl mx-auto mb-6">
                     {renderPlayerDetail(selectedPlayer)}
                </header>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
             <header className="max-w-6xl mx-auto flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-yellow-500">HALL OF FAME 👑</h1>
                    <p className="text-slate-400">Legends of the game.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={exportHallOfFame}
                        className="px-6 py-3 bg-blue-900/50 border border-blue-700 hover:bg-blue-800 rounded-xl font-bold transition text-blue-100"
                    >
                        Save / Export
                    </button>
                    <button 
                        onClick={onBack}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition"
                    >
                        Back to Menu
                    </button>
                </div>
             </header>

             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {players.length === 0 && (
                    <div className="col-span-2 text-center py-20 text-slate-500">
                        <p className="text-xl">No legends yet. Complete a career to be inducted.</p>
                    </div>
                )}

                {players.map((p, i) => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedPlayer(p)}
                        className="group cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/20 p-6 rounded-2xl shadow-xl hover:border-yellow-500/50 transition transform hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-yellow-500 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition">
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold group-hover:text-yellow-400 transition">{p.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span>{p.nationality}</span>
                                        <span>•</span>
                                        <span>{p.position}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs uppercase font-bold text-slate-500">Peak Rating</div>
                                <div className="text-yellow-400 font-bold text-lg">{Math.max(...p.history.map(h => h.stats.total.rating))}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Apps</div>
                                <div className="font-mono text-xl">{getTotalApps(p)}</div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Goals</div>
                                <div className="font-mono text-xl text-green-400">{getTotalGoals(p)}</div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Trophies</div>
                                <div className="font-mono text-xl text-yellow-400">{p.trophyCabinet.length}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Trophy Cabinet</h3>
                            <div className="flex flex-wrap gap-2">
                                {p.trophyCabinet.slice(0, 5).map((t, idx) => (
                                    <span key={idx} className="text-xs bg-yellow-900/20 text-yellow-400 px-2 py-1 rounded border border-yellow-900/30">
                                        🏆 {t}
                                    </span>
                                ))}
                                {p.trophyCabinet.length > 5 && (
                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                        +{p.trophyCabinet.length - 5} more
                                    </span>
                                )}
                                {p.trophyCabinet.length === 0 && <span className="text-xs text-slate-600 italic">None</span>}
                            </div>
                        </div>
                        
                        <div className="mt-4 text-center text-xs text-slate-600 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">
                            Click to view full career
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

export default HallOfFame;
