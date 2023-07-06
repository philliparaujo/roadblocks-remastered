import "./Edge.css";
import { Coord } from "./Coord.tsx";
import Game from "../GameEngine/Game";
import { useState } from "react";

type EdgeColor = "gray" | "red" | "blue" | "black";
type Orientation = "horizontal" | "vertical";
type EdgeType = "normal" | "locked";

interface EdgeProps {
  coord: Coord;
  orientation: Orientation;
  type: EdgeType;
}

const Edge: React.FC<EdgeProps> = ({ coord, orientation, type }) => {
  const [toggled, setToggled] = useState<boolean>(false);
  const [fill, setFill] = useState<EdgeColor>(
    type === "locked" ? "black" : "gray"
  );

  const handleClick = () => {
    if (type === "locked") {
      return;
    }

    if (toggled) {
      Game.removeEdge(coord)
        .then((ok) => {
          setFill("gray");
          setToggled(false);
        })
        .catch((err) => {
          console.log(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        });
    } else {
      Game.addEdge(coord)
        .then((ok) => {
          setFill(orientation === "horizontal" ? "blue" : "red");
          setToggled(true);
        })
        .catch((err) => {
          console.log(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        });
    }
  };

  return (
    <div className={`edge ${orientation} ${fill}`} onClick={handleClick}></div>
  );
};

export default Edge;
