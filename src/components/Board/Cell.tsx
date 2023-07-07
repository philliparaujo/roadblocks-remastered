import "./Cell.css";
import { Coord } from "./Coord";

interface CellProps {
  coord: Coord;
}

const Cell: React.FC<CellProps> = ({ coord }) => {
  const handleClick = () => {
    console.log(`cell: (${coord.row}, ${coord.col})`);
  };
  return <div className="cell" onClick={handleClick}></div>;
};

export default Cell;
