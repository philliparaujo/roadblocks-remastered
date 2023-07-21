import { Meta, StoryObj } from "@storybook/react";
import LockWallsButton from "./LockWallsButton";
import UIBoard from "../Board/UIBoard";
import { GameImpl } from "../../GameEngine/Game";

const meta: Meta<typeof LockWallsButton> = {
  component: LockWallsButton,
};

export default meta;
type Story = StoryObj<typeof LockWallsButton>;

const fakeGame: GameImpl = new GameImpl(7, 7);

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
