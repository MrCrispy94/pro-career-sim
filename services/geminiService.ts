
import { Club, Offer, Position, OfferType, PromisedRole, StatSet } from "../types";
import { REAL_CLUBS } from "../utils/clubData";
import { getRandomInt, getPromisedRole } from "../utils/gameLogic";

// --- SIMULATION SERVICE ---
// This service uses robust RNG logic to simulate game world events.
// It has NO external API dependencies and runs entirely locally.

export const generateInitialClub = async (nationality: string, position: string, clubCountry: string): Promise<Club> => {
  // Simulate "Scouting" delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // 1. 90% chance to start in home country if clubs exist
  const homeClubs = REAL_CLUBS.filter(c => c.country === nationality);
  let pool = REAL_CLUBS;
  
  if (homeClubs.length > 0) {
      // 90% chance for home nation
      if (Math.random() < 0.9) {
          pool = homeClubs;
      } else {
          // 10% chance for random global
          pool = REAL_CLUBS; 
      }
  }

  // Pick random club
  const club = pool[Math.floor(Math.random() * pool.length)];
  
  return club;
};

export const generateTransferOffers = async (
  playerAbility: number,
  position: string,
  currentLeagueTier: number,
  age: number,
  marketValue: number,
  playerForm: number = 50,
  potentialAbility: number = 0 // Added potential awareness
): Promise<Offer[]> => {
  // Simulate "Agent Work" delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const offers: Offer[] = [];
  
  // Adjust effective ability for target tier calculation
  // Form 50 = +0
  // Form 100 = +12.5
  // Form 0 = -12.5
  const formFactor = (playerForm - 50) / 4;
  let effectiveAbility = playerAbility + formFactor;

  // --- POTENTIAL AWARENESS ---
  // Teams will "scout" potential. If player is young and has high potential,
  // effective ability for recruitment purposes is higher.
  if (age < 23 && potentialAbility > playerAbility) {
      const potentialDiff = potentialAbility - playerAbility;
      // Scouts add a portion of potential to current perception
      const scoutBonus = potentialDiff * 0.4; 
      effectiveAbility += scoutBonus;
  }
  
  // Logic to find appropriate clubs
  // 1. Determine target tier based on effective CA
  let targetTier = 4;
  if (effectiveAbility > 82) targetTier = 1;
  else if (effectiveAbility > 72) targetTier = 2;
  else if (effectiveAbility > 62) targetTier = 3;
  else if (effectiveAbility > 52) targetTier = 4;
  else targetTier = 5;
  
  // 2. Get clubs in that tier range (+/- 1)
  let candidates = REAL_CLUBS.filter(c => Math.abs(c.tier - targetTier) <= 1);
  
  // 3. Filter by strength to ensure realism (don't go to a team way too good or way too bad)
  // Allow slightly better clubs to bid (ambition) or slightly worse (desperation)
  // Use effectiveAbility for upper bound to allow punching above weight
  candidates = candidates.filter(c => c.strength > (playerAbility - 15) && c.strength < (effectiveAbility + 20));

  // Fallback if no matches
  if (candidates.length === 0) candidates = REAL_CLUBS.filter(c => c.tier === targetTier);
  if (candidates.length === 0) candidates = REAL_CLUBS;

  // Shuffle
  candidates = candidates.sort(() => 0.5 - Math.random());
  
  const numOffers = getRandomInt(1, 3);
  const selectedClubs = candidates.slice(0, numOffers);
  
  const descriptions = [
      "We have been tracking your progress and believe you are ready for the first team.",
      "You are exactly the profile of player we are looking to rebuild around.",
      "We need reinforcement in your position immediately.",
      "Our scouts have identified you as a top prospect.",
      "We can offer you the game time you need to develop.",
      "We admire your style of play.",
      "Your recent form has caught our eye."
  ];

  selectedClubs.forEach((club, idx) => {
      const role = getPromisedRole(playerAbility, club.strength);
      
      // Wage Calculation Logic Updated:
      // 1. Base wage on market value (standard)
      let baseWage = Math.max(300, Math.round(marketValue * 0.004));
      
      // 2. Protection for Older Players (>29)
      // Market value drops with age, but wages usually stay high based on ability/reputation.
      // We calculate a "shadow wage" based purely on ability.
      if (age > 29) {
          // Calculate what a player of this ability would be worth if they were 25 (peak value approx)
          const shadowValue = Math.pow(playerAbility, 3) * 18 * 1.2; // Standard logic from gameLogic
          const abilityWage = Math.round((shadowValue / 10000) * 10000 * 0.0045); // Similar ratio
          
          // Take the higher of the two. 
          // This prevents a 35yo Messi getting offered €2k/wk just because his resale value is €500k.
          baseWage = Math.max(baseWage, abilityWage);
      }

      // 3. Tier Minimums
      if (club.tier === 1) baseWage = Math.max(5000, baseWage); 
      if (club.tier === 2) baseWage = Math.max(2000, baseWage);
      
      // 4. Saudi Tax (The Multiplier)
      let wageMultiplier = 0.8 + Math.random() * 0.5; // Standard 0.8x to 1.3x
      
      if (club.league === "Saudi Pro League") {
           // Massive wage boost for Saudi clubs
           // 3x to 6x normal wages
           wageMultiplier = 3.0 + Math.random() * 3.0; 
      }

      const wageOffer = Math.round(baseWage * wageMultiplier);
      
      // Transfer fee
      const feeOffer = Math.round(marketValue * (0.9 + Math.random() * 0.3));

      offers.push({
          id: `offer-${Date.now()}-${idx}`,
          type: OfferType.TRANSFER,
          club: club,
          wage: wageOffer,
          years: getRandomInt(2, 5),
          transferFee: feeOffer,
          description: descriptions[getRandomInt(0, descriptions.length - 1)],
          negotiable: true,
          promisedRole: role,
          yearlyWageRise: getRandomInt(0, 10)
      });
  });

  return offers;
};

export const generateNarrative = async (
    stats: any, // Using any to accept partial stat objects if needed, but mainly SeasonStats
    trophies: string[], 
    clubName: string,
    age: number
): Promise<string> => {
    // Simple narrative generation based on stats
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const goals = stats.total?.goals || 0;
    const rating = stats.total?.rating || 0;
    const matches = stats.total?.matches || 0;
    
    if (matches < 5) return `A quiet season at ${clubName} with limited opportunities to impress.`;
    
    if (rating >= 8.0) return `A sensational campaign for ${clubName}, dominating the league with a ${rating} rating.`;
    if (rating >= 7.5) return `An excellent season at ${clubName}, establishing yourself as a key player.`;
    if (rating >= 7.0) return `A solid season of development at ${clubName}.`;
    if (rating >= 6.0) return `A mixed season at ${clubName} with some ups and downs.`;
    
    if (goals > 15) return `A prolific season in front of goal, scoring ${goals} times for ${clubName}.`;
    if (trophies.length > 0) return `A successful season at ${clubName}, adding silverware to the cabinet.`;

    return `A difficult season at ${clubName}, struggling to find consistent form.`;
}
