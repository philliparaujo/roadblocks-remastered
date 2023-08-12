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
  const generateRandom7DigitNumber = () => {
    return Math.floor(1000000 + Math.random() * 9000000);
  };

  const [role, setRole] = useState<UserRole | undefined>();
  const [playerName, setPlayerName] = useState<string>(
    `Guest${generateRandom7DigitNumber()}`
  );
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [error, setError] = useState<string>("");

  const [onlineGames, setOnlineGames] = useState<GameInfo[]>();
  const refreshGamesTimerMs = 1000;

  const [showAbout, setShowAbout] = useState(false);
  const toggleAbout = () => {
    setShowAbout(!showAbout);
  };

  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const startGame = () => {
    GameInstance.newGame(playerName)
      .then(() => {
        setRole("red");
      })
      .catch((err) => {
        setError(err);
      });
  };

  const joinGame = (gameId: string, watcher: boolean) => {
    GameInstance.joinGame(gameId, playerName)
      .then(() => {
        setRole(watcher ? "watcher" : "blue");
      })
      .catch((err) => {
        setError(err);
      });
  };

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
    reset();
  }, []);

  return (
    <div className="home">
      <div id="background" />
      <img src="images/logo.png" id="logo" />

      {!hasConfirmed && (
        <>
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
              onClick={() => setHasConfirmed(true)}
            >
              Confirm
            </button>
          </div>
        </>
      )}

      {hasConfirmed && (
        <>
          <div className="back-button" onClick={() => setHasConfirmed(false)}>
            <FontAwesomeIcon icon={faCircleArrowLeft} />
            <span className="tooltip-text">Back</span>
          </div>

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
                      onClick={() =>
                        joinGame(game.gameId, game.users.length > 1)
                      }
                    >
                      {game.users.length < 2 ? "Join" : "Watch"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div>No Games</div>
            )}
          </div>

          <div>
            <button className="home-button" onClick={startGame}>
              Create Game
            </button>
          </div>

          <Link to={"/howtoplay"}>
            <button className="home-button">How To Play</button>
          </Link>

          {role && <Navigate to={`/game#${role}`} replace={true} />}

          <AboutIcon toggle={toggleAbout} />
          <SettingsIcon toggle={toggleSettings} />

          <AboutPopup show={showAbout} toggle={toggleAbout} />
          <SettingsPopup show={showSettings} toggle={toggleSettings} />

          {error && <div>{error}</div>}
        </>
      )}
    </div>
  );
}

export default Home;
