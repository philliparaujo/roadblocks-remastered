import "./Rectangles.css";
import { useEffect, useRef, useState } from "react";
import GameInstance, { Game } from "../../GameEngine/Game";
import { PlayerColor, TurnPhase } from "@roadblocks/engine";
import { TextBoard } from "../../GameEngine/TextBoard";
import Board from "../../GameEngine/Board";
import { isVerticalEdge } from "@roadblocks/engine";

export interface PlayerRectangleProps {
  game?: Game;
  maxRectangles?: number;
}

type rectangleState = "locked" | "green" | "red";

const PlayerRectangles: React.FC<PlayerRectangleProps> = ({
  game = GameInstance,
  maxRectangles = 7,
}) => {
  const [rectangleStates, setRectangleStates] = useState<rectangleState[]>([
    "locked",
  ]);
  const [diceValue, setDiceValue] = useState<number>(1);
  const diceValueRef = useRef(diceValue);

  useEffect(() => {
    setRectangleStates(createEmptyArray());
  }, [maxRectangles]);

  useEffect(() => {
    diceValueRef.current = diceValue;
  }, [diceValue]);

  const createEmptyArray = (): rectangleState[] => {
    let initialArray = new Array(maxRectangles).fill("locked");
    initialArray.fill("", 0, diceValueRef.current);
    return initialArray;
  };

  const updateRectangleStates = (numGreen: number) => {
    setRectangleStates(() => {
      let updatedStates = createEmptyArray();
      for (let i = 0; i < Math.min(numGreen, maxRectangles); i++) {
        if (updatedStates[i] !== "locked") {
          updatedStates[i] = "green";
        } else {
          updatedStates[i] = "red";
        }
      }
      return updatedStates;
    });
  };

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      updateRectangleStates(0);
    });
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      if (e.type === "stop") {
        const diceValue = e.value;
        setDiceValue(diceValue);

        let updatedArray = new Array(maxRectangles).fill("locked");
        updatedArray.fill("", 0, Math.min(maxRectangles, diceValue));

        setRectangleStates(updatedArray);
      }
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.playerMovedEventSubscription().subscribe((e) => {
      updateRectangleStates(e.numMovements);
    });
  }, [game]);

  return (
    <div className="rectangle-container">
      {rectangleStates.map((state, index) => (
        <div key={index} className={`rectangle ${state}`} />
      ))}
    </div>
  );
};

export default PlayerRectangles;
