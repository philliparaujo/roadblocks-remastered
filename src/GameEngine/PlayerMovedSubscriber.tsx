import { Coord } from "../Coord";
import { PlayerColor } from "./Game";

export interface PlayerMovedEvent {
  player: PlayerColor;
  from: Coord;
  to: Coord;
}

export type SubscribePlayerEvent = (
  callback: PlayerMovedEventCallback
) => UnsubscribePlayerMoved;

export interface PlayerEventSubscription {
  subscribe: SubscribePlayerEvent;
}

export type PlayerMovedEventCallback = (callback: PlayerMovedEvent) => void;
type UnsubscribePlayerMoved = () => void;

export class PlayerMovedSubscriber implements PlayerEventSubscription {
  subscribers: PlayerMovedEventCallback[] = [];

  subscribe: (callback: PlayerMovedEventCallback) => UnsubscribePlayerMoved = (
    callback
  ) => {
    this.subscribers.push(callback);
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: PlayerMovedEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: PlayerMovedEvent) => void = (event) => {
    this.subscribers.forEach((callback) => callback(event));
  };
}
