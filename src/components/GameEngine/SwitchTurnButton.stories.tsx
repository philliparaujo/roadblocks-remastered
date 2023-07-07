import { Meta, StoryObj } from "@storybook/react";
import SwitchTurnButton, { SwitchTurnButtonProps } from "./SwitchTurnButton";

const meta: Meta<typeof SwitchTurnButton> = {
  component: SwitchTurnButton,
};

export default meta;
type Story = StoryObj<typeof SwitchTurnButton>;

export const Default: Story = {};
