export interface DiceRollStart {
  type: "start";
}
export interface DiceRollStop {
  type: "stop";
  value: number;
}

export type DiceRollEvent = DiceRollStart | DiceRollStop;

export type SubscribeDiceRoll = (
  callback: DiceRollCallback
) => UnsubscribeDiceRoll;

export interface DiceRollEventSubscription {
  subscribe: SubscribeDiceRoll;
}

export type DiceRollCallback = (callback: DiceRollEvent) => void;
type UnsubscribeDiceRoll = () => void;

export class DiceRollSubscriber implements DiceRollEventSubscription {
  subscribers: ((event: DiceRollEvent) => void)[] = [];
  pastEvents: DiceRollEvent[] = [];

  subscribe: (callback: (event: DiceRollEvent) => void) => UnsubscribeDiceRoll =
    (callback) => {
      this.subscribers.push(callback);
      this.pastEvents.forEach((e) => callback(e));
      return () => this.unsubscribe(callback);
    };

  unsubscribe: (callback: (event: DiceRollEvent) => void) => void = (
    callback
  ) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: DiceRollEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
