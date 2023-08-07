import { useEffect } from "react";
import { GameInstance } from "@roadblocks/client";
// import { NPCImpl } from "./NPC/NPC.tsx.OFF";
// import { GameClient } from "../../client/src/GameClient";
import { Routes, Route, Router, Link } from "react-router-dom";
import Game from "./Game";
import Home from "./Home";

function App() {
  useEffect(() => {
    // NPCImpl.create(GameInstance, "red", {
    //   sleepTimeMs: 500,
    //   wallActionIntervalMs: 200,
    //   movementIntervalMs: 100,
    // });
    // NPCImpl.create(GameInstance, "blue", {
    //   sleepTimeMs: 500,
    //   wallActionIntervalMs: 200,
    //   movementIntervalMs: 100,
    // });
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/settings" element={<div>SETTINGS</div>} />
        <Route path="/about" element={<div>ABOUT</div>} />
      </Routes>
    </div>
  );
}
export default App;
