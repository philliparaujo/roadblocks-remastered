import "./LockWallsButton.css";
import GameInstance, { Game } from "../../GameEngine/Game";
import { useEffect, useState } from "react";

export interface LockWallsButtonProps {
  game?: Game;
}

const LockWallsButton: React.FC<LockWallsButtonProps> = ({
  game = GameInstance,
}) => {
  const [disabled, setDisabled] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setDisabled(false);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.lockWallEventSubscription().subscribe((e) => {
      setDisabled(true);
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

    return () => wallToggleUnsubscribe();
  }, [game]);

  const handleClick = () => {
    if (disabled) {
      return;
    }

    game.lockWalls().catch((error) => {
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
