import "./Dice.css";
import { useEffect, useState, useRef } from "react";
import GameInstance, { Game, PlayerColor } from "../../GameEngine/Game";
import { randomDiceValue } from "../../Utils";

export interface DiceProps {
  game?: Game;
  initialVisualRedRolls?: number[];
  initialVisualBlueRolls?: number[];
}

const Dice: React.FC<DiceProps> = ({
  game = GameInstance,
  initialVisualRedRolls = [],
  initialVisualBlueRolls = [],
}) => {
  const [value, setValue] = useState<number>(1);
  const [rolling, setRolling] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("red");
  const [visualRedRolls, setVisualRedRolls] = useState<number[]>(
    initialVisualRedRolls
  );
  const [visualBlueRolls, setVisualBlueRolls] = useState<number[]>(
    initialVisualBlueRolls
  );
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
    const fetchDiceRolls = async () => {
      if (initialVisualRedRolls.length === 0) {
        const red = await game.getDiceRolls("red");
        setVisualRedRolls(red);
      }
      if (initialVisualBlueRolls.length === 0) {
        const blue = await game.getDiceRolls("blue");
        setVisualBlueRolls(blue);
      }
    };
    fetchDiceRolls();
  }, [game, initialVisualRedRolls, initialVisualBlueRolls]);

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
      if (e.type === "start") {
        setRolling(true);
      } else if (e.type === "stop") {
        setRolling(false);
        setValue(e.value);
      }
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
