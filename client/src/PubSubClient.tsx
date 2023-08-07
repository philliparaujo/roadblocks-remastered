import { DiceRollEvent, WallToggledEvent } from "@roadblocks/types";
import { myGet, serviceURL } from "./GameClient";

type UnsubscribeDiceRoll = () => void;
type UnsubscribeWallToggled = () => void;

const fetchIntervalMs = 1000;

export type DiceRollEventCallback = (callback: DiceRollEvent) => void;

export type SubscribeDiceRoll = (
  callback: DiceRollEventCallback
) => UnsubscribeDiceRoll;

export interface DiceRollEventSubscription {
  subscribe: SubscribeDiceRoll;
}

export type WallToggledEventCallback = (callback: WallToggledEvent) => void;

export type SubscribeWallToggled = (
  callback: WallToggledEventCallback
) => UnsubscribeWallToggled;

export interface WallToggledEventSubscription {
  subscribe: SubscribeWallToggled;
}

export class DiceRollSubscriberClient implements DiceRollEventSubscription {
  subscribers: ((event: DiceRollEvent) => void)[] = [];
  pastEvents: DiceRollEvent[] = [];
  lastSeenEvent: EpochTimeStamp = Date.parse("1970-01-01T00:00:00Z");

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

  start: (sessionId: string) => void = (sessionId) => {
    setInterval(() => {
      const url = new URL(serviceURL);
      url.pathname = "/pubsub/dicerolls";
      url.searchParams.set("sessionId", sessionId);
      url.searchParams.set("lastEventTime", this.lastSeenEvent.toString());

      myGet<DiceRollEvent[]>(url).then((events) => {
        this.pastEvents.push(...events);
        this.lastSeenEvent = this.pastEvents.reduce(
          (result: EpochTimeStamp, item: DiceRollEvent) => {
            if (item.ts > result) {
              result = item.ts;
            }
            return result;
          },
          this.lastSeenEvent
        );
        events.forEach((event) => {
          this.subscribers.forEach((callback) => callback(event));
        });
      });
    }, fetchIntervalMs);
  };
}

export class WallToggledSubscriberClient
  implements WallToggledEventSubscription
{
  subscribers: ((event: WallToggledEvent) => void)[] = [];
  pastEvents: WallToggledEvent[] = [];
  lastSeenEvent: EpochTimeStamp = Date.parse("1970-01-01T00:00:00Z");

  subscribe: (
    callback: (event: WallToggledEvent) => void
  ) => UnsubscribeWallToggled = (callback) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: (event: WallToggledEvent) => void) => void = (
    callback
  ) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  start: (sessionId: string) => void = (sessionId) => {
    console.log("Starting PubSub client", this.constructor.name);
    setInterval(() => {
      const url = new URL(serviceURL);
      url.pathname = "/pubsub/walltoggled";
      url.searchParams.set("sessionId", sessionId);
      url.searchParams.set(
        "lastEventTime",
        new Date(this.lastSeenEvent).toISOString()
      );

      console.log("Checking PubSub events", this.constructor.name);
      myGet<WallToggledEvent[]>(url).then((events) => {
        this.pastEvents.push(...events);
        this.lastSeenEvent = this.pastEvents.reduce(
          (result: EpochTimeStamp, item: WallToggledEvent) => {
            if (item.ts > result) {
              result = item.ts;
            }
            return result;
          },
          this.lastSeenEvent
        );
        events.forEach((event) => {
          this.subscribers.forEach((callback) => callback(event));
        });
      });
    }, fetchIntervalMs);
  };
}
