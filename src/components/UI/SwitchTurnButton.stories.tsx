import { Meta, StoryObj } from "@storybook/react";
import SwitchTurnButton from "./SwitchTurnButton";
import UIBoard from "../UI/Board/UIBoard";
import { GameInstance } from "../../GameEngine/Game";

const meta: Meta<typeof SwitchTurnButton> = {
  component: SwitchTurnButton,
};

export default meta;
type Story = StoryObj<typeof SwitchTurnButton>;

const fakeGame: GameInstance = new GameInstance();

export const Default: Story = {};

export const WithBoard: Story = {
  render: () => {
    fakeGame.reset();

    return (
      <div>
        <SwitchTurnButton game={fakeGame} />
        <UIBoard height={7} width={7} game={fakeGame} />
      </div>
    );
  },
};
