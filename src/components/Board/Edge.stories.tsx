import { Meta, StoryObj } from "@storybook/react";
import Edge, { EdgeProps } from "./Edge";
import instance from "../GameEngine/Game";
import { useEffect } from "react";

const meta: Meta<typeof Edge> = {
  component: Edge,
  /* Default args */
  args: {
    orientation: "horizontal",
    type: "normal",
    coord: { row: 0, col: 1 },
    debug: false,
  },
};

export default meta;
type Story = StoryObj<typeof Edge>;

const VerticalRender = (props: EdgeProps) => {
  useEffect(() => {
    instance.reset();
  }, []);

  return <Edge {...props} />;
};

const HorizontalRender = (props: EdgeProps) => {
  useEffect(() => {
    instance.reset();
    instance.switchTurn();
  }, []);

  return <Edge {...props} />;
};

// Vertical Edges
export const VerticalNormal: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    coord: { row: 1, col: 0 },
  },
};

export const VerticalNormalDebug: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    coord: { row: 1, col: 0 },
    debug: true,
  },
};

export const VerticalLocked: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    type: "locked",
    coord: { row: 1, col: 0 },
  },
};

export const VerticalLockedDebug: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    type: "locked",
    coord: { row: 1, col: 0 },
    debug: true,
  },
};

export const VerticalDisabled: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    type: "disabled",
    coord: { row: 1, col: 0 },
  },
};

export const VerticalDisabledDebug: Story = {
  render: VerticalRender,
  args: {
    orientation: "vertical",
    type: "disabled",
    coord: { row: 1, col: 0 },
    debug: true,
  },
};

// Horizontal Edges
export const HorizontalNormal: Story = {
  render: HorizontalRender,
};

export const HorizontalNormalDebug: Story = {
  render: HorizontalRender,
  args: {
    debug: true,
  },
};

export const HorizontalLocked: Story = {
  render: HorizontalRender,
  args: {
    type: "locked",
  },
};

export const HorizontalLockedDebug: Story = {
  render: HorizontalRender,
  args: {
    type: "locked",
    debug: true,
  },
};

export const HorizontalDisabled: Story = {
  render: HorizontalRender,
  args: {
    type: "disabled",
  },
};

export const HorizontalDisabledDebug: Story = {
  render: HorizontalRender,
  args: {
    type: "disabled",
    debug: true,
  },
};

// All Edges
export const AllVerticalEdges: Story = {
  render: () => {
    instance.reset();
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <Edge
          orientation="vertical"
          type="normal"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="normal"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="locked"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="locked"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="disabled"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="disabled"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
      </div>
    );
  },
};

export const AllHorizontalEdges: Story = {
  render: () => {
    instance.reset();
    instance.switchTurn();
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <Edge
          orientation="horizontal"
          type="normal"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="normal"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="locked"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="locked"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="disabled"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="disabled"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
      </div>
    );
  },
};

export const AllEdges: Story = {
  render: () => {
    instance.reset();
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <Edge
          orientation="vertical"
          type="normal"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="normal"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="locked"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="locked"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="disabled"
          debug={false}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="vertical"
          type="disabled"
          debug={true}
          coord={{ row: 1, col: 0 }}
        />
        <Edge
          orientation="horizontal"
          type="normal"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="normal"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="locked"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="locked"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="disabled"
          debug={false}
          coord={{ row: 0, col: 1 }}
        />
        <Edge
          orientation="horizontal"
          type="disabled"
          debug={true}
          coord={{ row: 0, col: 1 }}
        />
      </div>
    );
  },
};
