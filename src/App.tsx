import "./App.css";
import UIBoard from "./components/Board/UIBoard";
import GameInstance, { GameImpl } from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";
import { TextBoard } from "./GameEngine/TextBoard";
import { useEffect, useState } from "react";
import { NPCImpl } from "./NPC/NPC";
import Dice from "./components/UI/Dice";
import { NPC2Impl } from "./NPC/NPC2";
import WallRectangles from "./components/UI/WallRectangles";
import PlayerRectangles from "./components/UI/PlayerRectangles";

function App() {
  useEffect(() => {
    NPC2Impl.create(GameInstance, "red", {
      sleepTimeMs: 500,
      wallActionIntervalMs: 200,
      movementIntervalMs: 100,
    });
    NPC2Impl.create(GameInstance, "blue", {
      sleepTimeMs: 500,
      wallActionIntervalMs: 200,
      movementIntervalMs: 100,
    });
    GameInstance.startGame();
  }, []);

  return (
    <div className="App">
      <div className="game-column">
        <h2>Game</h2>
        <UIBoard debug={false} />
      </div>
      <div className="actions-column">
        <Dice />
        <div>
          <h3>Wall Moves:</h3>
          <WallRectangles />
        </div>
        <div>
          <h3>Player Moves:</h3>
          <PlayerRectangles />
        </div>
        <div>
          <LockWallsButton />
          <SwitchTurnButton />
        </div>
      </div>
    </div>
  );
}
export default App;
