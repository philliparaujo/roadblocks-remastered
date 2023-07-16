import "./App.css";
import UIBoard from "./components/UI/Board/UIBoard";
import GameInstance from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";
import { TextBoard } from "./GameEngine/TextBoard";
import { useEffect, useState } from "react";

function App() {
  const [textBoard, setTextBoard] = useState<TextBoard | null>(null);

  useEffect(() => {
    console.log("??");
    TextBoard.create(GameInstance).then((tb) => {
      setTextBoard(tb);
      console.log(tb.getBoard());
    });
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
