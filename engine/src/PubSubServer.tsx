import {
  DiceRollEvent,
  ErrorEvent,
  LockWallEvent,
  NumWallChangesEvent,
  PlayerMovedEvent,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  WallToggledEvent,
  WinGameEvent,
} from "@roadblocks/types";

export class SubscriberServer<T extends TimedEvent> {
  pastEvents: T[] = [];

  constructor() {
    console.log("Created PubSub server for", this.constructor.name);
  }

  notify: (event: T) => void = (event) => {
    console.log("Pushing event", this.constructor.name, JSON.stringify(event));
    this.pastEvents.push(event);
    console.log(this.pastEvents);
  };

  reset: () => void = () => {
    this.pastEvents = [];
    this.pastEvents.push({ reset: true } as T);
    console.log(this.pastEvents);
  };

  get: (ts: EpochTimeStamp) => Promise<T[]> = (ts) => {
    console.log(
      "Checking events for",
      this.constructor.name,
      this.pastEvents.length
    );
    return Promise.resolve(
      this.pastEvents.filter((pastEvent) => pastEvent.ts > ts)
    );
  };
}

export class DiceRollSubscriberServer extends SubscriberServer<DiceRollEvent> {}
export class LockWallSubscriberServer extends SubscriberServer<LockWallEvent> {}
export class NumWallChangesSubscriberServer extends SubscriberServer<NumWallChangesEvent> {}
export class PlayerMovedSubscriberServer extends SubscriberServer<PlayerMovedEvent> {}
export class StartGameSubscriberServer extends SubscriberServer<StartGameEvent> {}
export class SwitchTurnSubscriberServer extends SubscriberServer<SwitchTurnEvent> {}
export class WallToggledSubscriberServer extends SubscriberServer<WallToggledEvent> {}
export class WinGameSubscriberServer extends SubscriberServer<WinGameEvent> {}
export class ErrorSubscriberServer extends SubscriberServer<ErrorEvent> {}
