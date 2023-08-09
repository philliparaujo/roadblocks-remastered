import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Button.css";

export interface ResetTurnButtonProps {
  game?: Game;
}

const ResetTurnButton: React.FC<ResetTurnButtonProps> = ({
  game = GameInstance,
}) => {
  const handleClick = () => {
    game.resetTurn().catch((error) => {
      console.error("Failed to reset turn:", error);
    });
  };

  return (
    <button onClick={handleClick} className={`button gray`}>
      Reset turn
    </button>
  );
};

export default ResetTurnButton;
