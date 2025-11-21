
import React from 'react';
import { AppSettings, Currency } from '../types';

interface Props {
    settings: AppSettings;
    onUpdate: (newSettings: AppSettings) => void;
    onClose: () => void;
}

const OptionsMenu: React.FC<Props> = ({ settings, onUpdate, onClose }) => {
    
    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...settings, scale: parseFloat(e.target.value) });
    };

    const handleCurrencyChange = (curr: Currency) => {
        onUpdate({ ...settings, currency: curr });
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-600 p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-white">Game Options</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="space-y-8">
                    {/* UI Scale */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-300">UI Scale</label>
                            <span className="text-blue-400 font-mono">{Math.round(settings.scale * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.8" 
                            max="1.2" 
                            step="0.05" 
                            value={settings.scale} 
                            onChange={handleScaleChange}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Adjust the size of the game interface.</p>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="text-sm font-bold text-slate-300 mb-2 block">Currency</label>
                        <div className="flex bg-slate-900 p-1 rounded-lg">
                            {(['GBP', 'EUR', 'USD'] as Currency[]).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => handleCurrencyChange(c)}
                                    className={`flex-1 py-2 rounded text-xs font-bold transition ${
                                        settings.currency === c 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="mt-8">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OptionsMenu;
