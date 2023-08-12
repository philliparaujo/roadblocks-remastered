const baseApi = "/api";

/* PubSub routes */
const pubSubRoute = `${baseApi}/pubsub`;

export const diceRollPubSubRoute = `${pubSubRoute}/dicerolls`;
export const playerMovedPubSubRoute = `${pubSubRoute}/playermoved`;
export const switchTurnPubSubRoute = `${pubSubRoute}/turnended`;
export const wallToggledPubSubRoute = `${pubSubRoute}/walltoggled`;
export const lockWallPubSubRoute = `${pubSubRoute}/lockwall`;
export const winGamePubSubRoute = `${pubSubRoute}/wingame`;
export const startGamePubSubRoute = `${pubSubRoute}/startgame`;
export const numWallChangesPubSubRoute = `${pubSubRoute}/numwallschanged`;
export const errorPubSubRoute = `${pubSubRoute}/error`;

/* API routes */
export const newGameRoute = `${baseApi}/newGame`;
export const joinGameRoute = `${baseApi}/joinGame`;
export const listGamesRoute = `${baseApi}/listGames`;

export const addEdgeRoute = `${baseApi}/addEdge`;
export const removeEdgeRoute = `${baseApi}/removeEdge`;
export const getWidthRoute = `${baseApi}/width`;
export const getHeightRoute = `${baseApi}/height`;
export const getCellLocationRoute = `${baseApi}/cellLocation`;
export const getWallLocationRoute = `${baseApi}/wallLocations`;
export const getDiceRoute = `${baseApi}/dice`;
export const getTurnRoute = `${baseApi}/turn`;
export const canEndTurnRoute = `${baseApi}/canEndTurn`;
export const pathExistsRoute = `${baseApi}/pathExists`;
export const lockWallsRoute = `${baseApi}/lockWalls`;
export const switchTurnRoute = `${baseApi}/switchTurn`;
export const setPlayerLocationRoute = `${baseApi}/setPlayerLocation`;
export const rollDiceRoute = `${baseApi}/rollDice`;
export const resetTurnRoute = `${baseApi}/resetTurn`;
export const errorRoute = `${baseApi}/error`;
