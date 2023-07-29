import "./MoveRectangles.css";
import { useEffect, useRef, useState } from "react";
import GameInstance, {
  Game,
  PlayerColor,
  TurnPhase,
} from "../../GameEngine/Game";
import { TextBoard } from "../../GameEngine/TextBoard";
import Board from "../../GameEngine/Board";
import { isVerticalEdge } from "../../Utils";

export interface MoveRectanglesProps {
  type: TurnPhase;
  game?: Game;
  maxRectangles?: number;
}

type rectangleState = "locked" | "green" | "red";

const MoveRectangles: React.FC<MoveRectanglesProps> = ({
  type,
  game = GameInstance,
  maxRectangles = 7,
}) => {
  const [rectangleStates, setRectangleStates] = useState<rectangleState[]>([
    "locked",
  ]);
  const [diceValue, setDiceValue] = useState<number>(1);
  const diceValueRef = useRef(diceValue);
  const [movements, setMovements] = useState<number>(0);
  const movementsRef = useRef(movements);

  useEffect(() => {
    setRectangleStates(createEmptyArray());
  }, [maxRectangles]);

  useEffect(() => {
    diceValueRef.current = diceValue;
  }, [diceValue]);

  useEffect(() => {
    movementsRef.current = movements;
  }, [movements]);

  const createEmptyArray = (): rectangleState[] => {
    let initialArray = new Array(maxRectangles).fill("locked");
    if (type === "placingWalls") {
      initialArray.fill("", 0, 7 - diceValueRef.current);
    } else if (type === "movingPlayer") {
      initialArray.fill("", 0, diceValueRef.current);
    }
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
      if (e.type === "stop") {
        const diceValue = e.value;
        setDiceValue(diceValue);

        let updatedArray = new Array(maxRectangles).fill("locked");
        if (type === "placingWalls") {
          updatedArray.fill("", 0, Math.max(0, 7 - diceValue));
        } else if (type === "movingPlayer") {
          updatedArray.fill("", 0, Math.min(maxRectangles, diceValue));
        }

        setRectangleStates(updatedArray);
      }
    });
    return () => unsubscribe();
  }, [game, type]);

  useEffect(() => {
    if (type === "movingPlayer") return;

    const unsubscribe = game.wallToggledEventSubscription().subscribe((e) => {
      game.getOldBoard().then((oldBoard) => {
        TextBoard.create(game, console.log).then((textBoard) => {
          if (!oldBoard) {
            console.error("oldBoard null");
            return;
          }

          const player: PlayerColor = isVerticalEdge(e.wall) ? "red" : "blue";

          const newBoard: Board = textBoard.getBoardForTesting();

          const numWallDiff =
            newBoard.countWalls(player) - oldBoard?.countWalls(player);
          const edgeDiff = newBoard.compareEdges(oldBoard);

          const wallChanges = edgeDiff;

          // change first #wallChanges rectangles to be green. if a green rectangle hits a locked rectangle, make it red.
          updateRectangleStates(wallChanges);
        });
      });
    });
    return () => unsubscribe();
  }, [game, diceValue, type]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setRectangleStates(createEmptyArray());
      setMovements(0);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    if (type === "placingWalls") return;

    const unsubscribe = game.playerMovedEventSubscription().subscribe((e) => {
      updateRectangleStates(movementsRef.current + 1);
      setMovements((oldMovements) => oldMovements + 1);
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

export default MoveRectangles;
