import { GameClient as Game, GameInstance } from "@roadblocks/client";
import { PlayerColor, randomDiceValue } from "@roadblocks/types";
import React, { useEffect, useRef, useState } from "react";
import { rollDurationMs } from "./Dice";

export interface DiceProps {
  game?: Game;
}

const Dice2: React.FC<DiceProps> = ({ game = GameInstance }) => {
  const [faceIndex, setFaceIndex] = useState<number>(0);

  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("red");
  const diceColor: PlayerColor = currentTurn;
  const [currentFaces, setCurrentFaces] = useState<number[]>([]);

  const [lastValue, setLastValue] = useState<number>(-1);

  const [rolling, setRolling] = useState<boolean>(false);
  const rollInterval = useRef<NodeJS.Timeout | null>(null);
  const rollSpeedMs = 200;
  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [disabled, setDisabled] = useState<boolean>(true);

  const getRandomIndex = (): number => {
    return randomDiceValue() - 1;
  };

  /* Given a value, return an index of an array which has the same value */
  const findIndexFromValue = (arr: number[], value: number): number => {
    const matchingIndices = arr.reduce<number[]>((indices, currVal, idx) => {
      if (currVal === value) indices.push(idx);
      return indices;
    }, []);

    const randomIdx = Math.floor(Math.random() * matchingIndices.length);

    return matchingIndices[randomIdx];
  };

  /* Set correct turns and currentFaces on game start */
  useEffect(() => {
    const fetchTurn = async () => {
      const turn = await game.getTurn();

      game.getDice(turn).then((faces) => {
        setCurrentFaces(faces);
      });

      setCurrentTurn(turn);
    };
    fetchTurn();
  }, [game]);

  /* Set correct turns and currentFaces on turn switch */
  useEffect(() => {
    const unsubscribe = game.switchTurnEventSubscription().subscribe((e) => {
      if (e.turn === "red") {
        setCurrentTurn("red");
      } else if (e.turn === "blue") {
        setCurrentTurn("blue");
      }

      game.getDice(e.turn).then((faces) => {
        setCurrentFaces(faces);
      });

      // Clear any timeouts and set rolling to false when the turn switches
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }
      setRolling(false);
      setDisabled(false);
    });

    return () => unsubscribe();
  }, [game]);

  /* Set rolling animations and final value from dice roll event */
  useEffect(() => {
    const unsubscribe = game.diceRollEventSubscription().subscribe((e) => {
      setLastValue(e.value);
      setRolling(true);
      setDisabled(true);

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

  /* Roll animation */
  useEffect(() => {
    if (rolling) {
      rollInterval.current = setInterval(() => {
        setFaceIndex(getRandomIndex());
      }, rollSpeedMs);
    } else if (rollInterval.current) {
      clearInterval(rollInterval.current);
      rollInterval.current = null;
    }
  }, [rolling, currentTurn]);

  /* Once done rolling, set the final index from the final value */
  useEffect(() => {
    if (
      rolling ||
      currentFaces.length === 0 ||
      currentFaces[faceIndex] === lastValue
    ) {
      return;
    }

    // We need to move the dice to the final chosen number
    const index = findIndexFromValue(currentFaces, lastValue);
    setFaceIndex(index);
  }, [rolling, lastValue]);

  useEffect(() => {
    const unsubscribe = game.startGameEventSubscription().subscribe((e) => {
      setDisabled(false);
    });
    return () => unsubscribe();
  }, [game]);

  useEffect(() => {
    const unsubscribe = game.winGameEventSubscription().subscribe((e) => {
      setDisabled(true);
    });
    return () => unsubscribe();
  }, [game]);

  const handleClick = () => {
    if (!disabled) {
      game
        .rollDice()
        .then((result) => {
          console.log("DICE ROLLED A ", result.diceValue);
        })
        .catch((err) => console.error("already rolled dice"));
    }
  };

  return (
    <div onClick={handleClick}>
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 0}
        id="btnFront"
      />
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 1}
        id="btnRight"
      />
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 2}
        id="btnTop"
      />
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 3}
        id="btnBottom"
      />
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 4}
        id="btnLeft"
      />
      <input
        type="radio"
        name="roll"
        readOnly
        checked={faceIndex === 5}
        id="btnBack"
      />
      <div id="view">
        <div id="dice" className={disabled ? "disabled" : ""}>
          <div className={`diceFace ${diceColor}`} id="front">
            {currentFaces[0]}
          </div>
          <div className={`diceFace ${diceColor}`} id="right">
            {currentFaces[1]}
          </div>
          <div className={`diceFace ${diceColor}`} id="top">
            {currentFaces[2]}
          </div>
          <div className={`diceFace ${diceColor}`} id="bottom">
            {currentFaces[3]}
          </div>
          <div className={`diceFace ${diceColor}`} id="left">
            {currentFaces[4]}
          </div>
          <div className={`diceFace ${diceColor}`} id="back">
            {currentFaces[5]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice2;
