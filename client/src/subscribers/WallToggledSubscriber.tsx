import { WallToggledEvent } from "@roadblocks/types";

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
}
