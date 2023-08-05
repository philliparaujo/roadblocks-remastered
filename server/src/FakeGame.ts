import { Coord, EdgeResult, Game } from "@roadblocks/types";

export class GameImpl implements Game {
  myValue: number;
  constructor() {
    this.myValue = Math.random();
    console.log(`Created object with ${this.myValue}`);
  }

  addEdge = (coord: Coord): Promise<EdgeResult> => {
    console.log(`Adding edge at ${coord.row},${coord.col}`);
    return Promise.resolve({});
  };

  value = (): Promise<number> => {
    return Promise.resolve(this.myValue);
  };
}
