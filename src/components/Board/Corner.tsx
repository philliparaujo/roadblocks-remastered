import "./Corner.css";
import { Coord } from "./Coord";

interface CornerProps {
  coord: Coord;
}

const Corner: React.FC<CornerProps> = ({ coord }) => {
  const handleClick = () => {
    console.log(`corner: (${coord.row}, ${coord.col})`);
  };

  return <div className="corner" onClick={handleClick}></div>;
};

export default Corner;
