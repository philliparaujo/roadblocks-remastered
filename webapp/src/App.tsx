import { useEffect } from "react";
import GameInstance from "./GameEngine/Game";
import { NPCImpl } from "./NPC/NPC";
import { Client } from "../../client/src/client";
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
    // GameInstance.startGame();
    const client = new Client();

    const fetchValue = async () => {
      await client.newgame("John");
      const value = await client.value();
      console.log(value);
    };

    setTimeout(fetchValue, 1000);
    // fetchValue();
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
