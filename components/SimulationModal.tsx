
import React, { useEffect, useState } from 'react';

interface Props {
    title: string;
    subtitles: string[];
}

const SimulationModal: React.FC<Props> = ({ title, subtitles }) => {
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitles[0]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % subtitles.length;
            setCurrentSubtitle(subtitles[i]);
        }, 800);
        return () => clearInterval(interval);
    }, [subtitles]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white">
            <div className="w-24 h-24 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin mb-8 shadow-2xl shadow-green-500/20"></div>
            <h2 className="text-3xl font-black mb-2 tracking-tight animate-pulse">{title}</h2>
            <p className="text-slate-400 font-mono text-sm">{currentSubtitle}</p>
        </div>
    );
};

export default SimulationModal;
