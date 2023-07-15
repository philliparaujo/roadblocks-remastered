import { Meta, StoryObj } from "@storybook/react";
import Cell, { CellProps } from "./Cell";

const meta: Meta<typeof Cell> = {
  component: Cell,
  args: {
    coord: { row: 0, col: 0 },
    initialContents: [],
    type: "disabled",
  },
};

export default meta;
type Story = StoryObj<typeof Cell>;

export const Default: Story = {
  render: (args) => {
    return <Cell {...args} />;
  },
};

export const RedPlayer: Story = {
  render: (args) => <Cell {...args} initialContents={["redplayer"]} />,
};

export const BluePlayer: Story = {
  render: (args) => <Cell {...args} initialContents={["blueplayer"]} />,
};

export const RedEnd: Story = {
  render: (args) => <Cell {...args} initialContents={["redend"]} />,
};

export const BlueEnd: Story = {
  render: (args) => <Cell {...args} initialContents={["blueend"]} />,
};

export const BothPlayers: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["redplayer", "blueplayer"]} />
  ),
};

export const RedPlayerRedEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["redplayer", "redend"]} />
  ),
};

export const BluePlayerBlueEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["blueplayer", "blueend"]} />
  ),
};

export const RedPlayerBlueEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["redplayer", "blueend"]} />
  ),
};

export const BluePlayerRedEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["blueplayer", "redend"]} />
  ),
};

export const BothPlayersRedEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["redplayer", "blueplayer", "redend"]} />
  ),
};

export const BothPlayersBlueEnd: Story = {
  render: (args) => (
    <Cell {...args} initialContents={["redplayer", "blueplayer", "blueend"]} />
  ),
};

export const AllCells: Story = {
  render: (args) => {
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <Cell {...args} initialContents={["redplayer"]} />
        <Cell {...args} initialContents={["blueplayer"]} />
        <Cell {...args} initialContents={["redend"]} />
        <Cell {...args} initialContents={["blueend"]} />
        <Cell {...args} initialContents={["redplayer", "blueplayer"]} />
        <Cell {...args} initialContents={["redplayer", "redend"]} />
        <Cell {...args} initialContents={["blueplayer", "blueend"]} />
        <Cell {...args} initialContents={["redplayer", "blueend"]} />
        <Cell {...args} initialContents={["blueplayer", "redend"]} />
        <Cell
          {...args}
          initialContents={["redplayer", "blueplayer", "redend"]}
        />
        <Cell
          {...args}
          initialContents={["redplayer", "blueplayer", "blueend"]}
        />
      </div>
    );
  },
};
