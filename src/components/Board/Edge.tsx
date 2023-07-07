import "./Edge.css";
import { Coord } from "./Coord";
import Game from "../GameEngine/Game";
import { useEffect, useState } from "react";

type EdgeColor = "gray" | "red" | "blue" | "black" | "lightblue" | "lightred";
export type Orientation = "horizontal" | "vertical";
export type EdgeType = "normal" | "locked" | "disabled";

export interface EdgeProps {
  coord: Coord;
  orientation: Orientation;
  type?: EdgeType;
  debug?: boolean;
}

/* Determine fill of edge based on given parameters */
const getFill = (
  orientation: Orientation,
  type: EdgeType,
  debug: boolean,
  toggled: boolean
) => {
  return toggled
    ? getToggledFill(orientation)
    : getUntoggledFill(orientation, type, debug);
};

const getToggledFill = (orientation: Orientation) => {
  return orientation === "horizontal" ? "blue" : "red";
};

const getUntoggledFill = (
  orientation: Orientation,
  type: EdgeType,
  debug: boolean
) => {
  const untoggledUnlockedFill = debug
    ? orientation === "horizontal"
      ? "lightblue"
      : "lightred"
    : "gray";
  return type === "locked" ? "black" : untoggledUnlockedFill;
};

/* Component */
const Edge: React.FC<EdgeProps> = ({
  coord,
  orientation,
  type = "normal",
  debug = false,
}) => {
  const [toggled, setToggled] = useState<boolean>(false);
  const [fill, setFill] = useState<EdgeColor>(
    getFill(orientation, type, debug, toggled)
  );

  /* Updates color of edge whenever a change occurs */
  useEffect(() => {
    setFill(getFill(orientation, type, debug, toggled));
  }, [orientation, type, debug, toggled]);

  const handleClick = () => {
    if (type === "locked" || type === "disabled") {
      return;
    }

    if (toggled) {
      Game.removeEdge(coord)
        .then((ok) => {
          setToggled(false);
        })
        .catch((err) => {
          console.log(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        });
    } else {
      Game.addEdge(coord)
        .then((ok) => {
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
