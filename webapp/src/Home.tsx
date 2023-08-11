import { GameInstance } from "@roadblocks/client";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./Home.css";

function Home() {
  const [gameReady, setGameReady] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [showAbout, setShowAbout] = useState(false);
  const toggleAbout = () => {
    setShowAbout(!showAbout);
  };

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

      <button className="home-button" onClick={startGame}>
        Start Game
      </button>

      <Link to={"/settings"}>
        <button className="home-button">Settings</button>
      </Link>

      {/* <Link to={"/about"}>
        <button>About</button>
      </Link> */}

      <div className="about-icon" onClick={toggleAbout}>
        <FontAwesomeIcon icon={faQuestionCircle} />
      </div>

      {gameReady && <Navigate to="/game" replace={true} />}

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
