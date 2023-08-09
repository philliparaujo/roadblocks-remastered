import { PlayerColor } from "@roadblocks/types";
import { useEffect, useState } from "react";
import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Button.css";

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
    const updateDisabledState = () => {
      Promise.all([game.pathExists("red"), game.pathExists("blue")])
        .then(([redPathExists, bluePathExists]) => {
          if (!redPathExists || !bluePathExists) {
            setDisabled(true);
            return;
          }
          game
            .canEndTurn()
            .then((canEnd) => {
              setDisabled(!canEnd);
            })
            .catch((error) => {
              console.error("Failed to check canEndTurn:", error);
              setDisabled(true);
            });
        })
        .catch((error) => {
          console.error("Failed to check path:", error);
          setDisabled(true);
        });
    };

    const wallToggleUnsubscribe = game
      .wallToggledEventSubscription()
      .subscribe(updateDisabledState);
    const playerMoveUnsubscribe = game
      .playerMovedEventSubscription()
      .subscribe(updateDisabledState);

    return () => {
      wallToggleUnsubscribe();
      playerMoveUnsubscribe();
    };
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
