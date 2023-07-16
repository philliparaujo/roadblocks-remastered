import { Coord } from "../components/UI/Board/Coord";

export interface WallToggledEvent {
  wall: Coord;
  isToggled: boolean;
}

export interface WallToggledEventSubscription {
  subscribe: (callback: WallToggledEventCallback) => UnsubscribeWallToggled;
}

export type WallToggledEventCallback = (callback: WallToggledEvent) => void;
type UnsubscribeWallToggled = () => void;

export class WallToggledSubscriber implements WallToggledEventSubscription {
  subscribers: WallToggledEventCallback[] = [];

  subscribe: (callback: WallToggledEventCallback) => UnsubscribeWallToggled = (
    callback
  ) => {
    this.subscribers.push(callback);
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: WallToggledEventCallback) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  notify: (event: WallToggledEvent) => void = (event) => {
    this.subscribers.forEach((callback) => callback(event));
  };
}
