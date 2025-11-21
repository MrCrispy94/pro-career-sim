
import React, { useState } from 'react';
import { SeasonRecord, StatSet } from '../types';

interface Props {
    seasonData: SeasonRecord;
    narrative: string;
    growthLog: string;
    onContinue: () => void;
}

const SeasonSummary: React.FC<Props> = ({ seasonData, narrative, growthLog, onContinue }) => {
  const [activeTab, setActiveTab] = useState<'total' | 'league' | 'cup' | 'europe' | 'int'>('total');
  const isInEurope = !!seasonData.stats.europeCompetitionName;

  const renderStatGrid = (stats: StatSet) => (
    <div className="grid grid-cols-4 gap-4 text-center animate-fade-in">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Starts (Subs)</div>
            <div className="text-2xl font-bold text-white flex items-baseline justify-center gap-1">
                {stats.starts} <span className="text-base text-slate-500">({stats.matches - stats.starts})</span>
            </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Goals</div>
            <div className="text-2xl font-bold text-green-400">{stats.goals}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Assists</div>
            <div className="text-2xl font-bold text-blue-400">{stats.assists}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Rating</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.rating}</div>
        </div>
    </div>
  );

  const getActiveStats = () => {
      switch(activeTab) {
          case 'league': return seasonData.stats.league;
          case 'cup': return seasonData.stats.cup;
          case 'europe': return seasonData.stats.europe;
          case 'int': return seasonData.stats.international;
          default: return seasonData.stats.total;
      }
  };

  const visibleTabs = ['total', 'league', 'cup', 'int'];
  if (isInEurope) {
      // Insert europe before int
      visibleTabs.splice(3, 0, 'europe');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-center border-b border-slate-700 shrink-0">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">{seasonData.year} Season Review</h2>
                {seasonData.stats.level !== 'Senior' && (
                    <div className="mb-2 inline-block bg-yellow-600/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded uppercase border border-yellow-600/30">
                        {seasonData.stats.level} Team
                    </div>
                )}
                <p className="text-blue-200 italic text-sm">"{narrative}"</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Tabs */}
                <div className="flex space-x-2 bg-slate-900 p-1 rounded-lg">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition ${
                                activeTab === tab 
                                ? 'bg-slate-700 text-white shadow' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab === 'int' ? 'Intl' : tab === 'europe' && seasonData.stats.europeCompetitionName ? seasonData.stats.europeCompetitionName : tab}
                        </button>
                    ))}
                </div>

                {/* Stats Display */}
                {renderStatGrid(getActiveStats())}
                
                {/* Events & Trophies & Awards */}
                {(seasonData.trophies.length > 0 || seasonData.stats.awards.length > 0 || seasonData.events.length > 0) && (
                    <div className="bg-gradient-to-br from-yellow-900/20 to-slate-800 p-4 rounded-xl border border-yellow-900/30">
                        <h3 className="text-yellow-500 font-bold mb-3 uppercase text-xs tracking-wider">Season Highlights</h3>
                        <ul className="space-y-2">
                            {seasonData.stats.awards.map((a, i) => (
                                <li key={`a-${i}`} className="flex items-center gap-2 text-yellow-100 font-bold">
                                    <span>🏅</span> {a}
                                </li>
                            ))}
                            {seasonData.trophies.map((t, i) => (
                                <li key={`t-${i}`} className="flex items-center gap-2 text-white font-semibold">
                                    <span>🏆</span> {t}
                                </li>
                            ))}
                            {seasonData.events.map((e, i) => (
                                <li key={`e-${i}`} className="flex items-center gap-2 text-slate-300">
                                    <span>📣</span> {e}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Injury Report */}
                <div className="bg-red-900/10 p-4 rounded-xl border border-red-900/30">
                    <h3 className="text-red-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                        <span>🚑</span> Injury Report
                    </h3>
                    {seasonData.stats.injuries.length === 0 ? (
                        <div className="text-slate-400 italic text-sm flex items-center gap-2">
                            <span className="text-green-500">✓</span> Clean bill of health. No major injuries this season.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-slate-400 border-b border-red-900/30 pb-2">
                                <span>Total Time Sidelined</span>
                                <span className="font-bold text-white">{seasonData.stats.weeksOut} Weeks</span>
                            </div>
                            <ul className="space-y-2">
                                {seasonData.stats.injuries.map((inj, i) => {
                                    // Parse "Injury Name (Duration)"
                                    const parts = inj.match(/^(.*?)\s*\((.*?)\)$/);
                                    const name = parts ? parts[1] : inj;
                                    const duration = parts ? parts[2] : "Unknown";

                                    return (
                                        <li key={i} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between border border-red-500/10">
                                            <span className="text-red-200 font-semibold text-sm">{name}</span>
                                            <span className="text-xs bg-red-950 text-red-300 px-2 py-1 rounded font-bold border border-red-900/50">
                                                {duration}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Growth */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex items-start gap-3">
                    <div className="text-2xl">📈</div>
                    <div>
                        <div className="font-bold text-white">Development Update</div>
                        <div className="text-sm text-slate-400">{growthLog}</div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-slate-800 border-t border-slate-700 shrink-0">
                <button 
                    onClick={onContinue}
                    className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition shadow-lg"
                >
                    Continue to Offseason
                </button>
            </div>
        </div>
    </div>
  );
};

export default SeasonSummary;
