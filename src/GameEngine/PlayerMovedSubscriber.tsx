import { Coord } from "../components/UI/Board/Coord";
import { PlayerColor } from "./Game";

export interface PlayerMovedEvent {
  player: PlayerColor;
  from: Coord;
  to: Coord;
}

export interface PlayerEventSubscription {
  subscribe: (callback: PlayerMovedEventCallback) => UnsubscribePlayerMoved;
}

export type PlayerMovedEventCallback = (callback: PlayerMovedEvent) => void;
type UnsubscribePlayerMoved = () => void;

export class PlayerMovedSubscriber implements PlayerEventSubscription {
  subscribers: PlayerMovedEventCallback[] = [];

  subscribe: (callback: PlayerMovedEventCallback) => UnsubscribePlayerMoved = (
    callback
  ) => {
    this.subscribers.push(callback);
    // console.log("subscriptions", this.subscribers);
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: PlayerMovedEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
    // console.log("unsubscribe subscriptions", this.subscribers);
  };

  notify: (event: PlayerMovedEvent) => void = (event) => {
    this.subscribers.forEach((callback) => callback(event));
  };
}