# Roadblocks

## Demo

See the app live: https://roadblocks.lunenetworks.com/

## Dependencies

- `node` (^v16.16.0)
- `pnpm` (^8.6.12)
- `react` (^18.2.0)
- `react-dom` (^18.2.0)
- `react-router-dom` (^6.14.2)
- `typescript` (^5.1.6)
- `webpack` (^5.88.1)

#### Development Dependencies

- `@storybook/react` (^7.0.26)
- `babel-loader` (^9.1.2)
- `ts-loader` (^9.4.4)

## Setup

Run `scripts\setup.cmd` to install and link all libraries.

#### Dependency Graph

```
Webapp --> Client --- +
                      |
                      + --> Types
                      |
Server --> Engine --- +
```

To abstract sections of the game and modify libraries as needed, `pnpm link` is used to link the different directories.

For each connection (marked with `A --> B`), the following steps are taken:

1. Go to directory B: `cd <path>/B`
2. Run `pnpm link -g`
3. Go to directory A: `cd <path>/A`
4. Run `pnpm link -g @roadblocks/B`

## Build

Run `scripts\build.cmd` to compile all libraries and run development versions of the **Webapp** and **Server**.

`pnpm build` runs development versions for **Webapp** and **Server** and compiles to tsc for the other libraries (**Client**, **Engine**, **Types**).
`pnpm start` runs production versions for **Webapp** and **Server**.

## Publishing Changes

Both the server and webapp are accessible at `https://roadblocks.lunenetworks.com/`.

To update changes, the server periodically pulls from the following branches:

- `release/server`: server running with ExpressJS that responds with `/api/<version>/...`
- `release/webapp`: main React Typescript app with browser interface

The only steps needed to push changes is to `git push` the `dist` directories from the `server` and `webapp` directories that were built following the steps from the previous section.

## Project Structure

### Webapp

- **Components**: Defines in-game elements such as cells, edges, and buttons.
- **Requests**: Makes requests to the **Client** and updates the local game upon success.
- **NPC**: Features an NPC object capable of playing autonomously.
- **Routing**: Establishes the webpage routing configuration.
- **Visual Assets**: Stores all visual assets like backgrounds and logos.

### Client

- **GameClient**: Specifies all in-game actions.
- **HTTP Requests**: Sends GET/POST requests to the **Server**.
- **Response Handling**: Communicates request results (success/failure) back to the **Webapp**.
- **Event Notifications**: Employs a client-side PubSub system for event notifications.

### Server

- **Configuration**: Establishes default port and routes detailing all in-game actions.
- **Session Management**: Contains the `SessionManager` responsible for maintaining and updating the list of ongoing games.
- **Game Processing**: Utilizes `GameServer` from **Engine** to create sessions and process game requests.
- **Response Handling**: Returns request outcomes (success/failure) to the **Client**.

### Engine

- **GameServer**:
  - **Initialization**: Initializes a new game.
  - **State Management**: Keeps track of the ongoing game's state.
  - **Game Logic**: Manages the game rules, identifies illegal moves, and determines win conditions. Executes asynchronously using Promises.
- **Pathfinder**: An object used for determining legal moves and assisting in NPC decision-making.
- **Event Notifications**: Features a server-side PubSub system for event notifications.

### Types

- **Board Object**: Utilized for representing game states and facilitating pathfinding.
- **Game Events**: Defines all possible game events.
- **Utilities**: Contains repeated utility functions.
- **Routing and Results**: Lists all server routes and respective `GameServer` results.
