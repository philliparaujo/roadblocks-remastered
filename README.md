# Roadblocks

## Requirements

- node (> v16)
- pnpm

## Setup

Run `scripts\setup.cmd` to install and link libraries

## Build

    scripts\build.cmd

# Project Structure

## Webapp

- **Components**: Defines in-game elements such as cells, edges, and buttons.
- **Requests**: Makes requests to the **Client** and updates the local game upon success.
- **NPC**: Features an NPC object capable of playing autonomously.
- **Routing**: Establishes the webpage routing configuration.
- **Visual Assets**: Stores all visual assets like backgrounds and logos.

## Client

- **GameClient**: Specifies all in-game actions.
- **HTTP Requests**: Sends GET/POST requests to the **Server**.
- **Response Handling**: Communicates request results (success/failure) back to the **Webapp**.
- **Event Notifications**: Employs a client-side PubSub system for event notifications.

## Server

- **Configuration**: Establishes default port and routes detailing all in-game actions.
- **Session Management**: Contains the `SessionManager` responsible for maintaining and updating the list of ongoing games.
- **Game Processing**: Utilizes `GameServer` from **Engine** to create sessions and process game requests.
- **Response Handling**: Returns request outcomes (success/failure) to the **Client**.

## Engine

- **GameServer**:
  - **Initialization**: Initializes a new game.
  - **State Management**: Keeps track of the ongoing game's state.
  - **Game Logic**: Manages the game rules, identifies illegal moves, and determines win conditions. Executes asynchronously using Promises.
- **Pathfinder**: An object used for determining legal moves and assisting in NPC decision-making.
- **Event Notifications**: Features a server-side PubSub system for event notifications.

## Types

- **Board Object**: Utilized for representing game states and facilitating pathfinding.
- **Game Events**: Defines all possible game events.
- **Utilities**: Contains repeated utility functions.
- **Routing and Results**: Lists all server routes and respective `GameServer` results.
