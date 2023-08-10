import { GameClient as Game, GameInstance } from "@roadblocks/client";
import { Coord, equalCoords } from "@roadblocks/types";
import { useEffect, useRef, useState } from "react";
import "./Edge.css";

type EdgeColor =
  | "gray"
  | "red"
  | "blue"
  | "black"
  | "lightred"
  | "lightblue"
  | "lightred-pending"
  | "lightblue-pending";
export type Orientation = "horizontal" | "vertical";
export type EdgeType = "normal" | "locked" | "disabled";

type Toggle = "on" | "pending" | "off";

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
  toggled: Toggle,
  startedOn: boolean
): EdgeColor => {
  switch (toggled) {
    case "on":
      return getToggledFill(orientation);
    case "pending":
      return getPendingFill(orientation);
    case "off":
      return getUntoggledFill(orientation, type, debug, startedOn);
  }
};

const getToggledFill = (orientation: Orientation): EdgeColor => {
  return orientation === "horizontal" ? "blue" : "red";
};

const getPendingFill = (orientation: Orientation): EdgeColor => {
  return orientation === "horizontal"
    ? "lightblue-pending"
    : "lightred-pending";
};

const getUntoggledFill = (
  orientation: Orientation,
  type: EdgeType,
  debug: boolean,
  startedOn: boolean
): EdgeColor => {
  const debugFill: EdgeColor =
    orientation === "horizontal" ? "lightblue" : "lightred";
  const normalFill: EdgeColor =
    orientation === "horizontal"
      ? startedOn
        ? "lightblue"
        : "gray"
      : startedOn
      ? "lightred"
      : "gray";

  const untoggledUnlockedFill = debug ? debugFill : normalFill;
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
  const [toggled, setToggled] = useState<Toggle>("off");
  const toggledRef = useRef<Toggle>("off");
  const [startedOn, setStartedOn] = useState<boolean>(toggled === "on");
  const [fill, setFill] = useState<EdgeColor>(
    getFill(orientation, type, debug, toggled, startedOn)
  );

  const [disabled, setDisabled] = useState<boolean>(true);

  /* Handle fill based on event */
  useEffect(() => {
    const unsubscribe = game.wallToggledEventSubscription().subscribe((e) => {
      if (equalCoords(e.wall, coord)) {
        setToggled(e.isToggled ? "on" : "off");
      }
    });
    return () => unsubscribe();
  }, [game]);

  /* Reset fill of removed startedOn edges (from light to gray) */
  useEffect(() => {
    const unsubscribe = game.lockWallEventSubscription().subscribe((e) => {
      setStartedOn(toggledRef.current === "on");
      setDisabled(e.locked);
    });
    return () => unsubscribe();
  }, [game, toggledRef]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setStartedOn(toggledRef.current === "on");
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game, toggledRef]);

  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setDisabled(false);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.winGameEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  /* Updates color of edge whenever a change occurs */
  useEffect(() => {
    setFill(getFill(orientation, type, debug, toggled, startedOn));
  }, [orientation, type, debug, toggled, startedOn]);

  useEffect(() => {
    toggledRef.current = toggled;
  }, [toggled]);

  /* First set to pending, then an event triggers */
  const handleClick = () => {
    if (type === "locked" || type === "disabled") {
      return;
    }
    setToggled("pending");

    if (toggled === "on") {
      game.removeEdge(coord).catch((err) => {
        console.error(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        setToggled("on");
      });
    } else {
      game.addEdge(coord).catch((err) => {
        console.error(`NAY(${err})! edge: (${coord.row}, ${coord.col})`);
        setToggled("off");
      });
    }
  };

  return (
    <div
      className={`edge ${orientation} ${fill} ${disabled ? "disabled" : ""}`}
      onClick={handleClick}
    ></div>
  );
};

export default Edge;
