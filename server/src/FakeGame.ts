export interface Game {
  value: number;
}

export class GameImpl implements Game {
  value: number;
  constructor() {
    this.value = Math.random();
  }
}
