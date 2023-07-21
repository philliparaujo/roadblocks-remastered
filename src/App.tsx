import "./App.css";
import UIBoard from "./components/Board/UIBoard";
import GameInstance from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";
import { TextBoard } from "./GameEngine/TextBoard";
import { useEffect, useState } from "react";
import { NPCImpl } from "./GameEngine/NPC";

function App() {
  useEffect(() => {
    NPCImpl.create(GameInstance, "red");
  }, []);

  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard debug={false}></UIBoard>
      <LockWallsButton />
      <SwitchTurnButton />
    </div>
  );
}
export default App;
