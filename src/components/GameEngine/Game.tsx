import { Coord } from "../Board/Coord";

interface EdgeResult {}

interface Game {
  addEdge: (coord: Coord) => Promise<EdgeResult>;
  removeEdge: (coord: Coord) => Promise<EdgeResult>;
}

const instance: Game = {
  addEdge: function (coord: Coord): Promise<EdgeResult> {
    return Promise.resolve({});
    // return Promise.reject("INVALID");
  },
  removeEdge: function (coord: Coord): Promise<EdgeResult> {
    return Promise.resolve({});
    // return Promise.reject("INVALID");
  },
};

export default instance;
