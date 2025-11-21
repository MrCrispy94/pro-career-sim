
import React, { useState, useEffect } from 'react';
import { WorldTables } from '../types';
import { getAvailableCountries, getLeaguesByCountry, getLeagueCountry } from '../utils/clubData';

interface Props {
    worldTables: WorldTables;
    onClose: () => void;
}

const WorldLeagues: React.FC<Props> = ({ worldTables, onClose }) => {
    const [selectedCountry, setSelectedCountry] = useState<string>("England");
    const [activeLeague, setActiveLeague] = useState<string>("");

    const countries = getAvailableCountries();
    const availableLeagues = getLeaguesByCountry(selectedCountry);

    // Initialize or reset active league when country changes
    useEffect(() => {
        if (availableLeagues.length > 0) {
            // Try to find a league in this country that has data
            const firstValid = availableLeagues.find(l => worldTables[l]) || availableLeagues[0];
            setActiveLeague(firstValid);
        }
    }, [selectedCountry]);

    // Check if current worldTables has data for the active league
    const currentRows = worldTables[activeLeague] || [];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-5xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-white">World Football 🌍</h2>
                        <p className="text-slate-400 text-sm">Scouting Network Database</p>
                    </div>
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition">
                        Close Database
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="w-full md:w-72 bg-slate-900 p-4 overflow-y-auto border-r border-slate-700 flex flex-col gap-4">
                        
                        {/* Country Selector */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Nation</label>
                            <select 
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            >
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Leagues List */}
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Competitions</label>
                            {availableLeagues.map(league => (
                                <button
                                    key={league}
                                    onClick={() => setActiveLeague(league)}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-bold transition flex justify-between items-center ${
                                        activeLeague === league 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <span>{league}</span>
                                    {worldTables[league] && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                </button>
                            ))}
                            {availableLeagues.length === 0 && (
                                <div className="text-slate-600 italic text-sm p-2">No leagues available.</div>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-800">
                        <div className="flex items-baseline justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">{activeLeague}</h3>
                            <span className="text-slate-500 font-mono text-sm">
                                {currentRows.length > 0 ? "Table Updated" : "No Data Available"}
                            </span>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold sticky top-0">
                                        <tr>
                                            <th className="p-4 text-left">Pos</th>
                                            <th className="p-4 text-left">Club</th>
                                            <th className="p-4 text-center">P</th>
                                            <th className="p-4 text-center hidden md:table-cell">W</th>
                                            <th className="p-4 text-center hidden md:table-cell">D</th>
                                            <th className="p-4 text-center hidden md:table-cell">L</th>
                                            <th className="p-4 text-center hidden md:table-cell">GD</th>
                                            <th className="p-4 text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {currentRows.length > 0 ? (
                                            currentRows.map((row) => (
                                                <tr key={row.name} className="hover:bg-slate-800 transition">
                                                    <td className={`p-4 font-bold ${row.position <= 4 ? 'text-green-400' : row.position >= (currentRows.length - 3) ? 'text-red-400' : 'text-slate-500'}`}>
                                                        {row.position}
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-200">
                                                        {row.name}
                                                    </td>
                                                    <td className="p-4 text-center text-slate-400">{row.played}</td>
                                                    <td className="p-4 text-center text-slate-500 hidden md:table-cell">{row.won}</td>
                                                    <td className="p-4 text-center text-slate-500 hidden md:table-cell">{row.drawn}</td>
                                                    <td className="p-4 text-center text-slate-500 hidden md:table-cell">{row.lost}</td>
                                                    <td className="p-4 text-center text-slate-500 hidden md:table-cell">{row.gd}</td>
                                                    <td className="p-4 text-center font-bold text-white bg-slate-800/30">{row.points}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="p-12 text-center text-slate-500 italic">
                                                    Simulated data for this league will appear here once the season begins.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorldLeagues;
