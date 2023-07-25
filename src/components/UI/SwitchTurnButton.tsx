import "./SwitchTurnButton.css";
import { useEffect, useState } from "react";
import GameInstance, { Game, PlayerColor } from "../../GameEngine/Game";

export interface SwitchTurnButtonProps {
  game?: Game;
}

const SwitchTurnButton: React.FC<SwitchTurnButtonProps> = ({
  game = GameInstance,
}) => {
  const [player, setPlayer] = useState<PlayerColor>("red");
  const playerColor: PlayerColor = player;

  useEffect(() => {
    game.getTurn().then((player) => {
      setPlayer(player);
      console.log("first", player);
    });
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setPlayer(e.turn);
    });
    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    game.switchTurn().catch((error) => {
      console.error("Failed to switch turn:", error);
    });
  };

  return (
    <button onClick={handleClick} className={`button ${playerColor}`}>
      End turn
    </button>
  );
};

export default SwitchTurnButton;
