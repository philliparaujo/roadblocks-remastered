import { GameInstance } from "@roadblocks/client";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

function Home() {
  const [gameReady, setGameReady] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const startGame = () => {
    GameInstance.newGame("John")
      .then(() => {
        setGameReady(true);
      })
      .catch((err) => {
        setError(err);
      });
  };

  return (
    <div className="home">
      <div id="background" />
      <img src="images/logo.png" id="logo" />

      <button onClick={startGame}>Start Game</button>

      <Link to={"/settings"}>
        <button>Settings</button>
      </Link>

      <Link to={"/about"}>
        <button>About</button>
      </Link>

      {gameReady && <Navigate to="/game" replace={true} />}
      {error && <div>{error}</div>}
    </div>
  );
}

export default Home;
