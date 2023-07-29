import { Coord } from "../Coord";

export interface NumWallChangesEvent {
  wallChanges: number;
}

export type SubscribeNumWallChanges = (
  callback: NumWallChangesEventCallback
) => UnsubscribeNumWallChanges;

export interface NumWallChangesEventSubscription {
  subscribe: SubscribeNumWallChanges;
}

export type NumWallChangesEventCallback = (
  callback: NumWallChangesEvent
) => void;
type UnsubscribeNumWallChanges = () => void;

export class NumWallChangesSubscriber
  implements NumWallChangesEventSubscription
{
  subscribers: NumWallChangesEventCallback[] = [];
  pastEvents: NumWallChangesEvent[] = [];

  subscribe: (
    callback: NumWallChangesEventCallback
  ) => UnsubscribeNumWallChanges = (callback) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: NumWallChangesEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: NumWallChangesEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
