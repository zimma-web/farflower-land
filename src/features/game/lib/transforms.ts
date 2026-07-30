import Decimal from "decimal.js-light";
import type { GameState, InventoryItemName } from "../types/game";
import { OFFLINE_FARM } from "./landData";

if (typeof (Number.prototype as any).toNumber !== "function") {
  (Number.prototype as any).toNumber = function () {
    return Number(this);
  };
}

export function safeDecimal(val: any): Decimal {
  if (val === undefined || val === null) return new Decimal(0);
  if (val instanceof Decimal) return val;
  if (typeof val === "number" || typeof val === "string")
    return new Decimal(val);
  if (typeof val === "object") {
    if (typeof val.toNumber === "function") return val;
    if (Array.isArray(val.d) && typeof val.d[0] === "number") {
      const s = val.s ?? 1;
      const e = val.e ?? 0;
      const d = val.d[0];
      return new Decimal(s * d * Math.pow(10, e));
    }
  }
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
}

import { OFFLINE_FARM } from "./landData";

/**
 * Converts API response into a game state
 */
export function makeGame(rawFarm: any): GameState {
  const farm = { ...OFFLINE_FARM, ...rawFarm };
  return {
    inventory: Object.keys(farm.inventory || {}).reduce(
      (items, item) => ({
        ...items,
        [item]: safeDecimal(farm.inventory[item]),
      }),
      {} as Record<InventoryItemName, Decimal>,
    ),
    previousInventory: Object.keys(farm.previousInventory || {}).reduce(
      (items, item) => ({
        ...items,
        [item]: safeDecimal(farm.previousInventory[item]),
      }),
      {} as Record<InventoryItemName, Decimal>,
    ),
    wardrobe: farm.wardrobe,
    calendar: farm.calendar,
    vip: farm.vip,
    previousWardrobe: farm.previousWardrobe,
    competitions: farm.competitions,
    verified: farm.verified,
    stock: Object.keys(farm.stock || {}).reduce(
      (items, item) => ({
        ...items,
        [item]: safeDecimal(farm.stock[item]),
      }),
      {} as Record<InventoryItemName, Decimal>,
    ),
    bounties: farm.bounties,
    island: farm.island,
    bank: farm.bank,
    home: farm.home,
    // Interior is a new, entirely separate placement surface. Seed it with an
    // empty ground level for any player coming back from the API who does not
    // yet have this field — the feature is front-end-only for v1 and they opt
    // in by placing items at /interior. We tolerate two legacy shapes:
    //   - `farm.interior` missing entirely → default to a fresh ground level
    //   - `farm.interior.collectibles` from an earlier prototype where data
    //     wasn't yet nested under .ground → migrate it under .ground.
    interior: farm.interior?.ground
      ? farm.interior
      : farm.interior?.collectibles
        ? { ground: { collectibles: farm.interior.collectibles } }
        : { ground: { collectibles: {} } },
    createdAt: farm.createdAt,
    stockExpiry: farm.stockExpiry || {},
    coins: farm.coins,
    balance: safeDecimal(farm.balance),
    previousBalance: safeDecimal(farm.previousBalance),
    username: farm.username,
    roninRewards: farm.roninRewards,
    settings: farm.settings,
    trades: farm.trades,
    farmHands: farm.farmHands,

    expansionConstruction: farm.expansionConstruction,
    expandedAt: farm.expandedAt,
    greenhouse: farm.greenhouse,
    choreBoard: farm.choreBoard,

    shipments: farm.shipments,
    gems: farm.gems,
    flower: farm.flower,
    bumpkin: farm.bumpkin,
    buildings: farm.buildings,
    fishing: farm.fishing ?? { wharf: {}, beach: {} },
    crabTraps: farm.crabTraps ?? { trapSpots: {} },
    farmActivity: farm.farmActivity ?? {},
    milestones: farm.milestones ?? {},
    airdrops: farm.airdrops,
    raffle: farm.raffle,
    collectibles: farm.collectibles,
    warCollectionOffer: farm.warCollectionOffer,
    mysteryPrizes: farm.mysteryPrizes,
    pumpkinPlaza: farm.pumpkinPlaza,
    dailyRewards: farm.dailyRewards,
    auctioneer: farm.auctioneer ?? {},
    minigames: farm.minigames,
    kingdomChores: farm.kingdomChores,
    buffs: farm.buffs,
    chores: farm.chores,
    tradedAt: farm.tradedAt,
    trees: farm.trees ?? {},
    stones: farm.stones ?? {},
    iron: farm.iron ?? {},
    gold: farm.gold ?? {},
    crimstones: farm.crimstones ?? {},
    oilReserves: farm.oilReserves ?? {},
    sunstones: farm.sunstones ?? {},
    ascensionCrystals: farm.ascensionCrystals ?? {},
    crops: farm.crops ?? {},
    fruitPatches: farm.fruitPatches ?? {},
    flowers: farm.flowers ?? {},
    beehives: farm.beehives ?? {},
    conversations: farm.conversations ?? [],
    mailbox: farm.mailbox ?? {
      read: [],
      unread: [],
    },
    mushrooms: farm.mushrooms,
    delivery: farm.delivery,
    potionHouse: farm.potionHouse,
    npcs: farm.npcs,
    buds: farm.buds,
    flowerShop: farm.flowerShop,
    specialEvents: farm.specialEvents,
    floatingIsland: farm.floatingIsland,
    megastore: farm.megastore,
    goblinMarket: farm.goblinMarket,
    faction: farm.faction,
    previousFaction: farm.previousFaction,
    dailyFactionDonationRequest: farm.dailyFactionDonationRequest
      ? {
          resource: farm.dailyFactionDonationRequest.resource,
          amount: new Decimal(farm.dailyFactionDonationRequest.amount),
        }
      : undefined,
    desert: farm.desert,
    transaction: farm.transaction,
    henHouse: farm.henHouse,
    barn: farm.barn,
    waterWell: farm.waterWell,
    agingShed: farm.agingShed,
    petHouse: farm.petHouse,
    craftingBox: farm.craftingBox,
    season: farm.season,
    lavaPits: farm.lavaPits,
    nfts: farm.nfts,
    faceRecognition: farm.faceRecognition,
    telegram: farm.telegram,
    discord: farm.discord,
    socialTasks: farm.socialTasks,
    referrals: farm.referrals,
    twitter: farm.twitter,
    ban: farm.ban,
    rewardBoxes: farm.rewardBoxes,
    withdrawals: farm.withdrawals,
    aoe: farm.aoe,
    boostsUsedAt: farm.boostsUsedAt,
    boostHistory: farm.boostHistory,
    socialFarming: farm.socialFarming,
    pets: farm.pets,
    prototypes: farm.prototypes,
    saltFarm: farm.saltFarm ?? { level: 0, nodes: {} },
    sculptures: farm.sculptures,
    layouts: farm.layouts,
  };
}
