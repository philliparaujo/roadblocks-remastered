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
