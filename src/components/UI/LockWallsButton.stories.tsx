import { Meta, StoryObj } from "@storybook/react";
import LockWallsButton from "./LockWallsButton";
import UIBoard from "../UI/Board/UIBoard";
import { GameInstance } from "../../GameEngine/Game";

const meta: Meta<typeof LockWallsButton> = {
  component: LockWallsButton,
};

export default meta;
type Story = StoryObj<typeof LockWallsButton>;

const fakeGame: GameInstance = new GameInstance(7, 7);

export const Default: Story = {};

export const WithBoard: Story = {
  render: () => {
    fakeGame.reset();

    return (
      <div>
        <LockWallsButton game={fakeGame} />
        <UIBoard game={fakeGame} />
      </div>
    );
  },
};
