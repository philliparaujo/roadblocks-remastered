import { Meta, StoryObj } from "@storybook/react";
import UIBoard from "./UIBoard";

const meta: Meta<typeof UIBoard> = {
  component: UIBoard,
  args: {
    height: 7,
    width: 7,
    debug: false,
  },
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof UIBoard>;

export const Test: Story = {};

export const Debug: Story = {
  render: (args) => {
    return <UIBoard width={7} height={7} debug={true} />;
  },
};
