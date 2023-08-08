import {
  BlueEnd,
  BluePlayer,
  Board,
  BoardImpl,
  CellElement,
  Coord,
  EdgeElement,
  PlayerMovedEvent,
  RedEnd,
  RedPlayer,
  WallToggledEvent,
  isVerticalEdge,
} from "@roadblocks/types";
import {
  GameClient as Game,
  PlayerMovedEventCallback,
  WallToggledEventCallback,
} from "@roadblocks/client";

export interface SmartBoard extends Board {
  initFromGame: (game: Game) => Promise<void>;

  dispose: (game: Game) => void;

  updateWalls: (e: WallToggledEvent) => Promise<void>;
  updatePlayer: (e: PlayerMovedEvent) => Promise<void>;
  subscribeToWallToggled: (
    callback: WallToggledEventCallback,
    game: Game
  ) => void;
  subscribeToPlayerMoved: (
    callback: PlayerMovedEventCallback,
    game: Game
  ) => void;
}

export async function createFromGame(game: Game): Promise<SmartBoard> {
  const width = await game.getWidth();
  const height = await game.getHeight();
  const board = new SmartBoardImpl(width, height);

  await board.initFromGame(game);

  board.subscribeToPlayerMoved(board.updatePlayer, game);
  board.subscribeToWallToggled(board.updateWalls, game);

  return board;
}

class SmartBoardImpl extends BoardImpl implements SmartBoard {
  id: number = Math.round(Math.random() * 1000000000);

  private unsubscribeToWallToggled: (() => void) | undefined;
  private unsubscribeToPlayerMoved: (() => void) | undefined;

  constructor(width: number, height: number) {
    super(width, height);

    this.updatePlayer = this.updatePlayer.bind(this);
    this.updateWalls = this.updateWalls.bind(this);
  }

  public async initFromGame(game: Game): Promise<void> {
    const redPlayerCoord: Coord = await game.getCellLocation("redplayer");
    const redplayer: RedPlayer = "r";
    this.addToCell(redPlayerCoord, redplayer);

    const bluePlayerCoord: Coord = await game.getCellLocation("blueplayer");
    const blueplayer: BluePlayer = "b";
    this.addToCell(bluePlayerCoord, blueplayer);

    const redEndCoord: Coord = await game.getCellLocation("redend");
    const redend: RedEnd = "R";
    this.addToCell(redEndCoord, redend);

    const blueEndCoord: Coord = await game.getCellLocation("blueend");
    const blueend: BlueEnd = "B";
    this.addToCell(blueEndCoord, blueend);

    const wallLocations = await game.getWallLocations();
    for (const wall of wallLocations.locked) {
      this.set(wall, "#");
    }
    for (const redWall of wallLocations.red) {
      this.set(redWall, "|");
    }
    for (const blueWall of wallLocations.blue) {
      this.set(blueWall, "-");
    }
  }

  /* Subscription handling */
  public async updateWalls(e: WallToggledEvent): Promise<void> {
    const coord: Coord = e.wall;
    const wallValue: EdgeElement = !e.isToggled
      ? " "
      : isVerticalEdge(coord)
      ? "|"
      : "-";
    this.set(coord, wallValue);
  }

  public async updatePlayer(e: PlayerMovedEvent): Promise<void> {
    const prevCoord: Coord = e.from;
    const prevElement: CellElement = this.get(prevCoord) as CellElement;

    if (Array.isArray(prevElement)) {
      const index = prevElement.indexOf(e.player === "red" ? "r" : "b");
      if (index > -1) {
        prevElement.splice(index, 1);
      }
    } else {
      this.set(prevCoord, " ");
    }

    const newCoord: Coord = e.to;
    const newCell: CellElement = this.get(newCoord) as CellElement;
    if (Array.isArray(newCell)) {
      newCell.push(e.player === "red" ? "r" : "b");
    }
  }

  public subscribeToWallToggled(
    callback: WallToggledEventCallback,
    game: Game
  ): void {
    this.unsubscribeToWallToggled = game
      ?.wallToggledEventSubscription()
      .subscribe(callback);
  }

  public subscribeToPlayerMoved(
    callback: PlayerMovedEventCallback,
    game: Game
  ): void {
    if (!game) {
      throw new Error("game is undefined or null ?!?");
    }
    this.unsubscribeToPlayerMoved = game
      ?.playerMovedEventSubscription()
      .subscribe(callback);
  }

  public dispose(game: Game) {
    if (!game) {
      throw new Error("game is undefined or null ?!?");
    }
    if (this.unsubscribeToWallToggled) {
      this.unsubscribeToWallToggled();
    }
    if (this.unsubscribeToPlayerMoved) {
      this.unsubscribeToPlayerMoved();
    }
  }
}
