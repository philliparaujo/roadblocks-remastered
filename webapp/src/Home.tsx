import { GameInstance, reset } from "@roadblocks/client";
import { GameInfo, UserRole } from "@roadblocks/types";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import {
  AboutIcon,
  AboutPopup,
  SettingsIcon,
  SettingsPopup,
} from "./components/UI/Popup";

function Home() {
  const navigate = useNavigate();

  const navigateToNameSelect = (
    selectedRole: UserRole,
    selectedGame?: GameInfo
  ) => {
    navigate("/nameSelect", {
      state: { game: selectedGame, role: selectedRole },
    });
  };

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

  return (
    <div className="home">
      <div id="background" />
      <img src="images/logo.png" id="logo" />
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
                      navigateToNameSelect(
                        game.users.length < 2 ? "blue" : "watcher",
                        game
                      );
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

        <div style={{ display: "flex" }}>
          <div>
            <button
              className="home-button"
              onClick={() => navigateToNameSelect("red")}
            >
              Create Game
            </button>
          </div>

          <Link to={"/howtoplay"}>
            <button className="home-button">How To Play</button>
          </Link>
        </div>

        <AboutIcon toggle={toggleAbout} />
        <SettingsIcon toggle={toggleSettings} />

        <AboutPopup show={showAbout} toggle={toggleAbout} />
        <SettingsPopup show={showSettings} toggle={toggleSettings} />
      </>
    </div>
  );
}

export default Home;
