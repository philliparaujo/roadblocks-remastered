import { Game } from "@roadblocks/types";

export class GameImpl implements Game {
  value: number;
  constructor() {
    this.value = Math.random();
  }
}
