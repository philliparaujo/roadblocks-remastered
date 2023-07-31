import "./Corner.css";
import { Coord } from "@roadblocks/engine";
import { Game } from "../../GameEngine/Game";

interface CornerProps {
  coord: Coord;
  game?: Game;
}

const Corner: React.FC<CornerProps> = ({ coord }) => {
  return <div className="corner"></div>;
};

export default Corner;
