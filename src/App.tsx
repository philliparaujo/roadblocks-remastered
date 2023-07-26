import "./App.css";
import UIBoard from "./components/Board/UIBoard";
import GameInstance, { GameImpl } from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";
import { TextBoard } from "./GameEngine/TextBoard";
import { useEffect, useState } from "react";
import { NPCImpl } from "./GameEngine/NPC";
import Dice from "./components/UI/Dice";

function App() {
  useEffect(() => {
    NPCImpl.create(GameInstance, "red", {
      sleepTimeMs: 1,
      wallActionIntervalMs: 1,
      movementIntervalMs: 1,
    });
    NPCImpl.create(GameInstance, "blue", {
      sleepTimeMs: 1,
      wallActionIntervalMs: 1,
      movementIntervalMs: 1,
    });
    GameInstance.startGame();
  }, []);

  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard debug={false}></UIBoard>
      <LockWallsButton />
      <SwitchTurnButton />
      {/* <Dice /> */}
    </div>
  );
}
export default App;
