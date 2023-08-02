import { PlayerColor } from "../Types";

export interface StartGameEvent {
  startingPlayer: PlayerColor;
}

export type SubscribeStartGameEvent = (
  callback: StartGameEventCallback
) => UnsubscribeStartGame;

export interface StartGameEventSubscription {
  subscribe: SubscribeStartGameEvent;
}

export type StartGameEventCallback = (callback: StartGameEvent) => void;
type UnsubscribeStartGame = () => void;

export class StartGameSubscriber implements StartGameEventSubscription {
  subscribers: StartGameEventCallback[] = [];
  pastEvents: StartGameEvent[] = [];

  subscribe: (callback: StartGameEventCallback) => UnsubscribeStartGame = (
    callback
  ) => {
    // console.log("Subscribing to WallToggledSubscriber");
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: StartGameEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: StartGameEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
