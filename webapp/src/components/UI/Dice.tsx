import { randomDiceValue } from "@roadblocks/types";
import { PlayerColor } from "@roadblocks/types";
import { useEffect, useRef, useState } from "react";
import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Dice.css";

export interface DiceProps {
  game?: Game;
}

const Dice: React.FC<DiceProps> = ({ game = GameInstance }) => {
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("red");

  const [redFaces, setRedFaces] = useState<number[]>([]);
  const [blueFaces, setBlueFaces] = useState<number[]>([]);

  const rollInterval = useRef<NodeJS.Timeout | null>(null);

  const [faceDisplay, setFaceDisplay] = useState<number>(1);
  const [lastValue, setLastValue] = useState<number>(1);
  const [rolling, setRolling] = useState<boolean>(false);

  const rollSpeed = 200;

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
    });

    return () => unsubscribe();
  }, [game]);

  /* Controls rolling stop/start */
  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setRolling(true);
      setLastValue(e.value);
      setTimeout(() => {
        setRolling(false);
      }, 3000);
    });

    return () => unsubscribe();
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
      }, rollSpeed);
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
