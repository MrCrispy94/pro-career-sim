
import { Club, Offer, Position, OfferType, PromisedRole } from "../types";
import { REAL_CLUBS } from "../utils/clubData";
import { getRandomInt, getPromisedRole } from "../utils/gameLogic";

// --- SIMULATION SERVICE ---
// Replacement for AI services. Uses RNG and game logic.

export const generateInitialClub = async (nationality: string, position: string, clubCountry: string): Promise<Club> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const homeClubs = REAL_CLUBS.filter(c => c.country === nationality);
  let pool = REAL_CLUBS;
  
  if (homeClubs.length > 0) {
      // 90% chance to start in home country
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
  potentialAbility: number = 0
): Promise<Offer[]> => {
  // Simulate Agent/Scout processing
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const offers: Offer[] = [];
  
  const formFactor = (playerForm - 50) / 4;
  let effectiveAbility = playerAbility + formFactor;

  // Potential Awareness: Scouts value high potential youth
  if (age < 23 && potentialAbility > playerAbility) {
      const potentialDiff = potentialAbility - playerAbility;
      const scoutBonus = potentialDiff * 0.4; 
      effectiveAbility += scoutBonus;
  }
  
  // Logic to find appropriate clubs
  let targetTier = 4;
  if (effectiveAbility > 82) targetTier = 1;
  else if (effectiveAbility > 72) targetTier = 2;
  else if (effectiveAbility > 62) targetTier = 3;
  else if (effectiveAbility > 52) targetTier = 4;
  else targetTier = 5;
  
  // Get clubs in that tier range (+/- 1 tier)
  let candidates = REAL_CLUBS.filter(c => Math.abs(c.tier - targetTier) <= 1);
  
  // Filter by strength (realistic transfers)
  candidates = candidates.filter(c => c.strength > (playerAbility - 15) && c.strength < (effectiveAbility + 20));

  // Fallback
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
      
      // Wage Calculation
      let baseWage = Math.max(300, Math.round(marketValue * 0.004));
      
      // Veteran protection
      if (age > 29) {
          const shadowValue = Math.pow(playerAbility, 3) * 18 * 1.2; 
          const abilityWage = Math.round((shadowValue / 10000) * 10000 * 0.0045); 
          baseWage = Math.max(baseWage, abilityWage);
      }

      // Tier Minimums
      if (club.tier === 1) baseWage = Math.max(5000, baseWage); 
      if (club.tier === 2) baseWage = Math.max(2000, baseWage);
      
      // League multipliers
      let wageMultiplier = 0.8 + Math.random() * 0.5;
      
      if (club.league === "Saudi Pro League") {
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
    stats: any, 
    trophies: string[], 
    clubName: string,
    age: number
): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const goals = stats.total?.goals || 0;
    const rating = stats.total?.rating || 0;
    const matches = stats.total?.matches || 0;
    const assists = stats.total?.assists || 0;
    
    // Helpers for random variety
    const pick = (opts: string[]) => opts[Math.floor(Math.random() * opts.length)];

    if (matches < 5) {
        return pick([
            `A quiet season at ${clubName} with limited opportunities.`,
            `Struggled to break into the first team at ${clubName}.`,
            `Spent most of the season on the bench at ${clubName}.`
        ]);
    }
    
    if (rating >= 8.0) {
        return pick([
            `A sensational campaign for ${clubName}, dominating the league with a ${rating} rating!`,
            `World-class performances throughout the season at ${clubName}.`,
            `The fans at ${clubName} are calling you a legend after this season.`
        ]);
    }
    
    if (rating >= 7.5) {
        return pick([
            `An excellent season at ${clubName}, establishing yourself as a key player.`,
            `Consistently high-level performances for ${clubName}.`,
            `A breakout year at ${clubName} where you showed your true quality.`
        ]);
    }
    
    if (goals > 20) {
        return `A goal-scoring masterclass, netting ${goals} times for ${clubName}.`;
    }

    if (assists > 15) {
        return `The creative engine of ${clubName}, providing ${assists} assists this season.`;
    }

    if (trophies.length > 0) {
        return `A successful, trophy-winning season at ${clubName}.`;
    }

    if (rating >= 7.0) {
        return `A solid, dependable season of development at ${clubName}.`;
    }
    
    if (rating >= 6.0) {
        return `A mixed season at ${clubName} with some ups and downs.`;
    }

    return `A difficult season at ${clubName}, struggling to find consistent form.`;
}
