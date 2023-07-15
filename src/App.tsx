import "./App.css";
import UIBoard from "./components/UI/Board/UIBoard";
import Game from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";

function App() {
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
