import "./App.css";
import UIBoard from "./components/Board/UIBoard";
import Game from "./components/GameEngine/Game";

function App() {
  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard height={7} width={7}></UIBoard>
      {/* <button onClick={Game.switchTurn}>End turn</button> */}
    </div>
  );
}
export default App;
