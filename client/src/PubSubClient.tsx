import {
  DiceRollEvent,
  LockWallEvent,
  NumWallChangesEvent,
  PlayerMovedEvent,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  WallToggledEvent,
  WinGameEvent,
  diceRollPubSubRoute,
  lockWallPubSubRoute,
  numWallChangesPubSubRoute,
  playerMovedPubSubRoute,
  startGamePubSubRoute,
  switchTurnPubSubRoute,
  winGamePubSubRoute,
  wlalToggledPubSubRoute,
} from "@roadblocks/types";
import { myGet, serviceURL } from "./GameClient";

const fetchIntervalMs = 1000;

export type DiceRollEventCallback = (callback: DiceRollEvent) => void;
export type LockWallEventCallback = (callback: LockWallEvent) => void;
export type NumWallChangesEventCallback = (
  callback: NumWallChangesEvent
) => void;
export type PlayerMovedEventCallback = (callback: PlayerMovedEvent) => void;
export type StartGameEventCallback = (callback: StartGameEvent) => void;
export type SwitchTurnEventCallback = (callback: SwitchTurnEvent) => void;
export type WallToggledEventCallback = (callback: WallToggledEvent) => void;
export type WinGameEventCallback = (callback: WinGameEvent) => void;

/* GENERIC */
type UnsubscribeT = () => void;

export class SubscriberClient<T extends TimedEvent> {
  subscribers: ((event: T) => void)[] = [];
  pastEvents: T[] = [];
  lastSeenEvent: EpochTimeStamp = Date.parse("1970-01-01T00:00:00Z");
  timer?: NodeJS.Timer;

  route: string;

  constructor(route: string) {
    this.route = route;
  }

  subscribe: (callback: (event: T) => void) => UnsubscribeT = (callback) => {
    this.subscribers.push(callback);
    this.pastEvents.forEach((e) => callback(e));
    return () => this.unsubscribe(callback);
  };

  unsubscribe: (callback: (event: T) => void) => void = (callback) => {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber !== callback
    );
  };

  start: (sessionId: string) => void = (sessionId) => {
    console.log("starting PubSub client", this.route);
    this.timer = setInterval(() => {
      const url = new URL(serviceURL);
      url.pathname = this.route;
      // url.searchParams.set("sessionId", sessionId);
      url.searchParams.set(
        "lastEventTime",
        new Date(this.lastSeenEvent).toISOString()
      );

      console.log("Checking PubSub events", this.route);
      myGet<T[]>(url, { sessionId }).then((events) => {
        events.forEach((event) => {
          {
            console.log("Received event", event, "for", this.constructor.name);
          }
        });

        events.forEach((event) => {
          if (event.reset) {
            this.pastEvents = [];
          } else {
            this.pastEvents.push(event);
          }
        });

        this.lastSeenEvent = this.pastEvents.reduce(
          (result: EpochTimeStamp, item: T) => {
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

  stop = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  };
}

/* IMPLEMENTATIONS */
export class DiceRollSubscriberClient extends SubscriberClient<DiceRollEvent> {
  constructor() {
    super(diceRollPubSubRoute);
  }
}
export class LockWallSubscriberClient extends SubscriberClient<LockWallEvent> {
  constructor() {
    super(lockWallPubSubRoute);
  }
}
export class NumWallChangesSubscriberClient extends SubscriberClient<NumWallChangesEvent> {
  constructor() {
    super(numWallChangesPubSubRoute);
  }
}
export class PlayerMovedSubscriberClient extends SubscriberClient<PlayerMovedEvent> {
  constructor() {
    super(playerMovedPubSubRoute);
  }
}
export class StartGameSubscriberClient extends SubscriberClient<StartGameEvent> {
  constructor() {
    super(startGamePubSubRoute);
  }
}
export class SwitchTurnSubscriberClient extends SubscriberClient<SwitchTurnEvent> {
  constructor() {
    super(switchTurnPubSubRoute);
  }
}
export class WallToggledSubscriberClient extends SubscriberClient<WallToggledEvent> {
  constructor() {
    super(wlalToggledPubSubRoute);
  }
}
export class WinGameSubscriberClient extends SubscriberClient<WinGameEvent> {
  constructor() {
    super(winGamePubSubRoute);
  }
}
