import "./App.css";
import UIBoard from "./components/Board/UIBoard";

function App() {
  return (
    <div className="App">
      <h2>Game</h2>
      <UIBoard height={7} width={7}></UIBoard>
    </div>
  );
}
export default App;
