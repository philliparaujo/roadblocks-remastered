import { Coord } from "@roadblocks/types";
import { GameClient as Game } from "@roadblocks/client";
import "./Corner.css";

interface CornerProps {
  coord: Coord;
  game?: Game;
}

const Corner: React.FC<CornerProps> = ({ coord }) => {
  return <div className="corner"></div>;
};

export default Corner;
