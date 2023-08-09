import {
  GameClient as Game,
  GameInstance,
  SubscriberClient,
} from "@roadblocks/client";
import {
  DiceRollEvent,
  LockWallEvent,
  SwitchTurnEvent,
  TimedEvent,
  WinGameEvent,
} from "@roadblocks/types";
import { useEffect } from "react";
import { useAlerts } from "./AlertContext";
import { rollDurationMs } from "./Dice";
import "./Alert.css";

interface GameAlertProps<T extends TimedEvent> {
  subscription: SubscriberClient<T>;
  messageBuilder: (event: T) => string; // Create a function determining the message output
  classBuilder?: (event: T) => string; // Create a function determining the message class (for color)
  game?: Game;
  delay?: number;
}

const displayTimeMs: number = 3000;

const GameAlert: React.FC<GameAlertProps<any>> = ({
  subscription,
  messageBuilder,
  classBuilder,
  game = GameInstance,
  delay = 0,
}) => {
  const { addAlert, removeAlert, updateAlertClass } = useAlerts();

  useEffect(() => {
    const unsubscribe = subscription.subscribe((e: any) => {
      setTimeout(() => {
        const alertMessage = messageBuilder(e);
        let alertClass = classBuilder ? classBuilder(e) : undefined;
        const id = addAlert({ message: alertMessage, className: alertClass });

        setTimeout(() => {
          alertClass += " fade-out";
          if (!alertClass) {
            console.error("NO ALERT CLASS");
            return;
          }
          updateAlertClass(id, alertClass);

          setTimeout(() => {
            removeAlert(id);
          }, 800); // Duration of fade-out
        }, displayTimeMs - 800);
      }, delay);
    });

    return () => unsubscribe();
  }, [game, delay]);

  // No need to render anything here. Rendering is handled by AlertDisplay.
  return null;
};

interface AlertProps {
  game?: Game;
}

const staticMessageBuilder = (message: string) => (): string => message;

export const WinGameAlert: React.FC<AlertProps> = ({ game = GameInstance }) => {
  const winGameSubscription = game.winGameEventSubscription();
  const messageBuilder = (event: WinGameEvent): string => {
    return event.winner === "red" ? "Red player wins!" : "Blue player wins!";
  };
  const classBuilder = (event: WinGameEvent) => event.winner;

  return (
    <GameAlert
      subscription={winGameSubscription}
      messageBuilder={messageBuilder}
      classBuilder={classBuilder}
    />
  );
};

export const StartGameAlert: React.FC<AlertProps> = ({
  game = GameInstance,
}) => (
  <GameAlert
    subscription={game.startGameEventSubscription()}
    messageBuilder={staticMessageBuilder("Game started!")}
  />
);

export const DiceRollAlert: React.FC<AlertProps> = ({
  game = GameInstance,
}) => (
  <GameAlert
    subscription={game.diceRollEventSubscription()}
    messageBuilder={(e: DiceRollEvent) => `Dice rolled a ${e.value}!`}
    delay={rollDurationMs}
  />
);

export const LockWallsAlert: React.FC<AlertProps> = ({
  game = GameInstance,
}) => (
  <GameAlert
    subscription={game.lockWallEventSubscription()}
    messageBuilder={(e: LockWallEvent) =>
      e.locked ? "Walls locked!" : "Walls unlocked!"
    }
  />
);

export const SwitchTurnAlert: React.FC<AlertProps> = ({
  game = GameInstance,
}) => {
  const switchTurnSubscription = game.switchTurnEventSubscription();
  const messageBuilder = (event: SwitchTurnEvent): string => {
    return event.turn === "red" ? "Red player's turn!" : "Blue player's turn!";
  };
  const classBuilder = (event: SwitchTurnEvent) => event.turn;

  return (
    <GameAlert
      subscription={switchTurnSubscription}
      messageBuilder={messageBuilder}
      classBuilder={classBuilder}
    />
  );
};
