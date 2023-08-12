import { GameInstance } from "@roadblocks/client";
import "./Game.css";
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
import { Link } from "react-router-dom";
import { UserRole } from "@roadblocks/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface GameProps {}

const Game: React.FC<GameProps> = () => {
  const [inProgress, setInProgress] = useState<boolean | undefined>(undefined);
  const [role, setRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    switch (window.location.hash) {
      case "#red":
        setRole("red");
        break;
      case "#blue":
        setRole("blue");
        break;
      case "#watcher":
        setRole("watcher");
        break;
      default:
        console.error("Role not found in URL");
        setRole(undefined);
    }
  }, [window.location]);

  useEffect(() => {
    GameInstance.gameInProgress()
      .then((result) => {
        setInProgress(result);
      })
      .catch((err) => {
        setInProgress(undefined);
      });
  }, [GameInstance]);

  return inProgress === undefined ? (
    <div>Loading...</div>
  ) : inProgress ? (
    <div className="game">
      <div id="background" />

      {role === "red" ? (
        <div>RED</div>
      ) : role === "blue" ? (
        <div>BLUE</div>
      ) : (
        <div>WATCHER</div>
      )}

      <Link to="/home" className="back-button">
        <FontAwesomeIcon icon={faCircleArrowLeft} />
        <span className="tooltip-text">Quit Game</span>
      </Link>

      {/* <img src="images/logo.png" id="logo" /> */}
      <div className="Game">
        <div className="game-column">
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
    </div>
  ) : (
    <Navigate to="/" replace={true} />
  );
};

export default Game;
