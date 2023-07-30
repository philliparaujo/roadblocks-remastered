export interface LockWallEvent {}

export interface LockWallEventSubscription {
  subscribe: (callback: LockWallEventCallback) => UnsubscribeLockWall;
}

export type LockWallEventCallback = (callback: LockWallEvent) => void;
type UnsubscribeLockWall = () => void;

export class LockWallSubscriber implements LockWallEventSubscription {
  subscribers: LockWallEventCallback[] = [];
  pastEvents: LockWallEvent[] = [];

  subscribe: (callback: LockWallEventCallback) => UnsubscribeLockWall = (
    callback
  ) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: LockWallEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: LockWallEvent) => void = (event) => {
    this.pastEvents.push(event);
    this.subscribers.forEach((callback) => callback(event));
  };
}
