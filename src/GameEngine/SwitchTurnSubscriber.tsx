export interface SwitchTurnEvent {
  redTurn: boolean;
}

export interface SwitchTurnEventSubscription {
  subscribe: (callback: SwitchTurnEventCallback) => UnsubscribeSwitchTurn;
}

export type SwitchTurnEventCallback = (callback: SwitchTurnEvent) => void;
type UnsubscribeSwitchTurn = () => void;

export class SwitchTurnSubscriber implements SwitchTurnEventSubscription {
  subscribers: SwitchTurnEventCallback[] = [];

  subscribe: (callback: SwitchTurnEventCallback) => UnsubscribeSwitchTurn = (
    callback
  ) => {
    this.subscribers.push(callback);
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: SwitchTurnEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: SwitchTurnEvent) => void = (event) => {
    this.subscribers.forEach((callback) => callback(event));
  };
}
