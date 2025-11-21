
import React, { useEffect, useState } from 'react';

interface Props {
    awards: string[];
    year: number;
    onFinish: () => void;
}

const AwardCeremony: React.FC<Props> = ({ awards, year, onFinish }) => {
    const [currentAwardIndex, setCurrentAwardIndex] = useState(-1);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Start sequence
        if (awards.length > 0) {
            setTimeout(() => setCurrentAwardIndex(0), 1000);
        } else {
            onFinish();
        }
    }, []);

    useEffect(() => {
        if (currentAwardIndex >= 0 && currentAwardIndex < awards.length) {
            setShowConfetti(true);
            const timer = setTimeout(() => {
                setShowConfetti(false);
                if (currentAwardIndex < awards.length - 1) {
                    setCurrentAwardIndex(prev => prev + 1);
                } else {
                    setTimeout(onFinish, 3000); // Wait a bit after last award
                }
            }, 4000); // Time per award
            return () => clearTimeout(timer);
        }
    }, [currentAwardIndex]);

    const currentAward = awards[currentAwardIndex];

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Spotlights */}
            <div className="absolute top-0 left-1/4 w-20 h-full bg-white/10 transform -skew-x-12 blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-1/4 w-20 h-full bg-white/10 transform skew-x-12 blur-3xl animate-pulse delay-700"></div>

            {/* Confetti Simple CSS implementation */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10px`,
                                animationDuration: `${Math.random() * 2 + 1}s`,
                                animationDelay: `${Math.random()}s`,
                                backgroundColor: ['#fcd34d', '#fbbf24', '#f59e0b', '#ffffff'][Math.floor(Math.random() * 4)]
                            }}
                        ></div>
                    ))}
                </div>
            )}

            <div className="relative z-10 text-center space-y-8 p-4">
                <h1 className="text-3xl text-slate-400 font-serif tracking-widest uppercase border-b border-slate-600 pb-4">
                    {year} Season Awards
                </h1>

                {currentAward && (
                    <div className="animate-fade-in-up transition-all duration-500 transform scale-100">
                        <div className="text-6xl mb-6 animate-bounce">🏆</div>
                        <div className="text-yellow-500 font-black text-4xl md:text-6xl mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            {currentAward}
                        </div>
                        <div className="text-white text-xl font-light">Winner</div>
                    </div>
                )}
                
                {currentAwardIndex === -1 && (
                    <div className="text-white animate-pulse">The ceremony is about to begin...</div>
                )}
            </div>
            
            {currentAwardIndex >= 0 && (
                <button 
                    onClick={onFinish}
                    className="absolute bottom-10 text-slate-500 hover:text-white text-xs uppercase tracking-widest border border-slate-700 px-4 py-2 rounded-full transition"
                >
                    Skip Ceremony
                </button>
            )}
        </div>
    );
};

export default AwardCeremony;
