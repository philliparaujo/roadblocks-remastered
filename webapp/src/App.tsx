import { useEffect } from "react";
import "./App.css";
import GameInstance from "./GameEngine/Game";
import { NPCImpl } from "./NPC/NPC";
import UIBoard from "./components/Board/UIBoard";
import Dice from "./components/UI/Dice";
import LockWallsButton from "./components/UI/LockWallsButton";
import PlayerRectangles from "./components/UI/PlayerRectangles";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import WallRectangles from "./components/UI/WallRectangles";

function App() {
  useEffect(() => {
    NPCImpl.create(GameInstance, "red", {
      sleepTimeMs: 500,
      wallActionIntervalMs: 200,
      movementIntervalMs: 100,
    });
    NPCImpl.create(GameInstance, "blue", {
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
