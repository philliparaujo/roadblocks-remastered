/* PubSub routes */
const pubSubRoute = "/pubsub";

export const diceRollPubSubRoute = `${pubSubRoute}/dicerolls`;
export const playerMovedPubSubRoute = `${pubSubRoute}/playermoved`;
export const switchTurnPubSubRoute = `${pubSubRoute}/turnended`;
export const wlalToggledPubSubRoute = `${pubSubRoute}/walltoggled`;
export const lockWallPubSubRoute = `${pubSubRoute}/lockwall`;
export const winGamePubSubRoute = `${pubSubRoute}/wingame`;
export const startGamePubSubRoute = `${pubSubRoute}/startgame`;
export const numWallChangesPubSubRoute = `${pubSubRoute}/numwallschanged`;

/* API routes */
export const newGameRoute = "/newGame";
export const joinGameRoute = "/joinGame";

export const addEdgeRoute = "/addEdge";
export const removeEdgeRoute = "/removeEdge";
export const getWidthRoute = "/width";
export const getHeightRoute = "/height";
export const getCellLocationRoute = "/cellLocation";
export const getWallLocationRoute = "/wallLocations";
export const getDiceRoute = "/dice";
export const getTurnRoute = "/turn";
export const canEndTurnRoute = "/canEndTurn";
export const pathExistsRoute = "/pathExists";
export const lockWallsRoute = "/lockWalls";
export const switchTurnRoute = "/switchTurn";
export const setPlayerLocationRoute = "/setPlayerLocation";
export const rollDiceRoute = "/rollDice";
