
import React from 'react';
import { Offer, Club, OfferType, PromisedRole } from '../types';

interface Props {
    offers: Offer[];
    currentClub: Club;
    playerValue: number;
    currentWage: number;
    onSelectOffer: (offer: Offer) => void;
    isGenerating: boolean;
}

const TransferMarket: React.FC<Props> = ({ offers, currentClub, playerValue, currentWage, onSelectOffer, isGenerating }) => {
  
  // Create a "Renewal" offer representing staying at the club
  const renewalOffer: Offer = {
      id: 'renewal-offer',
      type: OfferType.RENEWAL,
      club: currentClub,
      wage: Math.round(currentWage * 1.1), // Slight raise for loyalty
      years: 3,
      transferFee: 0,
      description: "The club wants to extend your stay.",
      negotiable: true,
      promisedRole: PromisedRole.IMPORTANT
  };

  if (isGenerating) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
            <h2 className="text-2xl font-bold">Agents are working...</h2>
            <p className="text-slate-400">Fielding calls from clubs.</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-black text-white mb-2">Transfer Window</h1>
                <p className="text-slate-400">Market Value: <span className="text-green-400 font-mono font-bold">€{playerValue.toLocaleString()}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Renewal Card */}
                <div className="bg-slate-800 rounded-2xl border-2 border-blue-500/50 p-6 flex flex-col relative overflow-hidden shadow-lg shadow-blue-900/20">
                    <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg text-white">RENEWAL</div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-white">{currentClub.name}</h3>
                        <p className="text-slate-400 text-sm">{currentClub.league}</p>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Wage</span>
                                <span className="text-green-400 font-mono">€{renewalOffer.wage.toLocaleString()}/wk</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Contract</span>
                                <span className="text-white">{renewalOffer.years} Years</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 italic">"We want you to stay and build a legacy here."</p>
                    </div>
                    <button 
                        onClick={() => onSelectOffer(renewalOffer)}
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
                    >
                        Renew Contract
                    </button>
                </div>

                {/* Offers */}
                {offers.map((offer, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-green-500/30 hover:border-green-500 p-6 flex flex-col shadow-xl shadow-black/20 transition-all hover:-translate-y-1">
                        <div className="mb-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-bold text-white">{offer.club.name}</h3>
                                <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1 rounded">Str: {offer.club.strength}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold bg-green-900 text-green-300 px-2 py-0.5 rounded">{offer.club.league}</span>
                                <span className="text-xs text-slate-400">{offer.club.country}</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Wage</span>
                                    <span className="text-green-400 font-mono">€{offer.wage.toLocaleString()}/wk</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Contract</span>
                                    <span className="text-white">{offer.years} Years</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
                                    <span className="text-slate-500">Transfer Fee</span>
                                    <span className="text-yellow-500 font-mono">€{offer.transferFee.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 italic">"{offer.description}"</p>
                        </div>

                        <button 
                            onClick={() => onSelectOffer(offer)}
                            className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-900/50"
                        >
                            Sign Contract ✍️
                        </button>
                    </div>
                ))}

                {offers.length === 0 && (
                    <div className="md:col-span-2 flex items-center justify-center bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-10">
                        <p className="text-slate-500 font-medium">No incoming transfer offers. Only renewal available.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TransferMarket;
