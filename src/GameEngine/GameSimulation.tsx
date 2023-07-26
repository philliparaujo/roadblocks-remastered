import { GameImpl, PlayerColor } from "./Game";
import { NPCImpl } from "./NPC";

async function simulateGame(): Promise<PlayerColor> {
  console.time("simulate");
  const game = GameImpl.createForTesting(7, 7, { rollDurationMs: 1 });
  const npcRed = NPCImpl.create(game, "red", {
    sleepTimeMs: 1,
    wallActionIntervalMs: 1,
    movementIntervalMs: 1,
  });
  const npcBlue = NPCImpl.create(game, "blue", {
    sleepTimeMs: 1,
    wallActionIntervalMs: 1,
    movementIntervalMs: 1,
  });
  game.startGame();

  return new Promise<PlayerColor>((resolve) => {
    game.winGameEventSubscription().subscribe((event) => {
      try {
        resolve(event.winner);
      } finally {
        console.timeEnd("simulate");
      }
    });
  });
}

async function runGames(times: number): Promise<void> {
  const results: { [key in PlayerColor]: number } = { red: 0, blue: 0 };

  // const gamePromises: Promise<PlayerColor>[] = [];
  // for (let i = 0; i < times; i++) {
  //   gamePromises.push(simulateGame());
  // }
  // const winners: PlayerColor[] = await Promise.all(gamePromises);
  // winners.forEach((winner) => {
  //   results[winner] += 1;
  // });

  for (let i = 0; i < times; i++) {
    const winner: PlayerColor = await simulateGame();
    results[winner] += 1;
  }

  console.log("Results:", results);
}

runGames(1);
