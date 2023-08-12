import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameInstance } from "@roadblocks/client";
import { PlayerColor, UserRole } from "@roadblocks/types";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import "./Game.css";
import UIBoard from "./components/Board/UIBoard";
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
import Dice2 from "./components/UI/Dice2";
import LockWallsButton from "./components/UI/LockWallsButton";
import PlayerRectangles from "./components/UI/PlayerRectangles";
import {
  AboutIcon,
  AboutPopup,
  SettingsIcon,
  SettingsPopup,
} from "./components/UI/Popup";
import ResetTurnButton from "./components/UI/ResetTurnButton";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import WallRectangles from "./components/UI/WallRectangles";

interface GameProps {}

const Game: React.FC<GameProps> = () => {
  const [inProgress, setInProgress] = useState<boolean | undefined>(undefined);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [turn, setTurn] = useState<PlayerColor>("red");

  const [redPlayer, setRedPlayer] = useState<string>();
  const [bluePlayer, setBluePlayer] = useState<string>();

  const [showAbout, setShowAbout] = useState(false);
  const toggleAbout = () => {
    setShowAbout(!showAbout);
  };

  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  useEffect(() => {
    const fetchGame = async () => {
      const games = (await GameInstance.listGames()).games;
      const myGame = games.find((game) => game.gameId === GameInstance.gameId);
      if (!myGame || !myGame.users) {
        return;
      }

      if (myGame.users.length >= 1) setRedPlayer(myGame.users[0].playerName);
      if (myGame.users.length >= 2) setBluePlayer(myGame.users[1].playerName);
    };

    fetchGame();
  }, [GameInstance]);

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
    const unsubscribe = GameInstance.switchTurnEventSubscription().subscribe(
      (e) => {
        setTurn(e.turn);
      }
    );
    return () => unsubscribe();
  }, [GameInstance]);

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

      {role === "red" && turn !== "red" ? (
        <div className="fullscreen-cover"></div>
      ) : role === "blue" && turn !== "blue" ? (
        <div className="fullscreen-cover"></div>
      ) : role === "watcher" ? (
        <div className="fullscreen-cover"></div>
      ) : (
        <div></div>
      )}

      {role === "watcher" ? (
        <div className="role-label">SPECTATING</div>
      ) : (
        <div></div>
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
          <div
            style={{
              alignSelf: "center",
              textAlign: "center",
              paddingBottom: 50,
              fontSize: 28,
            }}
          >
            {redPlayer && bluePlayer ? (
              <>
                <span className="redPlayer">{redPlayer}</span> vs.{" "}
                <span className="bluePlayer">{bluePlayer}</span>
              </>
            ) : (
              <span className="redPlayer">{redPlayer}</span>
            )}
          </div>
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

      {role !== "watcher" && (
        <AlertProvider>
          <AlertDisplay />

          <StartGameAlert />
          <DiceRollAlert />
          <LockWallsAlert />
          <SwitchTurnAlert />
          <WinGameAlert />
          <ErrorAlert />
        </AlertProvider>
      )}

      <AboutIcon toggle={toggleAbout} />
      <SettingsIcon toggle={toggleSettings} />

      <AboutPopup show={showAbout} toggle={toggleAbout} />
      <SettingsPopup show={showSettings} toggle={toggleSettings} />
    </div>
  ) : (
    <Navigate to="/" replace={true} />
  );
};

export default Game;
