import { Coord } from "../Coord";
import { PlayerColor } from "../Types";

export interface PlayerMovedEvent {
  player: PlayerColor;
  from: Coord;
  to: Coord;
  numMovements: number;
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
  pastEvents: PlayerMovedEvent[] = [];

  subscribe: (callback: PlayerMovedEventCallback) => UnsubscribePlayerMoved = (
    callback
  ) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: PlayerMovedEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: PlayerMovedEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
