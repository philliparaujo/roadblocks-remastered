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
} from "@roadblocks/types";

export class SubscriberServer<T extends TimedEvent> {
  pastEvents: T[] = [];

  notify: (event: T) => void = (event) => {
    this.pastEvents.push(event);
  };

  get: (ts: EpochTimeStamp) => Promise<T[]> = (ts) =>
    Promise.resolve(this.pastEvents.filter((pastEvent) => pastEvent.ts > ts));
}

export class DiceRollSubscriberServer extends SubscriberServer<DiceRollEvent> {}
export class LockWallSubscriberServer extends SubscriberServer<LockWallEvent> {}
export class NumWallChangesSubscriberServer extends SubscriberServer<NumWallChangesEvent> {}
export class PlayerMovedSubscriberServer extends SubscriberServer<PlayerMovedEvent> {}
export class StartGameSubscriberServer extends SubscriberServer<StartGameEvent> {}
export class SwitchTurnSubscriberServer extends SubscriberServer<SwitchTurnEvent> {}
export class WallToggledSubscriberServer extends SubscriberServer<WallToggledEvent> {}
export class WinGameSubscriberServer extends SubscriberServer<WinGameEvent> {}
