
import React, { useState, useEffect } from 'react';
import { Club, Offer } from '../types';

interface Props {
    club: Club;
    marketValue: number;
    playerAge: number;
    currentWage: number;
    onComplete: (wage: number, years: number, wageRise: number, successful: boolean) => void;
    onCancel: () => void;
    isRenewal: boolean;
    initialPatience?: number;
}

const Negotiation: React.FC<Props> = ({ club, marketValue, playerAge, currentWage, onComplete, onCancel, isRenewal, initialPatience = 3 }) => {
    // Initial Offer Logic
    const baseWageOffer = isRenewal ? Math.round(currentWage * 1.1) : Math.round(marketValue / 500); // Rough heuristic
    
    const [wage, setWage] = useState(baseWageOffer);
    const [years, setYears] = useState(isRenewal ? 2 : 3);
    const [wageRise, setWageRise] = useState(0);

    const [clubPatience, setClubPatience] = useState(initialPatience); 
    const [clubOffer, setClubOffer] = useState({ wage: baseWageOffer, years: isRenewal ? 2 : 3, wageRise: 0 });
    const [message, setMessage] = useState(isRenewal ? "We'd love to keep you." : "We are interested in your services.");
    const [status, setStatus] = useState<'active' | 'accepted' | 'rejected' | 'countered'>('active');

    const MAX_YEARS = isRenewal ? 8 : 5; // Constraint: New transfers max 5 years

    const handleSubmit = () => {
        // Negotiation Logic
        const maxWage = Math.round(baseWageOffer * 1.4); 
        const maxRise = 10; // Club rarely gives more than 10% rise

        // Perfect match
        if (wage <= clubOffer.wage && years === clubOffer.years && wageRise <= clubOffer.wageRise) {
            setStatus('accepted');
            setMessage("We are happy to accept those terms. Welcome aboard!");
            setTimeout(() => onComplete(wage, years, wageRise, true), 1500);
            return;
        }

        // Decrease patience
        const newPatience = clubPatience - 1;
        setClubPatience(newPatience);

        if (newPatience <= 0) {
            setStatus('rejected');
            setMessage("We are growing tired of this. The deal is off.");
            setTimeout(() => onComplete(0, 0, 0, false), 2000);
            return;
        }

        // Club Counter Logic
        let newClubWage = clubOffer.wage;
        let newClubRise = clubOffer.wageRise;
        let msg = "";

        // If user asks for crazy wage
        if (wage > maxWage) {
            msg = "That wage is simply too high for our budget.";
            newClubWage = Math.min(maxWage, clubOffer.wage + (maxWage - clubOffer.wage) / 2);
        } else {
            // Meet in the middle
            newClubWage = Math.round((clubOffer.wage + wage) / 2);
        }

        // If user asks for crazy rise
        if (wageRise > maxRise) {
            msg = msg || "We cannot sustain that kind of yearly increase.";
            newClubRise = Math.min(maxRise, Math.ceil((clubOffer.wageRise + wageRise) / 2));
        } else {
             newClubRise = Math.max(clubOffer.wageRise, wageRise); // Usually accept rise if reasonable
        }

        if (!msg) msg = "We can improve our offer, but that is our limit.";

        setStatus('countered');
        setClubOffer({ wage: newClubWage, years: years, wageRise: newClubRise });
        setMessage(msg);
    };

    const acceptClubOffer = () => {
        setStatus('accepted');
        setMessage("Excellent. We look forward to working with you.");
        setTimeout(() => onComplete(clubOffer.wage, clubOffer.years, clubOffer.wageRise, true), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-600 flex flex-col max-h-[90vh]">
                <div className="bg-slate-700 p-4 flex items-center gap-4 border-b border-slate-600 shrink-0">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold text-slate-900">
                        {club.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Contract Negotiation</h2>
                        <p className="text-slate-300 text-sm">{club.name}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Agent/Club Message */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 relative mt-2">
                        <div className="absolute -top-3 left-4 bg-blue-600 text-xs px-2 py-1 rounded text-white font-bold uppercase">
                            {club.name} Rep
                        </div>
                        <p className={`italic ${status === 'rejected' ? 'text-red-400' : 'text-blue-200'}`}>
                            "{message}"
                        </p>
                    </div>

                    {/* Current Offer Table */}
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        status === 'countered' 
                        ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                        : 'bg-slate-700/30 border-slate-600'
                    }`}>
                         {status === 'countered' && (
                             <div className="mb-2 flex justify-center">
                                 <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                     New Counter Offer
                                 </span>
                             </div>
                         )}
                        <div className="flex justify-between items-center text-center gap-2">
                            <div className="flex-1">
                                <div className="text-xs uppercase text-slate-500 font-bold mb-1">Wage</div>
                                <div className={`text-xl font-mono font-bold ${status === 'countered' ? 'text-orange-400' : 'text-green-400'}`}>
                                    €{clubOffer.wage.toLocaleString()}/wk
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-600"></div>
                            <div className="flex-1">
                                <div className="text-xs uppercase text-slate-500 font-bold mb-1">Length</div>
                                <div className="text-lg font-mono text-white">{clubOffer.years} Years</div>
                            </div>
                            <div className="w-px h-8 bg-slate-600"></div>
                            <div className="flex-1">
                                <div className="text-xs uppercase text-slate-500 font-bold mb-1">Yearly Rise</div>
                                <div className="text-lg font-mono text-blue-400">{clubOffer.wageRise}%</div>
                            </div>
                        </div>
                    </div>

                    {status !== 'accepted' && status !== 'rejected' && (
                        <div className="space-y-5 pt-2">
                            {/* WAGE SLIDER */}
                            <div>
                                <label className="flex justify-between text-sm text-slate-300 mb-2 font-semibold">
                                    <span>Wage Request</span>
                                    <span className="text-white">€{wage.toLocaleString()}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min={baseWageOffer * 0.8} 
                                    max={baseWageOffer * 3} 
                                    step={250}
                                    value={wage} 
                                    onChange={(e) => setWage(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400"
                                />
                            </div>

                             {/* WAGE RISE SLIDER */}
                             <div>
                                <label className="flex justify-between text-sm text-slate-300 mb-2 font-semibold">
                                    <span>Yearly Wage Rise %</span>
                                    <span className="text-blue-400">{wageRise}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={20} 
                                    step={1}
                                    value={wageRise} 
                                    onChange={(e) => setWageRise(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                                />
                            </div>

                            {/* YEARS BUTTONS */}
                            <div>
                                <label className="flex justify-between text-sm text-slate-300 mb-2 font-semibold">
                                    <span>Contract Length</span>
                                    <span className="text-white">{years} Years</span>
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({length: MAX_YEARS}, (_, i) => i + 1).map(y => (
                                        <button 
                                            key={y}
                                            onClick={() => setYears(y)}
                                            className={`flex-1 min-w-[40px] py-3 rounded-lg text-sm font-bold border transition ${
                                                years === y 
                                                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/50' 
                                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                                            }`}
                                        >
                                            {y}y
                                        </button>
                                    ))}
                                </div>
                                {!isRenewal && (
                                    <p className="text-xs text-slate-500 mt-2 text-center">
                                        *New signings are limited to a maximum of 5 years.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-xs font-bold text-slate-400 uppercase">Club Patience</span>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].slice(0, initialPatience).map(i => (
                                        <div key={i} className={`w-3 h-3 rounded-full transition-colors duration-300 ${i <= clubPatience ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-700/50 border-t border-slate-600 flex gap-3 shrink-0">
                    {status !== 'accepted' && status !== 'rejected' ? (
                        <>
                            <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition border border-transparent hover:border-slate-500">
                                Walk Away
                            </button>
                            <button onClick={acceptClubOffer} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/50">
                                Accept
                            </button>
                            <button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-900/50">
                                Counter
                            </button>
                        </>
                    ) : (
                        <button onClick={() => status === 'rejected' ? onCancel() : null} className="w-full bg-slate-600 text-white font-bold py-4 rounded-xl hover:bg-slate-500 transition">
                            {status === 'rejected' ? "Close Negotiation" : "Signing Contract..."}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Negotiation;
