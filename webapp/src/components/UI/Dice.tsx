import { randomDiceValue } from "@roadblocks/types";
import { PlayerColor } from "@roadblocks/types";
import { useEffect, useRef, useState } from "react";
import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Dice.css";

export interface DiceProps {
  game?: Game;
}
export const rollDurationMs = 2000;

const Dice: React.FC<DiceProps> = ({ game = GameInstance }) => {
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("red");

  const [redFaces, setRedFaces] = useState<number[]>([]);
  const [blueFaces, setBlueFaces] = useState<number[]>([]);

  const rollInterval = useRef<NodeJS.Timeout | null>(null);

  const [faceDisplay, setFaceDisplay] = useState<number>(1);
  const [lastValue, setLastValue] = useState<number>(1);
  const [rolling, setRolling] = useState<boolean>(false);

  const rollSpeedMs = 200;

  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Gets correct turn on game start */
  useEffect(() => {
    const fetchTurn = async () => {
      const turn = await game.getTurn();
      setCurrentTurn(turn);
    };
    fetchTurn();
  }, [game]);

  /* Gets faces on game start if none provided */
  useEffect(() => {
    game.getDice("red").then((redFaces) => {
      setRedFaces(redFaces);
    });
    game.getDice("blue").then((blueFaces) => {
      setBlueFaces(blueFaces);
    });
  }, [game]);

  /* Keeps current turn updated */
  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      if (e.turn === "red") {
        setCurrentTurn("red");
      } else if (e.turn === "blue") {
        setCurrentTurn("blue");
      }

      // Clear any timeouts and set rolling to false when the turn switches
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }
      setRolling(false);
    });

    return () => unsubscribe();
  }, [game]);

  /* Controls rolling stop/start */
  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setRolling(true);
      setLastValue(e.value);
      rollTimeoutRef.current = setTimeout(() => {
        setRolling(false);
      }, rollDurationMs);
    });

    return () => {
      unsubscribe();
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }
    };
  }, [game]);

  useEffect(() => {
    if (!rolling) {
      setFaceDisplay(lastValue);
    }
  }, [rolling]);

  /* Controls rolling speed intervals */
  useEffect(() => {
    if (rolling) {
      const currentRolls = currentTurn === "red" ? redFaces : blueFaces;
      rollInterval.current = setInterval(() => {
        setFaceDisplay(randomDiceValue(currentRolls));
      }, rollSpeedMs);
    } else if (rollInterval.current) {
      clearInterval(rollInterval.current);
      rollInterval.current = null;
    }
  }, [rolling, currentTurn, redFaces, blueFaces]);

  const handleClick = () => {
    game
      .rollDice()
      .then((result) => console.log("DICE ROLLED A ", result.diceValue))
      .catch((err) => console.error("already rolled dice"));
  };

  return (
    <div className={`dice ${rolling ? "rolling" : ""}`} onClick={handleClick}>
      {faceDisplay}
    </div>
  );
};

export default Dice;
