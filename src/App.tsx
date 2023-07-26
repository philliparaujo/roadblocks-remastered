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

function App() {
  useEffect(() => {
    NPCImpl.create(GameInstance, "red", {
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
      <h2>Game</h2>
      <UIBoard debug={false}></UIBoard>
      <LockWallsButton />
      <SwitchTurnButton />
      <Dice />
    </div>
  );
}
export default App;
