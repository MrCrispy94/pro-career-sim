
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
    createClub("Frankfurt", "Bundesliga", "Germany", 1, 76, 79, "#000000", "#E1000F", ContinentalTier.EUROPA),

    // --- ITALY (Serie A) ---
    createClub("Inter Milan", "Serie A", "Italy", 1, 90, 91, "#0068A8", "#221F20", ContinentalTier.CHAMPIONS),
    createClub("AC Milan", "Serie A", "Italy", 1, 88, 86, "#FB090B", "#000000", ContinentalTier.CHAMPIONS),
    createClub("Juventus", "Serie A", "Italy", 1, 92, 85, "#000000", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Bologna", "Serie A", "Italy", 1, 65, 80, "#1A2F48", "#A6192E", ContinentalTier.CHAMPIONS),
    createClub("Roma", "Serie A", "Italy", 1, 82, 81, "#8E252F", "#F0BC42", ContinentalTier.EUROPA),
    createClub("Atalanta", "Serie A", "Italy", 1, 76, 80, "#1E71B8", "#000000", ContinentalTier.EUROPA),
    createClub("Napoli", "Serie A", "Italy", 1, 84, 83, "#008FD4", "#FFFFFF", ContinentalTier.CONFERENCE),

    // --- FRANCE (Ligue 1) ---
    createClub("PSG", "Ligue 1", "France", 1, 94, 92, "#004170", "#DA291C", ContinentalTier.CHAMPIONS),
    createClub("Monaco", "Ligue 1", "France", 1, 78, 79, "#E71D2B", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Brest", "Ligue 1", "France", 1, 55, 76, "#E30613", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Lille", "Ligue 1", "France", 1, 75, 78, "#E01E37", "#222857", ContinentalTier.EUROPA),
    createClub("Nice", "Ligue 1", "France", 1, 70, 75, "#DA291C", "#000000", ContinentalTier.CONFERENCE),
    createClub("Lens", "Ligue 1", "France", 1, 70, 74, "#E30613", "#F7C403"),
    createClub("Marseille", "Ligue 1", "France", 1, 80, 78, "#2FAEE0", "#FFFFFF"),
    createClub("Lyon", "Ligue 1", "France", 1, 82, 76, "#14387F", "#D52B1E"),

    // --- PORTUGAL ---
    createClub("Sporting CP", "Primeira Liga", "Portugal", 1, 78, 82, "#00804E", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Benfica", "Primeira Liga", "Portugal", 1, 80, 81, "#E30613", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Porto", "Primeira Liga", "Portugal", 1, 80, 80, "#0053A0", "#FFFFFF", ContinentalTier.EUROPA),
    createClub("Braga", "Primeira Liga", "Portugal", 1, 70, 75, "#E30613", "#FFFFFF", ContinentalTier.CONFERENCE),
    createClub("Vitoria SC", "Primeira Liga", "Portugal", 1, 65, 72, "#000000", "#FFFFFF"),

    // --- NETHERLANDS ---
    createClub("PSV", "Eredivisie", "Netherlands", 1, 75, 80, "#DA291C", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Feyenoord", "Eredivisie", "Netherlands", 1, 74, 79, "#E30613", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Ajax", "Eredivisie", "Netherlands", 1, 82, 76, "#DA291C", "#FFFFFF", ContinentalTier.EUROPA),
    createClub("AZ Alkmaar", "Eredivisie", "Netherlands", 1, 70, 74, "#DA291C", "#FFFFFF", ContinentalTier.CONFERENCE),
    createClub("Twente", "Eredivisie", "Netherlands", 1, 68, 73, "#DA291C", "#FFFFFF"),

    // --- BELGIUM ---
    createClub("Club Brugge", "Pro League", "Belgium", 1, 70, 75, "#000000", "#0070B5", ContinentalTier.CHAMPIONS),
    createClub("Anderlecht", "Pro League", "Belgium", 1, 72, 74, "#4F2D7F", "#FFFFFF", ContinentalTier.EUROPA),
    createClub("Union SG", "Pro League", "Belgium", 1, 65, 73, "#FFD700", "#0000CD", ContinentalTier.CONFERENCE),
    createClub("Genk", "Pro League", "Belgium", 1, 65, 72, "#0053A0", "#FFFFFF"),

    // --- SCOTLAND ---
    createClub("Celtic", "Scottish Premiership", "Scotland", 1, 75, 76, "#00804E", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Rangers", "Scottish Premiership", "Scotland", 1, 75, 75, "#1B458F", "#FFFFFF", ContinentalTier.EUROPA),

    // --- AUSTRIA ---
    createClub("RB Salzburg", "Austrian Bundesliga", "Austria", 1, 72, 76, "#DA291C", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Sturm Graz", "Austrian Bundesliga", "Austria", 1, 65, 72, "#000000", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("LASK", "Austrian Bundesliga", "Austria", 1, 62, 70, "#000000", "#FFFFFF", ContinentalTier.EUROPA),

    // --- UKRAINE ---
    createClub("Shakhtar", "Ukrainian Premier League", "Ukraine", 1, 74, 75, "#F36F21", "#000000", ContinentalTier.CHAMPIONS),
    createClub("Dynamo Kyiv", "Ukrainian Premier League", "Ukraine", 1, 72, 73, "#FFFFFF", "#19407F", ContinentalTier.EUROPA),

    // --- TURKEY ---
    createClub("Galatasaray", "Super Lig", "Turkey", 1, 75, 78, "#A90432", "#FDB912", ContinentalTier.CHAMPIONS),
    createClub("Fenerbahce", "Super Lig", "Turkey", 1, 75, 77, "#002D72", "#FFED00", ContinentalTier.EUROPA),
    createClub("Besiktas", "Super Lig", "Turkey", 1, 72, 75, "#000000", "#FFFFFF", ContinentalTier.CONFERENCE),

    // --- GREECE ---
    createClub("Olympiacos", "Super League Greece", "Greece", 1, 70, 74, "#DA291C", "#FFFFFF", ContinentalTier.CONFERENCE),
    createClub("PAOK", "Super League Greece", "Greece", 1, 68, 73, "#000000", "#FFFFFF", ContinentalTier.CONFERENCE),
    createClub("AEK Athens", "Super League Greece", "Greece", 1, 68, 72, "#FFD700", "#000000"),
    createClub("Panathinaikos", "Super League Greece", "Greece", 1, 68, 72, "#00804E", "#FFFFFF"),

    // --- DENMARK ---
    createClub("FC Copenhagen", "Superliga", "Denmark", 1, 68, 72, "#FFFFFF", "#0053A0", ContinentalTier.CONFERENCE),
    createClub("Midtjylland", "Superliga", "Denmark", 1, 65, 70, "#000000", "#DA291C"),
    createClub("Brondby", "Superliga", "Denmark", 1, 62, 68, "#FFD700", "#003399"),

    // --- CZECH REPUBLIC ---
    createClub("Sparta Prague", "Czech First League", "Czech Republic", 1, 68, 72, "#AC1E23", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Slavia Prague", "Czech First League", "Czech Republic", 1, 68, 72, "#DA291C", "#FFFFFF", ContinentalTier.EUROPA),
    createClub("Viktoria Plzen", "Czech First League", "Czech Republic", 1, 65, 70, "#003399", "#DA291C", ContinentalTier.CONFERENCE),

    // --- POLAND ---
    createClub("Lech Poznan", "Ekstraklasa", "Poland", 1, 60, 68, "#0053A0", "#FFFFFF"),
    createClub("Rakow", "Ekstraklasa", "Poland", 1, 58, 67, "#DA291C", "#0053A0"),
    createClub("Legia Warsaw", "Ekstraklasa", "Poland", 1, 62, 69, "#000000", "#FFFFFF", ContinentalTier.CONFERENCE),

    // --- SWEDEN ---
    createClub("Malmo FF", "Allsvenskan", "Sweden", 1, 62, 69, "#6CABDD", "#FFFFFF", ContinentalTier.CHAMPIONS),
    createClub("Elfsborg", "Allsvenskan", "Sweden", 1, 58, 65, "#FFD700", "#000000"),
    createClub("Djurgarden", "Allsvenskan", "Sweden", 1, 58, 66, "#003399", "#6CABDD"),

    // --- ROMANIA ---
    createClub("FCSB", "Liga I", "Romania", 1, 60, 66, "#DA291C", "#003399"),
    createClub("CFR Cluj", "Liga I", "Romania", 1, 62, 67, "#800000", "#FFFFFF"),
    
    // --- SWITZERLAND ---
    createClub("Young Boys", "Swiss Super League", "Switzerland", 1, 65, 71, "#FFED00", "#000000", ContinentalTier.CHAMPIONS),
    createClub("Basel", "Swiss Super League", "Switzerland", 1, 65, 68, "#DA291C", "#003399"),
    createClub("Servette", "Swiss Super League", "Switzerland", 1, 60, 67, "#800000", "#FFFFFF"),

    // --- SLOVAKIA ---
    createClub("Slovan Bratislava", "Nike Liga", "Slovakia", 1, 55, 65, "#6CABDD", "#FFFFFF", ContinentalTier.CHAMPIONS),
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
