import { GameInstance } from "@roadblocks/client";
import "./Game.css";
import NavBar from "./NavBar";
import UIBoard from "./components/Board/UIBoard";
import Dice from "./components/UI/Dice";
import LockWallsButton from "./components/UI/LockWallsButton";
import PlayerRectangles from "./components/UI/PlayerRectangles";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import WallRectangles from "./components/UI/WallRectangles";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  DiceRollAlert,
  ErrorAlert,
  LockWallsAlert,
  StartGameAlert,
  SwitchTurnAlert,
  WinGameAlert,
} from "./components/UI/Alert";
import { AlertProvider } from "./components/UI/AlertContext";
import { AlertDisplay } from "./components/UI/AlertDisplay";
import ResetTurnButton from "./components/UI/ResetTurnButton";
import Dice2 from "./components/UI/Dice2";

function Game() {
  const [inProgress, setInProgress] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    GameInstance.gameInProgress()
      .then((result) => {
        setInProgress(result);
      })
      .catch((err) => {
        setInProgress(undefined);
      });
  }, [GameInstance]);

  const links = [{ name: "Home", url: "/home" }];

  return inProgress === undefined ? (
    <div>Loading...</div>
  ) : inProgress ? (
    <>
      <NavBar links={links} />

      <div className="Game">
        <div className="game-column">
          <h2>Game</h2>
          <UIBoard debug={false} />
        </div>
        <div className="actions-column">
          <Dice2 />
          <div>
            <LockWallsButton />
            <SwitchTurnButton />
            <ResetTurnButton />
          </div>
          <hr />
          <div>
            <h3>Wall Moves:</h3>
            <WallRectangles />
          </div>
          <div>
            <h3>Player Moves:</h3>
            <PlayerRectangles />
          </div>
        </div>
      </div>

      <AlertProvider>
        <AlertDisplay />

        <StartGameAlert />
        <DiceRollAlert />
        <LockWallsAlert />
        <SwitchTurnAlert />
        <WinGameAlert />
        <ErrorAlert />
      </AlertProvider>
    </>
  ) : (
    <Navigate to="/" replace={true} />
  );
}

export default Game;
