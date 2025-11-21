
import React, { useState } from 'react';
import { Player, GameState, Position, SeasonRecord, ContractType, PromisedRole, LeagueRow, SeasonStats, WorldTables, StatSet, GameConfig } from './types';
import { generateInitialClub, generateNarrative } from './services/geminiService';
import { calculateGrowth, getRandomInt, simulateSeasonPerformance, calculateMarketValue, handleClubProgression, generateWorldLeagues, mergeStatSet, calculateAwards, calculateForm } from './utils/gameLogic';
import { addToHallOfFame, saveGame, loadGame, getHallOfFame, exportSaveFile } from './utils/storage';
import StartScreen from './components/StartScreen';
import Dashboard from './components/Dashboard';
import SeasonSummary from './components/SeasonSummary';
import PreSeasonHub from './components/PreSeasonHub';
import MidSeasonWindow from './components/MidSeasonWindow';
import SimulationModal from './components/SimulationModal';
import HallOfFame from './components/HallOfFame';
import WorldLeagues from './components/WorldLeagues';
import AwardCeremony from './components/AwardCeremony';
import WelcomeScreen from './components/WelcomeScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentYear, setCurrentYear] = useState(2024);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState({ title: "Loading", subtitles: ["Please wait..."] });
  
  const [midSeasonStats, setMidSeasonStats] = useState<SeasonStats | null>(null);
  const [midSeasonTable, setMidSeasonTable] = useState<LeagueRow[]>([]);
  
  const [lastSeasonData, setLastSeasonData] = useState<{record: SeasonRecord, narrative: string, growthLog: string} | null>(null);
  const [hofPlayers, setHofPlayers] = useState<Player[]>([]);
  
  const [currentWorldTables, setCurrentWorldTables] = useState<WorldTables>({});
  const [showWorldLeagues, setShowWorldLeagues] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [seasonAwards, setSeasonAwards] = useState<string[]>([]);

  // Callback to handle continuing from Welcome Screen
  const [welcomeCallback, setWelcomeCallback] = useState<() => void>(() => {});

  // Check for save on mount
  React.useEffect(() => {
      const save = loadGame();
      setHasSave(!!save);
  }, []);

  const handleSaveGame = () => {
      if (player) {
          saveGame(player, currentYear, gameState, { midSeasonStats, midSeasonTable, lastSeasonData, currentWorldTables });
          alert("Game Saved Successfully! (Stored in Browser)");
          setHasSave(true);
      }
  };

  const handleExportSave = () => {
      if (player) {
          exportSaveFile(player, currentYear, gameState, { midSeasonStats, midSeasonTable, lastSeasonData, currentWorldTables });
      }
  };

  const handleImportSave = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.player && json.year) {
                  setPlayer(json.player);
                  setCurrentYear(json.year);
                  setGameState(json.gameState);
                  if (json.midSeasonData) {
                      setMidSeasonStats(json.midSeasonData.midSeasonStats);
                      setMidSeasonTable(json.midSeasonData.midSeasonTable);
                      setLastSeasonData(json.midSeasonData.lastSeasonData);
                      if (json.midSeasonData.currentWorldTables) {
                          setCurrentWorldTables(json.midSeasonData.currentWorldTables);
                      } else {
                          setCurrentWorldTables(generateWorldLeagues(0));
                      }
                  }
                  alert("Save file loaded successfully!");
              } else {
                  alert("Invalid save file format.");
              }
          } catch (error) {
              console.error(error);
              alert("Failed to parse save file.");
          }
      };
      reader.readAsText(file);
  };

  const handleMainMenu = () => {
      if (confirm("Are you sure you want to return to the Main Menu? Unsaved progress will be lost.")) {
          setGameState(GameState.START_SCREEN);
          setPlayer(null);
      }
  };

  const handleLoadGame = () => {
      const saveData = loadGame();
      if (saveData) {
          setPlayer(saveData.player);
          setCurrentYear(saveData.year);
          setGameState(saveData.gameState);
          if (saveData.midSeasonData) {
              setMidSeasonStats(saveData.midSeasonData.midSeasonStats);
              setMidSeasonTable(saveData.midSeasonData.midSeasonTable);
              setLastSeasonData(saveData.midSeasonData.lastSeasonData);
              if (saveData.midSeasonData.currentWorldTables) {
                  setCurrentWorldTables(saveData.midSeasonData.currentWorldTables);
              } else {
                  setCurrentWorldTables(generateWorldLeagues(0));
              }
          }
      } else {
          alert("No local save file found.");
      }
  };

  const handleStartGame = async (name: string, inputAge: number, nationality: string, position: Position, config: GameConfig) => {
    setIsLoading(true);
    setLoadingMessage({ title: "Scouting World", subtitles: ["Finding clubs...", "Generating youth intake...", "Negotiating contract...", "Initializing leagues..."] });
    
    let startAge = inputAge;
    
    // Club Selection Logic
    let club = config.startingClub;
    if (!club) {
        club = await generateInitialClub(nationality, position, nationality); 
    }
    
    // Ability Logic
    let baseAbility = config.startingAbility || getRandomInt(35, 55);
    // Random Ability if not set or if "Random" behavior implied (-1 case, or undefined/null passed)
    if ((config.startingAbility === undefined || config.startingAbility === -1) && Math.random() > 0.95) baseAbility += getRandomInt(5, 15); 

    let potential = config.potentialAbility || Math.min(99, Math.max(baseAbility + 20, baseAbility + getRandomInt(15, 40)));
    
    const naturalFitness = getRandomInt(50, 99); 
    const injuryProne = config.injuryProneness || getRandomInt(1, 15); 

    // First Contract
    const initContractYears = 3;
    const initWage = 100; 
    const initValue = calculateMarketValue(baseAbility, startAge, potential, position, initContractYears);

    const newPlayer: Player = {
      name, age: startAge, nationality, position,
      currentAbility: baseAbility, potentialAbility: potential,
      naturalFitness,
      injuryProne,
      fatigue: 0,
      form: 50, // Initial neutral form
      isSurplus: false,
      currentClub: club,
      parentClub: null,
      contract: { 
          wage: initWage, 
          yearsLeft: initContractYears, 
          expiryYear: 2024 + initContractYears,
          type: ContractType.YOUTH,
          promisedRole: PromisedRole.YOUTH,
          yearlyWageRise: 0
      },
      marketValue: initValue,
      history: [], trophyCabinet: [], awardsCabinet: [], cash: 0,
      config: config 
    };

    setPlayer(newPlayer);
    setCurrentWorldTables(generateWorldLeagues(0));
    
    // Show Welcome Screen for first club
    setWelcomeCallback(() => () => setGameState(GameState.PRE_SEASON));
    setGameState(GameState.WELCOME_SCREEN);
    setIsLoading(false);
  };

  const handleStartSeason = async () => {
    if (!player) return;
    setIsLoading(true);
    setLoadingMessage({ 
        title: `Simulating ${currentYear} Fall Season`, 
        subtitles: ["Playing League Matches...", "Cup Runs...", "Training...", "Travel Days...", "Simulating World Leagues..."] 
    });

    setTimeout(() => {
        // Simulate first half
        const performance = simulateSeasonPerformance(player, currentYear, 0.5);
        const worldTables = generateWorldLeagues(19); // 19 games for mid-season

        if (performance.leagueTable && performance.leagueTable.length > 0 && worldTables[player.currentClub.league]) {
            worldTables[player.currentClub.league] = performance.leagueTable;
        }

        setMidSeasonStats(performance.stats);
        setMidSeasonTable(performance.leagueTable);
        setCurrentWorldTables(worldTables);

        setIsLoading(false);
        setGameState(GameState.MID_SEASON);
    }, 2000);
  };

  const handleMidSeasonContinue = async (updatedPlayer: Player | null) => {
      if (!player) return;
      
      // Wrapper to handle welcome screen if club changed mid-season
      if (updatedPlayer && updatedPlayer.currentClub.name !== player.currentClub.name) {
          setPlayer(updatedPlayer);
          setWelcomeCallback(() => () => executeSeasonEndSimulation(updatedPlayer));
          setGameState(GameState.WELCOME_SCREEN);
      } else {
          const activePlayer = updatedPlayer || player;
          executeSeasonEndSimulation(activePlayer);
      }
  };

  const executeSeasonEndSimulation = async (activePlayer: Player) => {
    if (!midSeasonStats) return;
    
    setIsLoading(true);
    setLoadingMessage({ 
        title: "Simulating Spring Season", 
        subtitles: ["Title Charge...", "Relegation Battle...", "European Nights...", "End of Season Awards...", "International Tournaments..."] 
    });

    const performance = simulateSeasonPerformance(activePlayer, currentYear, 0.5, midSeasonStats, true);
    
    const worldTables = generateWorldLeagues(38); 
    if (performance.leagueTable && performance.leagueTable.length > 0 && worldTables[activePlayer.currentClub.league]) {
        worldTables[activePlayer.currentClub.league] = performance.leagueTable;
    }
    setCurrentWorldTables(worldTables);

    await finalizeSeason(activePlayer, performance, midSeasonStats, worldTables);
  };

  const finalizeSeason = async (
      activePlayer: Player, 
      performance: any, 
      midSeasonStats: SeasonStats, 
      worldTables: WorldTables
  ) => {
    
    const mergedBreakdown = { ...midSeasonStats.internationalBreakdown };
    if (performance.stats.internationalBreakdown) {
        Object.entries(performance.stats.internationalBreakdown).forEach(([key, val]) => {
            if (mergedBreakdown[key]) {
                mergedBreakdown[key] = mergeStatSet(mergedBreakdown[key], val as StatSet);
            } else {
                mergedBreakdown[key] = val as StatSet;
            }
        });
    }

    // Correctly merge split stats
    const mergedYouth = mergeStatSet(midSeasonStats.youth, performance.stats.youth);

    const finalStats: SeasonStats = {
        ...performance.stats, 
        total: mergeStatSet(midSeasonStats.total, performance.stats.total),
        youth: mergedYouth,
        league: mergeStatSet(midSeasonStats.league, performance.stats.league),
        cup: mergeStatSet(midSeasonStats.cup, performance.stats.cup),
        europe: mergeStatSet(midSeasonStats.europe, performance.stats.europe),
        international: mergeStatSet(midSeasonStats.international, performance.stats.international),
        internationalBreakdown: mergedBreakdown,
        
        injuries: [...midSeasonStats.injuries, ...performance.stats.injuries],
        weeksOut: midSeasonStats.weeksOut + performance.stats.weeksOut,
        cupStatus: performance.stats.cupStatus,
        europeStatus: performance.stats.europeStatus,
        level: performance.stats.level,
        awards: [] // Calculate below
    };

    // Calculate Awards (Uses finalStats.total, which is SENIOR only)
    const awards = calculateAwards(activePlayer, finalStats, performance.trophies);
    finalStats.awards = awards;
    setSeasonAwards(awards);
    
    const finalTrophies = performance.trophies;
    const finalEvents = performance.events;

    // Combined Stats for Fatigue/Growth Calculation (Includes Youth, Senior, International)
    // This ensures even youth players playing 0 senior games get fatigue accumulation.
    const totalSenior = mergeStatSet(midSeasonStats.total, performance.stats.total);
    const totalYouth = mergeStatSet(midSeasonStats.youth, performance.stats.youth);
    const totalIntl = mergeStatSet(midSeasonStats.international, performance.stats.international);
    const allMatchesStats = mergeStatSet(mergeStatSet(totalSenior, totalYouth), totalIntl);

    const { newCA, newFatigue, growthLog } = calculateGrowth(activePlayer, allMatchesStats, finalStats.level, finalEvents, finalStats.injuries);
    
    // CALCULATE FORM
    const newForm = calculateForm(finalStats.total, activePlayer.position);
    
    const newAge = activePlayer.age + 1;
    const newContractYears = Math.max(0, activePlayer.contract.yearsLeft - 1);
    
    let newWage = activePlayer.contract.wage;
    if (activePlayer.contract.yearlyWageRise > 0) {
        newWage = Math.round(newWage * (1 + activePlayer.contract.yearlyWageRise / 100));
    }

    let nextClub = activePlayer.currentClub;
    let nextParent = activePlayer.parentClub;

    const newVal = calculateMarketValue(newCA, newAge, activePlayer.potentialAbility, activePlayer.position, newContractYears);
    
    const narrative = await generateNarrative(finalStats, finalTrophies, activePlayer.currentClub.name, newAge);
    const leaguePos = performance.leagueTable.find((r: LeagueRow) => r.isPlayerClub)?.position || 10;

    const seasonRecord: SeasonRecord = {
        year: currentYear, age: activePlayer.age,
        club: activePlayer.currentClub,
        isLoan: !!activePlayer.parentClub,
        stats: finalStats,
        trophies: finalTrophies,
        events: finalEvents,
        leaguePosition: leaguePos,
        worldState: worldTables
    };

    setPlayer(prev => {
        if (!prev) return null;

        if (nextParent) {
             nextClub = nextParent;
             nextParent = null;
        }

        if (!activePlayer.parentClub && nextClub.name === activePlayer.currentClub.name) {
             nextClub = handleClubProgression(nextClub, leaguePos);
        }

        return {
            ...activePlayer,
            age: newAge,
            currentAbility: newCA,
            fatigue: newFatigue,
            form: newForm,
            currentClub: nextClub,
            parentClub: nextParent,
            contract: { 
                ...activePlayer.contract, 
                yearsLeft: newContractYears,
                wage: newWage,
                expiryYear: newContractYears > 0 ? currentYear + 1 + newContractYears : 0 
            },
            marketValue: newVal,
            history: [...prev.history, seasonRecord],
            trophyCabinet: [...prev.trophyCabinet, ...finalTrophies],
            awardsCabinet: [...prev.awardsCabinet, ...awards]
        };
    });
    
    setLastSeasonData({ record: seasonRecord, narrative, growthLog });
    setCurrentYear(prev => prev + 1);
    
    setIsLoading(false);

    if (awards.length > 0) {
        setGameState(GameState.AWARD_CEREMONY);
    } else {
        setGameState(GameState.SEASON_SUMMARY);
    }
  };

  const handleSeasonTransition = (updatedPlayer: Player) => {
      const prevClubName = player?.currentClub.name;
      const newClubName = updatedPlayer.currentClub.name;
      
      setPlayer({
          ...updatedPlayer,
          marketValue: calculateMarketValue(updatedPlayer.currentAbility, updatedPlayer.age, updatedPlayer.potentialAbility, updatedPlayer.position, updatedPlayer.contract.yearsLeft)
      });

      // If club changed in pre-season, show welcome screen
      if (player && prevClubName !== newClubName) {
          setWelcomeCallback(() => () => setGameState(GameState.DASHBOARD));
          setGameState(GameState.WELCOME_SCREEN);
      } else {
          setGameState(GameState.DASHBOARD);
      }
  };

  const handleRetire = () => {
      if (player) {
          addToHallOfFame(player);
          setHofPlayers(getHallOfFame());
          setGameState(GameState.HALL_OF_FAME);
          setPlayer(null);
      }
  };

  const handleShowHallOfFame = () => {
      setHofPlayers(getHallOfFame());
      setGameState(GameState.HALL_OF_FAME);
  };

  return (
    <>
        {isLoading && <SimulationModal title={loadingMessage.title} subtitles={loadingMessage.subtitles} />}
        
        {showWorldLeagues && <WorldLeagues worldTables={currentWorldTables} onClose={() => setShowWorldLeagues(false)} />}

        {gameState === GameState.START_SCREEN && 
            <StartScreen 
                onStart={handleStartGame} 
                isGenerating={isLoading} 
                onLoad={handleLoadGame} 
                onImport={handleImportSave}
                onHallOfFame={handleShowHallOfFame} 
                hasSave={hasSave} 
            />
        }

        {player && gameState === GameState.WELCOME_SCREEN && (
             <WelcomeScreen player={player} onContinue={welcomeCallback} />
        )}
        
        {player && gameState === GameState.DASHBOARD && (
            <Dashboard 
                player={player} 
                currentYear={currentYear} 
                onSimulate={handleStartSeason} 
                onChangeState={setGameState} 
                isSimulating={isLoading} 
                onSaveExit={handleSaveGame} 
                onExportSave={handleExportSave}
                onMainMenu={handleMainMenu}
                onRetire={() => {
                    if (player.fatigue > 110) alert("Your body can no longer handle professional football. Forced retirement.");
                    handleRetire();
                }}
                onViewWorld={() => setShowWorldLeagues(true)}
            />
        )}

        {player && gameState === GameState.MID_SEASON && midSeasonStats && (
            <MidSeasonWindow 
                player={player} 
                stats={midSeasonStats} 
                leagueTable={midSeasonTable} 
                onContinue={handleMidSeasonContinue} 
                currentYear={currentYear} 
                onSaveExit={handleSaveGame} 
                onViewWorld={() => setShowWorldLeagues(true)} 
            />
        )}

        {gameState === GameState.AWARD_CEREMONY && (
            <AwardCeremony 
                awards={seasonAwards} 
                year={currentYear} 
                onFinish={() => setGameState(GameState.SEASON_SUMMARY)} 
            />
        )}

        {lastSeasonData && gameState === GameState.SEASON_SUMMARY && (
            <SeasonSummary seasonData={lastSeasonData.record} narrative={lastSeasonData.narrative} growthLog={lastSeasonData.growthLog} onContinue={() => setGameState(GameState.PRE_SEASON)} />
        )}

        {player && gameState === GameState.PRE_SEASON && (
            <PreSeasonHub 
                player={player} 
                lastSeason={lastSeasonData?.record || null} 
                onStartSeason={handleSeasonTransition} 
                onUpdatePlayer={setPlayer}
                isGenerating={isLoading} 
                onSaveExit={handleSaveGame} 
            />
        )}

        {gameState === GameState.HALL_OF_FAME && (
            <HallOfFame players={hofPlayers} onBack={() => setGameState(GameState.START_SCREEN)} />
        )}
    </>
  );
};

export default App;
