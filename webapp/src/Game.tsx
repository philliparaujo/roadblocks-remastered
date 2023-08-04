import "./Game.css";
import NavBar from "./NavBar";
import UIBoard from "./components/Board/UIBoard";
import Dice from "./components/UI/Dice";
import LockWallsButton from "./components/UI/LockWallsButton";
import PlayerRectangles from "./components/UI/PlayerRectangles";
import SwitchTurnButton from "./components/UI/SwitchTurnButton";
import WallRectangles from "./components/UI/WallRectangles";

function Game() {
  const links = [{ name: "Home", url: "/home" }];

  return (
    <>
      <NavBar links={links} />
      <div className="Game">
        <div className="game-column">
          <h2>Game</h2>
          <UIBoard debug={false} />
        </div>
        <div className="actions-column">
          <Dice />
          <div>
            <h3>Wall Moves:</h3>
            <WallRectangles />
          </div>
          <div>
            <h3>Player Moves:</h3>
            <PlayerRectangles />
          </div>
          <div>
            <LockWallsButton />
            <SwitchTurnButton />
          </div>
        </div>
      </div>
    </>
  );
}

export default Game;
