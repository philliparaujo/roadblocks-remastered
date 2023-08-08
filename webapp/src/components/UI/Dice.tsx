import { randomDiceValue } from "@roadblocks/types";
import { PlayerColor } from "@roadblocks/types";
import { useEffect, useRef, useState } from "react";
import { GameInstance, GameClient as Game } from "@roadblocks/client";
import "./Dice.css";

export interface DiceProps {
  game?: Game;
}

const Dice: React.FC<DiceProps> = ({ game = GameInstance }) => {
  const [value, setValue] = useState<number>(1);
  const [rolling, setRolling] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("red");
  const [visualRedRolls, setVisualRedRolls] = useState<number[]>([]);
  const [visualBlueRolls, setVisualBlueRolls] = useState<number[]>([]);
  const rollInterval = useRef<NodeJS.Timeout | null>(null);

  const rollSpeed = 200;

  /* Gets correct turn on game start */
  useEffect(() => {
    const fetchTurn = async () => {
      const turn = await game.getTurn();
      setCurrentTurn(turn);
    };
    fetchTurn();
  }, [game]);

  /* Gets visualDiceRolls on game start if none provided */
  useEffect(() => {
    game.getDice("red").then((redFaces) => {
      setVisualRedRolls(redFaces);
    });
    game.getDice("blue").then((blueFaces) => {
      setVisualBlueRolls(blueFaces);
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
      // TODO: reimplement animations
      // if (e.type === "start") {
      //   setRolling(true);
      // } else if (e.type === "stop") {
      //   setRolling(false);
      //   setValue(e.value);
      // }
    });

    return () => unsubscribe();
  }, [game]);

  /* Controls rolling speed intervals */
  useEffect(() => {
    const currentRolls =
      currentTurn === "red" ? visualRedRolls : visualBlueRolls;
    if (rolling) {
      rollInterval.current = setInterval(() => {
        setValue(randomDiceValue(currentRolls));
      }, rollSpeed);
    } else if (rollInterval.current) {
      clearInterval(rollInterval.current);
      rollInterval.current = null;
    }
  }, [rolling, currentTurn, visualRedRolls, visualBlueRolls]);

  const handleClick = () => {
    game
      .rollDice()
      .then((result) => console.log("DICE ROLLED A ", result.diceValue))
      .catch((err) => console.error("already rolled dice"));
  };

  return (
    <div className={`dice ${rolling ? "rolling" : ""}`} onClick={handleClick}>
      {value}
    </div>
  );
};

export default Dice;
