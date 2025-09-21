"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast, Toaster } from "sonner"
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { initializeApp } from "@firebase/app"
import { ArrowLeft } from "lucide-react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./BurnPage.css"; // Ensure this file is in your project


const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, (match, letter, index) => (index > 0 ? `_${letter.toLowerCase()}` : letter.toLowerCase()))
    .toLowerCase()
}

const isResourceKey = (value: string): value is ResourceKey => {
  return [
    "ice",
    "co2",
    "water",
    "halite",
    "emptyPowerCell",
    "fullPowerCell",
    "brokenPowerCell",
    "crystalOre",
    "rareEarths",
    "purifiedWater",
    "plasmaFluid",
    "quantumCells",
    "energyCores",
    "biofiber",
    "sporeEssence",
    "alloyIngots",
    "nanosteel",
    "catalysts",
    "polymers",
    "spareParts",
    "circuitBoards",
    "tradeContracts",
    "marketTokens",
    "processedGems",
    "exoticCrystals",
    "hydrogenFuel",
    "fusionFluid",
    "plasmaCores",
    "antimatterCells",
    "bioPolymers",
    "nanoOrganics",
    "superAlloys",
    "metaMaterials",
    "nanoCatalysts",
    "quantumChemicals",
    "advancedComponents",
    "roboticModules",
    "cryptoCredits",
    "galacticBonds",
    "solarPanel",
    "ionThruster",
    "lifeSupportModule",
    "quantumDrive",
    "nanoAssembler",
    "bioCircuit",
    "crystalMatrix",
    "hydroCore",
    "tradeBeacon",
    "gravitonShield",
    "neuralInterface",
    "antimatterWarhead",
    "holoProjector",
    "bioReactorCore",
  ].includes(value as ResourceKey)
}

const resourceDisplayNameMap: Record<ResourceKey, string> = {
  ice: "Ice",
  co2: "CO2",
  water: "Water",
  halite: "Halite",
  emptyPowerCell: "Empty Power Cell",
  fullPowerCell: "Full Power Cell",
  brokenPowerCell: "Broken Power Cell",
  crystalOre: "Crystal Ore",
  rareEarths: "Rare Earths",
  purifiedWater: "Purified Water",
  plasmaFluid: "Plasma Fluid",
  quantumCells: "Quantum Cells",
  energyCores: "Energy Cores",
  biofiber: "Biofiber",
  sporeEssence: "Spore Essence",
  alloyIngots: "Alloy Ingots",
  nanosteel: "Nanosteel",
  catalysts: "Catalysts",
  polymers: "Polymers",
  spareParts: "Spare Parts",
  circuitBoards: "Circuit Boards",
  tradeContracts: "Trade Contracts",
  marketTokens: "Market Tokens",
  processedGems: "Processed Gems",
  exoticCrystals: "Exotic Crystals",
  hydrogenFuel: "Hydrogen Fuel",
  fusionFluid: "Fusion Fluid",
  plasmaCores: "Plasma Cores",
  antimatterCells: "Antimatter Cells",
  bioPolymers: "Bio Polymers",
  nanoOrganics: "Nano Organics",
  superAlloys: "Super Alloys",
  metaMaterials: "Meta Materials",
  nanoCatalysts: "Nano Catalysts",
  quantumChemicals: "Quantum Chemicals",
  advancedComponents: "Advanced Components",
  roboticModules: "Robotic Modules",
  cryptoCredits: "Crypto Credits",
  galacticBonds: "Galactic Bonds",
  solarPanel: "Solar Panel",
  ionThruster: "Ion Thruster",
  lifeSupportModule: "Life Support Module",
  quantumDrive: "Quantum Drive",
  nanoAssembler: "Nano Assembler",
  bioCircuit: "Bio Circuit",
  crystalMatrix: "Crystal Matrix",
  hydroCore: "Hydro Core",
  tradeBeacon: "Trade Beacon",
  gravitonShield: "Graviton Shield",
  neuralInterface: "Neural Interface",
  antimatterWarhead: "Antimatter Warhead",
  holoProjector: "Holo Projector",
  bioReactorCore: "Bio Reactor Core",
}

type ResourceKey =
  | "ice"
  | "co2"
  | "water"
  | "halite"
  | "emptyPowerCell"
  | "fullPowerCell"
  | "brokenPowerCell"
  | "crystalOre"
  | "rareEarths"
  | "purifiedWater"
  | "plasmaFluid"
  | "quantumCells"
  | "energyCores"
  | "biofiber"
  | "sporeEssence"
  | "alloyIngots"
  | "nanosteel"
  | "catalysts"
  | "polymers"
  | "spareParts"
  | "circuitBoards"
  | "tradeContracts"
  | "marketTokens"
  | "processedGems"
  | "exoticCrystals"
  | "hydrogenFuel"
  | "fusionFluid"
  | "plasmaCores"
  | "antimatterCells"
  | "bioPolymers"
  | "nanoOrganics"
  | "superAlloys"
  | "metaMaterials"
  | "nanoCatalysts"
  | "quantumChemicals"
  | "advancedComponents"
  | "roboticModules"
  | "cryptoCredits"
  | "galacticBonds"
  | "solarPanel"
  | "ionThruster"
  | "lifeSupportModule"
  | "quantumDrive"
  | "nanoAssembler"
  | "bioCircuit"
  | "crystalMatrix"
  | "hydroCore"
  | "tradeBeacon"
  | "gravitonShield"
  | "neuralInterface"
  | "antimatterWarhead"
  | "holoProjector"
  | "bioReactorCore";

interface TraitResourceMap {
  [key: string]: { [key: string]: ResourceKey }; // Index signature for dynamic access
  Mouth: {
    VIOLET_LIPS: ResourceKey;
    RED_LIPS: ResourceKey;
    NORMAL_BEARD: ResourceKey;
    DRACULA: ResourceKey;
    PIPE: ResourceKey;
    BLACK_BEARD: ResourceKey;
    MUSTACHE: ResourceKey;
    FRONT_BEARD: ResourceKey;
    MUTTONCHOPS: ResourceKey;
    HAPPY: ResourceKey;
    SAD: ResourceKey;
    GOAT: ResourceKey;
    CIGARETTE: ResourceKey;
    ONE_TEETH: ResourceKey;
    HANDLEBARS: ResourceKey;
    VAPE: ResourceKey;
    MEDICAL_MASK: ResourceKey;
  };
  Eyes: {
    HORNED_RIM_GLASSES: ResourceKey;
    THREE_D_GLASSES: ResourceKey;
    TOXIDO_MASK: ResourceKey;
    NERD_GLASSES: ResourceKey;
    CLASSIC_SHADES: ResourceKey;
    VR: ResourceKey;
    SMALL_EYES: ResourceKey;
    SMALL_SUN_GLASSES: ResourceKey;
    REGULAR_SHADES: ResourceKey;
    O0: ResourceKey;
    NORMAL: ResourceKey;
    VIOLET_SHADES: ResourceKey;
    EYE_PATCH: ResourceKey;
    CLOWN_EYES_BLUE: ResourceKey;
    CLOWN_EYES_GREEN: ResourceKey;
  };
  Hair: {
    PILOT_HELMET: ResourceKey;
    MOHAWK: ResourceKey;
    TIARA: ResourceKey;
    BANDANA: ResourceKey;
    THIEF: ResourceKey;
    HOODIE: ResourceKey;
    BITCOINER: ResourceKey;
    DO_RAG: ResourceKey;
    FRUMPY_HAIR: ResourceKey;
    STRINGY_HAIR: ResourceKey;
    MESSY_HAIR: ResourceKey;
    PEAK_SPIKE: ResourceKey;
    BACKWARDS_CAP: ResourceKey;
    CAP: ResourceKey;
    SHAVED_HEAD: ResourceKey;
    MOHAWK_DARK: ResourceKey;
    MOHAWK_THIN: ResourceKey;
    HEADBAND: ResourceKey;
    KNITTED_CAP: ResourceKey;
    WILD_HAIR: ResourceKey;
    FEDORA: ResourceKey;
    CLOWN_HAIR: ResourceKey;
    RASTA: ResourceKey;
    VIOLET_HAIR: ResourceKey;
    BEANIE: ResourceKey;
    POLICE_CAP: ResourceKey;
    CRAZY_HAIR: ResourceKey;
    TASSIE_HAT: ResourceKey;
  };
  Background: {
    BLUE_BG: ResourceKey;
    VIOLET_BG: ResourceKey;
    BLACK_BG: ResourceKey;
    RED_BG: ResourceKey;
    ORANGE_BG: ResourceKey;
    GREEN_BG: ResourceKey;
  };
  Body: {
    BLUE_UFO: ResourceKey;
    GOLD_UFO: ResourceKey;
    RED_UFO: ResourceKey;
    SILVER_UFO: ResourceKey;
    PINK_UFO: ResourceKey;
    GREEN_UFO: ResourceKey;
  };
  Accessory: {
    GOLD_CHAIN: ResourceKey;
    SILVER_CHAIN: ResourceKey;
    MOLE: ResourceKey;
    CLOWN_NOSE: ResourceKey;
    CHOKER: ResourceKey;
    EARRING: ResourceKey;
    FROWN: ResourceKey;
  };
}

interface NFTSkill {
  name: string
  level: number
  bonus: number
}

interface NFTLevelData {
  nftId: string
  exp: number
  level: number
  traits: { [traitName: string]: string | number }
  skills: { [skillName: string]: NFTSkill }
  totalBonus: number
}

const resourceImageMap: Record<ResourceKey, string> = {
  ice: "/Ice3.png",
  emptyPowerCell: "/Battery_Empty.png",
  fullPowerCell: "/Battery_Full.png",
  brokenPowerCell: "/Battery_Broken.png",
  halite: "/Mineral.png",
  co2: "/co2.png",
  water: "/water.png",
  crystalOre: "/crystal_ore.png",
  rareEarths: "/rare_earths.png",
  processedGems: "/processed_gems.png",
  exoticCrystals: "/exotic_crystals.png",
  purifiedWater: "/purified_water.png",
  plasmaFluid: "/plasma_fluid.png",
  hydrogenFuel: "/hydrogen_fuel.png",
  fusionFluid: "/fusion_fluid.png",
  quantumCells: "/quantum_cells.png",
  energyCores: "/energy_cores.png",
  plasmaCores: "/plasma_cores.png",
  antimatterCells: "/antimatter_cells.png",
  biofiber: "/biofiber.png",
  sporeEssence: "/spore_essence.png",
  bioPolymers: "/bio_polymers.png",
  nanoOrganics: "/nano_organics.png",
  alloyIngots: "/alloy_ingots.png",
  nanosteel: "/nanosteel.png",
  superAlloys: "/super_alloys.png",
  metaMaterials: "/meta_materials.png",
  catalysts: "/catalysts.png",
  polymers: "/polymers.png",
  nanoCatalysts: "/nano_catalysts.png",
  quantumChemicals: "/quantum_chemicals.png",
  spareParts: "/spare_parts.png",
  circuitBoards: "/circuit_boards.png",
  advancedComponents: "/advanced_components.png",
  roboticModules: "/robotic_modules.png",
  tradeContracts: "/trade_contracts.png",
  marketTokens: "/market_tokens.png",
  cryptoCredits: "/crypto_credits.png",
  galacticBonds: "/galactic_bonds.png",
  solarPanel: "/solar_panel.png",
  ionThruster: "/ion_thruster.png",
  lifeSupportModule: "/life_support_module.png",
  quantumDrive: "/quantum_drive.png",
  nanoAssembler: "/nano_assembler.png",
  bioCircuit: "/bio_circuit.png",
  crystalMatrix: "/crystal_matrix.png",
  hydroCore: "/hydro_core.png",
  tradeBeacon: "/trade_beacon.png",
  gravitonShield: "/graviton_shield.png",
  neuralInterface: "/neural_interface.png",
  antimatterWarhead: "/antimatter_warhead.png",
  holoProjector: "/holo_projector.png",
  bioReactorCore: "/bio_reactor_core.png",
}

const traitResourceMap: TraitResourceMap = {
  Mouth: {
    VIOLET_LIPS: "crystalOre",
    RED_LIPS: "purifiedWater",
    NORMAL_BEARD: "quantumCells",
    DRACULA: "biofiber",
    PIPE: "alloyIngots",
    BLACK_BEARD: "catalysts",
    MUSTACHE: "spareParts",
    FRONT_BEARD: "halite",
    MUTTONCHOPS: "processedGems",
    HAPPY: "hydrogenFuel",
    SAD: "plasmaCores",
    GOAT: "bioPolymers",
    CIGARETTE: "superAlloys",
    ONE_TEETH: "nanoCatalysts",
    HANDLEBARS: "emptyPowerCell",
    VAPE: "cryptoCredits",
    MEDICAL_MASK: "galacticBonds",
  },
  Eyes: {
    HORNED_RIM_GLASSES: "rareEarths",
    THREE_D_GLASSES: "plasmaFluid",
    TOXIDO_MASK: "energyCores",
    NERD_GLASSES: "sporeEssence",
    CLASSIC_SHADES: "nanosteel",
    VR: "polymers",
    SMALL_EYES: "circuitBoards",
    SMALL_SUN_GLASSES: "marketTokens",
    REGULAR_SHADES: "exoticCrystals",
    O0: "fusionFluid",
    NORMAL: "antimatterCells",
    VIOLET_SHADES: "nanoOrganics",
    EYE_PATCH: "metaMaterials",
    CLOWN_EYES_BLUE: "quantumChemicals",
    CLOWN_EYES_GREEN: "roboticModules",
  },
  Hair: {
    PILOT_HELMET: "water",
    MOHAWK: "hydrogenFuel",
    TIARA: "plasmaCores",
    BANDANA: "bioPolymers",
    THIEF: "superAlloys",
    HOODIE: "nanoCatalysts",
    BITCOINER: "advancedComponents",
    DO_RAG: "cryptoCredits",
    FRUMPY_HAIR: "galacticBonds",
    STRINGY_HAIR: "solarPanel",
    MESSY_HAIR: "ionThruster",
    PEAK_SPIKE: "lifeSupportModule",
    BACKWARDS_CAP: "quantumDrive",
    CAP: "nanoAssembler",
    SHAVED_HEAD: "bioCircuit",
    MOHAWK_DARK: "crystalMatrix",
    MOHAWK_THIN: "hydroCore",
    HEADBAND: "tradeBeacon",
    KNITTED_CAP: "gravitonShield",
    WILD_HAIR: "neuralInterface",
    FEDORA: "antimatterWarhead",
    CLOWN_HAIR: "holoProjector",
    RASTA: "bioReactorCore",
    VIOLET_HAIR: "exoticCrystals",
    BEANIE: "fusionFluid",
    POLICE_CAP: "antimatterCells",
    CRAZY_HAIR: "co2",
    TASSIE_HAT: "metaMaterials",
  },
  Background: {
    BLUE_BG: "quantumCells",
    VIOLET_BG: "energyCores",
    BLACK_BG: "ice",
    RED_BG: "biofiber",
    ORANGE_BG: "sporeEssence",
    GREEN_BG: "alloyIngots",
  },
  Body: {
    BLUE_UFO: "catalysts",
    GOLD_UFO: "polymers",
    RED_UFO: "spareParts",
    SILVER_UFO: "circuitBoards",
    PINK_UFO: "tradeContracts",
    GREEN_UFO: "marketTokens",
  },
  Accessory: {
    GOLD_CHAIN: "processedGems",
    SILVER_CHAIN: "hydrogenFuel",
    MOLE: "plasmaCores",
    CLOWN_NOSE: "bioPolymers",
    CHOKER: "superAlloys",
    EARRING: "nanoCatalysts",
    FROWN: "advancedComponents",
  },
};

const traitNormalizationMap: { [rawValue: string]: string } = {
  // Mouth
  "Violet Lips": "VIOLET_LIPS",
  "Red Lips": "RED_LIPS",
  "Normal Beard": "NORMAL_BEARD",
  Dracula: "DRACULA",
  Pipe: "PIPE",
  "Black Beard": "BLACK_BEARD",
  Mustache: "MUSTACHE",
  "Front Beard": "FRONT_BEARD",
  Muttonchops: "MUTTONCHOPS",
  Happy: "HAPPY",
  Sad: "SAD",
  Goat: "GOAT",
  Cigarette: "CIGARETTE",
  "One Teeth": "ONE_TEETH",
  Handlebars: "HANDLEBARS",
  Vape: "VAPE",
  "Medical Mask": "MEDICAL_MASK",
  DefaultMouth: "DEFAULT_MOUTH",
  // Eyes
  "Horned Rim Glasses": "HORNED_RIM_GLASSES",
  "3D Glasses": "THREE_D_GLASSES",
  "Toxido Mask": "TOXIDO_MASK",
  "Nerd Glasses": "NERD_GLASSES",
  "Classic Shades": "CLASSIC_SHADES",
  VR: "VR",
  "Small Eyes": "SMALL_EYES",
  "Small Sun Glasses": "SMALL_SUN_GLASSES",
  "Regular Shades": "REGULAR_SHADES",
  O0: "O0",
  Normal: "NORMAL",
  "Violet Shades": "VIOLET_SHADES",
  "Eye Patch": "EYE_PATCH",
  "Clown Eyes Blue": "CLOWN_EYES_BLUE",
  "Clown Eyes Green": "CLOWN_EYES_GREEN",
  DefaultEyes: "DEFAULT_EYES",
  // Hair
  "Pilot Helmet": "PILOT_HELMET",
  Mohawk: "MOHAWK",
  Tiara: "TIARA",
  Bandana: "BANDANA",
  Thief: "THIEF",
  Hoodie: "HOODIE",
  Bitcoiner: "BITCOINER",
  "Do-rag": "DO_RAG",
  "Frumpy Hair": "FRUMPY_HAIR",
  "Stringy Hair": "STRINGY_HAIR",
  "Messy Hair": "MESSY_HAIR",
  "Peak Spike": "PEAK_SPIKE",
  "Backwards Cap": "BACKWARDS_CAP",
  Cap: "CAP",
  "Shaved Head": "SHAVED_HEAD",
  "Mohawk Dark": "MOHAWK_DARK",
  "Mohawk Thin": "MOHAWK_THIN",
  Headband: "HEADBAND",
  "Knitted Cap": "KNITTED_CAP",
  "Wild Hair": "WILD_HAIR",
  Fedora: "FEDORA",
  "Clown Hair": "CLOWN_HAIR",
  Rasta: "RASTA",
  "Violet Hair": "VIOLET_HAIR",
  Beanie: "BEANIE",
  "Police Cap": "POLICE_CAP",
  "Crazy Hair": "CRAZY_HAIR",
  "Tassie Hat": "TASSIE_HAT",
  DefaultHair: "DEFAULT_HAIR",
  // Background
  BlueBG: "BLUE_BG",
  VioletBG: "VIOLET_BG",
  BlackBG: "BLACK_BG",
  RedBG: "RED_BG",
  OrangeBG: "ORANGE_BG",
  GreenBG: "GREEN_BG",
  DefaultBG: "DEFAULT_BG",
  // Body
  "Blue UFO": "BLUE_UFO",
  "Gold UFO": "GOLD_UFO",
  "Red UFO": "RED_UFO",
  "Silver UFO": "SILVER_UFO",
  "Pink UFO": "PINK_UFO",
  "Green UFO": "GREEN_UFO",
  DefaultBody: "DEFAULT_BODY",
  // Accessory
  "Gold Chain": "GOLD_CHAIN",
  "Silver Chain": "SILVER_CHAIN",
  Mole: "MOLE",
  "Clown Nose": "CLOWN_NOSE",
  Choker: "CHOKER",
  Earring: "EARRING",
  Frown: "FROWN",
}

// Helper functions for EXP calculations
const getCumulativeExpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 32 * (Math.pow(2, level - 1) - 1);
};

const getExpRequiredForNextLevel = (level: number): number => {
  return 32 * Math.pow(2, level - 1);
};

const getExpProgressPercentage = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  const expForNextLevel = getExpRequiredForNextLevel(level);
  const expTowardNextLevel = Math.max(0, exp - baseExp);
  return (expTowardNextLevel / expForNextLevel) * 100;
};

const getExpTowardNextLevel = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  return Math.max(0, exp - baseExp);
};

const calculateSkillBonus = (
  skillLevel: number,
  traitValue: string | number,
  skillName: string,
  profession: string,
  outputResource: ResourceKey
): number => {
  let baseBonus = skillLevel * 0.001;
  let traitMultiplier = 1;

  const traitKey = Object.keys(traitResourceMap).find((key) =>
    Object.values(traitResourceMap[key]).includes(outputResource)
  );
  if (!traitKey) {
    console.warn(`[calculateSkillBonus] No trait key found for resource ${outputResource}`);
    return baseBonus;
  }

  // Convert traitValue to string for indexing
  const traitValueStr = typeof traitValue === "string" ? traitValue : String(traitValue);

  // Check if traitValue is a valid key
  if (!(traitValueStr in traitResourceMap[traitKey])) {
    console.warn(`[calculateSkillBonus] Invalid trait value ${traitValueStr} for trait ${traitKey}`);
    return baseBonus;
  }

  const resourceForTrait = traitResourceMap[traitKey][traitValueStr];
  if (resourceForTrait !== outputResource) {
    return baseBonus;
  }

  if (typeof traitValue === "number") {
    traitMultiplier = traitValue / 1000; // Normalize Rarity Rank (not used here)
  } else {
    const traitMap: { [key: string]: number } = {
      "Gold Chain": 1.1,
      "Silver Chain": 1.1,
      Mole: 1.1,
      "Clown Nose": 1.1,
      Choker: 1.3,
      Earring: 1.8,
      Frown: 1.8,
      BlueBG: 1.1,
      VioletBG: 1.3,
      BlackBG: 1.0,
      RedBG: 1.2,
      OrangeBG: 1.3,
      GreenBG: 1.3,
      DefaultBG: 1.0,
      "Blue UFO": 1.2,
      "Gold UFO": 1.5,
      "Red UFO": 1.5,
      "Silver UFO": 1.3,
      "Pink UFO": 1.3,
      "Green UFO": 1.3,
      DefaultBody: 1.0,
      "Horned Rim Glasses": 1.3,
      "3D Glasses": 1.3,
      "Toxido Mask": 1.3,
      "Nerd Glasses": 1.3,
      "Classic Shades": 1.2,
      VR: 1.2,
      "Small Eyes": 1.2,
      "Small Sun Glasses": 1.2,
      "Regular Shades": 1.2,
      O0: 1.2,
      Normal: 1.1,
      "Violet Shades": 1.1,
      "Eye Patch": 1.3,
      "Clown Eyes Blue": 1.4,
      "Clown Eyes Green": 1.3,
      DefaultEyes: 1.0,
      "Pilot Helmet": 1.8,
      Mohawk: 1.5,
      Tiara: 1.3,
      Bandana: 1.3,
      Thief: 1.8,
      Hoodie: 1.2,
      Bitcoiner: 1.2,
      "Do-rag": 1.2,
      "Frumpy Hair": 1.2,
      "Stringy Hair": 1.2,
      "Messy Hair": 1.2,
      "Peak Spike": 1.2,
      "Backwards Cap": 1.2,
      Cap: 1.5,
      "Shaved Head": 1.5,
      "Mohawk Dark": 1.5,
      "Mohawk Thin": 1.5,
      Headband: 1.5,
      "Knitted Cap": 1.5,
      "Wild Hair": 1.5,
      Fedora: 1.5,
      "Clown Hair": 1.8,
      Rasta: 1.8,
      "Violet Hair": 1.8,
      Beanie: 1.8,
      "Police Cap": 1.8,
      "Crazy Hair": 1.2,
      "Tassie Hat": 1.8,
      DefaultHair: 1.0,
      "Normal Beard": 1.3,
      Dracula: 1.5,
      "Long Beard": 1.3,
      Pipe: 1.2,
      "Black Beard": 1.3,
      Mustache: 1.3,
      "Front Beard": 1.3,
      Muttonchops: 1.3,
      Happy: 1.3,
      Sad: 1.3,
      Goat: 1.5,
      Cigarette: 1.5,
      "One Teeth": 1.3,
      "Red Lips": 1.5,
      "Violet Lips": 1.5,
      Handlebars: 1.5,
      Vape: 1.5,
      "Medical Mask": 1.5,
      DefaultMouth: 1.0,
      None: 1.0,
    };
    traitMultiplier = traitMap[traitValue as string] || 1.0;
  }
  return baseBonus * traitMultiplier;
}

const calculateTotalBonus = (
  skills: { [skillName: string]: NFTSkill },
  traits: { [traitName: string]: string | number },
  profession: string,
  outputResource: ResourceKey
) => {
  return Object.entries(skills).reduce((total, [skillName, skill]) => {
    const resourceMatch = skillName.match(/(\w+) Efficiency/i);
    const resource = resourceMatch ? resourceMatch[1].toLowerCase() : null;
    if (!resource || !isResourceKey(resource) || resource !== outputResource) return total;

    const traitKey = Object.keys(traitResourceMap).find((key) =>
      Object.values(traitResourceMap[key as keyof TraitResourceMap]).includes(resource)
    ) as keyof TraitResourceMap | undefined;
    const traitValue = traitKey ? traits[traitKey] || "Default" : "Default";
    return total + calculateSkillBonus(skill.level, traitValue, skillName, profession, resource);
  }, 0);
}

export default function NFTScanner() {
  const [nftId, setNftId] = useState("")
  const [nftData, setNftData] = useState<NFTLevelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [firestore, setFirestore] = useState<any>(null)

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG)
      const db = getFirestore(app)
      setFirestore(db)
    } catch (error) {
      console.error("Error initializing Firebase:", error)
    }
  }, [])

 const fetchAndStoreNFTTraits = async (nftId: string): Promise<{
  traits: { [traitName: string]: string | number }
  skills: { [skillName: string]: NFTSkill }
}> => {
  try {
    const metadataUrl = `https://bafybeifwwp2yxmgi3nizlc674krzkloevnkfj3ohkievivh7dvfjfdauge.ipfs.nftstorage.link/${nftId}.json`
    console.log("[fetchAndStoreNFTTraits] Fetching traits from:", metadataUrl)

    const response = await fetch(metadataUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`)
    }
    const metadata = await response.json()

    let traits: { [traitName: string]: string | number } = {}
    if (metadata?.attributes && Array.isArray(metadata.attributes)) {
      metadata.attributes.forEach((attr: { trait_type: string; value: string | number }) => {
        const traitKey = attr.trait_type === "Accesory" ? "Accessory" : attr.trait_type
        const rawValue = typeof attr.value === "string" ? attr.value.trim() : attr.value
        const normalizedValue = traitNormalizationMap[rawValue] || rawValue.toString().toUpperCase().replace(/\s+/g, "_")
        traits[traitKey] = normalizedValue
      })
      console.log("[fetchAndStoreNFTTraits] Normalized traits:", traits)
    } else {
      console.warn("[fetchAndStoreNFTTraits] No attributes found in metadata for NFT:", nftId)
      traits = {
        Background: "DefaultBG",
        Body: "DefaultBody",
        Accessory: "None",
        Eyes: "DefaultEyes",
        Hair: "DefaultHair",
        Mouth: "DefaultMouth",
        "Rarity Rank": 1000,
      }
    }

    let skills: { [skillName: string]: NFTSkill } = {}
    let totalBonus = 0
    const validResources = new Set(Object.values(traitResourceMap).flatMap((map) => Object.values(map)))

    for (const [traitKey, traitValue] of Object.entries(traits)) {
      if (traitKey === "Rarity Rank") continue

      if (!(traitKey in traitResourceMap)) {
        console.log(`[fetchAndStoreNFTTraits] Invalid trait key ${traitKey}`)
        continue
      }

      // Convert traitValue to string for indexing
      const traitValueStr = typeof traitValue === "string" ? traitValue : String(traitValue)

      // Check if traitValue exists in the trait map
      if (!(traitValueStr in traitResourceMap[traitKey])) {
        console.log(`[fetchAndStoreNFTTraits] Invalid trait value ${traitValueStr} for trait ${traitKey}`)
        continue
      }

      const resource = traitResourceMap[traitKey][traitValueStr]
      if (!resource || !validResources.has(resource)) {
        console.log(`[fetchAndStoreNFTTraits] No valid resource mapped for trait ${traitKey}: ${traitValueStr}`)
        continue
      }

      const skillName = `${resource} Efficiency`
      if (skills[skillName]) {
        console.log(`[fetchAndStoreNFTTraits] Skill ${skillName} already exists, skipping duplicate`)
        continue
      }

      const bonus = calculateSkillBonus(0, traitValue, skillName, "Geologist", resource)
      skills[skillName] = {
        name: skillName,
        level: 0,
        bonus,
      }
      totalBonus += bonus
      console.log(`[fetchAndStoreNFTTraits] Added skill: ${skillName}, bonus: ${bonus}`)
    }

    const docRef = doc(firestore, "CryptoUFOs", nftId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log("[fetchAndStoreNFTTraits] Document exists, updating:", data)
      if (data.Skills && Object.keys(data.Skills).length > 0) {
        skills = data.Skills
        totalBonus = Object.entries(skills).reduce((sum, [skillName, skill]: [string, NFTSkill]) => {
          const resourceMatch = skillName.match(/(\w+) Efficiency/i)
          const resource = resourceMatch ? resourceMatch[1].toLowerCase() : null
          if (!resource || !isResourceKey(resource) || !validResources.has(resource)) return sum

          const matchingTraitKeys = Object.keys(traitResourceMap).filter((key) =>
            Object.values(traitResourceMap[key]).includes(resource)
          )
          let traitValue: string | number | null = null
          for (const key of matchingTraitKeys) {
            const resourceMap = traitResourceMap[key]
            const foundTraitValue = Object.keys(resourceMap).find(
              (val) => resourceMap[val] === resource
            )
            if (foundTraitValue && traits[key] === foundTraitValue) {
              traitValue = foundTraitValue
              break
            }
          }
          return sum + (traitValue ? calculateSkillBonus(skill.level, traitValue, skillName, "Geologist", resource) : 0)
        }, 0)

        if (JSON.stringify(data.Traits) !== JSON.stringify(traits)) {
          await updateDoc(docRef, {
            Traits: traits,
            TotalBonus: totalBonus,
            LastUpdated: serverTimestamp(),
          })
        }
      } else {
        await updateDoc(docRef, {
          Traits: traits,
          Skills: skills,
          TotalBonus: totalBonus,
          LastUpdated: serverTimestamp(),
        })
      }
    } else {
      await setDoc(docRef, {
        EXP: 0,
        LEVEL: 1,
        Traits: traits,
        Skills: skills,
        TotalBonus: totalBonus,
        LastUpdated: serverTimestamp(),
      })
    }

    console.log(`[fetchAndStoreNFTTraits] Stored NFT ${nftId} with skills:`, skills)
    return { traits, skills }
  } catch (error) {
    console.error(`[fetchAndStoreNFTTraits] Error for NFT ${nftId}:`, error)
    return { traits: {}, skills: {} }
  }
}

  const fetchNFTData = async () => {
    if (!firestore || !nftId) {
      return
    }

    if (!/^\d+$/.test(nftId)) {
      return
    }

    setIsLoading(true)
    try {
      const docRef = doc(firestore, "CryptoUFOs", nftId)
      let docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log("[fetchNFTData] Firebase data:", data)
        setNftData({
          nftId,
          exp: data.EXP || 0,
          level: data.LEVEL || 1,
          traits: data.Traits || {},
          skills: data.Skills || {},
          totalBonus: data.TotalBonus || 0,
        })
      } else {
        console.log("[fetchNFTData] No document in Firebase, fetching from IPFS for NFT:", nftId)
        const { traits, skills } = await fetchAndStoreNFTTraits(nftId)
        docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setNftData({
            nftId,
            exp: data.EXP || 0,
            level: data.LEVEL || 1,
            traits: data.Traits || traits,
            skills: data.Skills || skills,
            totalBonus: data.TotalBonus || 0,
          })

        } else {

          setNftData(null)
        }
      }
    } catch (error) {
      console.error("[fetchNFTData] Error fetching NFT data:", error)
      setNftData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNFTData()
  }

 return (
  <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white p-4 cypherpunk-loading-container">
    <Toaster richColors position="top-right" />
    <div className="max-w-2xl mx-auto">
      <Button
        onClick={() => (window.location.href = "/farm")}
        className="mb-4 cypherpunk-button cypherpunk-button-blue flex items-center gap-2 text-white border-none rounded-lg glow-hover"
        aria-label="Back to Game"
      >
        <ArrowLeft className="w-4 h-4 cypherpunk-icon-glow" />
        Back to Game
      </Button>

      <Card className="bg-[#1a1a1a]/95 cypherpunk-border rounded-xl shadow-2xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-[#ff00aa] mb-4 glitch-pulse">NFT Scanner</h1>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                value={nftId}
                onChange={(e) => setNftId(e.target.value)}
                placeholder="Enter NFT ID"
                className="bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg placeholder-[#00ffaa]/50 focus:ring-2 focus:ring-[#ff00aa] glow-hover"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="cypherpunk-button cypherpunk-button-green text-white rounded-lg glow-hover"
              >
                {isLoading ? "Scanning..." : "Scan NFT"}
              </Button>
            </div>
          </form>

          {nftData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {isLoading ? (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-md bg-[#2a2a2a] flex items-center justify-center cypherpunk-loading-container">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="cypherpunk-spinner"></div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-md">
                    <img
                      src={`https://bafybeigxxhol7amgewoep2falpmmdxsjshpceockpsbmyooutvknj5jkhy.ipfs.nftstorage.link//${nftData.nftId}`}
                      alt={`Crypto UFO #${nftData.nftId}`}
                      className="w-full h-full rounded-md object-cover cypherpunk-border"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-[#ff00aa] glitch-pulse">
                    Crypto UFO #{nftData.nftId}
                  </h2>
                  <p className="text-sm text-[#00ffaa]">Level: {nftData.level}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="cypherpunk-progress w-24 h-2">
                      <div
                        className="cypherpunk-progress-bar"
                        style={{ width: `${getExpProgressPercentage(nftData.exp, nftData.level)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-[#00ffaa]">
                      EXP: {getExpTowardNextLevel(nftData.exp, nftData.level)}/{getExpRequiredForNextLevel(nftData.level)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#00ffaa] glitch-pulse">Traits</h3>
                {Object.keys(nftData.traits).length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-[#00ffaa]">
                    {Object.entries(nftData.traits)
                      .filter(([trait]) => trait !== "Rarity Rank")
                      .map(([trait, value]) => (
                        <li key={trait}>
                          {trait}: {value}
                        </li>
                      ))}
                    {"Rarity Rank" in nftData.traits && (
                      <li key="Rarity Rank">
                        Rarity Rank: {nftData.traits["Rarity Rank"]}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[#00ffaa]/50">No traits available</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#00ffaa] glitch-pulse">Skills</h3>
                <p className="text-sm text-[#00ffaa]">Total Bonus: {(nftData.totalBonus * 100).toFixed(2)}%</p>
                {Object.keys(nftData.skills).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {Object.entries(nftData.skills).map(([skillName, skill]) => {
                      const resource = skillName.replace(" Efficiency", "") as ResourceKey;
                      return (
                        <div
                          key={skillName}
                          className="p-2 bg-[#2a2a2a]/60 cypherpunk-border rounded-md flex items-center gap-2 glow-hover"
                        >
                          <img
                            src={resourceImageMap[resource]}
                            alt={skillName}
                            className="w-8 h-8 object-contain cypherpunk-border"
                            onError={(e) => (e.currentTarget.src = "/images/resources/placeholder.png")}
                          />
                          <div>
                            <h4 className="text-base font-medium text-[#ff00aa]">{resourceDisplayNameMap[resource]} Efficiency</h4>
                            <p className="text-sm text-[#00ffaa]">Level: {skill.level}</p>
                            <p className="text-sm text-[#00ffaa]">Bonus: {(skill.bonus * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#00ffaa]/50">No skills assigned</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Analytics />
      <SpeedInsights />
    </div>
  </div>
);

}
