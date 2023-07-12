import "./App.css";
import UIBoard from "./components/UI/Board/UIBoard";
import Game from "./GameEngine/Game";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";

function App() {
  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard height={7} width={7} debug={true}></UIBoard>
      <SwitchTurnButton />
    </div>
  );
}
export default App;
