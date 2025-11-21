
import { Club, ContinentalTier } from "../types";
import { getRandomInt } from "./gameLogic";

// Helper to create club easily
const createClub = (name: string, league: string, country: string, tier: number, prestige: number, strength: number, primaryColor: string, secondaryColor: string, continentalTier: ContinentalTier = ContinentalTier.NONE): Club => ({
    id: name.replace(/\s+/g, '-').toLowerCase() + Math.random().toString(36).substr(2, 5),
    name, league, country, tier, prestige, strength, primaryColor, secondaryColor, continentalTier
});

const CITIES_BY_COUNTRY: Record<string, string[]> = {
    "England": ["London", "Manchester", "Liverpool", "Birmingham", "Leeds", "Sheffield", "Bristol", "Newcastle", "Sunderland", "Wolverhampton", "Southampton", "Portsmouth", "Derby", "Nottingham", "Leicester", "Coventry", "Hull", "Bradford", "Stoke", "Plymouth", "Reading", "Preston", "Luton", "Norwich", "Ipswich", "Blackpool", "Bolton", "Wigan", "Rotherham", "Cardiff", "Swansea", "Wrexham"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Malaga", "Murcia", "Palma", "Bilbao", "Alicante", "Cordoba", "Valladolid", "Vigo", "Gijon", "Granada", "Oviedo", "Badalona", "Cartagena", "Terrassa", "Sabadell"],
    "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Dusseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Munster"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto", "Brescia", "Prato", "Parma", "Modena"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Etienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nimes", "Villeurbanne", "Le Mans"]
};

const SUFFIXES = ["United", "City", "FC", "Athletic", "Rovers", "Wanderers", "Town", "Sporting", "Real", "Inter", "Dynamo", "Union"];

export const generateFillerClub = (league: string, country: string, tier: number): Club => {
    const cities = CITIES_BY_COUNTRY[country] || CITIES_BY_COUNTRY["England"];
    const city = cities[getRandomInt(0, cities.length - 1)];
    const suffix = SUFFIXES[getRandomInt(0, SUFFIXES.length - 1)];
    const name = `${city} ${suffix}`;
    
    // Generic colors
    const colors = ["#DA291C", "#003399", "#000000", "#FFFFFF", "#F7C403", "#00804E"];
    const primary = colors[getRandomInt(0, colors.length - 1)];
    let secondary = colors[getRandomInt(0, colors.length - 1)];
    while (secondary === primary) secondary = colors[getRandomInt(0, colors.length - 1)];

    // Base Strength based on Tier
    let strength = 20;
    if (tier === 1) strength = 75;
    else if (tier === 2) strength = 65;
    else if (tier === 3) strength = 55;
    else if (tier === 4) strength = 45;
    else strength = 35;

    return createClub(
        name, 
        league, 
        country, 
        tier, 
        strength - 5, 
        strength + getRandomInt(-5, 5), 
        primary, 
        secondary
    );
};

export const REAL_CLUBS: Club[] = [
    // --- ENGLAND (Premier League) ---
    createClub("Man City", "Premier League", "England", 1, 98, 98, "#6CABDD", "#1C2C5B", ContinentalTier.CHAMPIONS),
    createClub("Liverpool", "Premier League", "England", 1, 95, 94, "#C8102E", "#00B2A9", ContinentalTier.CHAMPIONS),
    createClub("Arsenal", "Premier League", "England", 1, 92, 92, "#EF0107", "#063672", ContinentalTier.CHAMPIONS),
    createClub("Man Utd", "Premier League", "England", 1, 90, 86, "#DA291C", "#FBE122", ContinentalTier.EUROPA),
    createClub("Chelsea", "Premier League", "England", 1, 88, 85, "#034694", "#DBA111"),
    createClub("Tottenham", "Premier League", "England", 1, 85, 84, "#FFFFFF", "#132257", ContinentalTier.EUROPA),
    createClub("Newcastle", "Premier League", "England", 1, 80, 82, "#241F20", "#FFFFFF"),
    createClub("Aston Villa", "Premier League", "England", 1, 78, 81, "#670E36", "#95BFE5", ContinentalTier.CONFERENCE),
    createClub("West Ham", "Premier League", "England", 1, 75, 78, "#7A263A", "#1BB1E7"),
    createClub("Brighton", "Premier League", "England", 1, 74, 77, "#0057B8", "#FFFFFF"),
    createClub("Everton", "Premier League", "England", 1, 72, 75, "#003399", "#FFFFFF"),
    createClub("Wolves", "Premier League", "England", 1, 70, 74, "#FDB913", "#231F20"),
    createClub("Crystal Palace", "Premier League", "England", 1, 68, 73, "#1B458F", "#C4122E"),
    createClub("Fulham", "Premier League", "England", 1, 68, 73, "#FFFFFF", "#000000"),
    createClub("Bournemouth", "Premier League", "England", 1, 65, 72, "#DA291C", "#000000"),
    createClub("Brentford", "Premier League", "England", 1, 65, 71, "#E30613", "#FFFFFF"),
    createClub("Nottm Forest", "Premier League", "England", 1, 62, 70, "#DD0000", "#FFFFFF"),
    createClub("Luton Town", "Premier League", "England", 1, 58, 68, "#F78F1E", "#002D62"),
    createClub("Burnley", "Premier League", "England", 1, 60, 69, "#6C1D45", "#99D6EA"),
    createClub("Sheffield Utd", "Premier League", "England", 1, 58, 67, "#EE2737", "#000000"),

    // --- ENGLAND (Championship) ---
    createClub("Leicester City", "Championship", "England", 2, 68, 75, "#0053A0", "#FDBE11"),
    createClub("Leeds United", "Championship", "England", 2, 65, 74, "#FFCD00", "#1D428A"),
    createClub("Southampton", "Championship", "England", 2, 65, 73, "#D71920", "#FFFFFF"),
    createClub("Ipswich", "Championship", "England", 2, 55, 70, "#0054A6", "#FFFFFF"),
    createClub("Norwich", "Championship", "England", 2, 60, 69, "#FFF200", "#00A650"),
    createClub("West Brom", "Championship", "England", 2, 60, 68, "#122F67", "#FFFFFF"),
    createClub("Hull City", "Championship", "England", 2, 55, 67, "#F5A12D", "#000000"),
    createClub("Coventry", "Championship", "England", 2, 55, 67, "#5EB6E4", "#FFFFFF"),
    createClub("Middlesbrough", "Championship", "England", 2, 58, 67, "#E0041B", "#FFFFFF"),
    createClub("Sunderland", "Championship", "England", 2, 60, 68, "#DD0000", "#FFFFFF"),
    createClub("Watford", "Championship", "England", 2, 58, 66, "#FBEE23", "#ED2127"),
    createClub("Bristol City", "Championship", "England", 2, 50, 64, "#E21E26", "#FFFFFF"),
    createClub("Preston", "Championship", "England", 2, 50, 63, "#FFFFFF", "#1B449C"),
    createClub("Cardiff", "Championship", "England", 2, 52, 62, "#0070B5", "#FFFFFF"),
    createClub("Swansea", "Championship", "England", 2, 52, 63, "#FFFFFF", "#000000"),
    createClub("Blackburn", "Championship", "England", 2, 55, 64, "#009EE0", "#FFFFFF"),
    createClub("Stoke City", "Championship", "England", 2, 55, 65, "#E03A3E", "#FFFFFF"),
    createClub("QPR", "Championship", "England", 2, 50, 62, "#005090", "#FFFFFF"),
    createClub("Birmingham", "Championship", "England", 2, 50, 61, "#0000DD", "#FFFFFF"),
    createClub("Huddersfield", "Championship", "England", 2, 48, 60, "#0E63AD", "#FFFFFF"),

    // --- SPAIN (La Liga) ---
    createClub("Real Madrid", "La Liga", "Spain", 1, 99, 97, "#FFFFFF", "#00529F", ContinentalTier.CHAMPIONS),
    createClub("Barcelona", "La Liga", "Spain", 1, 96, 93, "#A50044", "#004D98", ContinentalTier.CHAMPIONS),
    createClub("Atlético Madrid", "La Liga", "Spain", 1, 88, 86, "#CB3524", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Girona", "La Liga", "Spain", 1, 70, 82, "#EF3340", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Athletic Club", "La Liga", "Spain", 1, 78, 80, "#EE2523", "#000000", ContinentalTier.EUROPA),
    createClub("Real Sociedad", "La Liga", "Spain", 1, 78, 79, "#0067B1", "#FFFFFF", ContinentalTier.EUROPA),
    createClub("Real Betis", "La Liga", "Spain", 1, 76, 78, "#0BB363", "#FFFFFF", ContinentalTier.CONFERENCE),
    createClub("Valencia", "La Liga", "Spain", 1, 75, 74, "#FFFFFF", "#000000"),
    createClub("Villarreal", "La Liga", "Spain", 1, 74, 76, "#FCEE21", "#00519E"),
    createClub("Sevilla", "La Liga", "Spain", 1, 80, 75, "#FFFFFF", "#D4001F"),
    
    // --- GERMANY (Bundesliga) ---
    createClub("Leverkusen", "Bundesliga", "Germany", 1, 85, 90, "#E32219", "#000000", ContinentalTier.CHAMPIONS),
    createClub("Bayern Munich", "Bundesliga", "Germany", 1, 97, 96, "#DC052D", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Stuttgart", "Bundesliga", "Germany", 1, 72, 84, "#FFFFFF", "#E32219", ContinentalTier.CHAMPIONS),
    createClub("RB Leipzig", "Bundesliga", "Germany", 1, 82, 84, "#DD013F", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Dortmund", "Bundesliga", "Germany", 1, 88, 87, "#FDE100", "#000000", ContinentalTier.EUROPA),

    // --- ITALY (Serie A) ---
    createClub("Inter Milan", "Serie A", "Italy", 1, 90, 91, "#0068A8", "#221F20", ContinentalTier.CHAMPIONS),
    createClub("AC Milan", "Serie A", "Italy", 1, 88, 86, "#FB090B", "#000000", ContinentalTier.CHAMPIONS),
    createClub("Juventus", "Serie A", "Italy", 1, 92, 85, "#000000", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Bologna", "Serie A", "Italy", 1, 65, 80, "#1A2F48", "#A6192E", ContinentalTier.CHAMPIONS),
    createClub("Roma", "Serie A", "Italy", 1, 82, 81, "#8E252F", "#F0BC42", ContinentalTier.EUROPA),
    createClub("Atalanta", "Serie A", "Italy", 1, 76, 80, "#1E71B8", "#000000", ContinentalTier.EUROPA),

    // --- FRANCE (Ligue 1) ---
    createClub("PSG", "Ligue 1", "France", 1, 94, 92, "#004170", "#DA291C", ContinentalTier.CHAMPIONS),
    createClub("Monaco", "Ligue 1", "France", 1, 78, 79, "#E71D2B", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Brest", "Ligue 1", "France", 1, 55, 76, "#E30613", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Lille", "Ligue 1", "France", 1, 75, 78, "#E01E37", "#222857", ContinentalTier.EUROPA),
    createClub("Nice", "Ligue 1", "France", 1, 70, 75, "#DA291C", "#000000", ContinentalTier.CONFERENCE),
    createClub("Lens", "Ligue 1", "France", 1, 70, 74, "#E30613", "#F7C403"),
    createClub("Marseille", "Ligue 1", "France", 1, 80, 78, "#2FAEE0", "#FFFFFF"),
    createClub("Lyon", "Ligue 1", "France", 1, 82, 76, "#14387F", "#D52B1E"),
];

export const FREE_AGENT_CLUB: Club = createClub("Free Agent", "None", "None", 5, 0, 0, "#334155", "#94a3b8");

export const getClubsByTier = (tier: number) => REAL_CLUBS.filter(c => c.tier === tier);

export const getLeaguesByCountry = (country: string) => {
    const clubs = REAL_CLUBS.filter(c => c.country === country);
    return Array.from(new Set(clubs.map(c => c.league)));
};

export const getAvailableCountries = () => {
    return Array.from(new Set(REAL_CLUBS.map(c => c.country))).sort();
};
