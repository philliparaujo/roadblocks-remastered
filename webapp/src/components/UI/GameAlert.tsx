import {
  GameInstance,
  GameClient as Game,
  SubscriberClient,
} from "@roadblocks/client";
import { useEffect, useState } from "react";
import "./GameAlert.css";
import {
  DiceRollEvent,
  LockWallEvent,
  PlayerColor,
  StartGameEvent,
  SwitchTurnEvent,
  TimedEvent,
  WinGameEvent,
} from "@roadblocks/types";
import { rollDurationMs } from "./Dice";

interface GameAlertProps<T extends TimedEvent> {
  subscription: SubscriberClient<T>;
  messageBuilder: (event: T) => string;
  classBuilder?: (event: T) => string;
  game?: Game;
  delay?: number;
}

const GameAlert: React.FC<GameAlertProps<any>> = ({
  subscription,
  messageBuilder,
  classBuilder,
  game = GameInstance,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertClass, setAlertClass] = useState("");

  useEffect(() => {
    const unsubscribe = subscription.subscribe((e: any) => {
      setTimeout(() => {
        setAlertMessage(messageBuilder(e));
        if (classBuilder) {
          setAlertClass(classBuilder(e));
        }
        setIsVisible(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }, delay);
    });

    return () => unsubscribe();
  }, [game, delay]);

  if (!isVisible) {
    return null;
  }

  return <div className={`custom-alert ${alertClass}`}>{alertMessage}</div>;
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
    messageBuilder={staticMessageBuilder("Walls locked!")}
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
