import "./Button.css";
import { GameInstance, GameClient as Game } from "@roadblocks/client";
import { useEffect, useState } from "react";
import { rollDurationMs } from "./Dice";

export interface LockWallsButtonProps {
  game?: Game;
}

const LockWallsButton: React.FC<LockWallsButtonProps> = ({
  game = GameInstance,
}) => {
  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setTimeout(() => {
        setDisabled(false);
      }, rollDurationMs);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.lockWallEventSubscription().subscribe((e) => {
      setDisabled(e.locked);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.winGameEventSubscription().subscribe((e) => {
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
