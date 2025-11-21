
import React, { useState, useEffect } from 'react';
import { Player, Offer, OfferType, Club, Position, PromisedRole, ContractType, SeasonRecord } from '../types';
import { generateTransferOffers } from '../services/geminiService';
import { getClubsByTier, FREE_AGENT_CLUB, REAL_CLUBS } from '../utils/clubData';
import { getRandomInt, calculateStars, getPromisedRole, isSurplusToRequirements, calculateMarketValue } from '../utils/gameLogic';
import Negotiation from './Negotiation';
import SeasonSummary from './SeasonSummary';

interface Props {
    player: Player;
    lastSeason: SeasonRecord | null;
    onStartSeason: (updatedPlayer: Player) => void;
    onUpdatePlayer: (updatedPlayer: Player) => void;
    onSaveExit: () => void;
    isGenerating: boolean;
}

const PreSeasonHub: React.FC<Props> = ({ player, lastSeason, onStartSeason, onUpdatePlayer, onSaveExit, isGenerating }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'transfer'>('overview');
    const [managerMessage, setManagerMessage] = useState('');
    const [estimatedApps, setEstimatedApps] = useState(0);
    const [squadStatus, setSquadStatus] = useState('');
    const [offers, setOffers] = useState<Offer[]>([]);
    const [negotiatingOffer, setNegotiatingOffer] = useState<Offer | null>(null);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [generatedOffers, setGeneratedOffers] = useState(false);
    const [negotiationPatience, setNegotiationPatience] = useState(3); 
    const [showLastSeasonStats, setShowLastSeasonStats] = useState(false);
    const [isSurplus, setIsSurplus] = useState(false);

    const playerStars = calculateStars(player.currentAbility);
    const isOnLoan = !!player.parentClub;
    const isOutOfContract = player.contract.yearsLeft <= 0;
    const isFreeAgent = player.currentClub.name === "Free Agent";

    useEffect(() => {
        // Handle Free Agent case specifically
        if (isFreeAgent) {
            setManagerMessage("You are currently without a club. Find a team or risk your career fading away.");
            setSquadStatus("Free Agent");
            setEstimatedApps(0);
            if (!generatedOffers) fetchOffers(false, false);
            return;
        }

        // Check for Surplus Status
        const surplus = isSurplusToRequirements(player, lastSeason?.stats);
        setIsSurplus(surplus);
        if (surplus) {
            setManagerMessage("Listen, you're surplus to requirements. You're not in my plans. Find a new club or rot in the reserves.");
            setSquadStatus("Surplus (Forced Out)");
            setEstimatedApps(0);
            
            if (!generatedOffers) {
                fetchOffers(false, true); 
            }
            return;
        }

        const role = getPromisedRole(player.currentAbility, player.currentClub.strength);
        let msg = "";
        if (role === PromisedRole.STAR) msg = "You are the star of this team. Lead us.";
        else if (role === PromisedRole.IMPORTANT) msg = "You're a key part of my plans.";
        else if (role === PromisedRole.REGULAR) msg = "Expect plenty of game time if you perform.";
        else if (role === PromisedRole.ROTATION) msg = "You'll need to fight for your spot.";
        else if (role === PromisedRole.BACKUP) msg = "You're a backup option for now.";
        else msg = "You're not ready for senior football yet. Stick to the U21s.";

        setSquadStatus(role);
        
        let apps = 0;
        switch (role) {
            case PromisedRole.STAR: apps = 45; break;
            case PromisedRole.IMPORTANT: apps = 38; break;
            case PromisedRole.REGULAR: apps = 30; break;
            case PromisedRole.ROTATION: apps = 18; break;
            case PromisedRole.BACKUP: apps = 8; break;
            case PromisedRole.YOUTH: apps = 0; break;
        }

        setEstimatedApps(apps);
        setManagerMessage(msg);
        
        if (isOutOfContract && !generatedOffers) {
            fetchOffers(false, false);
        }
    }, [player]);

    const fetchOffers = async (forceLoan: boolean = false, forcedOut: boolean = false) => {
        setLoadingOffers(true);
        
        const staticOffers: Offer[] = [];
        
        // Logic: If out of contract, CANNOT get loans. Only transfers.
        const canLoan = !isOutOfContract && !isFreeAgent && !forcedOut;
        
        // Widen the criteria for "Should Generate"
        const shouldGenerateLowTier = forceLoan || forcedOut || (squadStatus === PromisedRole.YOUTH || squadStatus === PromisedRole.BACKUP) || isOutOfContract || isFreeAgent;
        
        if (shouldGenerateLowTier) {
            // LOAN ACCESSIBILITY UPDATE:
            // If forcing loan, look deeper down the pyramid (up to 3 tiers below) to guarantee interest
            const currentTier = player.currentClub.tier;
            let eligibleClubs: Club[] = [];

            if (forceLoan) {
                 // Look for clubs from current tier down to current + 3 (min Tier 1, max Tier 5)
                 // e.g. if in PL (Tier 1), look at Tier 2, 3, 4
                 const minTargetTier = Math.min(currentTier, 4); // Can go sideways if low enough
                 const maxTargetTier = Math.min(currentTier + 3, 5);
                 
                 eligibleClubs = REAL_CLUBS.filter(c => c.tier >= minTargetTier && c.tier <= maxTargetTier && c.name !== player.currentClub.name);
            } else if (isFreeAgent) {
                 // Free agents look everywhere lower than top tier generally, unless star
                 eligibleClubs = REAL_CLUBS.filter(c => c.tier >= 3);
            } else {
                 // Standard logic for backups looking for moves
                 const targetTier = Math.min(currentTier + 1, 4);
                 eligibleClubs = getClubsByTier(targetTier);
            }

            // Select 5-6 clubs instead of 3 to give more choice
            const randomClubs = eligibleClubs.sort(() => 0.5 - Math.random()).slice(0, 6);
            
            const offerType = (forcedOut || isOutOfContract || isFreeAgent) ? OfferType.TRANSFER : OfferType.LOAN;
            
            if (forceLoan && !canLoan) {
                // Cannot loan
            } else {
                randomClubs.forEach((c, i) => {
                    const role = getPromisedRole(player.currentAbility, c.strength);
                    staticOffers.push({
                        id: `offer-${i}`,
                        type: offerType, 
                        club: c,
                        wage: isFreeAgent ? 500 : player.contract.wage, 
                        years: offerType === OfferType.TRANSFER ? 2 : 1,
                        transferFee: 0,
                        description: offerType === OfferType.TRANSFER ? "We can give you a fresh start." : "We can offer you the game time you need.",
                        negotiable: offerType === OfferType.TRANSFER,
                        promisedRole: role,
                        yearlyWageRise: 0
                    });
                });
            }
        }

        let scoutedOffers: Offer[] = [];
        // Simulation Offers mainly for transfers if value high
        if ((!forceLoan || isOutOfContract || isFreeAgent) && player.marketValue > 500000) {
             scoutedOffers = await generateTransferOffers(
                player.currentAbility,
                player.position,
                isFreeAgent ? 3 : player.currentClub.tier,
                player.age,
                player.marketValue,
                player.form,
                player.potentialAbility
            );
        }

        // Remove duplicates by club name
        const combined = [...staticOffers, ...scoutedOffers];
        const uniqueOffers = combined.filter((offer, index, self) => 
            index === self.findIndex((t) => (
                t.club.name === offer.club.name
            ))
        );

        setOffers(uniqueOffers);
        setLoadingOffers(false);
        setGeneratedOffers(true);
        if (!forcedOut && !isFreeAgent) setActiveTab('transfer');
    };

    const handleStay = () => {
        if (player.contract.yearsLeft <= 0) {
            alert("Your contract has expired! You must sign a new deal or leave.");
            return;
        }
        const updatedPlayer = { ...player, isSurplus: isSurplus };
        onStartSeason(updatedPlayer);
    };

    const handleGoFreeAgent = () => {
        if (!isFreeAgent && !confirm("Are you sure? You will spend 6 months without a club. Attributes will decline, and body load will increase due to stress.")) return;

        const freeAgentPlayer: Player = {
            ...player,
            currentClub: FREE_AGENT_CLUB,
            parentClub: null,
            contract: {
                ...player.contract,
                yearsLeft: 0,
                wage: 0,
                expiryYear: 0,
                type: ContractType.PROFESSIONAL
            },
            isSurplus: false
        };
        onStartSeason(freeAgentPlayer);
    };

    const handleRenewalStart = () => {
        const yearsLeft = player.contract.yearsLeft;
        if (yearsLeft >= 4) {
            alert("The board refuses to enter negotiations. You recently signed a long-term deal.");
            return;
        }
        
        if (isSurplus) {
            alert("The manager refuses to renew your contract. 'We are trying to get rid of you!'");
            return;
        }

        let patience = 3;
        if (yearsLeft === 3) patience = 1; 
        else if (yearsLeft === 2) patience = 2; 
        else patience = 4; 

        setNegotiationPatience(patience);

        setNegotiatingOffer({
            id: 'renew', 
            type: OfferType.RENEWAL, 
            club: player.parentClub || player.currentClub, 
            wage: player.contract.wage, 
            years: 1, 
            transferFee: 0, 
            description: 'Renewal', 
            negotiable: true,
            promisedRole: squadStatus as PromisedRole,
            yearlyWageRise: player.contract.yearlyWageRise
        });
    };

    const handleLoanExtension = () => {
         setNegotiatingOffer({
            id: 'extend-loan',
            type: OfferType.EXTENSION,
            club: player.currentClub,
            wage: player.contract.wage, 
            years: 1,
            transferFee: 0,
            description: 'Extend loan for another season',
            negotiable: false,
            promisedRole: squadStatus as PromisedRole
         });
    };

    const handleAcceptLoanImmediate = (offer: Offer) => {
        // Immediate acceptance for loans
        let updatedPlayer = { ...player };
        updatedPlayer.parentClub = player.currentClub; 
        updatedPlayer.currentClub = offer.club;
        updatedPlayer.isSurplus = false;
        updatedPlayer.contract = {
            ...updatedPlayer.contract,
            promisedRole: offer.promisedRole
        };
        onStartSeason(updatedPlayer);
    };

    const handleNegotiationComplete = (wage: number, years: number, wageRise: number, successful: boolean) => {
        if (successful && negotiatingOffer) {
            const isLoan = negotiatingOffer.type === OfferType.LOAN;
            
            let updatedPlayer = { ...player };

            if (negotiatingOffer.type === OfferType.TRANSFER) {
                updatedPlayer.currentClub = negotiatingOffer.club;
                updatedPlayer.parentClub = null; 
                updatedPlayer.isSurplus = false; 
                updatedPlayer.contract = { 
                    wage, 
                    yearsLeft: years, 
                    expiryYear: isFreeAgent ? new Date().getFullYear() + years : player.contract.expiryYear + years, 
                    type: ContractType.PROFESSIONAL,
                    promisedRole: negotiatingOffer.promisedRole,
                    yearlyWageRise: wageRise
                }; 
                onStartSeason(updatedPlayer);
            } else if (isLoan) {
                updatedPlayer.parentClub = player.currentClub; 
                updatedPlayer.currentClub = negotiatingOffer.club;
                updatedPlayer.isSurplus = false;
                updatedPlayer.contract = {
                    ...updatedPlayer.contract,
                    promisedRole: negotiatingOffer.promisedRole
                };
                onStartSeason(updatedPlayer);
            } else if (negotiatingOffer.type === OfferType.RENEWAL) {
                 updatedPlayer.contract = { 
                     wage, 
                     yearsLeft: years, 
                     expiryYear: 0,
                     type: ContractType.PROFESSIONAL, 
                     promisedRole: negotiatingOffer.promisedRole,
                     yearlyWageRise: wageRise
                 }; 
                 updatedPlayer.isSurplus = false;
                 updatedPlayer.marketValue = calculateMarketValue(updatedPlayer.currentAbility, updatedPlayer.age, updatedPlayer.potentialAbility, updatedPlayer.position, years);
                 
                 // Update player in place, clear offers (as they might have been for expired contract)
                 onUpdatePlayer(updatedPlayer);
                 setOffers([]);
                 setGeneratedOffers(false);
                 setActiveTab('overview');
            } else if (negotiatingOffer.type === OfferType.EXTENSION) {
                 // Just keep current setup, logic handles year decrement naturally next season or reset expiry
                 onStartSeason(updatedPlayer);
            }
        }
        setNegotiatingOffer(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6 flex flex-col">
            {/* Last Season Stats Modal */}
            {showLastSeasonStats && lastSeason && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setShowLastSeasonStats(false)}></div>
                    <div className="relative w-full max-w-3xl h-[90vh]">
                         <SeasonSummary 
                            seasonData={lastSeason} 
                            narrative="Reviewing stats..." 
                            growthLog="" 
                            onContinue={() => setShowLastSeasonStats(false)}
                        />
                         <button 
                            onClick={() => setShowLastSeasonStats(false)}
                            className="absolute top-4 right-4 bg-white/10 text-white p-2 rounded-full hover:bg-white/20"
                         >✕</button>
                    </div>
                 </div>
            )}

            {negotiatingOffer && (
                <Negotiation 
                    club={negotiatingOffer.club}
                    marketValue={player.marketValue}
                    playerAge={player.age}
                    currentWage={negotiatingOffer.type === OfferType.RENEWAL ? player.contract.wage : negotiatingOffer.wage}
                    isRenewal={negotiatingOffer.type === OfferType.RENEWAL}
                    onCancel={() => setNegotiatingOffer(null)}
                    onComplete={handleNegotiationComplete}
                    initialPatience={negotiationPatience}
                />
            )}

            <header className="mb-8 border-b border-slate-700 pb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2">Pre-Season Office</h1>
                        
                        {/* Player Identity Strip */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-300 text-xs">
                                    {player.position.substring(0,3)}
                                </div>
                                <span className="font-bold text-white text-xl">{player.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <span className="text-slate-400">Age:</span>
                                <span className="text-white font-bold">{player.age}</span>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <span className="text-slate-400">Club:</span>
                                <span className={`font-bold ${player.currentClub.name === 'Free Agent' ? 'text-yellow-500' : 'text-white'}`}>
                                    {player.currentClub.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <span className="text-slate-400">Nat:</span>
                                <span className="text-white">{player.nationality}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                         {/* Actions */}
                        <div className="flex items-center gap-2">
                            {lastSeason && (
                                <button 
                                    onClick={() => setShowLastSeasonStats(true)}
                                    className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition flex items-center gap-1"
                                >
                                    <span>📊</span> Last Season
                                </button>
                            )}
                            <button onClick={onSaveExit} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition text-xs font-bold flex items-center gap-1">
                                💾 Save
                            </button>
                        </div>
                        
                        {/* Contract Status */}
                        <div className={`text-right px-3 py-1 rounded border ${player.contract.yearsLeft === 0 ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="text-[10px] uppercase text-slate-500 font-bold">Contract Status</div>
                            <div className={`font-mono font-bold text-sm ${player.contract.yearsLeft === 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                                {player.contract.yearsLeft === 0 ? "EXPIRED" : `${player.contract.yearsLeft} Years Left`}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex gap-6 flex-1 flex-col md:flex-row">
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 space-y-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left p-4 rounded-xl font-bold transition ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Manager Meeting
                    </button>
                    <button 
                        onClick={() => { setActiveTab('transfer'); if(!generatedOffers) fetchOffers(); }}
                        className={`w-full text-left p-4 rounded-xl font-bold transition ${activeTab === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Transfer Center
                        {isSurplus && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Action Req</span>}
                        {isFreeAgent && <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">Urgent</span>}
                    </button>
                    
                    {/* Quick Action: Request Loan - Disabled if out of contract */}
                    {!isOnLoan && !isOutOfContract && !isFreeAgent && (
                        <button 
                            onClick={() => fetchOffers(true)}
                            className="w-full text-left p-4 rounded-xl font-bold bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-600/30 mt-8"
                        >
                            Request Loan Move
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-slate-800 rounded-2xl p-8 border border-slate-700">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                             <div className="flex items-start gap-6">
                                 <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center text-3xl">👔</div>
                                 <div className={`bg-slate-700/50 p-6 rounded-2xl rounded-tl-none border flex-1 ${isSurplus ? 'border-red-500 bg-red-900/10' : 'border-slate-600'}`}>
                                     <h3 className={`text-sm font-bold uppercase mb-2 ${isSurplus ? 'text-red-400' : 'text-slate-300'}`}>The Boss says:</h3>
                                     <p className="text-white text-lg italic">"{managerMessage}"</p>
                                     {isOutOfContract && !isFreeAgent && (
                                         <p className="text-red-400 text-sm font-bold mt-2">"Your contract is up. Sign a new one or clear out your locker."</p>
                                     )}
                                 </div>
                             </div>

                             {!isFreeAgent && (
                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="bg-slate-900 p-6 rounded-xl">
                                         <div className="text-slate-500 text-xs uppercase font-bold">Projected Role</div>
                                         <div className={`text-2xl font-bold ${isSurplus ? 'text-red-500' : squadStatus === PromisedRole.YOUTH ? 'text-slate-400' : 'text-green-400'}`}>{squadStatus}</div>
                                     </div>
                                     <div className="bg-slate-900 p-6 rounded-xl">
                                         <div className="text-slate-500 text-xs uppercase font-bold">Est. Appearances</div>
                                         <div className="text-2xl font-bold text-white">{estimatedApps} <span className="text-sm text-slate-500">{squadStatus === PromisedRole.YOUTH ? 'U21 Games' : 'Senior Games'}</span></div>
                                     </div>
                                 </div>
                             )}
                             
                             {/* Form Display in PreSeason */}
                             <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                                 <div className="text-slate-500 text-xs uppercase font-bold">Recent Form</div>
                                 <div className={`text-2xl font-bold ${player.form > 75 ? 'text-green-400' : player.form < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                                     {player.form} <span className="text-sm text-slate-500">/ 100</span>
                                 </div>
                                 {player.form > 70 && <p className="text-green-400 text-xs mt-1">High form may attract interest from better clubs!</p>}
                             </div>

                             <div className="pt-8 border-t border-slate-700 space-y-3">
                                 {!isFreeAgent && (
                                     <button 
                                        onClick={handleStay}
                                        disabled={isOutOfContract}
                                        className={`w-full py-4 font-black rounded-xl transition ${isSurplus ? 'bg-red-900/30 text-red-200 border border-red-600 hover:bg-red-900/50' : 'bg-white text-slate-900 hover:bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                     >
                                         {isSurplus ? "Refuse Transfer (Rot in Reserves)" : "Start Season with Current Squad"}
                                     </button>
                                 )}
                                 
                                 {(isOutOfContract || isFreeAgent || isSurplus) && (
                                     <button 
                                        onClick={handleGoFreeAgent}
                                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition border border-dashed border-slate-500"
                                     >
                                         {isFreeAgent ? "Remain Free Agent (Simulate 6 Months)" : "Leave & Become Free Agent (6 Months)"}
                                     </button>
                                 )}

                                 {/* Loan Extension */}
                                 {player.parentClub && (
                                     <button 
                                        onClick={handleLoanExtension}
                                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition"
                                     >
                                         Extend Loan for 1 More Season
                                     </button>
                                 )}

                                 {/* Renewal Button */}
                                 {!isFreeAgent && (
                                     <button 
                                        onClick={handleRenewalStart}
                                        disabled={isSurplus}
                                        className="w-full py-3 bg-transparent border-2 border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                     >
                                         Negotiate Contract Renewal {player.parentClub ? '(Parent Club)' : ''}
                                     </button>
                                 )}
                             </div>
                        </div>
                    )}

                    {activeTab === 'transfer' && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6">Available Offers</h2>
                            {loadingOffers ? (
                                <div className="text-slate-400 animate-pulse">Contacting agents...</div>
                            ) : (
                                <div className="space-y-4">
                                    {offers.length === 0 && <div className="text-slate-500">No offers on the table.</div>}
                                    
                                    {offers.map((offer) => {
                                        const offerStars = calculateStars(offer.club.strength);
                                        return (
                                        <div key={offer.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-white text-lg">{offer.club.name}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${offer.type === OfferType.LOAN ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}`}>
                                                        {offer.type}
                                                    </span>
                                                    <div className="flex text-yellow-500 text-xs">
                                                        {[...Array(Math.floor(offerStars))].map((_,i)=><span key={i}>★</span>)}
                                                    </div>
                                                    <span className="text-xs text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded">Str: {offer.club.strength}</span>
                                                </div>
                                                <p className="text-slate-400 text-sm">{offer.club.league} • {offer.club.country}</p>
                                                <div className="mt-2 text-sm text-yellow-400 font-semibold">
                                                    Role: {offer.promisedRole}
                                                </div>
                                                <p className="text-slate-500 text-xs mt-1">"{offer.description}"</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-green-400 font-mono">€{offer.wage.toLocaleString()}/wk</div>
                                                {offer.type === OfferType.TRANSFER && <div className="text-slate-500 text-xs">Fee: €{offer.transferFee.toLocaleString()}</div>}
                                                {offer.type === OfferType.LOAN && <div className="text-slate-500 text-xs">Duration: 1 Year</div>}
                                                <button 
                                                    onClick={() => {
                                                        if (offer.type === OfferType.LOAN) {
                                                            handleAcceptLoanImmediate(offer);
                                                        } else {
                                                            setNegotiationPatience(3); 
                                                            if (offer.negotiable !== false) {
                                                                setNegotiatingOffer(offer);
                                                            } else {
                                                                setNegotiatingOffer(offer);
                                                                handleNegotiationComplete(offer.wage, offer.years, 0, true);
                                                            }
                                                        }
                                                    }}
                                                    className="mt-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
                                                >
                                                    {offer.type === OfferType.LOAN || offer.negotiable === false ? "Accept" : "Negotiate"}
                                                </button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreSeasonHub;
