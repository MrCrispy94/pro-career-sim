
import React, { useState } from 'react';
import { Player, GameState, SeasonRecord, StatSet, Position } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { calculateStars, getContrastColor } from '../utils/gameLogic';

interface Props {
  player: Player;
  currentYear: number;
  onSimulate: () => void;
  onChangeState: (state: GameState) => void;
  onSaveExit: () => void;
  onExportSave: () => void;
  onMainMenu: () => void;
  onRetire: () => void;
  onViewWorld: () => void;
  isSimulating: boolean;
}

const StarRating: React.FC<{ value: number, size?: string }> = ({ value, size = "text-lg" }) => {
    const fullStars = Math.floor(value);
    const hasHalf = value % 1 !== 0;
    const emptyStars = 5 - Math.ceil(value);

    return (
        <div className={`flex text-yellow-400 ${size}`}>
            {[...Array(fullStars)].map((_, i) => <span key={`f-${i}`}>★</span>)}
            {hasHalf && <span>½</span>}
            {[...Array(emptyStars)].map((_, i) => <span key={`e-${i}`} className="text-slate-600">★</span>)}
        </div>
    );
};

const Dashboard: React.FC<Props> = ({ player, currentYear, onSimulate, onChangeState, onSaveExit, onExportSave, onMainMenu, onRetire, onViewWorld, isSimulating }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'trophies'>('overview');
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [showRetireModal, setShowRetireModal] = useState(false);

  // Chart Data
  const chartData = player.history.map(h => ({
    year: h.year,
    goals: h.stats.total.goals,
    cleanSheets: h.stats.total.cleanSheets,
    rating: h.stats.total.rating
  }));

  const playerStars = calculateStars(player.currentAbility);
  const clubStars = calculateStars(player.currentClub.strength);

  // Fatigue visuals (Body Load)
  const fatigueColor = player.fatigue > 85 ? 'bg-red-600' : player.fatigue > 50 ? 'bg-yellow-500' : 'bg-green-500';
  const forcedRetirement = player.fatigue > 110;
  
  // Dynamic Club Colors
  const clubPrimary = player.currentClub.primaryColor || '#1e293b';
  const clubSecondary = player.currentClub.secondaryColor || '#ffffff';
  const contrastColor = getContrastColor(clubPrimary);
  
  // Determine text variations based on contrast
  const isDarkBg = contrastColor === '#ffffff';
  // If background is dark, subtext should be lighter version of white. If light, darker version of black.
  const subTextColor = isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  
  const totalStats = player.history.reduce((acc, h) => ({
     matches: acc.matches + h.stats.total.matches,
     goals: acc.goals + h.stats.total.goals,
     assists: acc.assists + h.stats.total.assists,
     cleanSheets: acc.cleanSheets + h.stats.total.cleanSheets,
     rating: 0 // calc later
  }), { matches: 0, goals: 0, assists: 0, cleanSheets: 0, rating: 0 });

  const ratedSeasons = player.history.filter(h => h.stats.total.matches > 0);
  const careerAvgRating = ratedSeasons.length > 0 
    ? (ratedSeasons.reduce((acc, h) => acc + h.stats.total.rating, 0) / ratedSeasons.length).toFixed(2) 
    : "N/A";

  const toggleSeason = (idx: number) => {
      if (expandedSeason === idx) setExpandedSeason(null);
      else setExpandedSeason(idx);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {/* Left Col: Profile Card */}
        <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <div className="text-9xl font-black text-white">{player.position}</div>
                </div>
                <div className="relative z-10">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{player.nationality}</div>
                    <h2 className="text-4xl font-black text-white mb-2 leading-tight">{player.name}</h2>
                    <div className="inline-block bg-blue-900/50 border border-blue-500/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full mb-4">
                        {player.age} Years Old • {player.position}
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Ability</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold">{player.currentAbility}</span>
                                <StarRating value={playerStars} size="text-xs" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Recent Form</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${player.form > 70 ? 'text-green-400' : player.form < 40 ? 'text-red-400' : 'text-yellow-400'}`}>{player.form}</span>
                                <span className="text-slate-600 text-xs">/ 100</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Body Load</span>
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${fatigueColor}`} style={{ width: `${Math.min(player.fatigue, 100)}%` }}></div>
                                </div>
                                <span className={`text-xs font-bold ${player.fatigue > 85 ? 'text-red-500' : 'text-slate-400'}`}>{player.fatigue}%</span>
                            </div>
                        </div>
                        {player.fatigue > 85 && <p className="text-xs text-red-400 font-bold mt-1">High body load is affecting performance.</p>}
                        {forcedRetirement && <p className="text-xs text-red-500 font-black uppercase mt-1 animate-pulse">Body Failure Imminent</p>}
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-400">Market Value</span>
                             <span className="text-green-400 font-mono font-bold">€{player.marketValue.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-slate-400">Wage</span>
                             <span className="text-slate-200 font-mono">€{player.contract.wage.toLocaleString()}/wk</span>
                         </div>
                         <div className="mt-2 text-xs text-slate-500 text-right">
                             Expires: {player.contract.expiryYear === 0 ? 'N/A' : `${player.contract.expiryYear} (${player.contract.yearsLeft}y)`}
                         </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Senior Career Totals</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-900 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-white">{totalStats.matches}</div>
                        <div className="text-xs text-slate-500 uppercase">Apps</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg">
                         {player.position === Position.GK ? (
                            <>
                                <div className="text-2xl font-bold text-green-400">{totalStats.cleanSheets}</div>
                                <div className="text-xs text-slate-500 uppercase">CS</div>
                            </>
                         ) : (
                            <>
                                <div className="text-2xl font-bold text-green-400">{totalStats.goals}</div>
                                <div className="text-xs text-slate-500 uppercase">Goals</div>
                            </>
                         )}
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{totalStats.assists}</div>
                        <div className="text-xs text-slate-500 uppercase">Assists</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">{careerAvgRating}</div>
                        <div className="text-xs text-slate-500 uppercase">Avg Rat</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Col: Current Context & Actions */}
        <div className="md:col-span-2 flex flex-col gap-6">
            <div 
                className="p-8 rounded-2xl border border-white/10 shadow-lg flex justify-between items-center relative overflow-hidden transition-colors duration-500"
                style={{ backgroundColor: clubPrimary, color: contrastColor }}
            >
                 {/* Background Elements for Texture */}
                 <div className="absolute right-0 bottom-0 opacity-10 font-black text-9xl pointer-events-none transform translate-x-10 translate-y-10" style={{ color: clubSecondary }}>
                     ⚽
                 </div>
                 
                 <div className="z-10">
                     <div className="font-bold uppercase text-xs tracking-widest mb-1" style={{ color: subTextColor }}>Current Club</div>
                     <h2 className="text-4xl font-black mb-2 drop-shadow-lg">{player.currentClub.name}</h2>
                     <div className="flex items-center gap-3 text-sm" style={{ color: subTextColor }}>
                         <span className="font-bold">{player.currentClub.league}</span>
                         <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clubSecondary }}></span>
                         <div className="flex items-center gap-1"><StarRating value={clubStars} size="text-xs" /></div>
                     </div>
                 </div>
                 
                 <div className="z-10 text-right">
                      <div className="text-sm font-bold mb-2" style={{ color: subTextColor }}>{currentYear} Season</div>
                      <button 
                        onClick={onSimulate}
                        disabled={isSimulating || forcedRetirement}
                        className="px-8 py-4 rounded-xl font-black text-lg shadow-lg transition transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: clubSecondary, color: getContrastColor(clubSecondary) }}
                      >
                          {isSimulating ? "Simulating..." : forcedRetirement ? "Must Retire" : "Play Season ▶"}
                      </button>
                 </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex-1 min-h-[300px]">
                 <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Performance History (Senior)</h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} 
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                            <Line type="monotone" dataKey="rating" stroke="#facc15" strokeWidth={2} name="Rating" dot={false} />
                            {player.position === Position.GK ? (
                                <Line type="monotone" dataKey="cleanSheets" stroke="#4ade80" strokeWidth={2} name="Clean Sheets" dot={false} />
                            ) : (
                                <Line type="monotone" dataKey="goals" stroke="#4ade80" strokeWidth={2} name="Goals" dot={false} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    </div>
  );

  const renderHistory = () => (
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-xs">
                  <tr>
                      <th className="p-4">Year</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Club</th>
                      <th className="p-4 text-center">Apps</th>
                      <th className="p-4 text-center">{player.position === Position.GK ? 'CS' : 'Goals'}</th>
                      <th className="p-4 text-center">Ast</th>
                      <th className="p-4 text-center">Rat</th>
                      <th className="p-4">Achievements</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                  {[...player.history].reverse().map((h, i) => {
                      const playedSenior = h.stats.total.matches > 0;
                      const isExpanded = expandedSeason === i;

                      return (
                      <React.Fragment key={i}>
                        <tr onClick={() => toggleSeason(i)} className={`cursor-pointer transition ${isExpanded ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                            <td className="p-4 font-mono text-slate-300">{h.year}</td>
                            <td className="p-4 text-slate-400">{h.age}</td>
                            <td className="p-4 font-bold text-white flex flex-col">
                                <div className="flex items-center gap-2">
                                    {h.club.name}
                                    {h.isLoan && <span className="text-[10px] bg-yellow-600 text-white px-1 rounded">LOAN</span>}
                                    {isExpanded ? <span className="text-xs">▼</span> : <span className="text-xs text-slate-500">▶</span>}
                                </div>
                                {!playedSenior && h.stats.youth.matches > 0 && (
                                    <span className="text-[10px] text-slate-500 italic">Played in Youth/Reserves</span>
                                )}
                                {!playedSenior && h.stats.level === 'Free Agent' && (
                                    <span className="text-[10px] text-slate-500 italic">Free Agent</span>
                                )}
                            </td>
                            <td className="p-4 text-center text-slate-300">{h.stats.total.matches}</td>
                            <td className="p-4 text-center text-green-400">{player.position === Position.GK ? h.stats.total.cleanSheets : h.stats.total.goals}</td>
                            <td className="p-4 text-center text-blue-400">{h.stats.total.assists}</td>
                            <td className="p-4 text-center font-bold text-yellow-400">{playedSenior ? h.stats.total.rating : '-'}</td>
                            <td className="p-4">
                                <div className="flex flex-wrap gap-1">
                                    {h.trophies.map((t, idx) => (
                                        <span key={idx} className="text-[10px] border border-yellow-500/30 text-yellow-500 px-1.5 py-0.5 rounded" title={t}>🏆</span>
                                    ))}
                                    {h.stats.awards.map((a, idx) => (
                                        <span key={`aw-${idx}`} className="text-[10px] border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded" title={a}>🏅</span>
                                    ))}
                                    {h.leaguePosition === 1 && <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">1st</span>}
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
  );

  const renderTrophies = () => (
      <div className="animate-fade-in">
          {player.trophyCabinet.length === 0 && player.awardsCabinet.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                  <div className="text-6xl mb-4 opacity-20">🏆</div>
                  <p className="text-xl font-bold">Trophy Cabinet Empty</p>
                  <p>Win silverware to fill this space.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Team Trophies */}
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <h3 className="text-slate-400 text-xs font-bold uppercase mb-6 border-b border-slate-700 pb-2">Team Honors</h3>
                      <div className="flex flex-wrap gap-4">
                          {Array.from(new Set(player.trophyCabinet)).map((trophy, i) => {
                              const count = player.trophyCabinet.filter(t => t === trophy).length;
                              return (
                                  <div key={i} className="bg-gradient-to-br from-yellow-900/40 to-slate-900 border border-yellow-700/50 p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
                                      <div className="text-3xl">🏆</div>
                                      <div>
                                          <div className="text-yellow-100 font-bold text-sm">{trophy}</div>
                                          <div className="text-yellow-500 text-xs font-bold">x{count}</div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {/* Individual Awards */}
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <h3 className="text-slate-400 text-xs font-bold uppercase mb-6 border-b border-slate-700 pb-2">Individual Honors</h3>
                      <div className="flex flex-wrap gap-4">
                          {Array.from(new Set(player.awardsCabinet)).map((award, i) => {
                              const count = player.awardsCabinet.filter(a => a === award).length;
                              return (
                                  <div key={i} className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-700/50 p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
                                      <div className="text-3xl">🏅</div>
                                      <div>
                                          <div className="text-blue-100 font-bold text-sm">{award}</div>
                                          <div className="text-blue-400 text-xs font-bold">x{count}</div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
        {/* Confirmation Modal */}
        {showRetireModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
                <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <div className="text-4xl mb-4">🎙️</div>
                    <h2 className="text-2xl font-black text-white mb-2">Announce Retirement?</h2>
                    <p className="text-slate-400 mb-8">
                        Are you sure you want to hang up your boots? This will end your career immediately and move you to the Hall of Fame.
                    </p>
                    <div className="flex gap-4">
                         <button 
                            onClick={() => setShowRetireModal(false)}
                            className="flex-1 py-3 font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
                         >
                             Cancel
                         </button>
                         <button 
                            onClick={onRetire}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-900/50"
                         >
                             Yes, Retire
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-green-500 tracking-tight">CAREER SIM</h1>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-mono">{currentYear}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={onViewWorld} className="text-sm font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-700">
                            World 🌍
                        </button>
                        <button onClick={onSaveExit} className="text-sm font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-700">
                            Save
                        </button>
                        <button onClick={onMainMenu} className="text-sm font-bold text-red-400 hover:text-red-300 transition px-3 py-1.5 rounded-lg hover:bg-red-900/20">
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800 p-1 rounded-xl mb-8 w-fit border border-slate-700">
                {(['overview', 'history', 'trophies'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg capitalize transition ${
                            activeTab === tab 
                            ? 'bg-slate-700 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'trophies' && renderTrophies()}
            </div>
            
            {/* Footer Actions */}
            {activeTab === 'overview' && (
                <div className="mt-12 border-t border-slate-800 pt-8 flex justify-center">
                    <button 
                        onClick={() => forcedRetirement ? onRetire() : setShowRetireModal(true)}
                        className="text-red-500 font-bold text-sm border border-red-900 hover:bg-red-900/20 px-6 py-3 rounded-xl transition flex items-center gap-2"
                    >
                        <span>🔚</span> 
                        {forcedRetirement ? "Body Failure - Force Retirement" : "Announce Retirement"}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default Dashboard;
