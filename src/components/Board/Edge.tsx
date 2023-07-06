import "./Edge.css";
import { Coord } from "./Coord.tsx";

type EdgeColor = "gray" | "red" | "blue" | "black";
type Orientation = "horizontal" | "vertical";

interface EdgeProps {
  coord: Coord;
  color: EdgeColor;
  orientation: Orientation;
}

const Edge: React.FC<EdgeProps> = ({ coord, color, orientation }) => {
  const handleClick = () => {
    console.log(`${color} edge: (${coord.row}, ${coord.col})`);
  };

  return (
    <div className={`edge ${orientation} ${color}`} onClick={handleClick}></div>
  );
};

export default Edge;
