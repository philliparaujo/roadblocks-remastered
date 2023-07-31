import { GameImpl } from "../GameEngine/Game";
import { PlayerColor } from "@roadblocks/engine";
import { NPCImpl } from "./NPC";
// import { NPC2Impl } from "./NPC2";

type NPCType = "NPCImpl" | "NPC2Impl";

async function simulateGame(): Promise<NPCType> {
  const game = GameImpl.createForTesting(7, 7, { rollDurationMs: 1 });

  const npc1Color: PlayerColor = Math.random() > 0.5 ? "red" : "blue";
  const npc2Color: PlayerColor = npc1Color === "red" ? "blue" : "red";

  const npc1 = NPCImpl.create(game, npc1Color, {
    sleepTimeMs: 0,
    wallActionIntervalMs: 0,
    movementIntervalMs: 0,
  });

  const npc2 = NPCImpl.create(game, npc2Color, {
    sleepTimeMs: 0,
    wallActionIntervalMs: 0,
    movementIntervalMs: 0,
  });

  game.startGame();

  return new Promise<NPCType>((resolve) => {
    game.winGameEventSubscription().subscribe((event) => {
      console.log(npc1Color, event.winner);
      resolve(event.winner === npc1Color ? "NPCImpl" : "NPC2Impl");
    });
  });
}

async function runGamesAsync(times: number): Promise<void> {
  const results = { NPCImpl: 0, NPC2Impl: 0 };

  const gamePromises: Promise<NPCType>[] = [];
  for (let i = 0; i < times; i++) {
    gamePromises.push(simulateGame());
  }
  const winners: NPCType[] = await Promise.all(gamePromises);
  winners.forEach((winner) => {
    results[winner] += 1;
  });

  console.log("Results:", results);
}

console.time("TOTAL TIME async");
runGamesAsync(40).then(() => {
  console.timeEnd("TOTAL TIME async");
});
