export const DEFAULT_FARM_STATE = {
  id: 1,
  balance: 0,
  coins: 50,
  createdAt: Date.now(),
  inventory: {
    "Sunflower Seed": 5,
    Market: 1,
    "Fire Pit": 1,
    Workbench: 1,
    "Basic Land": 3,
  },
  wardrobe: {},
  stock: {},
  chores: {
    chores: {},
    choresCompleted: 0,
    choresSkipped: 0,
  },
  crops: {
    "1": {
      createdAt: Date.now(),
      crop: {
        name: "Sunflower",
        plantedAt: Date.now() - 30000,
        amount: 1,
      },
      x: -2,
      y: 0,
    },
    "2": {
      createdAt: Date.now(),
      x: -1,
      y: 0,
    },
  },
  trees: {
    "1": {
      wood: { amount: 2, choppedAt: 0 },
      x: -3,
      y: 1,
    },
  },
  stones: {
    "1": {
      amount: 2,
      minedAt: 0,
      x: 2,
      y: 1,
    },
  },
  iron: {},
  gold: {},
  crimstones: {},
  oilReserves: {},
  sunstones: {},
  buildings: {
    Market: [
      { id: "1", coordinates: { x: 3, y: 3 }, readyAt: 0, createdAt: 0 },
    ],
    "Fire Pit": [
      { id: "2", coordinates: { x: 3, y: -2 }, readyAt: 0, createdAt: 0 },
    ],
    Workbench: [
      { id: "3", coordinates: { x: -3, y: -2 }, readyAt: 0, createdAt: 0 },
    ],
  },
  bumpkin: {
    id: 1,
    experience: 0,
    equipped: {
      body: "Beige Farmer Potion",
      hair: "Basic Hair",
      shirt: "Red Farmer Shirt",
      pants: "Farmer Overalls",
      shoes: "Black Farmer Boots",
      tool: "Farmer Pitchfork",
      background: "Farm Background",
    },
    activity: {},
  },
  island: {
    type: "spring",
  },
  conversations: [],
  mailbox: { read: [] },
  announcements: {},
};
