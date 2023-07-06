// import React from "react";
import "./App.css";
import Edge from "./components/Board/Edge";
import Cell from "./components/Board/Cell";
import Corner from "./components/Board/Corner";

function App() {
  return (
    <div className="App">
      <h2>Game</h2>
      <div className="game-board">
        <Corner coord={{ row: 0, col: 0 }}></Corner>
        <Edge
          coord={{ row: 0, col: 0 }}
          color="gray"
          orientation="horizontal"
        ></Edge>
        <Corner coord={{ row: 0, col: 0 }}></Corner>

        <Edge
          coord={{ row: 0, col: 0 }}
          color="gray"
          orientation="vertical"
        ></Edge>
        <Cell coord={{ row: 0, col: 0 }}></Cell>
        <Edge
          coord={{ row: 0, col: 0 }}
          color="red"
          orientation="vertical"
        ></Edge>

        <Corner coord={{ row: 0, col: 0 }}></Corner>
        <Edge
          coord={{ row: 0, col: 0 }}
          color="blue"
          orientation="horizontal"
        ></Edge>
        <Corner coord={{ row: 0, col: 0 }}></Corner>
      </div>
    </div>
  );
}
export default App;
