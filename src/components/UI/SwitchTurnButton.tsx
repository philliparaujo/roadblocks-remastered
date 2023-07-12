import "./SwitchTurnButton.css";
import { useEffect, useState } from "react";
import GameInstance, { Game } from "../../GameEngine/Game";

export interface SwitchTurnButtonProps {
  game?: Game;
}

const SwitchTurnButton: React.FC<SwitchTurnButtonProps> = ({
  game = GameInstance,
}) => {
  const [redTurn, setRedTurn] = useState<boolean>(false);

  useEffect(() => {
    game.isRedTurn().then((isRed) => setRedTurn(isRed));
  }, [game]);

  const handleClick = () => {
    game
      .switchTurn()
      .then((ok) => {
        setRedTurn((oldRedTurn) => !oldRedTurn);
      })
      .catch((error) => {
        console.error("Failed to switch turn:", error);
      });
  };

  return (
    <button
      onClick={handleClick}
      className={`button ${redTurn ? "red" : "blue"}`}
    >
      End turn
    </button>
  );
};

export default SwitchTurnButton;
