// Game.stories.tsx
import { Meta, StoryObj } from "@storybook/react";
import UIBoard from "../components/Board/UIBoard";
import Game, { GameImpl } from "./Game";
import SwitchTurnButton from "../components/UI/SwitchTurnButton";
import LockWallsButton from "../components/UI/LockWallsButton";
import { Coord } from "../Coord";

interface GameProps {
  height: number;
  width: number;
  initialRedPlayerLocation: Coord;
  initialBluePlayerLocation: Coord;
  initialRedEndLocation: Coord;
  initialBlueEndLocation: Coord;
  debug?: boolean;
}

const GameStory: React.FC<GameProps> = ({
  height,
  width,
  initialRedPlayerLocation,
  initialBluePlayerLocation,
  initialRedEndLocation,
  initialBlueEndLocation,
  debug,
}) => {
  const gameInstance = new GameImpl(height, width);
  gameInstance.state.playerLocations = {
    red: initialRedPlayerLocation,
    blue: initialBluePlayerLocation,
  };
  gameInstance.state.endLocations = {
    red: initialRedEndLocation,
    blue: initialBlueEndLocation,
  };
  return (
    <div>
      <UIBoard debug={debug} game={gameInstance} />
      <LockWallsButton game={gameInstance} />
      <SwitchTurnButton game={gameInstance} />
    </div>
  );
};

const meta: Meta<typeof GameStory> = {
  component: GameStory,
  args: {
    height: 3,
    width: 3,
    initialRedPlayerLocation: { row: 3, col: 1 },
    initialBluePlayerLocation: { row: 1, col: 3 },
    initialRedEndLocation: { row: 3, col: 5 },
    initialBlueEndLocation: { row: 5, col: 3 },
    debug: false,
  },
};

export default meta;
type Story = StoryObj<typeof GameStory>;

export const Default: Story = {
  render: (args) => {
    return <GameStory {...args} />;
  },
};
