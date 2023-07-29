import "./Rectangles.css";
import { useEffect, useRef, useState } from "react";
import GameInstance, {
  Game,
  PlayerColor,
  TurnPhase,
} from "../../GameEngine/Game";
import { TextBoard } from "../../GameEngine/TextBoard";
import Board from "../../GameEngine/Board";
import { isVerticalEdge } from "../../Utils";

export interface WallRectanglesProps {
  game?: Game;
  maxRectangles?: number;
}

type rectangleState = "locked" | "green" | "red";

const WallRectangles: React.FC<WallRectanglesProps> = ({
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
    initialArray.fill("", 0, 7 - diceValueRef.current);

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
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      console.log("Dice rolled!", e);
      if (e.type === "stop") {
        const diceValue = e.value;
        setDiceValue(diceValue);

        let updatedArray = new Array(maxRectangles).fill("locked");
        updatedArray.fill("", 0, Math.max(0, 7 - diceValue));
        console.log(e, updatedArray);
        setRectangleStates(updatedArray);
      }
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game
      .numWallChangesEventSubscription()
      .subscribe((e) => {
        console.log("wall changed", e);
        updateRectangleStates(e.wallChanges);
      });
    return () => unsubscribe();
  }, [game]);

  return (
    <div className="rectangle-container">
      {rectangleStates.map((state, index) => (
        <div key={index} className={`rectangle ${state}`}>
          <>{console.log(state, index)}</>
        </div>
      ))}
    </div>
  );
};

export default WallRectangles;
