import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Button.css";
import { useEffect, useState } from "react";
import { rollDurationMs } from "./Dice";

export interface ResetTurnButtonProps {
  game?: Game;
}

const ResetTurnButton: React.FC<ResetTurnButtonProps> = ({
  game = GameInstance,
}) => {
  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setTimeout(() => {
        setDisabled(false);
      }, rollDurationMs);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.winGameEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    if (!disabled) {
      game.resetTurn().catch((error) => {
        console.error("Failed to reset turn:", error);
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`button gray ${disabled ? "disabled" : ""}`}
    >
      Reset moves
    </button>
  );
};

export default ResetTurnButton;
