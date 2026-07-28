import type { Store } from "../types";

/**
 * Item IDs derived from src/data/stores.md.
 */
export const ITEM_IDS = [
  "armchair",
  "bed",
  "clock",
  "dresser",
  "kitchen_set",
  "lamp",
  "sofa",
  "blender",
  "clothes_dryer",
  "dishwasher",
  "iron",
  "radio",
  "refrigerator",
  "stove",
  "television",
  "toaster",
  "washing_machine",
  "cat",
  "dog",
  "fish",
  "lizard",
  "parrot",
  "rabbit",
] as const;

export type ItemId = (typeof ITEM_IDS)[number];

/**
 * Five stores x four price cards each.
 */
export const stores: Store[] = [
  {
    id: "dept_a",
    name: "Department Store Olive",
    colorGroup: "deptA",
    priceDeck: [
      {
        id: "dept_a_price_1",
        label: "Card 1",
        prices: {
          blender: 25,
          clothes_dryer: 325,
          dishwasher: 300,
          iron: 30,
          radio: 40,
          refrigerator: 525,
          stove: 375,
          television: 200,
          toaster: 35,
          washing_machine: 375,
        },
      },
      {
        id: "dept_a_price_2",
        label: "Card 2",
        prices: {
          blender: 35,
          clothes_dryer: 300,
          dishwasher: 375,
          iron: 45,
          radio: 35,
          refrigerator: 550,
          stove: 300,
          television: 150,
          toaster: 50,
          washing_machine: 350,
        },
      },
      {
        id: "dept_a_price_3",
        label: "Card 3",
        prices: {
          blender: 20,
          clothes_dryer: 350,
          dishwasher: 350,
          iron: 40,
          radio: 30,
          refrigerator: 575,
          stove: 325,
          television: 250,
          toaster: 45,
          washing_machine: 425,
        },
      },
      {
        id: "dept_a_price_4",
        label: "Card 4",
        prices: {
          blender: 30,
          clothes_dryer: 375,
          dishwasher: 325,
          iron: 35,
          radio: 45,
          refrigerator: 500,
          stove: 350,
          television: 100,
          toaster: 40,
          washing_machine: 400,
        },
      },
    ],
  },

  {
    id: "dept_b",
    name: "Department Store Purple",
    colorGroup: "deptB",
    priceDeck: [
      {
        id: "dept_b_price_1",
        label: "Card 1",
        prices: {
          blender: 55,
          clothes_dryer: 400,
          dishwasher: 250,
          iron: 25,
          radio: 15,
          refrigerator: 450,
          stove: 400,
          television: 350,
          toaster: 30,
          washing_machine: 450,
        },
      },
      {
        id: "dept_b_price_2",
        label: "Card 2",
        prices: {
          blender: 40,
          clothes_dryer: 450,
          dishwasher: 225,
          iron: 20,
          radio: 10,
          refrigerator: 425,
          stove: 475,
          television: 450,
          toaster: 15,
          washing_machine: 525,
        },
      },
      {
        id: "dept_b_price_3",
        label: "Card 3",
        prices: {
          blender: 50,
          clothes_dryer: 475,
          dishwasher: 200,
          iron: 10,
          radio: 20,
          refrigerator: 475,
          stove: 450,
          television: 400,
          toaster: 20,
          washing_machine: 500,
        },
      },
      {
        id: "dept_b_price_4",
        label: "Card 4",
        prices: {
          blender: 45,
          clothes_dryer: 425,
          dishwasher: 275,
          iron: 15,
          radio: 25,
          refrigerator: 400,
          stove: 425,
          television: 300,
          toaster: 25,
          washing_machine: 475,
        },
      },
    ],
  },

  {
    id: "furn_a",
    name: "Furniture Store Green",
    colorGroup: "furnA",
    priceDeck: [
      {
        id: "furn_a_price_1",
        label: "Card 1",
        prices: {
          armchair: 250,
          bed: 250,
          clock: 70,
          dresser: 275,
          kitchen_set: 650,
          lamp: 100,
          sofa: 350,
        },
      },
      {
        id: "furn_a_price_2",
        label: "Card 2",
        prices: {
          armchair: 225,
          bed: 200,
          clock: 60,
          dresser: 300,
          kitchen_set: 625,
          lamp: 70,
          sofa: 450,
        },
      },
      {
        id: "furn_a_price_3",
        label: "Card 3",
        prices: {
          armchair: 275,
          bed: 100,
          clock: 80,
          dresser: 250,
          kitchen_set: 675,
          lamp: 80,
          sofa: 400,
        },
      },
      {
        id: "furn_a_price_4",
        label: "Card 4",
        prices: {
          armchair: 200,
          bed: 150,
          clock: 50,
          dresser: 325,
          kitchen_set: 700,
          lamp: 90,
          sofa: 300,
        },
      },
    ],
  },

  {
    id: "furn_b",
    name: "Furniture Store Blue",
    colorGroup: "furnB",
    priceDeck: [
      {
        id: "furn_b_price_1",
        label: "Card 1",
        prices: {
          armchair: 350,
          bed: 350,
          clock: 20,
          dresser: 150,
          kitchen_set: 500,
          lamp: 30,
          sofa: 600,
        },
      },
      {
        id: "furn_b_price_2",
        label: "Card 2",
        prices: {
          armchair: 375,
          bed: 450,
          clock: 30,
          dresser: 200,
          kitchen_set: 200,
          lamp: 40,
          sofa: 650,
        },
      },
      {
        id: "furn_b_price_3",
        label: "Card 3",
        prices: {
          armchair: 300,
          bed: 300,
          clock: 40,
          dresser: 175,
          kitchen_set: 600,
          lamp: 60,
          sofa: 500,
        },
      },
      {
        id: "furn_b_price_4",
        label: "Card 4",
        prices: {
          armchair: 325,
          bed: 400,
          clock: 10,
          dresser: 225,
          kitchen_set: 450,
          lamp: 50,
          sofa: 550,
        },
      },
    ],
  },

  {
    id: "pets",
    name: "Pet Store Yellow",
    colorGroup: "pets",
    priceDeck: [
      {
        id: "pets_price_1",
        label: "Card 1",
        prices: {
          cat: 150,
          dog: 200,
          fish: 50,
          lizard: 45,
          parrot: 100,
          rabbit: 35,
        },
      },
      {
        id: "pets_price_2",
        label: "Card 2",
        prices: {
          cat: 100,
          dog: 150,
          fish: 75,
          lizard: 85,
          parrot: 300,
          rabbit: 25,
        },
      },
      {
        id: "pets_price_3",
        label: "Card 3",
        prices: {
          cat: 75,
          dog: 250,
          fish: 100,
          lizard: 25,
          parrot: 400,
          rabbit: 15,
        },
      },
      {
        id: "pets_price_4",
        label: "Card 4",
        prices: {
          cat: 50,
          dog: 100,
          fish: 125,
          lizard: 65,
          parrot: 200,
          rabbit: 45,
        },
      },
    ],
  },
];

/** Convenience: look up a store by id */
export function getStore(id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}

/** Return the currently active price card for a store */
export function activePrice(store: Store): Store["priceDeck"][0] {
  return store.priceDeck[0];
}

/** Rotate the top price card to the back (Sale! mechanic) */
export function rotatePriceDeck(store: Store): Store {
  const [top, ...rest] = store.priceDeck;
  return { ...store, priceDeck: [...rest, top] };
}
