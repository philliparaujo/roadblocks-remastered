import { GameClient as Game, GameInstance } from "@roadblocks/client";
import { Coord, equalCoords } from "@roadblocks/types";
import { useEffect, useState } from "react";
import "./Edge.css";

type EdgeColor = "gray" | "red" | "blue" | "black" | "lightblue" | "lightred";
export type Orientation = "horizontal" | "vertical";
export type EdgeType = "normal" | "locked" | "disabled";

export interface EdgeProps {
  coord: Coord;
  orientation: Orientation;
  type?: EdgeType;
  debug?: boolean;
  game: Game;
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
  game = GameInstance,
}) => {
  const [toggled, setToggled] = useState<boolean>(false);
  const [fill, setFill] = useState<EdgeColor>(
    getFill(orientation, type, debug, toggled)
  );

  useEffect(() => {
    const unsubscribe = game.wallToggledEventSubscription().subscribe((e) => {
      if (equalCoords(e.wall, coord)) {
        setToggled(e.isToggled);
      }
    });
    return () => unsubscribe();
  }, [game]);

  /* Updates color of edge whenever a change occurs */
  useEffect(() => {
    setFill(getFill(orientation, type, debug, toggled));
  }, [orientation, type, debug, toggled]);

  const handleClick = () => {
    if (type === "locked" || type === "disabled") {
      return;
    }

    if (toggled) {
      game
        .removeEdge(coord)
        .then((ok) => {
          setToggled(false);
        })
        .catch((err) => {
          console.error(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        });
    } else {
      game
        .addEdge(coord)
        .then((ok) => {
          setToggled(true);
        })
        .catch((err) => {
          console.error(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        });
    }
  };

  return (
    <div className={`edge ${orientation} ${fill}`} onClick={handleClick}></div>
  );
};

export default Edge;
