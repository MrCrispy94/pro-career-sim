
export enum Position {
  GK = 'Goalkeeper',
  DEF = 'Defender',
  MID = 'Midfielder',
  FWD = 'Forward'
}

export enum PromisedRole {
  STAR = 'Star Player',
  IMPORTANT = 'Important Starter',
  REGULAR = 'Regular Starter',
  ROTATION = 'Rotation',
  BACKUP = 'Backup',
  YOUTH = 'Youth/Prospect'
}

export enum ContractType {
  YOUTH = 'Youth',
  PROFESSIONAL = 'Professional'
}

export enum ContinentalTier {
  NONE = 0,
  CONFERENCE = 1,
  EUROPA = 2,
  CHAMPIONS = 3
}

export type Currency = 'GBP' | 'EUR' | 'USD';

export interface AppSettings {
  scale: number; // 0.8 to 1.2
  currency: Currency;
}

export interface Club {
  id: string; // Unique ID for tracking
  name: string;
  league: string;
  country: string;
  tier: number; // 1 (Elite) to 5 (Low)
  prestige: number; // 1-100
  strength: number; // 1-100, determines league performance
  primaryColor: string; // Hex
  secondaryColor: string; // Hex
  continentalTier: ContinentalTier;
}

export interface StatSet {
  matches: number;
  starts: number; 
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  rating: number;
  motm: number; // Man of the Match awards
}

export interface SeasonStats {
  total: StatSet; // SENIOR Stats only
  youth: StatSet; // Youth Stats
  league: StatSet;
  cup: StatSet;
  europe: StatSet;
  international: StatSet;
  internationalBreakdown: Record<string, StatSet>; // Key: "World Cup 2026", "Friendlies 2025"
  level: 'Senior' | 'U21' | 'U18' | 'Youth/Reserves' | 'Free Agent';
  injuries: string[]; // "Hamstring (2 months)"
  weeksOut: number;
  cupStatus: string; // e.g. "Round 4 (Active)", "Winner", "Eliminated in QF"
  europeStatus: string; // e.g. "Group Stage (Active)", "Winner"
  europeCompetitionName?: string; // "Champions League", "Europa League", "Conference League"
  awards: string[]; // Personal awards won this season
}

export interface LeagueRow {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
  isPlayerClub: boolean;
  status?: 'PRO' | 'REL' | 'UCL' | 'UEL' | 'UECL'; // For coloring rows
}

export type WorldTables = Record<string, LeagueRow[]>;

export interface SeasonRecord {
  year: number;
  age: number;
  club: Club;
  isLoan: boolean;
  stats: SeasonStats;
  trophies: string[];
  events: string[];
  leaguePosition: number; // 1st, 2nd, etc.
  worldState?: WorldTables; // Snapshot of major leagues
}

export interface Contract {
  wage: number; // Weekly
  yearsLeft: number;
  expiryYear: number;
  type: ContractType;
  promisedRole: PromisedRole;
  yearlyWageRise: number; // Percentage (0-20)
}

export interface GameModifiers {
  noTransfers: boolean;
  noStartsUnder21: boolean;
  forceMoveEveryYear: boolean;
  randomLifeEvents: boolean;
  injuriesOff: boolean;
  dislikedTeams: string[]; // Names of clubs
}

export interface GameConfig {
  startingAbility?: number;
  potentialAbility?: number;
  injuryProneness?: number;
  startingClub?: Club;
  modifiers: GameModifiers;
}

export interface Player {
  name: string;
  nationality: string;
  age: number;
  position: Position;
  
  // Hidden attributes
  currentAbility: number; // 1-100
  potentialAbility: number; // 1-100
  naturalFitness: number; // 1-100 (Determines fatigue resistance)
  injuryProne: number; // 1-100 (Higher = more injuries)
  form: number; // 1-100 (Dynamic based on recent performance)
  
  // Dynamic attributes
  fatigue: number; // 0-100+ (Career Load). 100 = Broken body.
  isSurplus: boolean; // If true, club wants to sell
  
  currentClub: Club;
  parentClub: Club | null; // If on loan, this is the owning club
  contract: Contract; // Contract is always with the Parent Club (or current if not on loan)
  marketValue: number;
  
  history: SeasonRecord[];
  trophyCabinet: string[];
  awardsCabinet: string[]; // Personal awards
  cash: number;
  
  // Config
  config: GameConfig;
}

export enum OfferType {
  TRANSFER = 'TRANSFER',
  LOAN = 'LOAN',
  RENEWAL = 'RENEWAL',
  EXTENSION = 'LOAN EXTENSION'
}

export interface Offer {
  id: string;
  type: OfferType;
  club: Club;
  wage: number;
  years: number;
  transferFee: number;
  description: string;
  negotiable: boolean;
  promisedRole: PromisedRole;
  yearlyWageRise?: number;
}

export enum GameState {
  START_SCREEN = 'START_SCREEN',
  LOADING = 'LOADING',
  WELCOME_SCREEN = 'WELCOME_SCREEN',
  DASHBOARD = 'DASHBOARD',
  MID_SEASON = 'MID_SEASON', // January Window
  SEASON_SUMMARY = 'SEASON_SUMMARY',
  PRE_SEASON = 'PRE_SEASON', // Replaces Transfer Market as the main hub
  RETIREMENT = 'RETIREMENT',
  HALL_OF_FAME = 'HALL_OF_FAME',
  INTERNATIONAL_TOURNAMENT = 'INTERNATIONAL_TOURNAMENT',
  AWARD_CEREMONY = 'AWARD_CEREMONY'
}
