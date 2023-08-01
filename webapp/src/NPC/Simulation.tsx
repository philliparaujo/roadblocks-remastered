import { GameImpl } from "../GameEngine/Game";
import { PlayerColor } from "@roadblocks/engine";
import { NPCImpl } from "./NPC";
import { NPC2Impl } from "./NPC2";

type NPCType = "NPCImpl" | "NPC2Impl";
type GameResult = { type: NPCType; color: PlayerColor };

async function simulateGame(
  npcType1: NPCType,
  npcType2: NPCType
): Promise<GameResult> {
  const game = GameImpl.createForTesting(7, 7, { rollDurationMs: 1 });

  const npc1Color: PlayerColor = Math.random() > 0.5 ? "red" : "blue";
  const npc2Color: PlayerColor = npc1Color === "red" ? "blue" : "red";

  const npc1 =
    npcType1 === "NPCImpl"
      ? NPCImpl.create(game, npc1Color, {
          sleepTimeMs: 0,
          wallActionIntervalMs: 0,
          movementIntervalMs: 0,
        })
      : NPC2Impl.create(game, npc1Color, {
          sleepTimeMs: 0,
          wallActionIntervalMs: 0,
          movementIntervalMs: 0,
        });

  const npc2 =
    npcType2 === "NPCImpl"
      ? NPCImpl.create(game, npc2Color, {
          sleepTimeMs: 0,
          wallActionIntervalMs: 0,
          movementIntervalMs: 0,
        })
      : NPC2Impl.create(game, npc2Color, {
          sleepTimeMs: 0,
          wallActionIntervalMs: 0,
          movementIntervalMs: 0,
        });

  game.startGame();

  return new Promise<GameResult>((resolve) => {
    game.winGameEventSubscription().subscribe((event) => {
      const winnerType = event.winner === npc1Color ? npcType1 : npcType2;
      resolve({ type: winnerType, color: event.winner });
    });
  });
}

/* node-ts Simulation.tsx */

async function runGamesAsync(
  times: number,
  npcType1: NPCType,
  npcType2: NPCType
): Promise<void> {
  const results = {
    byType: { NPCImpl: 0, NPC2Impl: 0 },
    byColor: { red: 0, blue: 0 },
  };

  const gamePromises: Promise<GameResult>[] = [];
  for (let i = 0; i < times; i++) {
    gamePromises.push(simulateGame(npcType1, npcType2));
  }
  const winners: GameResult[] = await Promise.all(gamePromises);
  winners.forEach((winner) => {
    results.byType[winner.type] += 1;
    results.byColor[winner.color] += 1;
  });

  if (npcType1 === npcType2) {
    results.byType[npcType1] = times;
    results.byType[npcType1 === "NPCImpl" ? "NPC2Impl" : "NPCImpl"] = 0;
  }

  console.log("Results by Type:", results.byType);
  console.log("Results by Color:", results.byColor);
}

console.time("TOTAL TIME async");
runGamesAsync(40, "NPCImpl", "NPCImpl").then(() => {
  console.timeEnd("TOTAL TIME async");
});
