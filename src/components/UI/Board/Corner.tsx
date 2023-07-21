import "./Corner.css";
import { Coord } from "../../../Coord";
import { Game } from "../../../GameEngine/Game";

interface CornerProps {
  coord: Coord;
  game?: Game;
}

const Corner: React.FC<CornerProps> = ({ coord }) => {
  const handleClick = () => {
    console.log(`corner: (${coord.row}, ${coord.col})`);
  };

  return <div className="corner" onClick={handleClick}></div>;
};

export default Corner;
