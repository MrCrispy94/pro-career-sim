import React, { useState, useEffect } from 'react';
import { Player, StatSet, Position } from '../types';
import { simulateMatch, getCountryTier, getRandomInt, mergeStatSet } from '../utils/gameLogic';
import { COUNTRIES, getRegion } from '../utils/constants';

interface Props {
    player: Player;
    tournamentName: string;
    year: number;
    onComplete: (stats: StatSet, trophies: string[], events: string[]) => void;
}

type Stage = 'GROUP' | 'RO16' | 'QF' | 'SF' | 'FINAL' | 'WINNER' | 'ELIMINATED';

interface GroupTeam {
    name: string;
    p: number; w: number; d: number; l: number; gd: number; pts: number;
}

const InternationalTournament: React.FC<Props> = ({ player, tournamentName, year, onComplete }) => {
    const [stage, setStage] = useState<Stage>('GROUP');
    const [groupTable, setGroupTable] = useState<GroupTeam[]>([]);
    const [matchIndex, setMatchIndex] = useState(0); // 0, 1, 2 for group games
    
    const [opponent, setOpponent] = useState<string>("");
    const [matchResult, setMatchResult] = useState<{myScore: number, oppScore: number, stats: StatSet} | null>(null);
    
    const [tournamentStats, setTournamentStats] = useState<StatSet>({
        matches: 0, 
        starts: 0,
        minutes: 0, 
        goals: 0, 
        assists: 0, 
        cleanSheets: 0, 
        rating: 0,
        motm: 0
    });
    const [simulating, setSimulating] = useState(false);
    const [eliminatedBy, setEliminatedBy] = useState<string>("");

    // Init Group
    useEffect(() => {
        const myNation = player.nationality;
        const myRegion = getRegion(myNation);

        let potentialOpponents = COUNTRIES.filter(c => c !== myNation);

        // Filter based on tournament type
        if (tournamentName.includes("European Championship") || tournamentName.includes("U21 Euros")) {
            potentialOpponents = potentialOpponents.filter(c => getRegion(c) === 'Europe');
        } else if (tournamentName.includes("Copa America")) {
             // Copa sometimes has guests, but let's stick to SA for core realism, or invite NA
             potentialOpponents = potentialOpponents.filter(c => getRegion(c) === 'South America' || getRegion(c) === 'North America');
        } else if (tournamentName.includes("World Cup")) {
             // World Cup Group Logic: Try to avoid same confederation (except Europe)
             // We need 3 opponents.
        } else {
            // Continental cups (Asian Cup, AFCON, Gold Cup)
            potentialOpponents = potentialOpponents.filter(c => getRegion(c) === myRegion);
        }
        
        // Pick 3 random opponents with weighted logic for World Cup diversity
        let opponents: string[] = [];
        
        if (tournamentName.includes("World Cup")) {
             // Try to get 1 Europe, 1 other, 1 other different
             const europeans = potentialOpponents.filter(c => getRegion(c) === 'Europe');
             const others = potentialOpponents.filter(c => getRegion(c) !== 'Europe' && getRegion(c) !== myRegion);
             
             // Simple shuffle
             const shuffledOthers = others.sort(() => 0.5 - Math.random());
             const shuffledEuro = europeans.sort(() => 0.5 - Math.random());

             // Naive selection: 1 Euro, 2 others (or mixed)
             if (myRegion !== 'Europe') {
                 opponents.push(shuffledEuro[0] || potentialOpponents[0]);
                 opponents.push(shuffledOthers[0] || potentialOpponents[1]);
                 opponents.push(shuffledOthers[1] || potentialOpponents[2]);
             } else {
                 opponents.push(shuffledEuro[0] || potentialOpponents[0]); // Another european
                 opponents.push(shuffledOthers[0] || potentialOpponents[1]);
                 opponents.push(shuffledOthers[1] || potentialOpponents[2]);
             }
             
             // Filter undefineds if list small (fallback)
             opponents = opponents.filter(o => o);
             // If we still don't have 3, fill random
             while (opponents.length < 3) {
                 const rem = potentialOpponents.filter(c => !opponents.includes(c));
                 opponents.push(rem[Math.floor(Math.random() * rem.length)]);
             }

        } else {
             // Standard random within filtered pool
             if (potentialOpponents.length < 3) {
                 // Fallback if not enough teams in region (unlikely with full DB but possible with small slice)
                 potentialOpponents = COUNTRIES.filter(c => c !== myNation); 
             }
             opponents = potentialOpponents.sort(() => 0.5 - Math.random()).slice(0, 3);
        }
        
        const initialTable = [
            { name: myNation, p: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0 },
            ...opponents.map(o => ({ name: o, p: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0 }))
        ];
        
        setGroupTable(initialTable);
        setOpponent(opponents[0]);
    }, []);

    const handleSimulateMatch = () => {
        setSimulating(true);
        setTimeout(() => {
            const oppStrength = getCountryTier(opponent);
            const result = simulateMatch(player, oppStrength, stage !== 'GROUP'); // Extra time allowed in KO
            
            setMatchResult(result);
            setTournamentStats(prev => mergeStatSet(prev, result.stats));

            if (stage === 'GROUP') {
                updateGroupTable(result.myScore, result.oppScore, opponent);
            } else {
                // KO Logic
                if (result.myScore < result.oppScore) {
                    setStage('ELIMINATED');
                    setEliminatedBy(opponent);
                } else {
                    advanceStage();
                }
            }
            setSimulating(false);
        }, 1500);
    };

    const updateGroupTable = (myScore: number, oppScore: number, oppName: string) => {
        setGroupTable(prev => {
            return prev.map(t => {
                if (t.name === player.nationality) {
                    return {
                        ...t,
                        p: t.p + 1,
                        w: t.w + (myScore > oppScore ? 1 : 0),
                        d: t.d + (myScore === oppScore ? 1 : 0),
                        l: t.l + (myScore < oppScore ? 1 : 0),
                        gd: t.gd + (myScore - oppScore),
                        pts: t.pts + (myScore > oppScore ? 3 : myScore === oppScore ? 1 : 0)
                    };
                }
                if (t.name === oppName) {
                    return {
                        ...t,
                        p: t.p + 1,
                        w: t.w + (oppScore > myScore ? 1 : 0),
                        d: t.d + (oppScore === myScore ? 1 : 0),
                        l: t.l + (oppScore < myScore ? 1 : 0),
                        gd: t.gd + (oppScore - myScore),
                        pts: t.pts + (oppScore > myScore ? 3 : oppScore === myScore ? 1 : 0)
                    };
                }
                return t;
            }).sort((a, b) => b.pts - a.pts || b.gd - a.gd);
        });
    };

    const handleNext = () => {
        setMatchResult(null);

        if (stage === 'GROUP') {
            if (matchIndex < 2) {
                // Next group game
                const nextIdx = matchIndex + 1;
                setMatchIndex(nextIdx);
                
                // Find next opponent in table order that isn't me and hasn't been played
                // Simplification: The initial table has [Me, Opp1, Opp2, Opp3]
                // Opponent state currently holds previous opponent.
                // We can just use the initial order logic if we hadn't sorted the table visually...
                // But we sort the table.
                // Robust way: Filter groupTable for names != myName and names != any previously played.
                // We haven't tracked previously played explicitely list.
                // HACK: We know we play Opponents in index 1, 2, 3 of the INITIAL generation.
                // But we lost that order.
                // Let's just find a team in groupTable that matches has p=0 (matches played).
                
                const nextOpp = groupTable.find(t => t.name !== player.nationality && t.p === 0);
                if (nextOpp) {
                    setOpponent(nextOpp.name);
                } else {
                    // Fallback if state desync (shouldn't happen)
                    const anyOpp = groupTable.find(t => t.name !== player.nationality && t.name !== opponent);
                    setOpponent(anyOpp?.name || "Unknown");
                }

            } else {
                // End of Group
                // Check qualification
                const myRank = groupTable.findIndex(t => t.name === player.nationality);
                if (myRank <= 1) {
                    setStage('RO16');
                    setOpponent(pickRandomOpponent());
                } else {
                    setStage('ELIMINATED');
                    setEliminatedBy("Group Stage");
                }
            }
        } else if (stage === 'WINNER' || stage === 'ELIMINATED') {
             finishTournament();
        } 
    };

    const advanceStage = () => {
        if (stage === 'RO16') { setStage('QF'); setOpponent(pickRandomOpponent()); }
        else if (stage === 'QF') { setStage('SF'); setOpponent(pickRandomOpponent()); }
        else if (stage === 'SF') { setStage('FINAL'); setOpponent(pickRandomOpponent()); }
        else if (stage === 'FINAL') { setStage('WINNER'); }
    };

    const pickRandomOpponent = () => {
        // Pick opponent valid for the tournament
        let validOpponents = COUNTRIES.filter(c => c !== player.nationality);
        
        if (tournamentName.includes("European") || tournamentName.includes("Euro")) {
             validOpponents = validOpponents.filter(c => getRegion(c) === 'Europe');
        } else if (tournamentName.includes("Copa")) {
             validOpponents = validOpponents.filter(c => getRegion(c) === 'South America');
        } else if (!tournamentName.includes("World Cup")) {
             validOpponents = validOpponents.filter(c => getRegion(c) === getRegion(player.nationality));
        }

        if (validOpponents.length === 0) validOpponents = COUNTRIES; // Fallback

        return validOpponents.sort(() => 0.5 - Math.random())[0];
    };

    const finishTournament = () => {
        const trophies = [];
        if (stage === 'WINNER') trophies.push(`${tournamentName} Winner`);
        
        // Award logic
        const events = [`Participated in ${tournamentName}`];
        if (stage === 'WINNER') events.push(`Won the ${tournamentName}!`);
        if (stage === 'FINAL') events.push(`Runner-up in ${tournamentName}`);
        
        if (tournamentStats.goals >= 5) events.push(`${tournamentName} Golden Boot Contender`);
        if (tournamentStats.rating > 8.0) events.push(`${tournamentName} Best Player Contender`);

        onComplete(tournamentStats, trophies, events);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col items-center overflow-y-auto p-4">
            <div className="max-w-4xl w-full mt-10 mb-20">
                <h1 className="text-4xl font-black text-center text-yellow-500 mb-2 uppercase tracking-widest">{tournamentName}</h1>
                <p className="text-center text-slate-400 mb-10">{year} Edition</p>

                {stage === 'GROUP' && (
                    <div className="mb-10">
                         <h2 className="text-2xl font-bold mb-4 text-center">Group Stage</h2>
                         <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                             <table className="w-full text-sm">
                                 <thead className="bg-slate-900 text-slate-500 uppercase font-bold">
                                     <tr>
                                         <th className="p-3 text-left">Team</th>
                                         <th className="p-3 text-center">P</th>
                                         <th className="p-3 text-center">W</th>
                                         <th className="p-3 text-center">D</th>
                                         <th className="p-3 text-center">L</th>
                                         <th className="p-3 text-center">GD</th>
                                         <th className="p-3 text-center">Pts</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-700">
                                     {groupTable.map((t, i) => (
                                         <tr key={i} className={t.name === player.nationality ? "bg-blue-900/20" : ""}>
                                             <td className="p-3 font-bold">{t.name} {t.name === player.nationality && "(You)"}</td>
                                             <td className="p-3 text-center">{t.p}</td>
                                             <td className="p-3 text-center text-slate-400">{t.w}</td>
                                             <td className="p-3 text-center text-slate-400">{t.d}</td>
                                             <td className="p-3 text-center text-slate-400">{t.l}</td>
                                             <td className="p-3 text-center text-slate-400">{t.gd}</td>
                                             <td className="p-3 text-center font-bold text-white">{t.pts}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                         <p className="text-center text-xs text-slate-500 mt-2">Top 2 Advance</p>
                    </div>
                )}

                {(stage === 'ELIMINATED' || stage === 'WINNER') ? (
                    <div className="text-center space-y-6">
                         <div className="text-6xl mb-4">{stage === 'WINNER' ? '🏆' : '❌'}</div>
                         <h2 className="text-3xl font-bold">{stage === 'WINNER' ? "CHAMPIONS!" : "ELIMINATED"}</h2>
                         <p className="text-xl text-slate-400">
                             {stage === 'WINNER' ? `You have won the ${tournamentName}!` : `Knocked out by ${eliminatedBy}.`}
                         </p>
                         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 inline-block text-left min-w-[300px]">
                             <h3 className="text-slate-500 uppercase font-bold text-xs mb-4">Tournament Stats</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <div className="text-2xl font-bold text-white">{tournamentStats.matches}</div>
                                     <div className="text-xs text-slate-500">Apps</div>
                                 </div>
                                 <div>
                                     <div className="text-2xl font-bold text-slate-300">{tournamentStats.minutes}</div>
                                     <div className="text-xs text-slate-500">Minutes</div>
                                 </div>
                                 <div>
                                     <div className="text-2xl font-bold text-green-400">{tournamentStats.goals}</div>
                                     <div className="text-xs text-slate-500">Goals</div>
                                 </div>
                                 <div>
                                     <div className="text-2xl font-bold text-blue-400">{tournamentStats.assists}</div>
                                     <div className="text-xs text-slate-500">Assists</div>
                                 </div>
                                 <div className="col-span-2 text-center">
                                     <div className="text-2xl font-bold text-yellow-400">{tournamentStats.rating}</div>
                                     <div className="text-xs text-slate-500">Avg Rating</div>
                                 </div>
                             </div>
                         </div>
                         <button onClick={finishTournament} className="block mx-auto w-full max-w-xs bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition">
                             Return to Season Summary
                         </button>
                    </div>
                ) : (
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-center flex-1">
                                <div className="text-sm text-slate-500 font-bold uppercase">{player.nationality}</div>
                                <div className="text-3xl font-black">{matchResult ? matchResult.myScore : "?"}</div>
                            </div>
                            <div className="px-4 text-slate-600 font-bold text-xl">VS</div>
                            <div className="text-center flex-1">
                                <div className="text-sm text-slate-500 font-bold uppercase">{opponent}</div>
                                <div className="text-3xl font-black">{matchResult ? matchResult.oppScore : "?"}</div>
                            </div>
                        </div>

                        {matchResult ? (
                            <div className="animate-fade-in text-center">
                                 <div className="bg-slate-900/50 p-4 rounded-xl mb-6">
                                     <div className="text-yellow-400 font-bold text-xl mb-1">Rating: {matchResult.stats.rating}</div>
                                     <div className="text-sm font-mono text-slate-300 mb-2">Minutes Played: {matchResult.stats.minutes}'</div>
                                     <div className="text-sm text-slate-400">
                                         {matchResult.stats.goals > 0 && <span className="text-green-400 font-bold mr-2">{matchResult.stats.goals} Goals</span>}
                                         {matchResult.stats.assists > 0 && <span className="text-blue-400 font-bold">{matchResult.stats.assists} Assists</span>}
                                         {matchResult.stats.goals === 0 && matchResult.stats.assists === 0 && "No G/A contribution."}
                                     </div>
                                 </div>
                                 <button 
                                    onClick={handleNext}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
                                 >
                                     Next
                                 </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="mb-6 text-slate-400 text-sm font-mono uppercase">
                                    {stage === 'GROUP' ? `Group Match ${matchIndex + 1}` : stage}
                                </div>
                                <button 
                                    onClick={handleSimulateMatch}
                                    disabled={simulating}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {simulating ? "Playing Match..." : "Kick Off ⚽"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InternationalTournament;