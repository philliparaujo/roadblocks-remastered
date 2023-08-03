import { Game } from "@roadblocks/types";

export class GameImpl implements Game {
  myValue: number;
  constructor() {
    this.myValue = Math.random();
    console.log(`Created object with ${this.myValue}`);
  }

  value = (): Promise<number> => {
    return Promise.resolve(this.myValue);
  };
}
