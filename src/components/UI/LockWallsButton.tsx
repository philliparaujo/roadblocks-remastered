import "./LockWallsButton.css";
import GameInstance, { Game } from "../../GameEngine/Game";
import { useState } from "react";

export interface LockWallsButtonProps {
  game?: Game;
}

const LockWallsButton: React.FC<LockWallsButtonProps> = ({
  game = GameInstance,
}) => {
  const [disabled, setDisabled] = useState<boolean>(false);

  const handleClick = () => {
    if (disabled) {
      return;
    }

    game
      .lockWalls()
      .then((ok) => {
        setDisabled(true);
        console.log("done");
      })
      .catch((error) => {
        console.error("Failed to lock walls:", error);
      });
  };

  return (
    <button
      onClick={handleClick}
      className={`button ${disabled ? "disabled" : "green"}`}
    >
      Lock walls
    </button>
  );
};

export default LockWallsButton;
