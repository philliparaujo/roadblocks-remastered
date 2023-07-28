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
  const [disabled, setDisabled] = useState<boolean>(false);
  const playerColor: PlayerColor = player;

  useEffect(() => {
    game.getTurn().then((player) => {
      setPlayer(player);
    });
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setPlayer(e.turn);
    });

    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.wallToggledEventSubscription().subscribe((e) => {
      Promise.all([game.pathExists("red"), game.pathExists("blue")])
        .then(([redPathExists, bluePathExists]) => {
          if (!redPathExists || !bluePathExists) {
            setDisabled(true);
          } else {
            setDisabled(false);
          }
        })
        .catch((error) => {
          console.error("Failed to check path:", error);
          setDisabled(true);
        });
    });

    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    if (!disabled) {
      game.switchTurn().catch((error) => {
        console.error("Failed to switch turn:", error);
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`button ${disabled ? "disabled" : ""} ${playerColor}`}
    >
      End turn
    </button>
  );
};

export default SwitchTurnButton;
