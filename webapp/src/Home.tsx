import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameInstance, reset } from "@roadblocks/client";
import { GameInfo, UserRole } from "@roadblocks/types";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import "./Home.css";
import {
  AboutIcon,
  AboutPopup,
  SettingsIcon,
  SettingsPopup,
} from "./components/UI/Popup";

function Home() {
  const randomGuestName = () => {
    const random7DigitNumber: number = Math.floor(
      1000000 + Math.random() * 9000000
    );
    return `Guest${random7DigitNumber}`;
  };

  const [role, setRole] = useState<UserRole | undefined>();

  const storedPlayerName = localStorage.getItem("playerName");
  const initialPlayerName = storedPlayerName
    ? storedPlayerName
    : randomGuestName();
  const [playerName, setPlayerName] = useState<string>(initialPlayerName);

  const [game, setGame] = useState<GameInfo>();
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [onlineGames, setOnlineGames] = useState<GameInfo[]>();
  const refreshGamesTimerMs = 1000;

  const [showAbout, setShowAbout] = useState<boolean>(false);
  const toggleAbout = () => {
    setShowAbout(!showAbout);
  };

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const startGame = () =>
    GameInstance.newGame(playerName)
      .catch((err) => {
        setError(err);
      })
      .then(() => {
        setHasConfirmed(true);
      });

  const joinGame = (gameId: string) =>
    GameInstance.joinGame(gameId, playerName)
      .catch((err) => {
        setError(err);
      })
      .then(() => {
        setHasConfirmed(true);
      });

  const fetchGames = () => {
    GameInstance.listGames().then((result) => {
      setOnlineGames(result.games);
    });
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(() => {
      fetchGames();
    }, refreshGamesTimerMs);
    return () => clearInterval(interval);
  }, [GameInstance]);

  useEffect(() => {
    console.log("Resetting game engine");
    reset();
  }, []);

  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  return (
    <div className="home">
      <div id="background" />
      <img src="images/logo.png" id="logo" />

      {!hasConfirmed && !role && (
        <>
          <label className="game-list-label" htmlFor="playerName">
            Games
          </label>
          <div className="game-list">
            {onlineGames === undefined ? (
              <div>Loading...</div>
            ) : onlineGames.length > 0 ? (
              onlineGames.map((game) => (
                <div className="game" key={game.gameId}>
                  <div className="names">
                    <div className="redPlayer">{game.users[0].playerName}</div>
                    <div>{game.users.length > 1 && "vs."}</div>
                    <div className="bluePlayer">
                      {game.users.length > 1 && game.users[1].playerName}
                    </div>
                  </div>

                  {game.users.length > 2 && (
                    <div className="watchers">
                      {game.users.length - 2} <span className="eye">👁</span>
                    </div>
                  )}

                  <div className="action">
                    <button
                      className={`home-button ${
                        game.users.length < 2 ? "join-button" : "watch-button"
                      }`}
                      onClick={() => {
                        setGame(game);
                        setRole(game.users.length < 2 ? "blue" : "watcher");
                      }}
                    >
                      {game.users.length < 2 ? "Join" : "Watch"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="noGames">No Games</div>
            )}
          </div>

          <div>
            <button className="home-button" onClick={() => setRole("red")}>
              Create Game
            </button>
          </div>

          <Link to={"/howtoplay"}>
            <button className="home-button">How To Play</button>
          </Link>

          <AboutIcon toggle={toggleAbout} />
          <SettingsIcon toggle={toggleSettings} />

          <AboutPopup show={showAbout} toggle={toggleAbout} />
          <SettingsPopup show={showSettings} toggle={toggleSettings} />

          {error && <div>{error}</div>}
        </>
      )}

      {!hasConfirmed && role && (
        <>
          <div className="back-button" onClick={() => setRole(undefined)}>
            <FontAwesomeIcon icon={faCircleArrowLeft} />
            <span className="tooltip-text">Back</span>
          </div>

          <div className="player-name-container">
            <label className="player-name-label" htmlFor="playerName">
              Player Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="player-name-input"
            />
            <button
              className="home-button"
              onClick={() => {
                switch (role) {
                  case "red":
                    startGame();
                    break;
                  case "blue":
                  case "watcher":
                    if (game) joinGame(game.gameId);
                    break;
                }
              }}
            >
              Confirm
            </button>
          </div>
        </>
      )}

      {hasConfirmed && <Navigate to={`/game#${role}`} replace={true} />}
    </div>
  );
}

export default Home;
