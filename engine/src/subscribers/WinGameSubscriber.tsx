import { PlayerColor } from "../Types";

export interface WinGameEvent {
  winner: PlayerColor;
}

export type SubscribeWinGameEvent = (
  callback: WinGameEventCallback
) => UnsubscribeWinGame;

export interface WinGameEventSubscription {
  subscribe: SubscribeWinGameEvent;
}

export type WinGameEventCallback = (callback: WinGameEvent) => void;
type UnsubscribeWinGame = () => void;

export class WinGameSubscriber implements WinGameEventSubscription {
  subscribers: WinGameEventCallback[] = [];
  pastEvents: WinGameEvent[] = [];

  subscribe: (callback: WinGameEventCallback) => UnsubscribeWinGame = (
    callback
  ) => {
    // console.log("Subscribing to WallToggledSubscriber");
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: WinGameEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: WinGameEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
