
import { Position, Player, Club, SeasonStats, StatSet, PromisedRole, ContractType, LeagueRow, WorldTables, Currency, ContinentalTier } from "../types";
import { REAL_CLUBS, FREE_AGENT_CLUB, generateFillerClub } from "./clubData";

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- CURRENCY HELPERS ---
export const formatCurrency = (amount: number, currency: Currency): string => {
    let val = amount;
    let symbol = '£';

    if (currency === 'EUR') {
        val = amount * 1.15;
        symbol = '€';
    } else if (currency === 'USD') {
        val = amount * 1.25;
        symbol = '$';
    }

    // Format with commas
    return `${symbol}${Math.round(val).toLocaleString()}`;
};

// --- WORLD GENERATION & PERSISTENCE ---

// Defines the hierarchy of leagues for promotion/relegation
const LEAGUE_HIERARCHY: Record<string, { tier: number, parent?: string, child?: string, size: number }> = {
    "Premier League": { tier: 1, child: "Championship", size: 20 },
    "Championship": { tier: 2, parent: "Premier League", child: "League One", size: 24 },
    "League One": { tier: 3, parent: "Championship", child: "League Two", size: 24 },
    "League Two": { tier: 4, parent: "League One", child: "National League", size: 24 },
    "National League": { tier: 5, parent: "League Two", size: 24 },
    
    "La Liga": { tier: 1, child: "La Liga 2", size: 20 },
    "La Liga 2": { tier: 2, parent: "La Liga", child: "Primera Fed", size: 22 },
    "Primera Fed": { tier: 3, parent: "La Liga 2", size: 20 },

    "Bundesliga": { tier: 1, child: "Bundesliga 2", size: 18 },
    "Bundesliga 2": { tier: 2, parent: "Bundesliga", child: "3. Liga", size: 18 },
    "3. Liga": { tier: 3, parent: "Bundesliga 2", size: 20 },

    "Serie A": { tier: 1, child: "Serie B", size: 20 },
    "Serie B": { tier: 2, parent: "Serie A", child: "Serie C", size: 20 },
    "Serie C": { tier: 3, parent: "Serie B", size: 20 },

    "Ligue 1": { tier: 1, child: "Ligue 2", size: 18 },
    "Ligue 2": { tier: 2, parent: "Ligue 1", child: "National 1", size: 20 },
    "National 1": { tier: 3, parent: "Ligue 2", size: 18 },
};

export const initializeWorldClubs = (): Club[] => {
    // Merge REAL_CLUBS with generated ones to fill leagues
    let allClubs = [...REAL_CLUBS];
    const leagueCounts: Record<string, number> = {};
    
    // Count current real clubs
    allClubs.forEach(c => {
        leagueCounts[c.league] = (leagueCounts[c.league] || 0) + 1;
    });

    // Fill gaps
    Object.keys(LEAGUE_HIERARCHY).forEach(leagueName => {
        const config = LEAGUE_HIERARCHY[leagueName];
        const currentCount = leagueCounts[leagueName] || 0;
        const needed = config.size - currentCount;

        if (needed > 0) {
            // Find a country reference
            const sampleClub = allClubs.find(c => c.league === leagueName);
            const country = sampleClub ? sampleClub.country : "England"; // Default to England if new league

            for (let i = 0; i < needed; i++) {
                allClubs.push(generateFillerClub(leagueName, country, config.tier));
            }
        }
    });

    return allClubs;
};

export const processWorldSeasonEnd = (allClubs: Club[], currentWorldTables: WorldTables): Club[] => {
    // 1. Apply Strength changes (RNG dynamic world)
    const nextClubs = allClubs.map(c => ({
        ...c,
        strength: clamp(c.strength + getRandomInt(-3, 3), 10, 99),
        continentalTier: ContinentalTier.NONE // Reset continental, recalculate below
    }));

    // 2. Process Promotion/Relegation based on Tables
    Object.keys(currentWorldTables).forEach(leagueName => {
        const table = currentWorldTables[leagueName];
        const hierarchy = LEAGUE_HIERARCHY[leagueName];
        
        if (!hierarchy) return;

        // Identify Promoted/Relegated Teams
        // Logic: 
        // Tier 1: Relegate bottom 3
        // Tier 2-4: Promote top 3, Relegate bottom 3
        // Tier 5: Promote top 3
        
        const isTopTier = hierarchy.tier === 1;
        const isBottomTier = !hierarchy.child;

        const promotedCount = 3;
        const relegatedCount = 3;

        // Sort table by pos just to be safe
        const sortedTable = [...table].sort((a,b) => a.position - b.position);

        // Teams moving UP (to Parent)
        if (hierarchy.parent) {
            const promoters = sortedTable.slice(0, promotedCount);
            promoters.forEach(row => {
                const clubIndex = nextClubs.findIndex(c => c.name === row.name);
                if (clubIndex !== -1) {
                    nextClubs[clubIndex].league = hierarchy.parent!;
                    nextClubs[clubIndex].tier = hierarchy.tier - 1;
                    nextClubs[clubIndex].strength += getRandomInt(2, 5); // Boost for promotion
                }
            });
        }

        // Teams moving DOWN (to Child)
        if (hierarchy.child) {
            const relegators = sortedTable.slice(sortedTable.length - relegatedCount);
            relegators.forEach(row => {
                const clubIndex = nextClubs.findIndex(c => c.name === row.name);
                if (clubIndex !== -1) {
                    nextClubs[clubIndex].league = hierarchy.child!;
                    nextClubs[clubIndex].tier = hierarchy.tier + 1;
                    nextClubs[clubIndex].strength -= getRandomInt(2, 5); // Penalty for relegation
                }
            });
        }

        // Continental Qualification (Only for Tier 1)
        if (isTopTier) {
            sortedTable.forEach((row, idx) => {
                const clubIndex = nextClubs.findIndex(c => c.name === row.name);
                if (clubIndex !== -1) {
                    if (idx < 4) nextClubs[clubIndex].continentalTier = ContinentalTier.CHAMPIONS;
                    else if (idx < 6) nextClubs[clubIndex].continentalTier = ContinentalTier.EUROPA;
                    else if (idx === 6) nextClubs[clubIndex].continentalTier = ContinentalTier.CONFERENCE;
                }
            });
        }
    });

    return nextClubs;
};

// --- SIMULATION ---

export const generateWorldLeagues = (gamesPlayed: number, allClubs: Club[]): WorldTables => {
    const worldTables: WorldTables = {};
    
    // Group by league
    const leagues: Record<string, Club[]> = {};
    allClubs.forEach(c => {
        if (!leagues[c.league]) leagues[c.league] = [];
        leagues[c.league].push(c);
    });

    Object.keys(leagues).forEach(leagueName => {
        const teams = leagues[leagueName];
        const tierBaseStrength = { 1: 82, 2: 72, 3: 62, 4: 52, 5: 42 }[teams[0].tier] || 40;

        const table: LeagueRow[] = teams.map(team => {
            const relativeStr = team.strength - tierBaseStrength;
            let winProb = 0.35 + (relativeStr * 0.015);
            let loseProb = 0.35 - (relativeStr * 0.015);
            winProb = clamp(winProb, 0.1, 0.8);
            loseProb = clamp(loseProb, 0.1, 0.8);
            
            let won = 0, drawn = 0, lost = 0;
            if (gamesPlayed > 0) {
                for(let i=0; i<gamesPlayed; i++) {
                    const matchRng = Math.random();
                    if (matchRng < winProb) won++;
                    else if (matchRng < winProb + (1 - winProb - loseProb)) drawn++;
                    else lost++;
                }
            }
            
            const points = (won * 3) + drawn;
            const gd = Math.floor((won * 1.4) - (lost * 1.2) + getRandomInt(-3, 3));

            return { 
                position: 0, 
                name: team.name, 
                played: gamesPlayed, 
                won, drawn, lost, gd, points, 
                isPlayerClub: false 
            };
        });

        table.sort((a, b) => b.points - a.points || b.gd - a.gd);
        
        // Add status flags
        const leagueConfig = LEAGUE_HIERARCHY[leagueName];
        const mappedTable = table.map((row, idx) => {
            let status: 'PRO' | 'REL' | 'UCL' | 'UEL' | 'UECL' | undefined = undefined;
            if (leagueConfig) {
                if (leagueConfig.tier === 1) {
                    if (idx < 4) status = 'UCL';
                    else if (idx < 6) status = 'UEL';
                    else if (idx === 6) status = 'UECL';
                    else if (idx >= table.length - 3) status = 'REL';
                } else {
                    // Lower tiers
                    if (idx < 3 && leagueConfig.parent) status = 'PRO';
                    else if (idx >= table.length - 3 && leagueConfig.child) status = 'REL';
                }
            }
            return { ...row, position: idx + 1, status };
        });

        worldTables[leagueName] = mappedTable;
    });

    return worldTables;
};


// --- VISUAL HELPERS ---
export const getContrastColor = (hexcolor: string) => {
    if(!hexcolor) return '#ffffff';
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#0f172a' : '#ffffff'; 
}

export const adjustBrightness = (col: string, amt: number) => {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
}

// --- CHECK SURPLUS STATUS ---
export const isSurplusToRequirements = (player: Player, stats?: SeasonStats): boolean => {
    const { currentAbility, currentClub, contract } = player;
    
    if (currentClub.name === "Free Agent") return false;

    // 1. If player is much worse than team average
    if (contract.type === ContractType.PROFESSIONAL) {
        const diff = currentClub.strength - currentAbility;
        if (diff > 15 && player.age > 21) return true;
        if (diff > 25) return true; 
    }

    // 2. Terrible performance (if stats provided)
    if (stats && stats.total.matches > 10) {
        if (stats.total.rating < 5.8) return true;
    }

    return false;
};

// --- STAR RATING SYSTEM ---
export const calculateStars = (rating: number): number => {
    if (rating < 40) return 0.5;
    if (rating < 50) return 1;
    if (rating < 60) return 1.5;
    if (rating < 70) return 2;
    if (rating < 75) return 2.5;
    if (rating < 80) return 3;
    if (rating < 85) return 3.5;
    if (rating < 90) return 4;
    if (rating < 95) return 4.5;
    return 5;
};

// --- ROLE CALCULATION ---
export const getPromisedRole = (playerAbility: number, clubStrength: number): PromisedRole => {
    const diff = playerAbility - clubStrength;
    
    if (diff >= 5) return PromisedRole.STAR;
    if (diff >= -2) return PromisedRole.IMPORTANT;
    if (diff >= -8) return PromisedRole.REGULAR;
    if (diff >= -15) return PromisedRole.ROTATION;
    if (diff >= -25) return PromisedRole.BACKUP;
    return PromisedRole.YOUTH;
};

// --- ESTIMATED APPS BASED ON ROLE ---
export const getEstimatedApps = (role: PromisedRole): number => {
    switch (role) {
        case PromisedRole.STAR: return 45;
        case PromisedRole.IMPORTANT: return 38;
        case PromisedRole.REGULAR: return 30;
        case PromisedRole.ROTATION: return 18;
        case PromisedRole.BACKUP: return 8;
        case PromisedRole.YOUTH: return 0; 
        default: return 0;
    }
};

// --- MARKET VALUE LOGIC ---
export const calculateMarketValue = (ability: number, age: number, potential: number, position: Position, contractYears: number): number => {
    let baseValue = Math.pow(ability, 3) * 18; 
    
    // Age Multiplier
    let ageMult = 1.0;
    if (age < 22) ageMult = 1.5 + ((potential - ability) / 40); 
    else if (age > 30) ageMult = 0.8 - ((age - 30) * 0.15);
    
    // Contract Length Multiplier
    let contractMult = 1.0;
    if (contractYears <= 1) contractMult = 0.6;
    else if (contractYears === 2) contractMult = 0.85;
    else if (contractYears === 3) contractMult = 1.0;
    else if (contractYears === 4) contractMult = 1.15;
    else if (contractYears >= 5) contractMult = 1.3;
    
    let value = baseValue * ageMult * contractMult;
    
    if (value < 25000) value = 25000;
    return Math.round(value / 10000) * 10000; 
};

// --- FORM CALCULATION ---
export const calculateForm = (stats: StatSet, position: Position): number => {
    if (!stats || stats.matches === 0) return 50;

    let base = 50;
    
    // Rating impact: 6.5 is average/neutral (form 50).
    // 7.5 (+1.0) -> +25 form points = 75. Excellent.
    // 5.5 (-1.0) -> -25 form points = 25. Poor.
    const ratingDiff = stats.rating - 6.5;
    base += ratingDiff * 25;

    // Performance bonus
    const matches = stats.matches;
    const gpergame = matches > 0 ? stats.goals / matches : 0;
    const apergame = matches > 0 ? stats.assists / matches : 0;
    const cspergame = matches > 0 ? stats.cleanSheets / matches : 0;

    if (position === Position.FWD) {
        if (gpergame > 0.8) base += 10;
        else if (gpergame > 0.5) base += 5;
        
        if (gpergame < 0.2) base -= 5;
    } else if (position === Position.MID) {
        if (apergame > 0.4) base += 10;
        else if (apergame > 0.2) base += 5;
        
        if (gpergame > 0.25) base += 5;
    } else if (position === Position.DEF) {
        if (cspergame > 0.4) base += 8;
        if (gpergame > 0.1) base += 5; 
    } else if (position === Position.GK) {
        if (cspergame > 0.45) base += 10;
    }
    
    // Momentum from recent MOTMs
    if (stats.motm) {
        base += (stats.motm / matches) * 20;
    }

    return Math.max(1, Math.min(99, Math.round(base)));
};

export const getTierName = (tier: number): string => {
    switch(tier) {
        case 1: return "Premier Division";
        case 2: return "Championship Division";
        case 3: return "League One / Tier 3";
        case 4: return "League Two / Tier 4";
        case 5: return "National / Tier 5";
        default: return "Lower Division";
    }
};

export const generateLeagueTable = (myClub: Club, isMidSeason: boolean, allClubs: Club[]): LeagueRow[] => {
    if (myClub.name === "Free Agent") return [];

    const gamesPlayed = isMidSeason ? 19 : 38;
    
    // Filter clubs belonging to this league from the global list
    const leagueTeams = allClubs.filter(c => c.league === myClub.league);
    const tierBaseStrength = { 1: 82, 2: 72, 3: 62, 4: 52, 5: 42 }[myClub.tier] || 40;

    // Simulate games for everyone in this league
    const table: LeagueRow[] = leagueTeams.map(team => {
        const isPlayer = team.name === myClub.name;
        // If it's the player, we use their actual known strength
        const strength = isPlayer ? myClub.strength : team.strength;

        const relativeStr = strength - tierBaseStrength;
        let winProb = 0.35 + (relativeStr * 0.015);
        let loseProb = 0.35 - (relativeStr * 0.015);
        winProb = clamp(winProb, 0.1, 0.8);
        loseProb = clamp(loseProb, 0.1, 0.8);
        
        let won = 0, drawn = 0, lost = 0;
        if (gamesPlayed > 0) {
            for(let i=0; i<gamesPlayed; i++) {
                const matchRng = Math.random();
                if (matchRng < winProb) won++;
                else if (matchRng < winProb + (1 - winProb - loseProb)) drawn++;
                else lost++;
            }
        }
        
        const points = (won * 3) + drawn;
        const gd = Math.floor((won * 1.4) - (lost * 1.2) + getRandomInt(-5, 5));

        return { position: 0, name: team.name, played: gamesPlayed, won, drawn, lost, gd, points, isPlayerClub: isPlayer };
    });

    table.sort((a, b) => b.points - a.points || b.gd - a.gd);
    return table.map((row, idx) => ({ ...row, position: idx + 1 }));
};

const generateStatSet = (matches: number, ability: number, position: Position, opponentStrength: number, isCup: boolean = false): StatSet => {
    if (matches === 0) return { matches: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, rating: 0, motm: 0 };

    // Form fluctuation
    const form = getRandomInt(90, 110) / 100;
    const effectiveAbility = ability * form;
    
    const advantage = effectiveAbility - opponentStrength; 
    // Base performance metric
    const perGamePerf = (effectiveAbility + (advantage/2)) / 100;

    let goals = 0, assists = 0, cleanSheets = 0;
    const ratingBase = 6.4; 

    let startRatio = 0.5;
    if (matches > 25) startRatio = 0.9;
    else if (matches < 5) startRatio = 0.2;
    else startRatio = 0.6;
    
    startRatio = clamp(startRatio + (Math.random() * 0.2 - 0.1), 0.1, 1.0);
    
    const starts = Math.round(matches * startRatio);
    const subs = matches - starts;

    const avgMinsPerStart = getRandomInt(75, 90);
    const avgMinsPerSub = getRandomInt(10, 35);
    
    const minutes = (starts * avgMinsPerStart) + (subs * avgMinsPerSub);
    const effectiveMatches = minutes / 90;

    // Stats Generation
    if (position === Position.FWD) {
        goals = Math.floor(effectiveMatches * perGamePerf * 0.7 * (Math.random() + 0.4));
        assists = Math.floor(effectiveMatches * perGamePerf * 0.25);
    } else if (position === Position.MID) {
        goals = Math.floor(effectiveMatches * perGamePerf * 0.25);
        assists = Math.floor(effectiveMatches * perGamePerf * 0.5);
        cleanSheets = Math.floor(effectiveMatches * perGamePerf * 0.2); 
    } else if (position === Position.DEF) {
        goals = Math.floor(effectiveMatches * perGamePerf * 0.06);
        assists = Math.floor(effectiveMatches * perGamePerf * 0.1);
        cleanSheets = Math.floor(effectiveMatches * perGamePerf * 0.45);
    } else { // GK
        cleanSheets = Math.floor(effectiveMatches * perGamePerf * 0.55);
        goals = 0;
        assists = Math.floor(effectiveMatches * 0.02); // Rare
    }

    // Rating Calculation
    let ratingBonus = 0;
    const goalRatio = matches > 0 ? goals / matches : 0;
    const assistRatio = matches > 0 ? assists / matches : 0;
    const csRatio = matches > 0 ? cleanSheets / matches : 0;

    if (position === Position.FWD) {
        ratingBonus += goalRatio * 2.2;
        ratingBonus += assistRatio * 1.2;
    } else if (position === Position.MID) {
        ratingBonus += goalRatio * 1.6;
        ratingBonus += assistRatio * 1.6;
        ratingBonus += csRatio * 0.4;
    } else if (position === Position.DEF) {
        ratingBonus += csRatio * 1.8; 
        ratingBonus += goalRatio * 2.5; 
        ratingBonus += assistRatio * 1.4;
    } else { // GK
        ratingBonus += csRatio * 2.2;
        ratingBonus += assistRatio * 3.0;
    }

    const diffBonus = advantage / 25; 
    const variance = (Math.random() * 0.8) - 0.1; 

    let finalRating = ratingBase + ratingBonus + diffBonus + variance;
    finalRating = clamp(finalRating, 5.5, 9.9);

    let motm = 0;
    if (finalRating > 8.2) {
        motm = Math.floor(matches * 0.15 * (finalRating - 7.5)); 
        if (motm < 1 && matches > 0 && Math.random() < 0.3) motm = 1;
        if (motm > matches) motm = matches;
    }

    return { matches, starts, minutes, goals, assists, cleanSheets, rating: Number(finalRating.toFixed(2)), motm };
};

export const simulateMatch = (player: Player, opponentStrength: number, isExtraTimePossible: boolean = false): { myScore: number, oppScore: number, stats: StatSet } => {
    const myTeamStrength = player.currentClub.strength;
    const diff = myTeamStrength - opponentStrength;
    
    let winProb = 0.5 + (diff * 0.015);
    winProb = clamp(winProb, 0.1, 0.9);

    let myScore = 0;
    let oppScore = 0;

    if (Math.random() < winProb) {
        myScore = getRandomInt(1, 3);
        oppScore = getRandomInt(0, myScore - 1);
    } else if (Math.random() < 0.3) {
        myScore = getRandomInt(0, 2);
        oppScore = myScore;
    } else {
        oppScore = getRandomInt(1, 3);
        myScore = getRandomInt(0, oppScore - 1);
    }

    let minutes = getRandomInt(60, 90);

    if (isExtraTimePossible && myScore === oppScore) {
        minutes += 30;
        if (Math.random() < 0.5) myScore++;
        else oppScore++;
    }

    const stats = generateStatSet(1, player.currentAbility, player.position, opponentStrength);
    stats.minutes = minutes; 
    stats.starts = 1;
    
    if (stats.goals > myScore) stats.goals = myScore;
    
    if (oppScore > 0) stats.cleanSheets = 0;
    else if (player.position === Position.GK || player.position === Position.DEF) stats.cleanSheets = 1;
    
    let adjRating = stats.rating;
    if (stats.goals > 0 && adjRating < 7.5) adjRating += 1.0;
    if (stats.assists > 0 && adjRating < 7.0) adjRating += 0.5;
    if (stats.cleanSheets > 0 && (player.position === Position.GK || player.position === Position.DEF) && adjRating < 7.0) adjRating += 0.5;
    
    if (oppScore > myScore + 2) adjRating -= 1.0;
    else if (oppScore > myScore) adjRating -= 0.3;

    if (myScore > oppScore) adjRating += 0.3;

    stats.rating = clamp(Number(adjRating.toFixed(2)), 5.0, 10.0);
    stats.motm = stats.rating > 8.5 ? 1 : 0;

    return { myScore, oppScore, stats };
};

export const getCountryTier = (country: string): number => {
    const tier1 = ["Argentina", "Brazil", "England", "France", "Germany", "Italy", "Portugal", "Spain", "Netherlands"];
    if (tier1.includes(country)) return 88;
    return 70;
};

export const mergeStatSet = (s1: StatSet, s2: StatSet): StatSet => {
    const matches = s1.matches + s2.matches;
    let rating = 0;
    if (matches > 0) {
        rating = ((s1.rating * s1.matches) + (s2.rating * s2.matches)) / matches;
    }
    return {
        matches,
        starts: (s1.starts || 0) + (s2.starts || 0),
        minutes: (s1.minutes || 0) + (s2.minutes || 0),
        goals: s1.goals + s2.goals,
        assists: s1.assists + s2.assists,
        cleanSheets: s1.cleanSheets + s2.cleanSheets,
        rating: parseFloat(rating.toFixed(2)),
        motm: (s1.motm || 0) + (s2.motm || 0)
    };
};

export const calculateGrowth = (
    player: Player, 
    stats: StatSet, 
    level: 'Senior' | 'U21' | 'U18' | 'Youth/Reserves' | 'Free Agent',
    events: string[] = [],
    seasonInjuries: string[] = []
): { newCA: number, newFatigue: number, growthLog: string } => {
    const { age, currentAbility, potentialAbility, naturalFitness, fatigue, currentClub } = player;
    const { matches, rating } = stats;
    
    let growth = 0;
    let log = "";
    let fatigueGain = 0;

    if (level === 'Free Agent') {
        growth = -getRandomInt(2, 4);
        fatigueGain = 8 + (fatigue * 0.1); 
        log = "Attributes declining without a club.";
    } else {
        const ratingFactor = (rating - 6.0) * 2;
        const matchFactor = Math.min(matches, 40) / 40;
        
        if (age < 21) {
            growth = (getRandomInt(2, 5) + ratingFactor) * matchFactor;
            if (level === 'Senior' && matches > 10) growth *= 1.5; 
            else if (level.includes('U18') || level.includes('U21')) growth *= 0.8; 
            log = "Developing well.";
        } else if (age < 28) {
            growth = (getRandomInt(0, 3) + ratingFactor) * matchFactor;
            log = "Entering prime years.";
        } else if (age < 32) {
            growth = (ratingFactor * 0.5) - getRandomInt(0, 2);
            log = "Maintaining fitness.";
        } else {
            growth = -getRandomInt(2, 5) + (ratingFactor * 0.5);
            log = "Physical decline.";
        }

        if (fatigue > 85) {
            growth -= 2;
            log += " High body load hindering progress.";
        }

        if (currentClub.tier === 1) growth += 1;
        
        let matchLoad = (matches * 0.6) * (1 - (naturalFitness / 250)); 
        
        fatigueGain = matchLoad;
    }
    
    if (seasonInjuries.length > 0) {
         seasonInjuries.forEach(inj => {
             if (inj.includes("ACL") || inj.includes("Broken") || inj.includes("Tear")) {
                 fatigueGain += getRandomInt(5, 10); 
                 growth -= 1;
                 log += " Major injury setback.";
             } else {
                 fatigueGain += 1;
             }
         });
    }

    let newCA = currentAbility + growth;
    if (newCA > potentialAbility) newCA = potentialAbility;
    if (newCA < 1) newCA = 1;

    let newFatigue = fatigue + fatigueGain;
    
    if (level !== 'Free Agent') {
        let recovery = 7 + (naturalFitness / 20); 
        const facilityBonus = currentClub.tier === 1 ? 3 : currentClub.tier === 2 ? 1.5 : 0;
        
        if (events.some(e => e.includes("physio") || e.includes("yoga") || e.includes("diet"))) {
            recovery += 5;
            log += " Lifestyle improvements aiding recovery.";
        }

        let agePenalty = 0;
        if (age > 29) {
            agePenalty = (age - 29) * 1.0; 
        }

        newFatigue = Math.max(0, newFatigue - (recovery + facilityBonus - agePenalty));
    }

    const diff = Math.round(newCA - currentAbility);
    if (diff > 0) log = `+${diff} Ability. ${log}`;
    else log = `${diff} Ability. ${log}`;

    return {
        newCA: clamp(Math.round(newCA), 1, 99),
        newFatigue: Math.round(newFatigue), 
        growthLog: log
    };
};

const CUP_ROUNDS = ["Round 1", "Round 2", "Round 3", "Round 4", "Quarter Final", "Semi Final", "Final", "Winner"];
const EUROPE_ROUNDS = ["Qualifying", "Group Stage", "Round of 16", "Quarter Final", "Semi Final", "Final", "Winner"];

const simulateCompetitionProgress = (currentStatus: string, rounds: string[], teamStrength: number, isMidSeason: boolean): string => {
    if (currentStatus.includes("Eliminated") || currentStatus === "Winner") return currentStatus;

    let currentRoundIndex = rounds.indexOf(currentStatus.replace(" (Active)", ""));
    if (currentRoundIndex === -1) currentRoundIndex = 0;

    const midSeasonCapIndex = rounds.length - 4; 
    const advanceProb = 0.35 + (teamStrength * 0.004); 

    let status = currentStatus.replace(" (Active)", "");
    if ((status === "" || status === "Not Qualified") && currentRoundIndex === 0) {
        status = rounds[1];
        currentRoundIndex = 1;
    }
    
    let activeIndex = currentRoundIndex;
    while (activeIndex < rounds.length - 1) { 
        if (isMidSeason && activeIndex >= midSeasonCapIndex) return `${rounds[activeIndex]} (Active)`;
        if (Math.random() < advanceProb) {
            activeIndex++;
            status = rounds[activeIndex];
            if (status === "Winner") return "Winner";
        } else {
            return `Eliminated in ${rounds[activeIndex]}`; 
        }
    }
    return status === "Winner" ? "Winner" : `Eliminated in ${rounds[activeIndex]}`;
};

export const calculateAwards = (player: Player, stats: SeasonStats, teamTrophies: string[]): string[] => {
    const awards: string[] = [];
    const { total, league } = stats;
    const { currentClub } = player;

    if (Math.random() < 0.001 && total.goals > 0) awards.push("Puskas Award");

    if (league.matches > 20 && currentClub.tier === 1) {
        const expectedBootGoals = 25 + getRandomInt(-5, 8);
        if (league.goals >= expectedBootGoals) awards.push("League Golden Boot");
        if (league.rating >= 7.8) awards.push("League Player of the Year");
    }

    if (currentClub.tier === 1 && total.rating > 7.8) {
        let score = total.rating * 10;
        if (teamTrophies.includes("Champions League Winner")) score += 30;
        if (teamTrophies.includes("World Cup Winner")) score += 50;
        if (score > 160) {
            awards.push("Ballon d'Or");
            awards.push("World Player of the Year");
        }
    }
    return awards;
};

export const simulateSeasonPerformance = (
  player: Player,
  year: number,
  allClubs: Club[],
  portion: number = 1.0, 
  prevStats?: SeasonStats,
  simulateSummerTournament: boolean = true
): { stats: SeasonStats; trophies: string[]; events: string[], leagueTable: LeagueRow[], tournamentSelection?: string } => {
  const { currentAbility, currentClub, contract, fatigue, injuryProne, age } = player;
  const trophies: string[] = [];
  const events: string[] = [];
  const injuries: string[] = [];
  let weeksOut = 0;

  if (currentClub.name === "Free Agent") {
      const emptyStats: StatSet = { matches: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, rating: 0, motm: 0 };
      return {
          stats: {
              total: emptyStats, youth: emptyStats, league: emptyStats, cup: emptyStats, europe: emptyStats, international: emptyStats, internationalBreakdown: {},
              level: 'Free Agent', injuries: [], weeksOut: 0, cupStatus: 'N/A', europeStatus: 'N/A', awards: []
          },
          trophies: [], events: ["Spent time as Free Agent searching for clubs"], leagueTable: []
      };
  }

  const isMidSeasonWindow = portion < 0.8 && !prevStats;
  const leagueTable = generateLeagueTable(currentClub, isMidSeasonWindow, allClubs);
  const myRow = leagueTable.find(r => r.isPlayerClub);
  const position = myRow ? myRow.position : 10;

  if (!isMidSeasonWindow) {
      if (position === 1) trophies.push(`${currentClub.league} Winner`);
      else if (position <= 4 && currentClub.tier === 1) events.push("Qualified for Champions League");
  }

  let role = contract.promisedRole;
  const calculatedRole = getPromisedRole(currentAbility, currentClub.strength);
  let level: 'Senior' | 'U21' | 'U18' | 'Youth/Reserves' = 'Senior';
  
  let isSeniorRegular = true;
  
  if (contract.type === ContractType.YOUTH && age < 18 && currentAbility < currentClub.strength - 10) {
      level = 'U18';
      isSeniorRegular = false;
  } else if (age < 21 && calculatedRole === PromisedRole.YOUTH) {
      level = 'U21';
      isSeniorRegular = false;
  } else if (player.config.modifiers.noStartsUnder21 && age < 21 && !player.parentClub) {
      level = 'U21';
      isSeniorRegular = false;
  } else if (calculatedRole === PromisedRole.YOUTH) {
      level = 'Youth/Reserves';
      isSeniorRegular = false;
  }

  let seniorPlayRatio = 0;
  let youthPlayRatio = 0;

  if (isSeniorRegular) {
      seniorPlayRatio = getEstimatedApps(role) / 45; 
      youthPlayRatio = 0;
  } else {
      youthPlayRatio = 0.8; 
      if (currentAbility > currentClub.strength - 15 && Math.random() > 0.6) {
          seniorPlayRatio = 0.1 + (Math.random() * 0.15); 
          events.push(`Made appearances for Senior Team`);
      }
  }

  if (player.isSurplus) {
      seniorPlayRatio = 0.02; 
      youthPlayRatio = 0.5; 
      events.push("Frozen out of squad");
  }

  if (!player.config.modifiers.injuriesOff) {
      let injuryRisk = (injuryProne * 0.5) + (fatigue * 0.8); 
      if (fatigue > 85) injuryRisk *= 1.5;
      
      if (Math.random() * 1000 < injuryRisk) {
          const severity = Math.random();
          let duration = 0;
          let type = "";
          
          if (severity > 0.92) { duration = 24; type = "ACL Tear (6 months)"; events.push("Serious Injury: ACL Tear"); }
          else if (severity > 0.8) { duration = 12; type = "Broken Foot (3 months)"; }
          else if (severity > 0.5) { duration = 4; type = "Hamstring Strain (1 month)"; }
          else { duration = 2; type = "Ankle Sprain (2 weeks)"; }
          
          if (portion < 0.8) duration = Math.min(duration, 12); 
          weeksOut = duration;
          injuries.push(type);
      }
  }

  const availableRatio = Math.max(0, 24 - weeksOut) / 24; 

  const leagueGamesTotal = Math.ceil(((isSeniorRegular ? 38 : 20) * portion) * availableRatio);
  
  const leagueAppsSenior = Math.floor(leagueGamesTotal * seniorPlayRatio);
  const leagueAppsYouth = Math.floor(leagueGamesTotal * youthPlayRatio);

  const oppositionStrengthSenior = currentClub.strength;
  const oppositionStrengthYouth = currentClub.strength - 20;
  
  let perfMod = 1.0;
  if (fatigue > 60) perfMod = 0.95;
  if (fatigue > 85) perfMod = 0.80; 

  const leagueStatsSenior = generateStatSet(leagueAppsSenior, currentAbility * perfMod, player.position, oppositionStrengthSenior);
  const leagueStatsYouth = generateStatSet(leagueAppsYouth, currentAbility * perfMod, player.position, oppositionStrengthYouth);

  const cupStatus = simulateCompetitionProgress("Round 3", CUP_ROUNDS, currentClub.strength, isMidSeasonWindow);
  const cupGames = isSeniorRegular ? getRandomInt(1, 4) : 0; 
  const cupStats = generateStatSet(cupGames, currentAbility * perfMod, player.position, oppositionStrengthSenior, true);
  
  const europeStatus = simulateCompetitionProgress("Not Qualified", EUROPE_ROUNDS, currentClub.strength, isMidSeasonWindow);
  const europeGames = isSeniorRegular && europeStatus !== "Not Qualified" ? getRandomInt(2, 6) : 0;
  const europeStats = generateStatSet(europeGames, currentAbility * perfMod, player.position, oppositionStrengthSenior);

  const intStats = { matches: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, rating: 0, motm: 0 };
  const breakdown: Record<string, StatSet> = {};

  if (!isMidSeasonWindow) {
      if (cupStatus === "Winner") trophies.push("Domestic Cup Winner");
      if (europeStatus === "Winner") trophies.push(`Continental Cup Winner`);
      
      if (player.config.modifiers.randomLifeEvents && Math.random() < 0.2) {
         const recoveryEvents = ["Hired private physio", "Adopted new diet", "Started yoga"];
         const evt = recoveryEvents[getRandomInt(0, recoveryEvents.length - 1)];
         events.push(evt);
      }
  }

  const totalStats: StatSet = {
      matches: leagueStatsSenior.matches + cupStats.matches + europeStats.matches + intStats.matches,
      starts: leagueStatsSenior.starts + cupStats.starts + europeStats.starts + intStats.starts,
      minutes: leagueStatsSenior.minutes + cupStats.minutes + europeStats.minutes + intStats.minutes,
      goals: leagueStatsSenior.goals + cupStats.goals + europeStats.goals + intStats.goals,
      assists: leagueStatsSenior.assists + cupStats.assists + europeStats.assists + intStats.assists,
      cleanSheets: leagueStatsSenior.cleanSheets + cupStats.cleanSheets + europeStats.cleanSheets + intStats.cleanSheets,
      rating: 0,
      motm: leagueStatsSenior.motm + cupStats.motm + europeStats.motm + intStats.motm
  };
  
  const totalApps = totalStats.matches || 1;
  totalStats.rating = parseFloat(((leagueStatsSenior.rating * leagueAppsSenior + cupStats.rating * cupGames + europeStats.rating * europeGames) / totalApps).toFixed(2)) || 0;

  return {
      stats: { 
          total: totalStats, 
          youth: leagueStatsYouth, 
          league: leagueStatsSenior, 
          cup: cupStats, 
          europe: europeStats, 
          international: intStats,
          internationalBreakdown: breakdown,
          level: level,
          injuries,
          weeksOut,
          cupStatus,
          europeStatus,
          awards: [] 
      },
      trophies,
      events,
      leagueTable
  };
};
