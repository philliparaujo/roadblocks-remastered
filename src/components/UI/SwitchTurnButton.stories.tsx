import { Meta, StoryObj } from "@storybook/react";
import SwitchTurnButton from "./SwitchTurnButton";
import UIBoard from "../Board/UIBoard";
import { GameImpl } from "../../GameEngine/Game";

const meta: Meta<typeof SwitchTurnButton> = {
  component: SwitchTurnButton,
};

export default meta;
type Story = StoryObj<typeof SwitchTurnButton>;

const fakeGame: GameImpl = new GameImpl(7, 7);

export const Default: Story = {};

export const WithBoard: Story = {
  render: () => {
    fakeGame.reset();

    return (
      <div>
        <SwitchTurnButton game={fakeGame} />
        <UIBoard game={fakeGame} />
      </div>
    );
  },
};
