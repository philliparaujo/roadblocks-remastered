import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GameInstance } from "@roadblocks/client";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Home.css";

interface NameSelectProps {}

const NameSelect: React.FC<NameSelectProps> = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const game = location.state?.game;
  const role = location.state?.role;

  const randomGuestName = () => {
    const random7DigitNumber: number = Math.floor(
      1000000 + Math.random() * 9000000
    );
    return `Guest${random7DigitNumber}`;
  };
  const storedPlayerName = localStorage.getItem("playerName");
  const initialPlayerName = storedPlayerName
    ? storedPlayerName
    : randomGuestName();
  const [playerName, setPlayerName] = useState<string>(initialPlayerName);

  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  const startGame = () =>
    GameInstance.newGame(playerName)
      .catch((err) => {
        console.error(err);
      })
      .then(() => {
        navigate(`/game#${role}`);
      });

  const joinGame = (gameId: string) =>
    GameInstance.joinGame(gameId, playerName)
      .catch((err) => {
        console.error(err);
      })
      .then(() => {
        navigate(`/game#${role}`);
      });

  return (
    <div className="home">
      <div id="background" />
      <img src="images/logo.png" id="logo" />

      <div className="back-button" onClick={() => navigate("/home")}>
        <FontAwesomeIcon icon={faCircleArrowLeft} />
        <span className="tooltip-text">Back</span>
      </div>

      <div>
        {role === "red"
          ? "Creating game..."
          : role === "blue"
          ? "Joining game..."
          : "Spectating game..."}
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
    </div>
  );
};

export default NameSelect;
