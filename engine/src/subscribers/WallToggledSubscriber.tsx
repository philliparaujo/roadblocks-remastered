import { Coord } from "@roadblocks/types";

export interface WallToggledEvent {
  wall: Coord;
  isToggled: boolean;
  ts?: EpochTimeStamp;
}

export type SubscribeWallEvent = (
  callback: WallToggledEventCallback
) => UnsubscribeWallToggled;

export interface WallToggledEventSubscription {
  subscribe: SubscribeWallEvent;
}

export type WallToggledEventCallback = (callback: WallToggledEvent) => void;
type UnsubscribeWallToggled = () => void;

export class WallToggledSubscriber implements WallToggledEventSubscription {
  subscribers: WallToggledEventCallback[] = [];
  pastEvents: WallToggledEvent[] = [];

  subscribe: (callback: WallToggledEventCallback) => UnsubscribeWallToggled = (
    callback
  ) => {
    // console.log("Subscribing to WallToggledSubscriber");
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: WallToggledEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: WallToggledEvent) => void = (event) => {
    const tsEvent = { ...event, ts: new Date().getTime() };
    this.pastEvents.push(tsEvent);
    // console.log("Sending subscriptions", this.subscribers.length, tsEvent);
    this.subscribers.forEach((callback) => callback(tsEvent));
  };
}
