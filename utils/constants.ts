
export const COUNTRIES = [
    "Argentina", "Australia", "Austria", "Belgium", "Brazil", 
    "Cameroon", "Canada", "Chile", "Colombia", "Croatia", 
    "Czech Republic", "Denmark", "Egypt", "England", "France", 
    "Germany", "Ghana", "Greece", "Italy", "Ivory Coast", 
    "Japan", "Mexico", "Morocco", "Netherlands", "Nigeria", 
    "Norway", "Poland", "Portugal", "Republic of Ireland", 
    "Scotland", "Senegal", "Serbia", "South Korea", "Spain", 
    "Sweden", "Switzerland", "Turkey", "Ukraine", "United States", 
    "Uruguay", "Wales"
];

export const getRegion = (country: string): 'Europe' | 'South America' | 'Africa' | 'Asia' | 'North America' => {
    const europe = ["Austria", "Belgium", "Croatia", "Czech Republic", "Denmark", "England", "France", "Germany", "Greece", "Italy", "Netherlands", "Norway", "Poland", "Portugal", "Republic of Ireland", "Scotland", "Serbia", "Spain", "Sweden", "Switzerland", "Turkey", "Ukraine", "Wales"];
    const southAmerica = ["Argentina", "Brazil", "Chile", "Colombia", "Uruguay"];
    const africa = ["Cameroon", "Egypt", "Ghana", "Ivory Coast", "Morocco", "Nigeria", "Senegal"];
    const asia = ["Australia", "Japan", "South Korea"]; // Australia in AFC
    const northAmerica = ["Canada", "Mexico", "United States"];

    if (europe.includes(country)) return 'Europe';
    if (southAmerica.includes(country)) return 'South America';
    if (africa.includes(country)) return 'Africa';
    if (asia.includes(country)) return 'Asia';
    if (northAmerica.includes(country)) return 'North America';
    
    return 'Europe'; // Default fallback
};
