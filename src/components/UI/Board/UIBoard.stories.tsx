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

export const Empty: Story = {
  render: (args) => {
    return <UIBoard width={0} height={0} />;
  },
};

export const OneByOne: Story = {
  render: (args) => {
    return <UIBoard width={1} height={1} />;
  },
};

export const TwoByTwo: Story = {
  render: (args) => {
    return <UIBoard width={2} height={2} />;
  },
};

export const TwentyByTwenty: Story = {
  render: (args) => {
    return <UIBoard width={20} height={20} />;
  },
};

export const NegativeOneByNegativeOne: Story = {
  render: (args) => {
    return <UIBoard width={-1} height={-1} />;
  },
};
