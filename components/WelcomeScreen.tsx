
import React from 'react';
import { Player, PromisedRole } from '../types';
import { getContrastColor, adjustBrightness } from '../utils/gameLogic';

interface Props {
    player: Player;
    onContinue: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ player, onContinue }) => {
    const { currentClub, contract, name } = player;
    const primary = currentClub.primaryColor || '#1e293b';
    const secondary = currentClub.secondaryColor || '#ffffff';
    const contrast = getContrastColor(primary);
    
    // Derive darker background shade for texture
    const darkPrimary = adjustBrightness(primary, -40);

    const getManagerMessage = (role: PromisedRole) => {
        switch(role) {
            case PromisedRole.STAR: return "The fans are expecting miracles. You are the face of this club now. Lead us to glory.";
            case PromisedRole.IMPORTANT: return "You're going to be a key piece of our puzzle this season. We need consistent performances.";
            case PromisedRole.REGULAR: return "Work hard and the starting spot is yours. I believe in your ability.";
            case PromisedRole.ROTATION: return "We have a deep squad competing on many fronts. You'll get your chances, make them count.";
            case PromisedRole.BACKUP: return "We need depth to survive the season. Be ready when called upon, the team relies on everyone.";
            case PromisedRole.YOUTH: return "This is a great environment for you to learn and develop without too much pressure yet.";
            default: return "Welcome to the club. Show us what you've got.";
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: primary }}
        >
            {/* Background Texture */}
            <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                    backgroundImage: `radial-gradient(circle at 20% 30%, ${secondary} 0%, transparent 20%), radial-gradient(circle at 80% 70%, ${darkPrimary} 0%, transparent 20%)`,
                    backgroundSize: 'cover' 
                }}
            ></div>
            
            <div className="relative z-10 max-w-4xl w-full p-8">
                <div className="bg-slate-900/90 backdrop-blur-lg rounded-3xl shadow-2xl border-4 border-white/10 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="p-10 text-center relative overflow-hidden" style={{ backgroundColor: primary }}>
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center font-black text-[150px] leading-none select-none pointer-events-none text-white">
                            {currentClub.name.substring(0, 1)}
                        </div>
                        
                        <h1 
                            className="text-5xl md:text-7xl font-black uppercase tracking-tighter relative z-10 mb-2 drop-shadow-lg"
                            style={{ color: contrast }}
                        >
                            Welcome to <br/> {currentClub.name}
                        </h1>
                        <div className="inline-block px-4 py-1 rounded-full bg-black/20 backdrop-blur text-sm font-bold uppercase tracking-widest" style={{ color: contrast }}>
                            {currentClub.league} • {currentClub.country}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-10 text-center space-y-8">
                        <div>
                            <div className="w-24 h-24 mx-auto bg-slate-700 rounded-full border-4 border-slate-600 flex items-center justify-center text-4xl shadow-lg mb-4">
                                👔
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">A Word from the Manager</h2>
                            <div className="text-lg text-slate-300 italic max-w-2xl mx-auto leading-relaxed">
                                "{getManagerMessage(contract.promisedRole)}"
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-xs uppercase font-bold text-slate-500 mb-1">Your Role</div>
                                <div className="text-xl font-bold text-white">{contract.promisedRole}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-xs uppercase font-bold text-slate-500 mb-1">Weekly Wage</div>
                                <div className="text-xl font-bold text-green-400">€{contract.wage.toLocaleString()}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-xs uppercase font-bold text-slate-500 mb-1">Contract Length</div>
                                <div className="text-xl font-bold text-blue-400">{contract.yearsLeft} Years</div>
                            </div>
                        </div>

                        <button 
                            onClick={onContinue}
                            className="mt-8 px-10 py-4 bg-white hover:bg-slate-200 text-slate-900 font-black text-lg rounded-xl shadow-xl hover:scale-105 transition transform"
                        >
                            Meet the Squad ➡️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
