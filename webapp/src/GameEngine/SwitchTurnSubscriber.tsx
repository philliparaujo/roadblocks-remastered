import { PlayerColor } from "@roadblocks/engine";

export interface SwitchTurnEvent {
  turn: PlayerColor;
}

export interface SwitchTurnEventSubscription {
  subscribe: (callback: SwitchTurnEventCallback) => UnsubscribeSwitchTurn;
}

export type SwitchTurnEventCallback = (callback: SwitchTurnEvent) => void;
type UnsubscribeSwitchTurn = () => void;

export class SwitchTurnSubscriber implements SwitchTurnEventSubscription {
  subscribers: SwitchTurnEventCallback[] = [];
  pastEvents: SwitchTurnEvent[] = [];

  subscribe: (callback: SwitchTurnEventCallback) => UnsubscribeSwitchTurn = (
    callback
  ) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: SwitchTurnEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: SwitchTurnEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
