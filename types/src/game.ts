import { Coord } from "./Coord";
import { EdgeResult } from "./protocol";

export interface Game {
  value: () => Promise<number>;
  addEdge: (coord: Coord) => Promise<EdgeResult>;
}
