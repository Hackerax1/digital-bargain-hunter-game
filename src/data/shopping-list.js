export const PET_ITEM_IDS = ["cat", "dog", "fish", "lizard", "parrot", "rabbit"];

export const SHOPPING_LIST_TEMPLATE = [
  { itemId: "armchair", name: "Armchair", purchased: false },
  { itemId: "bed", name: "Bed", purchased: false },
  { itemId: "blender", name: "Blender", purchased: false },
  { itemId: "clock", name: "Clock", purchased: false },
  { itemId: "clothes_dryer", name: "Clothes Dryer", purchased: false },
  { itemId: "dishwasher", name: "Dishwasher", purchased: false },
  { itemId: "dresser", name: "Dresser", purchased: false },
  { itemId: "iron", name: "Iron", purchased: false },
  { itemId: "kitchen_set", name: "Kitchen Set", purchased: false },
  { itemId: "lamp", name: "Lamp", purchased: false },
  { itemId: "radio", name: "Radio", purchased: false },
  { itemId: "refrigerator", name: "Refrigerator", purchased: false },
  { itemId: "sofa", name: "Sofa", purchased: false },
  { itemId: "stove", name: "Stove", purchased: false },
  { itemId: "television", name: "Television", purchased: false },
  { itemId: "toaster", name: "Toaster", purchased: false },
  { itemId: "washing_machine", name: "Washing Machine", purchased: false },
  {
    itemId: "pet_slot_1",
    name: "Pet 1 (any unique species)",
    purchased: false,
    isPetSlot: true,
  },
  {
    itemId: "pet_slot_2",
    name: "Pet 2 (different species)",
    purchased: false,
    isPetSlot: true,
  },
];

export function createShoppingListFromTemplate() {
  return SHOPPING_LIST_TEMPLATE.map((item) => ({ ...item }));
}
