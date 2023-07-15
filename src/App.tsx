import "./App.css";
import UIBoard from "./components/UI/Board/UIBoard";
import Game from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import LockWallsButton from "./components/UI/LockWallsButton";

function App() {
  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard height={7} width={7} debug={true}></UIBoard>
      <LockWallsButton />
      <SwitchTurnButton />
    </div>
  );
}
export default App;
