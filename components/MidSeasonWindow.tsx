
import React, { useState } from 'react';
import { Player, LeagueRow, SeasonStats, Offer, OfferType, PromisedRole, Club, ContractType, StatSet, Position, AppSettings } from '../types';
import { calculateStars, getPromisedRole, calculateForm, formatCurrency } from '../utils/gameLogic';
import { generateTransferOffers } from '../services/geminiService';
import { getClubsByTier } from '../utils/clubData';
import Negotiation from './Negotiation';

interface Props {
    player: Player;
    stats: SeasonStats;
    leagueTable: LeagueRow[];
    onContinue: (updatedPlayer: Player | null) => void; // null means no change
    currentYear: number;
    onSaveExit: () => void;
    onViewWorld: () => void;
    settings: AppSettings;
}

const MidSeasonWindow: React.FC<Props> = ({ player, stats, leagueTable, onContinue, currentYear, onSaveExit, onViewWorld, settings }) => {
    const [view, setView] = useState<'summary' | 'table' | 'offers'>('summary');
    const [activeStatTab, setActiveStatTab] = useState<'total' | 'league' | 'cup' | 'europe'>('total');
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [negotiatingOffer, setNegotiatingOffer] = useState<Offer | null>(null);
    const [requestMessage, setRequestMessage] = useState('');

    const clubName = player.currentClub.name;
    const isOnLoan = !!player.parentClub;
    
    const getActiveStats = (): StatSet => {
        switch(activeStatTab) {
            case 'league': return stats.league;
            case 'cup': return stats.cup;
            case 'europe': return stats.europe;
            default: return stats.total;
        }
    };

    const handleRequestTransfer = async (mode: 'TRANSFER' | 'LOAN') => {
        setLoadingOffers(true);
        setView('offers'); // Switch view immediately to show loading state
        setRequestMessage(mode === 'TRANSFER' ? "Agents contacted for permanent move." : "Looking for loan opportunities.");
        
        const generatedOffers: Offer[] = [];
        
        // Calculate current form for mid-season
        const currentForm = calculateForm(stats.total, player.position);

        // 1. Generate immediate local offers to ensure UI is responsive
        if (mode === 'LOAN') {
             const targetTier = Math.min(player.currentClub.tier + 1, 4);
             const clubs = getClubsByTier(targetTier).sort(() => 0.5 - Math.random()).slice(0, 3);
             clubs.forEach((c, i) => {
                generatedOffers.push({
                    id: `jan-loan-local-${i}`,
                    type: OfferType.LOAN,
                    club: c,
                    wage: player.contract.wage,
                    years: 1,
                    transferFee: 0,
                    description: "Need reinforcements for the second half.",
                    negotiable: false,
                    promisedRole: getPromisedRole(player.currentAbility, c.strength)
                });
             });
        } else {
            // Fallback Transfer Offer
            const clubs = getClubsByTier(Math.min(player.currentClub.tier, 4)).sort(() => 0.5 - Math.random()).slice(0, 1);
            clubs.forEach((c, i) => {
                generatedOffers.push({
                    id: `jan-transfer-local-${i}`,
                    type: OfferType.TRANSFER,
                    club: c,
                    wage: Math.round(player.contract.wage * 1.1),
                    years: 3,
                    transferFee: player.marketValue * 0.9,
                    description: "We need a squad player immediately.",
                    negotiable: true,
                    promisedRole: PromisedRole.ROTATION
                });
            });
        }

        // 2. Try to get Simulated offers if valuable enough
        if (mode === 'TRANSFER' && player.marketValue > 500000) {
            try {
                const scoutedOffers = await generateTransferOffers(
                    player.currentAbility, 
                    player.position, 
                    player.currentClub.tier, 
                    player.age, 
                    player.marketValue,
                    currentForm
                );
                if (scoutedOffers && scoutedOffers.length > 0) {
                    generatedOffers.push(...scoutedOffers);
                }
            } catch (e) {
                console.error("Failed to generate simulation offers", e);
            }
        }

        setOffers(generatedOffers);
        setLoadingOffers(false);
    };

    const handleAcceptLoanImmediate = (offer: Offer) => {
        let updatedPlayer = { ...player };
        updatedPlayer.parentClub = player.currentClub; 
        updatedPlayer.currentClub = offer.club;
        updatedPlayer.contract = {
            ...updatedPlayer.contract,
            promisedRole: offer.promisedRole
        };
        onContinue(updatedPlayer);
    };

    const handleNegotiationComplete = (wage: number, years: number, wageRise: number, successful: boolean) => {
        if (successful && negotiatingOffer) {
            let updatedPlayer = { ...player };
            
            if (negotiatingOffer.type === OfferType.TRANSFER) {
                updatedPlayer.currentClub = negotiatingOffer.club;
                updatedPlayer.parentClub = null; 
                updatedPlayer.isSurplus = false;
                updatedPlayer.contract = { 
                    wage, 
                    yearsLeft: years, 
                    expiryYear: currentYear + years,
                    type: ContractType.PROFESSIONAL,
                    promisedRole: negotiatingOffer.promisedRole,
                    yearlyWageRise: wageRise
                }; 
                onContinue(updatedPlayer);
            } else if (negotiatingOffer.type === OfferType.LOAN) {
                updatedPlayer.parentClub = player.currentClub; 
                updatedPlayer.currentClub = negotiatingOffer.club;
                updatedPlayer.contract = {
                    ...updatedPlayer.contract,
                    promisedRole: negotiatingOffer.promisedRole
                };
                onContinue(updatedPlayer);
            }
        }
        setNegotiatingOffer(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {negotiatingOffer && (
                 <Negotiation 
                    club={negotiatingOffer.club}
                    marketValue={player.marketValue}
                    playerAge={player.age}
                    currentWage={negotiatingOffer.wage}
                    isRenewal={false}
                    onCancel={() => setNegotiatingOffer(null)}
                    onComplete={handleNegotiationComplete}
                    settings={settings}
                />
            )}

            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <span className="text-blue-400">❄️</span> Mid-Season Window
                        </h1>
                        <p className="text-slate-400 text-sm">{clubName} • January {currentYear + 1}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onViewWorld} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition">
                            World Leagues 🌍
                        </button>
                        <button onClick={onSaveExit} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition">
                            Save & Exit 💾
                        </button>
                        <button onClick={() => onContinue(null)} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition shadow-lg shadow-green-900/50">
                            Continue Season ➡️
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
                {/* Sidebar Nav */}
                <div className="w-full md:w-64 space-y-2">
                    <button 
                        onClick={() => setView('summary')}
                        className={`w-full text-left p-3 rounded-xl font-bold transition ${view === 'summary' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Performance Report
                    </button>
                    <button 
                        onClick={() => setView('table')}
                        className={`w-full text-left p-3 rounded-xl font-bold transition ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        League Table
                    </button>
                    <button 
                        onClick={() => setView('offers')}
                        className={`w-full text-left p-3 rounded-xl font-bold transition ${view === 'offers' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Transfer Office
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    
                    {/* SUMMARY VIEW */}
                    {view === 'summary' && (
                        <div className="p-6 overflow-y-auto">
                            <h2 className="text-xl font-bold text-white mb-4">Half-Season Stats</h2>
                            <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg w-fit">
                                {(['total', 'league', 'cup', 'europe'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveStatTab(tab)}
                                        className={`px-4 py-1 rounded-md text-xs font-bold uppercase transition ${activeStatTab === tab ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-900 p-4 rounded-xl text-center">
                                    <div className="text-slate-500 text-xs font-bold uppercase">Matches</div>
                                    <div className="text-2xl font-bold text-white">{getActiveStats().matches}</div>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-xl text-center">
                                    <div className="text-slate-500 text-xs font-bold uppercase">{player.position === Position.GK ? 'Clean Sheets' : 'Goals'}</div>
                                    <div className="text-2xl font-bold text-green-400">{player.position === Position.GK ? getActiveStats().cleanSheets : getActiveStats().goals}</div>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-xl text-center">
                                    <div className="text-slate-500 text-xs font-bold uppercase">Assists</div>
                                    <div className="text-2xl font-bold text-blue-400">{getActiveStats().assists}</div>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-xl text-center">
                                    <div className="text-slate-500 text-xs font-bold uppercase">Rating</div>
                                    <div className="text-2xl font-bold text-yellow-400">{getActiveStats().rating}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-400">Domestic Cup</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${stats.cupStatus.includes('Eliminated') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                            {stats.cupStatus}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${stats.cupStatus.includes('Eliminated') ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-400">Continental</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${stats.europeStatus === 'Not Qualified' ? 'bg-slate-800 text-slate-500' : stats.europeStatus.includes('Eliminated') ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {stats.europeStatus}
                                        </span>
                                    </div>
                                    {stats.europeStatus !== 'Not Qualified' && (
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${stats.europeStatus.includes('Eliminated') ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: '50%' }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TABLE VIEW */}
                    {view === 'table' && (
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold sticky top-0">
                                    <tr>
                                        <th className="p-4 text-left">Pos</th>
                                        <th className="p-4 text-left">Club</th>
                                        <th className="p-4 text-center">P</th>
                                        <th className="p-4 text-center">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {leagueTable.map((row) => (
                                        <tr key={row.name} className={`${row.isPlayerClub ? 'bg-blue-900/20' : ''} hover:bg-slate-700/50`}>
                                            <td className={`p-4 font-bold ${row.position <= 4 ? 'text-green-400' : row.position >= 18 ? 'text-red-400' : 'text-slate-300'}`}>{row.position}</td>
                                            <td className={`p-4 font-bold ${row.isPlayerClub ? 'text-white' : 'text-slate-400'}`}>
                                                {row.name}
                                            </td>
                                            <td className="p-4 text-center text-slate-500">{row.played}</td>
                                            <td className="p-4 text-center font-bold text-white">{row.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* OFFERS VIEW */}
                    {view === 'offers' && (
                        <div className="p-6 flex flex-col h-full">
                            <div className="mb-6 flex gap-4">
                                <button 
                                    onClick={() => handleRequestTransfer('TRANSFER')}
                                    disabled={loadingOffers}
                                    className="flex-1 bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-100 py-4 rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    Request Transfer 📤
                                </button>
                                {isOnLoan ? (
                                    <div className="flex-1 bg-slate-800 border border-slate-600 text-slate-500 flex items-center justify-center rounded-xl font-bold">
                                        Cannot Loan (Already Loaned)
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleRequestTransfer('LOAN')}
                                        disabled={loadingOffers}
                                        className="flex-1 bg-yellow-900/50 hover:bg-yellow-900 border border-yellow-700 text-yellow-100 py-4 rounded-xl font-bold transition disabled:opacity-50"
                                    >
                                        Request Loan 🔄
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-700 p-4">
                                {loadingOffers ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
                                        <p>{requestMessage}</p>
                                    </div>
                                ) : offers.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-500 italic text-center">
                                        <p>No active offers. <br/>Request a move to alert other clubs.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Incoming Offers</h3>
                                        {offers.map((offer) => (
                                            <div key={offer.id} className="bg-slate-800 p-4 rounded-lg border border-slate-600 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-white">{offer.club.name}</div>
                                                    <div className="text-xs text-slate-400">{offer.type} • {offer.club.league}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-green-400 font-mono text-sm">{formatCurrency(offer.wage, settings.currency)}/wk</div>
                                                    <button 
                                                        onClick={() => {
                                                            if (offer.type === OfferType.LOAN) {
                                                                handleAcceptLoanImmediate(offer);
                                                            } else {
                                                                if (offer.negotiable !== false) setNegotiatingOffer(offer);
                                                                else {
                                                                    setNegotiatingOffer(offer);
                                                                    handleNegotiationComplete(offer.wage, offer.years, 0, true);
                                                                }
                                                            }
                                                        }}
                                                        className="mt-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                                                    >
                                                        {offer.type === OfferType.LOAN || offer.negotiable === false ? "Accept" : "Negotiate"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MidSeasonWindow;
