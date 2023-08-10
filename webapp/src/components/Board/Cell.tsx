import { GameClient as Game, GameInstance } from "@roadblocks/client";
import { Coord, PlayerLocation, equalCoords } from "@roadblocks/types";
import { useEffect, useState } from "react";
import "./Cell.css";

type CellContents = PlayerLocation[];
export type CellType = "normal" | "disabled";

export interface CellProps {
  coord: Coord;
  initialContents?: CellContents;
  type?: CellType;
  game?: Game;
}

const Cell: React.FC<CellProps> = ({
  coord,
  initialContents = [],
  type = "normal",
  game = GameInstance,
}) => {
  const [contents, setContents] = useState<CellContents>(initialContents);
  const [pending, setPending] = useState<boolean>(false);
  const [pendingColor, setPendingColor] = useState<PlayerLocation | null>(null);

  const [disabled, setDisabled] = useState<boolean>(true);

  const pendingOpacity: number = 0.3;

  const iconMapping: Record<PlayerLocation, string> = {
    redplayer: "🔴",
    redend: "🟥",
    blueplayer: "🔵",
    blueend: "🟦",
  };

  const generateIconSpan = (
    icon: string,
    label: PlayerLocation,
    index: number = 0,
    opacity = 1
  ): JSX.Element => (
    <span key={label + index} role="img" aria-label={label} style={{ opacity }}>
      {icon}
    </span>
  );

  const generateCellContents = (): JSX.Element[] => {
    return contents.map((element, i) =>
      generateIconSpan(iconMapping[element], element, i)
    );
  };

  useEffect(() => {
    const unsubscribe = game.playerMovedEventSubscription().subscribe((e) => {
      const playerColor: PlayerLocation =
        e.player === "red" ? "redplayer" : "blueplayer";

      if (equalCoords(coord, e.from)) {
        setContents((oldContents) =>
          oldContents.filter((element) => element !== playerColor)
        );
      }

      if (equalCoords(coord, e.to)) {
        setContents((oldContents) => [...oldContents, playerColor]);
      }

      setPending(false);
      setPendingColor(null);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.lockWallEventSubscription().subscribe((e) => {
      setDisabled(!e.locked);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.winGameEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    if (type === "disabled") {
      return;
    }

    setPending(true);
    game.getTurn().then((player) => {
      setPendingColor(player === "red" ? "redplayer" : "blueplayer");
    });

    game.setPlayerLocation(coord).catch((err) => {
      console.error(`NAY(${err})! cell: (${coord.row}, ${coord.col})`);
      setPending(false);
      setPendingColor(null);
    });
  };

  return (
    <div className={`cell ${disabled ? "disabled" : ""}`} onClick={handleClick}>
      {generateCellContents()}
      {pending &&
        pendingColor &&
        generateIconSpan(
          iconMapping[pendingColor],
          pendingColor,
          0,
          pendingOpacity
        )}
    </div>
  );
};

export default Cell;
