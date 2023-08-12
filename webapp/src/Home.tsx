import { GameInstance, reset } from "@roadblocks/client";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { faQuestionCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameInfo, UserRole } from "@roadblocks/types";
import "./Home.css";

function Home() {
  const generateRandom7DigitNumber = () => {
    return Math.floor(1000000 + Math.random() * 9000000);
  };

  const [role, setRole] = useState<UserRole | undefined>();
  const [playerName, setPlayerName] = useState<string>(
    `Guest${generateRandom7DigitNumber()}`
  );
  const [error, setError] = useState<string>("");

  const [onlineGames, setOnlineGames] = useState<GameInfo[]>();
  const refreshGamesTimerMs = 1000;

  const [showAbout, setShowAbout] = useState(false);
  const toggleAbout = () => {
    setShowAbout(!showAbout);
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
                <div className="red">{game.users[0].playerName}</div>
                <div>{game.users.length > 1 && "vs."}</div>
                <div className="blue">
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
                  onClick={() => joinGame(game.gameId, game.users.length > 1)}
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

      <Link to={"/settings"}>
        <button className="home-button">Settings</button>
      </Link>

      {/* <Link to={"/about"}>
        <button>About</button>
      </Link> */}

      <div className="about-icon" onClick={toggleAbout}>
        <FontAwesomeIcon icon={faQuestionCircle} />
      </div>

      {role && <Navigate to={`/game#${role}`} replace={true} />}

      {showAbout && (
        <div className="overlay" onClick={toggleAbout}>
          <div className="about-popup" onClick={(e) => e.stopPropagation()}>
            {" "}
            {/* Prevents the popup from closing when clicked on */}
            <div className="popup-close" onClick={toggleAbout}>
              <FontAwesomeIcon icon={faTimes} />
            </div>
            <div className="about-container">
              <h1 className="about-header">About</h1>
              <p className="description">
                Roadblocks is a strategic, turn-based board game. Players must
                navigate their pieces to the finish while blocking their
                opponents with walls. Do you have what it takes to outmaneuver
                your foes and claim victory?
              </p>
              <h2 className="how-to-play-header">How to Play</h2>

              <p className="description">
                Every turn, you and your opponent will...
              </p>
              <ol className="how-to-play-list">
                <li>
                  <b>Roll a dice</b> to determine movement
                </li>
                <li>
                  <b>Add and remove walls</b> to block your opponent
                </li>
                <li>
                  <b>Move your piece</b> closer to the finish
                </li>
              </ol>

              <p className="description">Rules:</p>
              <ul className="how-to-play-list">
                <li>
                  You may never <b>fully</b> block your opponent's path to the
                  finish
                </li>
                <li>You may only have six walls in play at one time</li>
                <li>
                  All player movements must be adjacent (up, down, left, right)
                </li>
                <li>
                  Every addition and removal of a wall counts as one wall
                  movement
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && <div>{error}</div>}
    </div>
  );
}

export default Home;
