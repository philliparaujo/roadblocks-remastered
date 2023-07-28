import "./MoveRectangles.css";
import { useEffect, useState } from "react";
import GameInstance, { Game, TurnPhase } from "../../GameEngine/Game";

export interface MoveRectanglesProps {
  type: TurnPhase;
  game?: Game;
  maxRectangles?: number;
}

type rectangleState = "locked" | "green" | "red";

const MoveRectangles: React.FC<MoveRectanglesProps> = ({
  type: TurnPhase,
  game = GameInstance,
  maxRectangles = 7,
}) => {
  const [rectangleStates, setRectangleStates] = useState<rectangleState[]>([
    "locked",
  ]);

  useEffect(() => {
    const initialArray = new Array(maxRectangles).fill("green");
    setRectangleStates(initialArray);
  }, [maxRectangles]);

  return (
    <div className="rectangle-container">
      {rectangleStates.map((state, index) => (
        <div key={index} className={`rectangle ${state}`} />
      ))}
    </div>
  );
};

export default MoveRectangles;
