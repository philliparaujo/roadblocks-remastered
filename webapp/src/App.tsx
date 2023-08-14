import { useEffect } from "react";
// import { NPCImpl } from "./NPC/NPC.tsx.OFF";
// import { GameClient } from "../../client/src/GameClient";
import { Route, Routes } from "react-router-dom";
import Game from "./Game";
import Home from "./Home";
import HowToPlay from "./HowToPlay";
import NameSelect from "./NameSelect";

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
        <Route path="/nameSelect" element={<NameSelect />} />
        <Route path="/game" element={<Game />} />
        <Route path="/settings" element={<div>SETTINGS</div>} />
        <Route path="/howtoplay" element={<HowToPlay />} />
        <Route path="/*" element={<div>NOT FOUND</div>} />
      </Routes>
    </div>
  );
}
export default App;
