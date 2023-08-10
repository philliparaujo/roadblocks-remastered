import { GameInstance } from "@roadblocks/client";
import NavBar from "./NavBar";
import { useState } from "react";
import { Navigate } from "react-router-dom";

function Home() {
  const [gameReady, setGameReady] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const links = [
    { name: "Settings", url: "/settings" },
    { name: "About", url: "/about" },
  ];

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
    <>
      <NavBar links={links} />
      <button onClick={startGame}>Start Game</button>

      {gameReady && <Navigate to="/game" replace={true} />}
      {error && <div>{error}</div>}
    </>
  );
}

export default Home;
