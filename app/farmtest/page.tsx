"use client"

import { Analytics } from "@vercel/analytics/next"
import React, { useState, memo, useEffect, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { StandardToastModal } from "@/components/StandardToastModal";
import { Activity, ZoomIn, ZoomOut, Eye, EyeOff, Ticket } from "lucide-react"
import { toast, Toaster } from "sonner"; // Add Toaster to imports
import { initializeApp } from "firebase/app"
import {  QueryDocumentSnapshot, DocumentData, DocumentReference } from "firebase/firestore";
import { getFirestore, collection, query, where, runTransaction, getDocs, doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { Play, Pause, Volume2,  ChevronUp, ChevronDown } from "lucide-react";
import { XCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { web3 } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction, VersionedTransaction, TransactionInstruction, TransactionMessage } from "@solana/web3.js"
import { useWallet, useConnection, ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { motion } from 'framer-motion';
import { sha256 } from "js-sha256" // Add this dependency for hashing
import "./BurnPage.css"; // Assuming you have a CSS file for styling
import "@solana/wallet-adapter-react-ui/styles.css"; // Required for WalletModalProvider
import {
  Pickaxe,
  Droplet,
  Zap,
  Sprout,
  Hammer,
  FlaskConical,
  Wrench,
  DollarSign,
  LucideIcon, // Add this import
  Store,
  Gift, // For Daily Claim
  UserCog, // For Profession
  Package, // For Inventory
  Image as LucideImage, // For Change PFP
  Edit, // For Change Name
  Send, // For Transfer UFOS
} from "lucide-react";
import { PhantomProvider, SolflareProvider } from "../../types/phantom";



const professionIcons: { [key: string]: LucideIcon } = {
  Geologist: Pickaxe, // Pickaxe for mining and earth sciences
  HydroEngineer: Droplet, // Droplet for water management
  PowerTechnician: Zap, // Lightning bolt for energy systems
  Botanist: Sprout, // Sprout for plant growth
  Metallurgist: Hammer, // Hammer for metal crafting
  Chemist: FlaskConical, // Flask for chemical processes
  Mechanic: Wrench, // Wrench for machinery
  Trader: DollarSign, // Dollar sign for commerce
};


// Firebase configuration from environment variables
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const API_BASE = "https://api-6sqflqpoba-uc.a.run.app";

// Game asset paths
const GAME_ASSETS = {
  background: "/Background.png",
  landMap: "/Landgg.png",
  batteryEmpty: "/Battery_Empty.png",
  batteryFull: "/Battery_Full.png",
  batteryBroken: "/Battery_Broken.png",
  batteryCharging: "/charging1.png",
  ice: "/Ice3.png",
  co2: "/co2.png",
  rocket: "/rocket.png",
  water: "/water.png",
  mineral: "/Mineral.png",
  coin: "/Coin_Anim.gif",
  powerCellCharger: "/PowerCellCharger.png",
  market: "/Marketgg.png",
  cad: "/cad.png",
  iceMiner: "/Ice_Miner.png",
  workshop: "/workshop.png",
  waterFilter: "/waterfilter.png",
  crown: "/crown.png",
  inventory: "/inventory.png",
  claim: "/claim.png",
  marketBg: "/marketbg.png",
  labBg: "/labbg.png",
  ufoLogo: "/UFO_v3.gif",
  buy: "/buy.png",
  sell: "/sell.png",
  phantomIcon: "/phantom-icon.png",
  solflareIcon: "https://avatars.githubusercontent.com/u/89903469?s=200&v=4", // Add this line
  crystalMine: "crystal_mine.png",
  crystalRefinery: "crystal_refinery.png",
  advancedFilter: "advanced_filter.png",
  plasmaReactor: "plasma_extractor.png",
  quantumFoundry: "quantum_foundry.png",
  coreReactor: "core_reactor.png",
  biopolymerGreenhouse: "biopolymer_greenhouse.png",
  myceliumExtractor: "mycelium_extractor.png",
  smeltingForge: "smelting_forge.png",
  nanoForge: "nano_forge.png",
  chemicalSynthesizer: "chemical_synthesizer.png",
  polymerizationPlant: "polymerization_plant.png",
  assemblyWorkshop: "assembly_workshop.png",
  electronicsFabricator: "electronics_fabricator.png",
  commerceHub: "commerce_hub.png",
  tokenMinter: "token_minter.png",
  crystalOre: "/crystal_ore.png",
  rareEarths: "/rare_earths.png",
  processedGems: "/processed_gems.png", // Geologist
  exoticCrystals: "/exotic_crystals.png", // Geologist
  purifiedWater: "/purified_water.png",
  plasmaFluid: "/plasma_fluid.png",
  hydrogenFuel: "/hydrogen_fuel.png", // HydroEngineer
  fusionFluid: "/fusion_fluid.png", // HydroEngineer
  quantumCells: "/quantum_cells.png",
  energyCores: "/energy_cores.png",
  plasmaCores: "/plasma_cores.png", // PowerTechnician
  antimatterCells: "/antimatter_cells.png", // PowerTechnician
  biofiber: "/biofiber.png",
  sporeEssence: "/spore_essence.png",
  bioPolymers: "/bio_polymers.png", // Botanist
  nanoOrganics: "/nano_organics.png", // Botanist
  alloyIngots: "/alloy_ingots.png",
  nanosteel: "/nanosteel.png",
  superAlloys: "/super_alloys.png", // Metallurgist
  metaMaterials: "/meta_materials.png", // Metallurgist
  catalysts: "/catalysts.png",
  polymers: "/polymers.png",
  nanoCatalysts: "/nano_catalysts.png", // Chemist
  quantumChemicals: "/quantum_chemicals.png", // Chemist
  spareParts: "/spare_parts.png",
  circuitBoards: "/circuit_boards.png",
  advancedComponents: "/advanced_components.png", // Mechanic
  roboticModules: "/robotic_modules.png", // Mechanic
  tradeContracts: "/trade_contracts.png",
  marketTokens: "/market_tokens.png",
  cryptoCredits: "/crypto_credits.png", // Trader
  galacticBonds: "/galactic_bonds.png", // Trader
  gemProcessor: "/gem_processor.png", // Geologist
  crystalSynthesizer: "/crystal_synthesizer.png", // Geologist
  hydrogenExtractor: "/hydrogen_extractor.png", // HydroEngineer
  fusionPlant: "/fusion_plant.png", // HydroEngineer
  plasmaCoreFabricator: "/plasma_core_fabricator.png", // PowerTechnician
  antimatterGenerator: "/antimatter_generator.png", // PowerTechnician
  bioPolymerSynthesizer: "/bio_polymer_synthesizer.png", // Botanist
  nanoOrganicLab: "/nano_organic_lab.png", // Botanist
  superAlloyForge: "/super_alloy_forge.png", // Metallurgist
  metaMaterialSynthesizer: "/meta_material_synthesizer.png", // Metallurgist
  nanoCatalystLab: "/nano_catalyst_lab.png", // Chemist
  quantumChemSynthesizer: "/quantum_chem_synthesizer.png", // Chemist
  componentFabricator: "/component_fabricator.png", // Mechanic
  roboticsAssembler: "/robotics_assembler.png", // Mechanic
  cryptoExchange: "/crypto_exchange.png", // Trader
  bondIssuer: "/bond_issuer.png", // Trader
  interstellarFabricator: "/interstellar_fabricator.png",
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

const MODAL_DEBOUNCE_MS = 100;

const resources: Resource[] = [
  { name: "Empty Cells", key: "emptyPowerCell", image: GAME_ASSETS.batteryEmpty },
  { name: "Full Cells", key: "fullPowerCell", image: GAME_ASSETS.batteryFull },
  { name: "Broken Cells", key: "brokenPowerCell", image: GAME_ASSETS.batteryBroken },
  { name: "Ice", key: "ice", image: GAME_ASSETS.ice },
  { name: "Water", key: "water", image: GAME_ASSETS.water },
  { name: "Minerals", key: "halite", image: GAME_ASSETS.mineral },
  { name: "CO2", key: "co2", image: GAME_ASSETS.co2 },
  { name: "Crystal Ore", key: "crystalOre", image: GAME_ASSETS.crystalOre },
  { name: "Rare Earths", key: "rareEarths", image: GAME_ASSETS.rareEarths },
  { name: "Purified Water", key: "purifiedWater", image: GAME_ASSETS.purifiedWater },
  { name: "Plasma Fluid", key: "plasmaFluid", image: GAME_ASSETS.plasmaFluid },
  { name: "Quantum Cells", key: "quantumCells", image: GAME_ASSETS.quantumCells },
  { name: "Energy Cores", key: "energyCores", image: GAME_ASSETS.energyCores },
  { name: "Biofiber", key: "biofiber", image: GAME_ASSETS.biofiber },
  { name: "Spore Essence", key: "sporeEssence", image: GAME_ASSETS.sporeEssence },
  { name: "Alloy Ingots", key: "alloyIngots", image: GAME_ASSETS.alloyIngots },
  { name: "Nanosteel", key: "nanosteel", image: GAME_ASSETS.nanosteel },
  { name: "Catalysts", key: "catalysts", image: GAME_ASSETS.catalysts },
  { name: "Polymers", key: "polymers", image: GAME_ASSETS.polymers },
  { name: "Spare Parts", key: "spareParts", image: GAME_ASSETS.spareParts },
  { name: "Circuit Boards", key: "circuitBoards", image: GAME_ASSETS.circuitBoards },
  { name: "Trade Contracts", key: "tradeContracts", image: GAME_ASSETS.tradeContracts },
  { name: "Market Tokens", key: "marketTokens", image: GAME_ASSETS.marketTokens },
  { name: "Processed Gems", key: "processedGems", image: GAME_ASSETS.processedGems },
  { name: "Exotic Crystals", key: "exoticCrystals", image: GAME_ASSETS.exoticCrystals },
  { name: "Hydrogen Fuel", key: "hydrogenFuel", image: GAME_ASSETS.hydrogenFuel },
  { name: "Fusion Fluid", key: "fusionFluid", image: GAME_ASSETS.fusionFluid },
  { name: "Plasma Cores", key: "plasmaCores", image: GAME_ASSETS.plasmaCores },
  { name: "Antimatter Cells", key: "antimatterCells", image: GAME_ASSETS.antimatterCells },
  { name: "Bio Polymers", key: "bioPolymers", image: GAME_ASSETS.bioPolymers },
  { name: "Nano Organics", key: "nanoOrganics", image: GAME_ASSETS.nanoOrganics },
  { name: "Super Alloys", key: "superAlloys", image: GAME_ASSETS.superAlloys },
  { name: "Meta Materials", key: "metaMaterials", image: GAME_ASSETS.metaMaterials },
  { name: "Nano Catalysts", key: "nanoCatalysts", image: GAME_ASSETS.nanoCatalysts },
  { name: "Quantum Chemicals", key: "quantumChemicals", image: GAME_ASSETS.quantumChemicals },
  { name: "Advanced Components", key: "advancedComponents", image: GAME_ASSETS.advancedComponents },
  { name: "Robotic Modules", key: "roboticModules", image: GAME_ASSETS.roboticModules },
  { name: "Crypto Credits", key: "cryptoCredits", image: GAME_ASSETS.cryptoCredits },
  { name: "Galactic Bonds", key: "galacticBonds", image: GAME_ASSETS.galacticBonds },
  { name: "Solar Panel", key: "solarPanel", image: GAME_ASSETS.solarPanel },
  { name: "Ion Thruster", key: "ionThruster", image: GAME_ASSETS.ionThruster },
  { name: "Life Support Module", key: "lifeSupportModule", image: GAME_ASSETS.lifeSupportModule },
  { name: "Quantum Drive", key: "quantumDrive", image: GAME_ASSETS.quantumDrive },
  { name: "Nano Assembler", key: "nanoAssembler", image: GAME_ASSETS.nanoAssembler },
  { name: "Bio Circuit", key: "bioCircuit", image: GAME_ASSETS.bioCircuit },
  { name: "Crystal Matrix", key: "crystalMatrix", image: GAME_ASSETS.crystalMatrix },
  { name: "Hydro Core", key: "hydroCore", image: GAME_ASSETS.hydroCore },
  { name: "Trade Beacon", key: "tradeBeacon", image: GAME_ASSETS.tradeBeacon },
  { name: "Graviton Shield", key: "gravitonShield", image: GAME_ASSETS.gravitonShield },
  { name: "Neural Interface", key: "neuralInterface", image: GAME_ASSETS.neuralInterface },
  { name: "Antimatter Warhead", key: "antimatterWarhead", image: GAME_ASSETS.antimatterWarhead },
  { name: "Holo-Projector", key: "holoProjector", image: GAME_ASSETS.holoProjector },
  { name: "Bio-Reactor Core", key: "bioReactorCore", image: GAME_ASSETS.bioReactorCore },
];

// Add these constants at the top of the file, after the GAME_ASSETS definition
const API_URL = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db"
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb"
const PROGRAM_ID = new PublicKey("CzQLNvYoi8E9ymB6LPC9M9EX9H1hRavvFMAguRqSeRmb"); // Your program ID
const NETWORK = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db"; // Use mainnet-beta for production
const INTERSTELLAR_MARKETPLACE_URL = "https://www.cryptoufos.com/market";


// Inside CryptoUFOsGame component, add this state
interface ToastState {
  isOpen: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description: string | ToastContent[];
  duration?: number;
}

interface ToastContent {
  key: ResourceKey | "text";
  amount: number;
  text?: string; // Optional text field for non-resource messages
}


const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];


interface StandardToastModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description: string | ToastContent[];
  duration?: number; // Duration in milliseconds (0 or undefined for no auto-close)
}

const typeStyles = {
  success: {
    icon: <CheckCircle className="w-6 h-6 text-green-500" />,
    titleColor: "text-green-400",
    borderColor: "border-green-500",
  },
  error: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    titleColor: "text-red-400",
    borderColor: "border-red-500",
  },
  info: {
    icon: <Info className="w-6 h-6 text-blue-500" />,
    titleColor: "text-blue-400",
    borderColor: "border-blue-500",
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    titleColor: "text-yellow-300",
    borderColor: "border-yellow-500",
  },
};

// First, let's add a new interface for power cell slots and a function to determine available slots
// Add this after the determineUserTier function
interface PowerCellSlot {
  id: number
  isCharging: boolean
  isClaimable: boolean
  timeStamp: Date | null
}

interface NFTSkill {
  name: string; // e.g., "Mining Efficiency"
  level: number; // 0-10
  bonus: number; // Bonus multiplier (e.g., 0.05 per level)
}

interface NFTLevelData {
  nftId: string;
  exp: number;
  level: number;
  traits: { [traitName: string]: string | number };
  skills: { [skillName: string]: NFTSkill };
  totalBonus: number;
}

interface ProfessionSkill {
  level: number; // 0 (unlocked), 1, 2, or 3
  efficiencyBonus: number; // 0, 0.1, 0.2, or 0.3
}

interface ProgressItem {
  key: string; // Unique identifier (e.g., "scavenger", "CrystalMine", "powerCellSlot_0")
  progress: number; // Progress percentage (0-100)
  cycleHours: number; // Total duration in hours
  icon: string; // Image URL or icon component
  displayName: string; // Display name for the progress bar
}







type FabricatorOutputKey = "solarPanel" | "ionThruster" | "lifeSupportModule" | "quantumDrive"   | "nanoAssembler" 
| "bioCircuit"
| "crystalMatrix"
| "hydroCore"
| "tradeBeacon"
| "gravitonShield"
| "neuralInterface"
| "antimatterWarhead"
| "holoProjector"
| "bioReactorCore";

// Add this interface for clarity
interface MapSize {
  width: number;
  height: number;
}

// Add this interface near other interfaces
interface NotifiedActions {
  [key: string]: boolean; // e.g., "scavenger", "cad", "waterFilter", "workshop", "powerCellSlot_0", "CrystalMine"
}

interface Resource {
  name: string;
  key: ResourceKey;
  image: string;
}
interface FabricatorProduct extends Product {
  outputKey: FabricatorOutputKey;
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
  | "ufos"
  | "nanoAssembler"
  | "bioCircuit"
  | "crystalMatrix"
  | "hydroCore"
  | "tradeBeacon"
  | "gravitonShield"
  | "neuralInterface"
  | "antimatterWarhead"
  | "holoProjector"
  | "bioReactorCore"
  | "ufos";

  interface Product {
    name: string;
    requirements: Partial<Record<ResourceKey, number>>;
    cycleHours: number;
    output: Partial<Record<ResourceKey, number>>;
    currencyRequirements?: { ufos?: number }; // Optional field for currency costs
  }
interface ProgressItem {
  key: string; // Unique identifier (e.g., "scavenger", "CrystalMine", "powerCellSlot_0")
  progress: number; // Progress percentage (0-100)
  cycleHours: number; // Total duration in hours
  icon: string; // Image URL or icon component
  displayName: string; // Display name for the progress bar
}



// Function to determine how many power cell slots a user gets based on NFT count
function getPowerCellSlots(nftCount: number): number {
  if (nftCount >= 1000) return 33
  if (nftCount >= 950) return 32
  if (nftCount >= 900) return 31
  if (nftCount >= 850) return 30
  if (nftCount >= 800) return 29
  if (nftCount >= 750) return 28
  if (nftCount >= 700) return 27
  if (nftCount >= 650) return 26
  if (nftCount >= 600) return 25
  if (nftCount >= 550) return 24
  if (nftCount >= 500) return 23
  if (nftCount >= 450) return 22
  if (nftCount >= 400) return 21
  if (nftCount >= 350) return 20
  if (nftCount >= 300) return 19
  if (nftCount >= 250) return 18
  if (nftCount >= 200) return 17
  if (nftCount >= 150) return 16
  if (nftCount >= 140) return 15
  if (nftCount >= 130) return 14
  if (nftCount >= 120) return 13
  if (nftCount >= 110) return 12
  if (nftCount >= 100) return 11
  if (nftCount >= 90) return 10
  if (nftCount >= 80) return 9
  if (nftCount >= 70) return 8
  if (nftCount >= 60) return 7
  if (nftCount >= 50) return 6
  if (nftCount >= 40) return 5
  if (nftCount >= 30) return 4
  if (nftCount >= 20) return 3
  if (nftCount >= 10) return 2
  return 1
}

// Define the type for user data
interface UserData {
  wallet: string
  name: string
  nfts: number
  ufos: number
  emptyPowerCell: number
  fullPowerCell: number
  brokenPowerCell: number
  ice: number
  co2: number
  water: number
  halite: number
  chargingPowerCell: number
  claimableFullPowerCell: number
  scavengerWorking: number
  cadWorking: number
  scavengerWorkingEnd: number
  cadWorkingEnd: number
  chargingWaterFilter: number
  claimableWater: number
  chargingWorkShop: number
  claimableEmptyPowerCell: number
  timeStamp: Date | null
  timeStampScavenger: Date | null
  timeStampCad: Date | null
  timeStampW: Date | null
  timeStampS: Date | null
  timeStampDailyClaim: Date | null
  powerCellSlots: PowerCellSlot[]
  selectedNFT?: string | null // Add this field
  activeProfession: string | null; // e.g., "Geologist"
  professionSwitchTimestamp: Date | null;
  professions: {
    [key: string]: ProfessionSkill;
    Geologist: ProfessionSkill;
    HydroEngineer: ProfessionSkill;
    PowerTechnician: ProfessionSkill;
    Botanist: ProfessionSkill;
    Metallurgist: ProfessionSkill;
    Chemist: ProfessionSkill;
    Mechanic: ProfessionSkill;
    Trader: ProfessionSkill;
  }
    crystalOre: number;
    rareEarths: number;
    purifiedWater: number;
    plasmaFluid: number;
    quantumCells: number;
    energyCores: number;
    biofiber: number;
    sporeEssence: number;
    alloyIngots: number;
    nanosteel: number;
    catalysts: number;
    polymers: number;
    spareParts: number;
    circuitBoards: number;
    tradeContracts: number;
    marketTokens: number;
    solarPanel: number;
    ionThruster: number;
    lifeSupportModule: number;
    quantumDrive: number;
    processedGems: number;
    exoticCrystals: number;
    hydrogenFuel: number;
    fusionFluid: number;
    plasmaCores: number;
    antimatterCells: number;
    bioPolymers: number;
    nanoOrganics: number;
    superAlloys: number;
    metaMaterials: number;
    nanoCatalysts: number;
    quantumChemicals: number;
    advancedComponents: number;
    roboticModules: number;
    cryptoCredits: number;
    streakCount?: number; // Add this field for streak tracking
    galacticBonds: number;
  buildingLevels: {
    [key: string]: number; // e.g., "CrystalMine": 2
  };
  buildingTimestamps: {
    [key: string]: Date | null; // e.g., "CrystalMine": Date
  };
  buildingClaimables: {
    [key: string]: number; // e.g., "CrystalMine": 1
  };
  selectedFabricatorProduct: string | null; // Add this field
  claimableFabricatorProduct: string | null; // Add this field
  nanoAssembler: number;
  bioCircuit: number;
  crystalMatrix: number;
  hydroCore: number;
  tradeBeacon: number;
  gravitonShield: number;
  neuralInterface: number;
  antimatterWarhead: number;
  holoProjector: number;
  bioReactorCore: number;
}

interface ProgressBars {
  powerCell: number;
  scavenger: number;
  waterFilter: number;
  workshop: number;
  cad: number;
  [key: string]: number;

}


// Default user data
const defaultUserData: UserData = {
  wallet: "",
  name: "Guest",
  nfts: 0,
  ufos: 0,
  emptyPowerCell: 0,
  fullPowerCell: 0,
  brokenPowerCell: 0,
  ice: 0,
  co2: 0,
  water: 0,
  halite: 0,
  chargingPowerCell: 0,
  claimableFullPowerCell: 0,
  scavengerWorking: 0,
  cadWorking: 0,
  scavengerWorkingEnd: 0,
  cadWorkingEnd: 0,
  chargingWaterFilter: 0,
  claimableWater: 0,
  chargingWorkShop: 0,
  claimableEmptyPowerCell: 0,
  timeStamp: null,
  timeStampScavenger: null,
  timeStampCad: null,
  timeStampW: null,
  timeStampS: null,
  timeStampDailyClaim: null,
  powerCellSlots: [],
  selectedNFT: null, // Add this field
  activeProfession: null,
  professionSwitchTimestamp: null,
  professions: {
    Geologist: { level: 0, efficiencyBonus: 0 },
    HydroEngineer: { level: 0, efficiencyBonus: 0 },
    PowerTechnician: { level: 0, efficiencyBonus: 0 },
    Botanist: { level: 0, efficiencyBonus: 0 },
    Metallurgist: { level: 0, efficiencyBonus: 0 },
    Chemist: { level: 0, efficiencyBonus: 0 },
    Mechanic: { level: 0, efficiencyBonus: 0 },
    Trader: { level: 0, efficiencyBonus: 0 },
  },
  crystalOre: 0,
  rareEarths: 0,
  purifiedWater: 0,
  plasmaFluid: 0,
  quantumCells: 0,
  energyCores: 0,
  biofiber: 0,
  sporeEssence: 0,
  alloyIngots: 0,
  nanosteel: 0,
  catalysts: 0,
  polymers: 0,
  spareParts: 0,
  circuitBoards: 0,
  tradeContracts: 0,
  marketTokens: 0,
  buildingLevels: {},
  buildingTimestamps: {},
  buildingClaimables: {},
  processedGems: 0,
  exoticCrystals: 0,
  hydrogenFuel: 0,
  fusionFluid: 0,
  plasmaCores: 0,
  antimatterCells: 0,
  bioPolymers: 0,
  nanoOrganics: 0,
  superAlloys: 0,
  metaMaterials: 0,
  nanoCatalysts: 0,
  quantumChemicals: 0,
  advancedComponents: 0,
  roboticModules: 0,
  cryptoCredits: 0,
  galacticBonds: 0,
  solarPanel: 0,
  ionThruster: 0,
  lifeSupportModule: 0,
  quantumDrive: 0,
  selectedFabricatorProduct: null,
  streakCount: 0, // Add this field
  claimableFabricatorProduct: null, // Add this field
  nanoAssembler: 0,
  bioCircuit: 0,
  crystalMatrix: 0,
  hydroCore: 0,
  tradeBeacon: 0,
  gravitonShield: 0,
  neuralInterface: 0,
  antimatterWarhead: 0,
  holoProjector: 0,
  bioReactorCore: 0,
};

// For the first error, we need to define an interface for the asset items
// Add this interface before the fetchAssetsByGroup function:
interface AssetItem {
  ownership: {
    owner: string
  }
  [key: string]: any // For other properties we're not explicitly using
}

async function fetchAssetsByGroup(collectionAddress: string, publicKey: string) {
  try {
    let page = 1;
    let totalCount = 0; // Accumulate count without storing full list

    while (true) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "searchAssets",
          params: {
            ownerAddress: publicKey,
            grouping: ["collection", collectionAddress],
            burnt: false,
            tokenType: "nonFungible",
            page: page,
            limit: 1000,
          },
        }),
      });

      const { result } = await response.json();
      console.log("result", result);
      if (result && result.items) {
        totalCount += result.items.length;
      }

      if (result.items.length < 1000) {
        break;
      }

      page++;
    }

    return totalCount;
  } catch (error) {
    console.error("Error fetching assets by search:", error);
    return 0;
  }
}

const buildingProfessionMap: { [key: string]: string } = {
  CrystalMine: "Geologist",
  CrystalRefinery: "Geologist",
  AdvancedFilter: "HydroEngineer",
  PlasmaReactor: "HydroEngineer",
  QuantumFoundry: "PowerTechnician",
  CoreReactor: "PowerTechnician",
  BiopolymerGreenhouse: "Botanist",
  MyceliumExtractor: "Botanist",
  SmeltingForge: "Metallurgist",
  Nanoforge: "Metallurgist",
  ChemicalSynthesizer: "Chemist",
  PolymerizationPlant: "Chemist",
  AssemblyWorkshop: "Mechanic",
  ElectronicsFabricator: "Mechanic",
  CommerceHub: "Trader",
  TokenMinter: "Trader",
  GemProcessor: "Geologist",
  CrystalSynthesizer: "Geologist",
  HydrogenExtractor: "HydroEngineer",
  FusionPlant: "HydroEngineer",
  PlasmaCoreFabricator: "PowerTechnician",
  AntimatterGenerator: "PowerTechnician",
  BioPolymerSynthesizer: "Botanist",
  NanoOrganicLab: "Botanist",
  SuperAlloyForge: "Metallurgist",
  MetaMaterialSynthesizer: "Metallurgist",
  NanoCatalystLab: "Chemist",
  QuantumChemSynthesizer: "Chemist",
  ComponentFabricator: "Mechanic",
  RoboticsAssembler: "Mechanic",
  CryptoExchange: "Trader",
  BondIssuer: "Trader",
  InterstellarFabricator: "All", // Add this line
};

// Add a new function to determine user tier based on NFT count
function determineUserTier(nftCount: number) {
  if (nftCount >= 1000) return 32
  if (nftCount >= 950) return 31
  if (nftCount >= 900) return 30
  if (nftCount >= 850) return 29
  if (nftCount >= 800) return 28
  if (nftCount >= 750) return 27
  if (nftCount >= 700) return 26
  if (nftCount >= 650) return 25
  if (nftCount >= 600) return 24
  if (nftCount >= 550) return 23
  if (nftCount >= 500) return 22
  if (nftCount >= 450) return 21
  if (nftCount >= 400) return 20
  if (nftCount >= 350) return 19
  if (nftCount >= 300) return 18
  if (nftCount >= 250) return 17
  if (nftCount >= 200) return 16
  if (nftCount >= 150) return 15
  if (nftCount >= 140) return 14
  if (nftCount >= 130) return 13
  if (nftCount >= 120) return 12
  if (nftCount >= 110) return 11
  if (nftCount >= 100) return 10
  if (nftCount >= 90) return 9
  if (nftCount >= 80) return 8
  if (nftCount >= 70) return 7
  if (nftCount >= 60) return 6
  if (nftCount >= 50) return 5
  if (nftCount >= 40) return 4
  if (nftCount >= 30) return 3
  if (nftCount >= 20) return 2
  if (nftCount >= 10) return 1
  return 0
}

  const marketResources = [
    {
      name: "Empty Power Cell",
      key: "emptyPowerCell",
      image: GAME_ASSETS.batteryEmpty,
      buyPrice: 50,
    },
    {
      name: "Full Power Cell",
      key: "fullPowerCell",
      image: GAME_ASSETS.batteryFull,
      sellPrice: 100, // Only sellable for 100 UFOS
    },



    {
      name: "Ion Thruster",
      key: "ionThruster",
      image: GAME_ASSETS.ionThruster,
      sellPrice: 1000, // Only sellable for 100 UFOS
    },
    {
      name: "Solar Panel",
      key: "solarPanel",
      image: GAME_ASSETS.solarPanel,
      sellPrice: 2500, // Only sellable for 100 UFOS
    },
    {
      name: "Life Support Module",
      key: "lifeSupportModule",
      image: GAME_ASSETS.lifeSupportModule,
      sellPrice: 5000, // Only sellable for 100 UFOS
    },
    {
      name: "Trade Beacon",
      key: "tradeBeacon",
      image: GAME_ASSETS.tradeBeacon,
      sellPrice: 5000,
    },
    {
      name: "Hydro Core",
      key: "hydroCore",
      image: GAME_ASSETS.hydroCore,
      sellPrice: 5500,
    },

    
    {
      name: "Bio Circuit",
      key: "bioCircuit",
      image: GAME_ASSETS.bioCircuit,
      sellPrice: 6000,
    },
    {
      name: "Bio-Reactor Core",
      key: "bioReactorCore",
      image: GAME_ASSETS.bioReactorCore,
      sellPrice: 6500,
    },
    {
      name: "Holo-Projector",
      key: "holoProjector",
      image: GAME_ASSETS.holoProjector,
      sellPrice: 7000,
    },
    {
      name: "Nano Assembler",
      key: "nanoAssembler",
      image: GAME_ASSETS.nanoAssembler,
      sellPrice: 7500,
    },
    
    {
      name: "Crystal Matrix",
      key: "crystalMatrix",
      image: GAME_ASSETS.crystalMatrix,
      sellPrice: 8000,
    },
    {
      name: "Neural Interface",
      key: "neuralInterface",
      image: GAME_ASSETS.neuralInterface,
      sellPrice: 8500,
    },
    {
      name: "Graviton Shield",
      key: "gravitonShield",
      image: GAME_ASSETS.gravitonShield,
      sellPrice: 9000,
    },
    {
      name: "Antimatter Warhead",
      key: "antimatterWarhead",
      image: GAME_ASSETS.antimatterWarhead,
      sellPrice: 9500,
    },
    {
      name: "Quantum Drive",
      key: "quantumDrive",
      image: GAME_ASSETS.quantumDrive,
      sellPrice: 10000, // Only sellable for 100 UFOS
    },

  ];

function CryptoUFOsGame() {
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const { publicKey, wallet, disconnect, connect } = useWallet()
  const { connection } = useConnection()
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [isMarketOpen, setIsMarketOpen] = useState(false)
  const [isLaboratoryOpen, setIsLaboratoryOpen] = useState(false)
  const [activeMarketTab, setActiveMarketTab] = useState("buy")
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState(0)
  const [transferWallet, setTransferWallet] = useState("")
  const [sortOption, setSortOption] = useState<"name" | "quantity-desc" | "quantity-asc">("name");
  const [isNameFormOpen, setIsNameFormOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [progressBars, setProgressBars] = useState<ProgressBars>({
    powerCell: 0,
    scavenger: 0,
    waterFilter: 0,
    workshop: 0,
    cad: 0,
  });
  const [showMusicControls, setShowMusicControls] = useState(true);
  const [displayPowerCellProgress, setDisplayPowerCellProgress] = useState<number[]>([]);
  const [displayBuildingProgress, setDisplayBuildingProgress] = useState<{ [key: string]: number }>({});
  const [displayScavengerProgress, setDisplayScavengerProgress] = useState(0);
  const [displayCadProgress, setDisplayCadProgress] = useState(0);
  const [displayWaterFilterProgress, setDisplayWaterFilterProgress] = useState(0);
  const [displayWorkshopProgress, setDisplayWorkshopProgress] = useState(0);
  const [displayFabricatorProgress, setDisplayFabricatorProgress] = useState(0);
  const [firebaseApp, setFirebaseApp] = useState<any>(null)
  const [firestore, setFirestore] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walletConnected, setWalletConnected] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const [powerCellSlots, setPowerCellSlots] = useState<PowerCellSlot[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [connectedWalletType, setConnectedWalletType] = useState<"phantom" | "solflare" | null>(null);
  const [hasClaimable, setHasClaimable] = useState(false); // New state
  const [isClaiming, setIsClaiming] = useState(false); // New loading state for claiming
  const [isClaiming2, setIsClaiming2] = useState(false); // New loading state for claiming
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProfessionModalOpen, setIsProfessionModalOpen] = useState(false)
  const [showClaimableDetails, setShowClaimableDetails] = useState(false);
const [tradeQuantity, setTradeQuantity] = useState<{ [key: string]: number }>(() =>
  marketResources.reduce((acc, resource) => ({ ...acc, [resource.key]: 1 }), {})
);
  const [isFabricatorModalOpen, setIsFabricatorModalOpen] = useState(false);
  const [selectedFabricatorProduct, setSelectedFabricatorProduct] = useState<string | null>(null);
  const [fabricatorProgress, setFabricatorProgress] = useState(0);
  const [inventoryTab, setInventoryTab] = useState("all");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [claimableFabricatorProduct, setClaimableFabricatorProduct] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 2000, height: 1000 });
  const [zoomLevel, setZoomLevel] = useState(0.3)
  const baseMapSize = 6000; // Map is 5000px x 5000px at 1x zoom
  const minZoom = 0.3 ; // Minimum zoom (half size)
  const maxZoom = 2; // Maximum zoom (double size)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  
  const [isUserInfoExpanded, setIsUserInfoExpanded] = useState(true); // Default to expanded
  const [nftLevelData, setNFTLevelData] = useState<NFTLevelData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isNFTDataLoading, setIsNFTDataLoading] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [isSkillPointsModalOpen, setIsSkillPointsModalOpen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const network = clusterApiUrl("mainnet-beta"); // Use the same network as BettingGame (adjust if needed)
  const [toastState, setToastState] = useState<ToastState>({
  isOpen: false,
  type: "info",
  title: "",
  description: "",
  duration: 3000,
});
  const [confirmModalDetails, setConfirmModalDetails] = useState<{
  action: () => void;
  message: string;
} | null>(null);
  // New refs for pinch zoom
  const isPinching = useRef(false);
  const initialPinchDistance = useRef(0);
  const initialZoom = useRef(0);
  const pinchMidpoint = useRef({ x: 0, y: 0 });

  // Calculate scaled map size based on zoom level
  const calculateMapSize = (zoom: number): MapSize => {
    const size = baseMapSize * zoom;
    return { width: size, height: size };
  };
  
  const [notifiedActions, setNotifiedActions] = useState<NotifiedActions>(() => {
    // Initialize from local storage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`notifiedActions_${userData.wallet}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });



const preloadImages = (imageUrls: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    let loadedCount = 0;
    const totalImages = imageUrls.length;

    if (totalImages === 0) {
      setLoadingProgress(80); // Base progress for Firebase
      setImagesLoaded(true);
      resolve();
      return;
    }

    imageUrls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        const imageProgress = (loadedCount / totalImages) * 80; // 80% weight for images
        setLoadingProgress(imageProgress);
        console.log(`[preloadImages] Loaded ${url} (${loadedCount}/${totalImages}, ${imageProgress.toFixed(2)}%)`);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
          resolve();
        }
      };
      img.onerror = () => {
        console.warn(`[preloadImages] Failed to load ${url}`);
        loadedCount++;
        const imageProgress = (loadedCount / totalImages) * 80;
        setLoadingProgress(imageProgress);
        console.log(`[preloadImages] Error on ${url} (${loadedCount}/${totalImages}, ${imageProgress.toFixed(2)}%)`);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
          resolve();
        }
      };
    });
  });
};



const AUDIO_TRACKS = [
  { src: "/audio/track1.mp3", title: "Cosmic Drift" },
  { src: "/audio/track2.mp3", title: "Stellar Waves" },
  { src: "/audio/track3.mp3", title: "Galactic Pulse" },
  { src: "/audio/track4.mp3", title: "Nebula Dance" },
  { src: "/audio/track5.mp3", title: "Astro Voyage" },
  { src: "/audio/track6.mp3", title: "Lunar Echoes" },
  { src: "/audio/track7.mp3", title: "Orbiting Light" },
  { src: "/audio/track8.mp3", title: "Solar Flare" },
  { src: "/audio/track9.mp3", title: "Cosmic Dance" },
  { src: "/audio/track10.mp3", title: "Exploding Stars" },
  { src: "/audio/track11.mp3", title: "Interstellar Haze" },
  { src: "/audio/track12.mp3", title: "Quantum Rift" },
  { src: "/audio/track13.mp3", title: "Nebular Whispers" },
  { src: "/audio/track14.mp3", title: "Starlight Surge" },
  { src: "/audio/track15.mp3", title: "Void Symphony" },
  { src: "/audio/track16.mp3", title: "Pulsar Glow" },
  { src: "/audio/track17.mp3", title: "Astral Currents" },
  { src: "/audio/track18.mp3", title: "Meteor Cascade" },
  { src: "/audio/track19.mp3", title: "Galactic Horizon" },
];

const resourceProfessionMap: Partial<Record<ResourceKey, string>> = {
  ice: "Basic",
  co2: "Basic",
  water: "HydroEngineer",
  halite: "Basic",
  emptyPowerCell: "Basic",
  fullPowerCell: "Basic",
  brokenPowerCell: "Basic",
  crystalOre: "Geologist",
  rareEarths: "Geologist",
  processedGems: "Geologist",
  exoticCrystals: "Geologist",
  purifiedWater: "HydroEngineer",
  plasmaFluid: "HydroEngineer",
  hydrogenFuel: "HydroEngineer",
  fusionFluid: "HydroEngineer",
  quantumCells: "PowerTechnician",
  energyCores: "PowerTechnician",
  plasmaCores: "PowerTechnician",
  antimatterCells: "PowerTechnician",
  biofiber: "Botanist",
  sporeEssence: "Botanist",
  bioPolymers: "Botanist",
  nanoOrganics: "Botanist",
  alloyIngots: "Metallurgist",
  nanosteel: "Metallurgist",
  superAlloys: "Metallurgist",
  metaMaterials: "Metallurgist",
  catalysts: "Chemist",
  polymers: "Chemist",
  nanoCatalysts: "Chemist",
  quantumChemicals: "Chemist",
  spareParts: "Mechanic",
  circuitBoards: "Mechanic",
  advancedComponents: "Mechanic",
  roboticModules: "Mechanic",
  tradeContracts: "Trader",
  marketTokens: "Trader",
  cryptoCredits: "Trader",
  galacticBonds: "Trader",
  solarPanel: "Components",
  ionThruster: "Components",
  lifeSupportModule: "Components",
  quantumDrive: "Components",
  nanoAssembler: "Components",
  bioCircuit: "Components",
  crystalMatrix: "Components",
  hydroCore: "Components",
  tradeBeacon: "Components",
  gravitonShield: "Components",
  neuralInterface: "Components",
  antimatterWarhead: "Components",
  holoProjector: "Components",
  bioReactorCore: "Components",
};
  
const SKILL_CATEGORIES: {
  [category: string]: { name: string; traitKey: string }[];
} = {
  Geologist: [
    { name: "Mining Efficiency", traitKey: "Body" }, // Boosts Crystal Ore yield (Crystal Mine)
    { name: "Crystal Processing", traitKey: "Accessory" }, // Improves Rare Earths production (Crystal Refinery)
    { name: "Gem Polishing", traitKey: "Eyes" }, // Enhances Processed Gems output (Gem Processor)
    { name: "Crystal Synthesis", traitKey: "Mouth" }, // Increases Exotic Crystals yield (Crystal Synthesizer)
  ],
  HydroEngineer: [
    { name: "Water Purification", traitKey: "Eyes" }, // Boosts Purified Water yield (Advanced Filter)
    { name: "Fluid Dynamics", traitKey: "Hair" }, // Improves Plasma Fluid production (Plasma Reactor)
    { name: "Hydrogen Extraction", traitKey: "Mouth" }, // Enhances Hydrogen Fuel output (Hydrogen Extractor)
    { name: "Fusion Optimization", traitKey: "Background" }, // Increases Fusion Fluid yield (Fusion Plant)
  ],
  PowerTechnician: [
    { name: "Energy Conversion", traitKey: "Background" }, // Boosts Quantum Cells yield (Quantum Foundry)
    { name: "Core Stability", traitKey: "Mouth" }, // Improves Energy Cores production (Core Reactor)
    { name: "Plasma Fabrication", traitKey: "Eyes" }, // Enhances Plasma Cores output (Plasma Core Fabricator)
    { name: "Antimatter Synthesis", traitKey: "Hair" }, // Increases Antimatter Cells yield (Antimatter Generator)
  ],
  Botanist: [
    { name: "Biofiber Growth", traitKey: "Body" }, // Boosts Biofiber yield (Biopolymer Greenhouse)
    { name: "Spore Extraction", traitKey: "Eyes" }, // Improves Spore Essence production (Mycelium Extractor)
    { name: "Polymer Synthesis", traitKey: "Mouth" }, // Enhances Bio Polymers output (Bio Polymer Synthesizer)
    { name: "Nano Organic Cultivation", traitKey: "Hair" }, // Increases Nano Organics yield (Nano Organic Lab)
  ],
  Metallurgist: [
    { name: "Alloy Forging", traitKey: "Accessory" }, // Boosts Alloy Ingots yield (Smelting Forge)
    { name: "Nanosteel Refining", traitKey: "Hair" }, // Improves Nanosteel production (Nanoforge)
    { name: "Super Alloy Crafting", traitKey: "Body" }, // Enhances Super Alloys output (Super Alloy Forge)
    { name: "Meta Material Synthesis", traitKey: "Eyes" }, // Increases Meta Materials yield (Meta Material Synthesizer)
  ],
  Chemist: [
    { name: "Catalyst Synthesis", traitKey: "Background" }, // Boosts Catalysts yield (Chemical Synthesizer)
    { name: "Polymer Production", traitKey: "Mouth" }, // Improves Polymers production (Polymerization Plant)
    { name: "Nano Catalyst Formulation", traitKey: "Eyes" }, // Enhances Nano Catalysts output (Nano Catalyst Lab)
    { name: "Quantum Chemical Synthesis", traitKey: "Hair" }, // Increases Quantum Chemicals yield (Quantum Chem Synthesizer)
  ],
  Mechanic: [
    { name: "Component Assembly", traitKey: "Eyes" }, // Boosts Spare Parts yield (Assembly Workshop)
    { name: "Robotics Tuning", traitKey: "Body" }, // Improves Circuit Boards production (Electronics Fabricator)
    { name: "Advanced Component Crafting", traitKey: "Mouth" }, // Enhances Advanced Components output (Component Fabricator)
    { name: "Robotic Module Integration", traitKey: "Hair" }, // Increases Robotic Modules yield (Robotics Assembler)
  ],
  Trader: [
    { name: "Market Analysis", traitKey: "Hair" }, // Boosts Trade Contracts yield (Commerce Hub)
    { name: "Trade Negotiation", traitKey: "Accessory" }, // Improves Market Tokens production (Token Minter)
    { name: "Crypto Trading", traitKey: "Eyes" }, // Enhances Crypto Credits output (Crypto Exchange)
    { name: "Bond Valuation", traitKey: "Mouth" }, // Increases Galactic Bonds yield (Bond Issuer)
  ],
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
};


const traitResourceMap: { [traitKey: string]: { [traitValue: string]: ResourceKey } } = {
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

  // Zoom state

  // Use refs to prevent multiple data loading attempts
  const isDataLoading = useRef(false)
  const currentWalletAddress = useRef<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  
const showToast = (
  type: "success" | "error" | "info" | "warning",
  title: string,
  description: string | ToastContent[],
  duration: number = 3000
) => {
  setToastState({
    isOpen: true,
    type,
    title,
    description,
    duration,
  });
};




useEffect(() => {
  if (publicKey && !isDataLoading.current) {
    setWalletConnected(true);
    handleWalletConnect()
    currentWalletAddress.current = publicKey.toString();
    // No need to call fetchUserData here since handleWalletConnect handles it
  } else if (!publicKey) {
    setWalletConnected(false);
    currentWalletAddress.current = null;
    setUserData(defaultUserData);
    setPowerCellSlots([]);
    setNFTLevelData(null);
  }
}, [publicKey]);


const handleWalletConnect = async () => {
  if (isDataLoading.current) {
    console.log("[handleWalletConnect] Data loading in progress, skipping");
    return;
  }  isDataLoading.current = true;
  setIsLoadingUserData(true);  try {
    await connect();
    if (!publicKey) {
      throw new Error("Wallet connection failed: No public key available");
    }const walletAddress = publicKey.toString();
setWalletConnected(true);
currentWalletAddress.current = walletAddress;

const walletType = window.solana?.isPhantom ? "phantom" : window.solflare?.isSolflare ? "solflare" : null;
if (walletType) {
  setConnectedWalletType(walletType);
}

const nftCount = await fetchAssetsByGroup(COLLECTION_ADDRESS, walletAddress);
console.log("[handleWalletConnect] Fetched NFT count:", nftCount);

const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", walletAddress));
const querySnapshot = await getDocs(q);
let updatedUserData: UserData = { ...defaultUserData, wallet: walletAddress };

// Set up real-time listener
const docRef = querySnapshot.empty
  ? null
  : doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);

if (docRef) {
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const docData = docSnap.data();
      const validProduct = docData.SelectedFabricatorProduct && fabricatorProducts[docData.SelectedFabricatorProduct]
        ? docData.SelectedFabricatorProduct
        : null;

      const firestoreSlots = docData.PowerCellSlots || [];
      const slotCount = getPowerCellSlots(nftCount);
      const updatedSlots: PowerCellSlot[] = Array.from({ length: slotCount }, (_, i) => {
        const existingSlot = firestoreSlots.find((s: any) => s.id === i);
        return existingSlot
          ? {
              id: i,
              isCharging: existingSlot.isCharging,
              isClaimable: existingSlot.isClaimable,
              timeStamp: existingSlot.timeStamp ? new Date(existingSlot.timeStamp.seconds * 1000) : null,
              progress: existingSlot.progress || 0,
            }
          : {
              id: i,
              isCharging: false,
              isClaimable: false,
              timeStamp: null,
              progress: 0,
            };
      });

      updatedUserData = {
        ...defaultUserData,
        wallet: docData.Wallet || walletAddress,
        name: docData.Name || "Player",
        nfts: nftCount,
        ufos: docData.UFOS || 0,
        emptyPowerCell: docData.EmptyPowerCell || 0,
        fullPowerCell: docData.FullPowerCell || 0,
        brokenPowerCell: docData.BrokenPowerCell || 0,
        ice: docData.Ice || 0,
        co2: docData.co2 || 0,
        water: docData.Water || 0,
        halite: docData.Halite || 0,
        chargingPowerCell: docData.ChargingPowerCell || 0,
        claimableFullPowerCell: docData.ClaimableFullPowerCell || 0,
        scavengerWorking: docData.ScavengerWorking || 0,
        cadWorking: docData.cadWorking || 0,
        scavengerWorkingEnd: docData.ScavengerWorkingEnd || 0,
        cadWorkingEnd: docData.cadWorkingEnd || 0,
        chargingWaterFilter: docData.ChargingWaterFilter || 0,
        claimableWater: docData.ClaimableWater || 0,
        chargingWorkShop: docData.ChargingWorkShop || 0,
        claimableEmptyPowerCell: docData.ClaimableEmptyPowerCell || 0,
        timeStamp: docData.TimeStamp ? new Date(docData.TimeStamp.seconds * 1000) : null,
        timeStampScavenger: docData.TimeStampScavenger ? new Date(docData.TimeStampScavenger.seconds * 1000) : null,
        timeStampCad: docData.TimeStampCad ? new Date(docData.TimeStampCad.seconds * 1000) : null,
        timeStampW: docData.TimeStampW ? new Date(docData.TimeStampW.seconds * 1000) : null,
        timeStampS: docData.TimeStampS ? new Date(docData.TimeStampS.seconds * 1000) : null,
        timeStampDailyClaim: docData.TimeStampDailyClaim ? new Date(docData.TimeStampDailyClaim.seconds * 1000) : null,
        powerCellSlots: updatedSlots,
        selectedNFT: docData.SelectedNFT || null,
        activeProfession: docData.ActiveProfession || null,
        professionSwitchTimestamp: docData.ProfessionSwitchTimestamp
          ? new Date(docData.ProfessionSwitchTimestamp.seconds * 1000)
          : null,
        professions: docData.Professions || defaultUserData.professions,
        crystalOre: docData.CrystalOre || 0,
        rareEarths: docData.RareEarths || 0,
        purifiedWater: docData.PurifiedWater || 0,
        plasmaFluid: docData.PlasmaFluid || 0,
        quantumCells: docData.QuantumCells || 0,
        energyCores: docData.EnergyCores || 0,
        biofiber: docData.Biofiber || 0,
        sporeEssence: docData.SporeEssence || 0,
        alloyIngots: docData.AlloyIngots || 0,
        nanosteel: docData.Nanosteel || 0,
        catalysts: docData.Catalysts || 0,
        polymers: docData.Polymers || 0,
        spareParts: docData.SpareParts || 0,
        circuitBoards: docData.CircuitBoards || 0,
        tradeContracts: docData.TradeContracts || 0,
        marketTokens: docData.MarketTokens || 0,
        processedGems: docData.ProcessedGems || 0,
        exoticCrystals: docData.ExoticCrystals || 0,
        hydrogenFuel: docData.HydrogenFuel || 0,
        fusionFluid: docData.FusionFluid || 0,
        plasmaCores: docData.PlasmaCores || 0,
        antimatterCells: docData.AntimatterCells || 0,
        bioPolymers: docData.BioPolymers || 0,
        nanoOrganics: docData.NanoOrganics || 0,
        superAlloys: docData.SuperAlloys || 0,
        metaMaterials: docData.MetaMaterials || 0,
        nanoCatalysts: docData.NanoCatalysts || 0,
        quantumChemicals: docData.QuantumChemicals || 0,
        advancedComponents: docData.AdvancedComponents || 0,
        roboticModules: docData.RoboticModules || 0,
        cryptoCredits: docData.CryptoCredits || 0,
        galacticBonds: docData.GalacticBonds || 0,
        solarPanel: docData.SolarPanel || 0,
        ionThruster: docData.IonThruster || 0,
        lifeSupportModule: docData.LifeSupportModule || 0,
        quantumDrive: docData.QuantumDrive || 0,
        nanoAssembler: docData.NanoAssembler || 0,
        bioCircuit: docData.BioCircuit || 0,
        crystalMatrix: docData.CrystalMatrix || 0,
        hydroCore: docData.HydroCore || 0,
        tradeBeacon: docData.TradeBeacon || 0,
        gravitonShield: docData.GravitonShield || 0,
        neuralInterface: docData.NeuralInterface || 0,
        antimatterWarhead: docData.AntimatterWarhead || 0,
        holoProjector: docData.HoloProjector || 0,
        bioReactorCore: docData.BioReactorCore || 0,
        buildingLevels: docData.BuildingLevels || {},
        buildingTimestamps: Object.keys(docData.BuildingTimestamps || {}).reduce(
          (acc, key) => ({
            ...acc,
            [key]: docData.BuildingTimestamps[key] ? new Date(docData.BuildingTimestamps[key].seconds * 1000) : null,
          }),
          {}
        ),
        buildingClaimables: docData.BuildingClaimables || {},
        selectedFabricatorProduct: validProduct,
        streakCount: docData.StreakCount || 0,
        claimableFabricatorProduct: docData.ClaimableFabricatorProduct || null,
      };

      setUserData(updatedUserData);
      setPowerCellSlots(updatedUserData.powerCellSlots);
      setClaimableFabricatorProduct(updatedUserData.claimableFabricatorProduct);
      console.log("[handleWalletConnect] Updated user data from Firestore snapshot");
    } else {
      console.warn("[handleWalletConnect] Document does not exist");
      setUserData(defaultUserData);
      setPowerCellSlots([]);
    }
  }, (error) => {
    console.error("[handleWalletConnect] Firestore snapshot error:", error);
    showToast("error", "Data Sync Error", "Failed to sync user data. Please reconnect.", 3000);
  });

  // Store unsubscribe function to clean up on disconnect
  return () => unsubscribe();
}

// Initialize new user if no document exists
if (querySnapshot.empty) {
  const slotCount = getPowerCellSlots(nftCount);
  const initialSlots: PowerCellSlot[] = Array.from({ length: slotCount }, (_, i) => ({
    id: i,
    isCharging: false,
    isClaimable: false,
    timeStamp: null,
    progress: 0,
  }));

  updatedUserData = {
    ...defaultUserData,
    wallet: walletAddress,
    nfts: nftCount,
    powerCellSlots: initialSlots,
  };

  await addDoc(collection(firestore, "UFOSperWallet"), {
    Wallet: walletAddress,
    Name: "Player",
    NFTs: nftCount,
    UFOS: 0,
    EmptyPowerCell: 0,
    FullPowerCell: 0,
    BrokenPowerCell: 0,
    Ice: 0,
    co2: 0,
    Water: 0,
    Halite: 0,
    ChargingPowerCell: 0,
    ClaimableFullPowerCell: 0,
    ScavengerWorking: 0,
    cadWorking: 0,
    ScavengerWorkingEnd: 0,
    cadWorkingEnd: 0,
    ChargingWaterFilter: 0,
    ClaimableWater: 0,
    ChargingWorkShop: 0,
    ClaimableEmptyPowerCell: 0,
    TimeStamp: null,
    TimeStampScavenger: null,
    TimeStampCad: null,
    TimeStampW: null,
    TimeStampS: null,
    TimeStampDailyClaim: null,
    PowerCellSlots: initialSlots,
    SelectedNFT: null,
    ActiveProfession: null,
    ProfessionSwitchTimestamp: null,
    Professions: defaultUserData.professions,
    CrystalOre: 0,
    RareEarths: 0,
    PurifiedWater: 0,
    PlasmaFluid: 0,
    QuantumCells: 0,
    EnergyCores: 0,
    Biofiber: 0,
    SporeEssence: 0,
    AlloyIngots: 0,
    Nanosteel: 0,
    Catalysts: 0,
    Polymers: 0,
    SpareParts: 0,
    CircuitBoards: 0,
    TradeContracts: 0,
    MarketTokens: 0,
    ProcessedGems: 0,
    ExoticCrystals: 0,
    HydrogenFuel: 0,
    FusionFluid: 0,
    PlasmaCores: 0,
    AntimatterCells: 0,
    BioPolymers: 0,
    NanoOrganics: 0,
    SuperAlloys: 0,
    MetaMaterials: 0,
    NanoCatalysts: 0,
    QuantumChemicals: 0,
    AdvancedComponents: 0,
    RoboticModules: 0,
    CryptoCredits: 0,
    GalacticBonds: 0,
    SolarPanel: 0,
    IonThruster: 0,
    LifeSupportModule: 0,
    QuantumDrive: 0,
    NanoAssembler: 0,
    BioCircuit: 0,
    CrystalMatrix: 0,
    HydroCore: 0,
    TradeBeacon: 0,
    GravitonShield: 0,
    NeuralInterface: 0,
    AntimatterWarhead: 0,
    HoloProjector: 0,
    BioReactorCore: 0,
    BuildingLevels: {},
    BuildingTimestamps: {},
    BuildingClaimables: {},
    SelectedFabricatorProduct: null,
    StreakCount: 0,
    ClaimableFabricatorProduct: null,
    LastUpdated: serverTimestamp(),
  });
  console.log("[handleWalletConnect] Initialized new user in Firestore");
}

setUserData(updatedUserData);
setPowerCellSlots(updatedUserData.powerCellSlots);
setClaimableFabricatorProduct(updatedUserData.claimableFabricatorProduct);

if (updatedUserData.selectedNFT) {
  await fetchNFTLevelData(updatedUserData.selectedNFT);
}

showToast("success", "Wallet Connected", `Connected wallet: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}. NFTs: ${nftCount}`, 3000);  } catch (error) {
    console.error("[handleWalletConnect] Error connecting wallet or fetching data:", error);
    showToast("error", "Connection Failed", "Failed to connect wallet or fetch NFT data.", 3000);
    setWalletConnected(false);
    currentWalletAddress.current = null;
    setUserData(defaultUserData);
    setPowerCellSlots([]);
  } finally {
    isDataLoading.current = false;
    setIsLoadingUserData(false);
  }
};




const handleWalletDisconnect = async () => {
  try {
    await disconnect();
    if (currentWalletAddress.current) {
      localStorage.removeItem(`userData_${currentWalletAddress.current}`);
      localStorage.removeItem(`notifiedActions_${currentWalletAddress.current}`);
    }
    setWalletConnected(false);
    currentWalletAddress.current = null;
    setUserData(defaultUserData);
    setPowerCellSlots([]);
    setNFTLevelData(null);
    showToast("success", "Wallet Disconnected", "Successfully disconnected your wallet.", 3000);
  } catch (error) {
    console.error("[handleWalletDisconnect] Error disconnecting wallet:", error);
    showToast("error", "Disconnect Failed", "Failed to disconnect wallet.", 3000);
  }
};

const extractNFTId = (selectedNFT: string | null | undefined): string => {
  if (!selectedNFT) return "";
  // If selectedNFT is a URL, extract the numerical ID
  const match = selectedNFT.match(/(\d+)\.json$/) || selectedNFT.match(/\/(\d+)$/) || selectedNFT.match(/^(\d+)$/);
  if (match) {
    return match[1]; // Return the numerical ID
  }
  console.error("[extractNFTId] Invalid selectedNFT format:", selectedNFT);
  return "";
};

   // Detect mobile view
   useEffect(() => {
    const checkMobile = () => {

      setIsMobile(window.innerWidth < 768) // Tailwind's 'md' breakpoint

      setIsMobile(window.innerWidth < 968) // Tailwind's 'md' breakpoint

    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const checkClaimable = () => {
      const claimablePowerCells = powerCellSlots.some(slot => slot.isClaimable);
      const claimableBuildings = Object.values(userData.buildingClaimables).some(amount => amount > 0);
      const claimableConditions = [
        userData.scavengerWorkingEnd > 0,
        userData.cadWorkingEnd > 0,
        userData.claimableWater > 0,
        userData.claimableEmptyPowerCell > 0,
        claimablePowerCells,
        claimableBuildings,
      ];
  
      const hasClaimableResources = claimableConditions.some(condition => condition);
      setHasClaimable(hasClaimableResources);
    };
  
    checkClaimable();
  }, [userData, powerCellSlots]);

useEffect(() => {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    setFirebaseApp(app);
    setFirestore(db);
    setIsLoading(false);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showToast("error", "Failed to connect to database", "Using local data instead.", 3000);
    setIsLoading(false);
  }
}, []);



const formatNumber = (value: number): string => {
  if (isNaN(Number(value))) {
    return "0"; // Return "0" for invalid numbers
  }
  // Use toLocaleString to add comma separators, without decimal places
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
    // Sync notifiedActions to local storage whenever it changes
  useEffect(() => {
    if (userData.wallet) {
      localStorage.setItem(`notifiedActions_${userData.wallet}`, JSON.stringify(notifiedActions));
    }
  }, [notifiedActions, userData.wallet]);

  // Helper function to mark an action as notified
  const markActionNotified = (actionKey: string) => {
    setNotifiedActions((prev) => ({
      ...prev,
      [actionKey]: true,
    }));
  };

  // Helper function to clear notification status for an action
  const clearActionNotification = (actionKey: string) => {
    setNotifiedActions((prev) => {
      const updated = { ...prev };
      delete updated[actionKey];
      return updated;
    });
  };

  // Preload images when component mounts
  useEffect(() => {
    const imageUrls = Object.values(GAME_ASSETS).filter(
      (url) => typeof url === "string" && (url.endsWith(".png") || url.endsWith(".gif") || url.endsWith(".jpg"))
    );
    console.log("[CryptoUFOsGame] Preloading images:", imageUrls);

    preloadImages(imageUrls)
      .then(() => {
        console.log("[CryptoUFOsGame] All images preloaded");
        setImagesLoaded(true);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("[CryptoUFOsGame] Error preloading images:", error);
        setImagesLoaded(true); // Proceed even if some images fail
        setIsLoading(false);
      });
  }, []);
const fetchNFTLevelData = async (nftId: string) => {
  if (!firestore || !walletConnected || !nftId) {
    setNFTLevelData(null);
    setIsNFTDataLoading(false);
    return;
  }
  setIsNFTDataLoading(true);
  try {
    const docRef = doc(firestore, "CryptoUFOs", nftId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const totalBonus = calculateTotalBonus(data.Skills || {}, data.Traits || {}, "Geologist");
      setNFTLevelData({
        nftId,
        exp: data.EXP || 0,
        level: data.LEVEL || 1,
        traits: data.Traits || {},
        skills: data.Skills || {},
        totalBonus,
      });
    } else {
      const { traits, skills } = await fetchAndStoreNFTTraits(nftId, userData.wallet);
      const totalBonus = calculateTotalBonus(skills, traits, "Geologist");
      await setDoc(docRef, {
        EXP: 0,
        LEVEL: 1,
        Traits: traits,
        Skills: skills,
        TotalBonus: totalBonus,
        LastUpdated: serverTimestamp(),
      });
      setNFTLevelData({ nftId, exp: 0, level: 1, traits, skills, totalBonus });
      showToast("success", "NFT Initialized", `Crypto UFO #${nftId} initialized.`, 3000);
    }
  } catch (error) {
    console.error("[fetchNFTLevelData] Error:", error);
    showToast("error", "Failed to load NFT data", "Please try again.", 3000);
    setNFTLevelData(null);
  } finally {
    setIsNFTDataLoading(false);
  }
};

useEffect(() => {
  if (!walletConnected || !userData.selectedNFT || !firestore || isNFTDataLoading) {
    console.log("[NFT Selection] Clearing level data due to missing dependencies or loading");
    setNFTLevelData(null);
    return;
  }

  const nftId = extractNFTId(userData.selectedNFT);
  if (!nftId) {
    console.warn("[NFT Selection] Invalid NFT ID, clearing level data");
    setNFTLevelData(null);
    return;
  }

  // Only fetch if nftLevelData is null or doesn't match the current NFT ID
  if (nftLevelData && nftLevelData.nftId === nftId) {
    console.log("[NFT Selection] NFT data already loaded for ID:", nftId);
    return;
  }

  console.log("[NFT Selection] Fetching level data for NFT:", nftId);
  fetchNFTLevelData(nftId);
}, [walletConnected, userData.selectedNFT, firestore, isNFTDataLoading]);

const addNFTExperience = async (expToAdd: number) => {
  if (!firestore || !walletConnected || !userData.selectedNFT) {
    return;
  }

  if (isActionLocked) {
showToast("error", "Action in Progress", "Please wait for the current action to complete.", 3000);
    return;
  }

  const nftId = extractNFTId(userData.selectedNFT);
  if (!nftId) {
    return;
  }

  setIsActionLocked(true); // Lock actions

  try {
    const docRef = doc(firestore, "CryptoUFOs", nftId);
    await runTransaction(firestore, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      let currentExp = 0;
      let currentLevel = 1;
      let skills: { [skillName: string]: NFTSkill } = {};
      let totalBonus = 0;
      let traits: { [traitName: string]: string | number } = {};

      if (docSnap.exists()) {
        const data = docSnap.data();
        currentExp = data.EXP || 0;
        currentLevel = data.LEVEL || 1;
        skills = data.Skills || {};
        totalBonus = data.TotalBonus || 0;
        traits = data.Traits || {};
      }

      const newExp = currentExp + expToAdd;
      let newLevel = currentLevel;

      // Calculate total EXP required for the next level
      let totalExpRequired = 0;
      for (let i = 1; i <= newLevel; i++) {
        totalExpRequired += i === 1 ? 0 : 32 * Math.pow(2, i - 2);
      }

      // Level-up logic
      while (newExp >= totalExpRequired + 32 * Math.pow(2, newLevel - 1)) {
        newLevel++;
        totalExpRequired += 32 * Math.pow(2, newLevel - 2);
      }

      // Update skills and total bonus if leveled up
      if (newLevel > currentLevel && userData.activeProfession) {
        totalBonus = calculateTotalBonus(skills, traits, userData.activeProfession, "ice"); // Default resource
      }

      transaction.set(docRef, {
        EXP: newExp,
        LEVEL: newLevel,
        Skills: skills,
        TotalBonus: totalBonus,
        Traits: traits,
        LastUpdated: serverTimestamp(),
      });

      setNFTLevelData({
        nftId,
        exp: newExp,
        level: newLevel,
        skills,
        totalBonus,
        traits,
      });

      if (newLevel > currentLevel) {
showToast("success", "NFT Level Up!", `Crypto UFO #${nftId} reached Level ${newLevel}! Gained ${newLevel - currentLevel} skill point(s).`, 3000);
      }
    });
  } catch (error) {
    console.error("[addNFTExperience] Error updating NFT experience:", error);
showToast("error", "Failed to update NFT experience", "Please try again later.", 3000);
  } finally {
    setIsActionLocked(false); // Release lock
  }
};

const allocateSkillPoint = async (nftId: string, skillName: string) => {
  if (!firestore || !walletConnected || !nftLevelData) {
showToast("error", "Cannot Allocate Skill", "Wallet or NFT not ready.", 3000);    return;
  }

  // Extract resource from skill name (e.g., "Biofiber Efficiency" -> "biofiber")
  const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
  if (!resourceMatch) {
showToast("error", "Invalid Skill", `Skill ${skillName} is not valid.`, 3000);    return;
  }
  const resource = resourceMatch[1] as ResourceKey;

  const currentSkill = nftLevelData.skills[skillName] || { name: skillName, level: 0, bonus: 0 };
  if (currentSkill.level >= 10) {
showToast("error", "Max Level Reached", `${skillName} is at max level.`, 3000);    return;
  }

  const availablePoints = nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0);
  if (availablePoints <= 0) {
showToast("error", "No Skill Points Available", "Level up your NFT to gain more points.", 3000);
    return;
  }

  try {
    const newLevel = currentSkill.level + 1;

    // Find trait key and value for the resource
    let traitKey: string | null = null;
    let traitValue: string | number | null = null;
    for (const [key, valueMap] of Object.entries(traitResourceMap)) {
      if (Object.values(valueMap).includes(resource)) {
        traitKey = key;
        const foundTraitValue = Object.keys(valueMap).find((val) => valueMap[val] === resource);
        if (foundTraitValue) {
          traitValue = nftLevelData.traits[key] || foundTraitValue;
          break;
        }
      }
    }

    if (!traitKey || !traitValue) {
      throw new Error(`No trait mapping found for resource: ${resource}`);
    }

    // Use a default profession for bonus calculation
    const newBonus = calculateSkillBonus(newLevel, traitValue, skillName, "Geologist", resource);
    const updatedSkills = {
      ...nftLevelData.skills,
      [skillName]: { name: skillName, level: newLevel, bonus: newBonus },
    };
    const newTotalBonus = calculateTotalBonus(updatedSkills, nftLevelData.traits, "Geologist", resource);

    const docRef = doc(firestore, "CryptoUFOs", nftId);
    await updateDoc(docRef, {
      Skills: updatedSkills,
      TotalBonus: newTotalBonus,
      LastUpdated: serverTimestamp(),
    });

    setNFTLevelData((prev) =>
      prev
        ? {
            ...prev,
            skills: updatedSkills,
            totalBonus: newTotalBonus,
          }
        : null
    );

showToast("success", "Skill Upgraded", `${skillName} upgraded to Level ${newLevel}! Bonus: ${(newBonus * 100).toFixed(2)}%`, 3000);
  } catch (error: any) {
    console.error("[allocateSkillPoint] Error for NFT ID:", nftId, "Skill:", skillName, "Error:", error);

    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorDescription = `Skill: ${skillName}, NFT ID: ${nftId}. Contact support with this info.`;

    if (error.message.includes("No trait mapping found")) {
      errorMessage = "Trait Mapping Error";
      errorDescription = `No trait found for resource ${resource} in skill ${skillName}. Please report this issue.`;
    } else if (error.code === "permission-denied") {
      errorMessage = "Permission Denied";
      errorDescription = "You don't have permission to update this NFT. Ensure you're using the correct wallet.";
    } else if (error.code === "not-found") {
      errorMessage = "NFT Not Found";
      errorDescription = `NFT #${nftId} does not exist in the database. Try re-selecting your NFT.`;
    } else if (error.code === "unavailable" || error.code === "deadline-exceeded") {
      errorMessage = "Network Error";
      errorDescription = "Unable to connect to the server. Check your internet connection and try again.";
    } else if (error.message.includes("calculateSkillBonus") || error.message.includes("calculateTotalBonus")) {
      errorMessage = "Bonus Calculation Error";
      errorDescription = `Failed to calculate bonus for ${skillName}. Please report this issue.`;
    }

showToast("error", errorMessage, errorDescription, 5000);
  }
};

async function fetchAndStoreNFTTraits(nftId: string, publicKey: string): Promise<{
  traits: { [traitName: string]: string | number };
  skills: { [skillName: string]: NFTSkill };
}> {
  const cacheKey = `nftTraits_${nftId}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    console.log("[fetchAndStoreNFTTraits] Using cached traits for NFT:", nftId);
    return JSON.parse(cachedData);
  }
  try {
const metadataUrl = `https://cloudflare-ipfs.com/ipfs/bafybeifwwp2yxmgi3nizlc674krzkloevnkfj3ohkievivh7dvfjfdauge/${nftId}.json`;
    const response = await fetch(metadataUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    const metadata = await response.json();
    let traits: { [traitName: string]: string | number } = {};
    if (metadata?.attributes && Array.isArray(metadata.attributes)) {
      metadata.attributes.forEach((attr: { trait_type: string; value: string | number }) => {
        const traitKey = attr.trait_type === "Accesory" ? "Accessory" : attr.trait_type;
        const rawValue = typeof attr.value === "string" ? attr.value.trim() : attr.value;
        traits[traitKey] = traitNormalizationMap[rawValue] || rawValue.toString().toUpperCase().replace(/\s+/g, "_");
      });
    }
    let skills: { [skillName: string]: NFTSkill } = {};
    let totalBonus = 0;
    const validResources = new Set(Object.values(traitResourceMap).flatMap((map) => Object.values(map)));
    for (const [traitKey, traitValue] of Object.entries(traits)) {
      if (traitKey === "Rarity Rank") continue;
      const resource = traitResourceMap[traitKey]?.[traitValue as string] as ResourceKey | undefined;
      if (!resource || !validResources.has(resource)) continue;
      const skillName = `${resource} Efficiency`;
      if (skills[skillName]) continue;
      const bonus = calculateSkillBonus(0, traitValue, skillName, "Geologist", resource);
      skills[skillName] = { name: skillName, level: 0, bonus };
      totalBonus += bonus;
    }
    const result = { traits, skills };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    const docRef = doc(firestore, "CryptoUFOs", nftId);
    await setDoc(docRef, {
      EXP: 0,
      LEVEL: 1,
      Traits: traits,
      Skills: skills,
      TotalBonus: totalBonus,
      LastUpdated: serverTimestamp(),
    });
    return result;
  } catch (error) {
    console.error("[fetchAndStoreNFTTraits] Error:", error);
    showToast("error", "Failed to fetch NFT traits", "Using cached traits if available.", 3000);
    return cachedData ? JSON.parse(cachedData) : { traits: {}, skills: {} };
  }
}
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    const fixModalAndButtons = () => {
      const modal = document.querySelector(".wallet-adapter-modal") as HTMLElement | null;
    const modalContainer = document.querySelector(".wallet-adapter-modal-container") as HTMLElement | null;
    const connectMessage = document.querySelector(".wallet-connect-message") as HTMLElement | null; // Adjust selector based on your HTML structure

    if (!modal || !modalContainer || !connectMessage) {
      return;
    }

    // Style the modal container
    modalContainer.setAttribute(
      "style",
      `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.85) !important;
        backdrop-filter: blur(10px) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1000 !important;
      `
    );

    // Style the modal
    modal.setAttribute(
      "style",
      `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 1001 !important;
        max-width: 400px !important;
        width: 90% !important;
        height: auto !important;
        min-height: 300px !important;
        background: linear-gradient(135deg, #0a0a14, #1a1a2e) !important;
        border: 2px solid #00ffcc !important;
        border-radius: 16px !important;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.9), 0 0 20px #00ffcc, 0 0 40px #00ccff !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        animation: fadeIn 0.3s ease-in-out !important;
      `
    );

    // Style the connect message
    connectMessage.setAttribute(
      "style",
      `
        font-family: 'Orbitron', sans-serif !important;
        font-size: 28px !important;
        font-weight: 700 !important;
        color: #00ffcc !important;
        text-align: center !important;
        text-transform: uppercase !important;
        letter-spacing: 2px !important;
        text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ccff !important;
        line-height: 1.4 !important;
        padding: 20px !important;
        background: rgba(0, 0, 0, 0.5) !important;
        border-radius: 10px !important;
        box-shadow: inset 0 0 15px rgba(0, 255, 204, 0.3) !important;
      `
    );

      const modalList = modal.querySelector(".wallet-adapter-modal-list") as HTMLElement | null;
      if (modalList) {
        modalList.setAttribute(
          "style",
          `
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          `
        );
      }
      const modalTitle = modal.querySelector(".wallet-adapter-modal-title") as HTMLElement | null;
      if (modalTitle) {
        modalTitle.setAttribute(
          "style",
          `
            font-family: 'Orbitron', sans-serif !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            color: #00ffcc !important;
            text-align: center !important;
            margin-bottom: 24px !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
          `
        );
      }
    };

    fixModalAndButtons();
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(fixModalAndButtons, MODAL_DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimeout);
    };
  }, []);
const calculateSkillBonus = (
  skillLevel: number,
  traitValue: string | number,
  skillName: string,
  profession: string, // Unused but kept for compatibility
  outputResource: ResourceKey
): number => {
  let baseBonus = skillLevel * 0.001; // 0.1% per level
  let traitMultiplier = 1;

  // Find the trait key for the resource
  const traitKey = Object.keys(traitResourceMap).find((key) =>
    Object.values(traitResourceMap[key]).includes(outputResource)
  );
  if (!traitKey) {
    console.warn(`[calculateSkillBonus] No trait key found for resource ${outputResource}`);
    return baseBonus; // No trait bonus if resource isn't mapped
  }

  // Verify the trait value maps to the resource
  const resourceForTrait = traitResourceMap[traitKey]?.[traitValue as string];
  if (resourceForTrait !== outputResource) {
    return baseBonus; // No trait bonus if trait value doesn't match resource
  }

  if (typeof traitValue === "number") {
    traitMultiplier = traitValue / 1000; // Normalize Rarity Rank (not used here)
  } else {
    const traitMap: { [key: string]: number } = {
      // Accessory
      "Gold Chain": 1.1,
      "Silver Chain": 1.1,
      Mole: 1.1,
      "Clown Nose": 1.1,
      Choker: 1.3,
      Earring: 1.8,
      Frown: 1.8,
      // Background
      BlueBG: 1.1,
      VioletBG: 1.3,
      BlackBG: 1.0,
      RedBG: 1.2,
      OrangeBG: 1.3,
      GreenBG: 1.3,
      DefaultBG: 1.0,
      // Body
      "Blue UFO": 1.2,
      "Gold UFO": 1.5,
      "Red UFO": 1.5,
      "Silver UFO": 1.3,
      "Pink UFO": 1.3,
      "Green UFO": 1.3,
      DefaultBody: 1.0,
      // Eyes
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
      // Hair
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
      // Mouth
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
};
const calculateTotalBonus = (
  skills: { [skillName: string]: NFTSkill },
  traits: { [traitName: string]: string | number },
  profession: string,
  outputResource?: ResourceKey
) => {
  return Object.entries(skills).reduce((total, [skillName, skill]) => {
    const resourceMatch = skillName.match(/(\w+) Efficiency/i);
    const resource = resourceMatch ? resourceMatch[1] as ResourceKey : null;
    if (!resource) {
      console.warn(`[calculateTotalBonus] Invalid skill name format: ${skillName}`);
      return total;
    }
    if (outputResource && resource !== outputResource) return total;

    const traitKey = Object.keys(traitResourceMap).find((key) =>
      Object.values(traitResourceMap[key]).includes(resource)
    );
    if (!traitKey) {
      console.warn(`[calculateTotalBonus] No trait key found for resource: ${resource}, skill: ${skillName}`);
      return total;
    }

    const traitValue = traits[traitKey] || "Default";
    const bonus = calculateSkillBonus(skill.level, traitValue, skillName, profession, resource);
    console.log(`[calculateTotalBonus] Skill: ${skillName}, Resource: ${resource}, TraitKey: ${traitKey}, TraitValue: ${traitValue}, Bonus: ${bonus}`);
    return total + bonus;
  }, 0);
};


const fetchUserData = async (walletAddress: string) => {
  if (!firestore || !walletAddress) return;

  const cacheKey = `userData_${walletAddress}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    setUserData(parsedData);
    setPowerCellSlots(parsedData.powerCellSlots || []);
    setClaimableFabricatorProduct(parsedData.claimableFabricatorProduct || null);
    console.log("[fetchUserData] Loaded from cache");
    return;
  }

  try {
    const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", walletAddress));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      const validProduct = docData.SelectedFabricatorProduct && fabricatorProducts[docData.SelectedFabricatorProduct]
        ? docData.SelectedFabricatorProduct
        : null;
      const updatedUserData: UserData = {
        ...defaultUserData,
        wallet: docData.Wallet || walletAddress,
        name: docData.Name || "Player",
        nfts: docData.NFTs || 0,
        ufos: docData.UFOS || 0,
        emptyPowerCell: docData.EmptyPowerCell || 0,
        fullPowerCell: docData.FullPowerCell || 0,
        brokenPowerCell: docData.BrokenPowerCell || 0,
        ice: docData.Ice || 0,
        co2: docData.co2 || 0,
        water: docData.Water || 0,
        halite: docData.Halite || 0,
        chargingPowerCell: docData.ChargingPowerCell || 0,
        claimableFullPowerCell: docData.ClaimableFullPowerCell || 0,
        scavengerWorking: docData.ScavengerWorking || 0,
        cadWorking: docData.cadWorking || 0,
        scavengerWorkingEnd: docData.ScavengerWorkingEnd || 0,
        cadWorkingEnd: docData.cadWorkingEnd || 0,
        chargingWaterFilter: docData.ChargingWaterFilter || 0,
        claimableWater: docData.ClaimableWater || 0,
        chargingWorkShop: docData.ChargingWorkShop || 0,
        claimableEmptyPowerCell: docData.ClaimableEmptyPowerCell || 0,
        timeStamp: docData.TimeStamp ? new Date(docData.TimeStamp.seconds * 1000) : null,
        timeStampScavenger: docData.TimeStampScavenger
          ? new Date(docData.TimeStampScavenger.seconds * 1000)
          : null,
        timeStampCad: docData.TimeStampCad ? new Date(docData.TimeStampCad.seconds * 1000) : null,
        timeStampW: docData.TimeStampW ? new Date(docData.TimeStampW.seconds * 1000) : null,
        timeStampS: docData.TimeStampS ? new Date(docData.TimeStampS.seconds * 1000) : null,
        timeStampDailyClaim: docData.TimeStampDailyClaim
          ? new Date(docData.TimeStampDailyClaim.seconds * 1000)
          : null,
        powerCellSlots: docData.PowerCellSlots
          ? docData.PowerCellSlots.map((slot: any) => ({
              ...slot,
              timeStamp: slot.timeStamp ? new Date(slot.timeStamp.seconds * 1000) : null,
              // Remove progress
            }))
          : [],
        selectedNFT: docData.SelectedNFT || null,
        activeProfession: docData.ActiveProfession || null,
        professionSwitchTimestamp: docData.ProfessionSwitchTimestamp
          ? new Date(docData.ProfessionSwitchTimestamp.seconds * 1000)
          : null,
        professions: docData.Professions || defaultUserData.professions,
        crystalOre: docData.CrystalOre || 0,
        rareEarths: docData.RareEarths || 0,
        purifiedWater: docData.PurifiedWater || 0,
        plasmaFluid: docData.PlasmaFluid || 0,
        quantumCells: docData.QuantumCells || 0,
        energyCores: docData.EnergyCores || 0,
        biofiber: docData.Biofiber || 0,
        sporeEssence: docData.SporeEssence || 0,
        alloyIngots: docData.AlloyIngots || 0,
        nanosteel: docData.Nanosteel || 0,
        catalysts: docData.Catalysts || 0,
        polymers: docData.Polymers || 0,
        spareParts: docData.SpareParts || 0,
        circuitBoards: docData.CircuitBoards || 0,
        tradeContracts: docData.TradeContracts || 0,
        marketTokens: docData.MarketTokens || 0,
        processedGems: docData.ProcessedGems || 0,
        exoticCrystals: docData.ExoticCrystals || 0,
        hydrogenFuel: docData.HydrogenFuel || 0,
        fusionFluid: docData.FusionFluid || 0,
        plasmaCores: docData.PlasmaCores || 0,
        antimatterCells: docData.AntimatterCells || 0,
        bioPolymers: docData.BioPolymers || 0,
        nanoOrganics: docData.NanoOrganics || 0,
        superAlloys: docData.SuperAlloys || 0,
        metaMaterials: docData.MetaMaterials || 0,
        nanoCatalysts: docData.NanoCatalysts || 0,
        quantumChemicals: docData.QuantumChemicals || 0,
        advancedComponents: docData.AdvancedComponents || 0,
        roboticModules: docData.RoboticModules || 0,
        cryptoCredits: docData.CryptoCredits || 0,
        galacticBonds: docData.GalacticBonds || 0,
        solarPanel: docData.SolarPanel || 0,
        ionThruster: docData.IonThruster || 0,
        lifeSupportModule: docData.LifeSupportModule || 0,
        quantumDrive: docData.QuantumDrive || 0,
        nanoAssembler: docData.NanoAssembler || 0,
        bioCircuit: docData.BioCircuit || 0,
        crystalMatrix: docData.CrystalMatrix || 0,
        hydroCore: docData.HydroCore || 0,
        tradeBeacon: docData.TradeBeacon || 0,
        gravitonShield: docData.GravitonShield || 0,
        neuralInterface: docData.NeuralInterface || 0,
        antimatterWarhead: docData.AntimatterWarhead || 0,
        holoProjector: docData.HoloProjector || 0,
        bioReactorCore: docData.BioReactorCore || 0,
        buildingLevels: docData.BuildingLevels || {},
        buildingTimestamps: Object.keys(docData.BuildingTimestamps || {}).reduce(
          (acc, key) => ({
            ...acc,
            [key]: docData.BuildingTimestamps[key] ? new Date(docData.BuildingTimestamps[key].seconds * 1000) : null,
          }),
          {}
        ),
        buildingClaimables: docData.BuildingClaimables || {},
        selectedFabricatorProduct: validProduct,
        streakCount: docData.StreakCount || 0,
        claimableFabricatorProduct: docData.ClaimableFabricatorProduct || null,
      };
      setUserData(updatedUserData);
      setPowerCellSlots(updatedUserData.powerCellSlots || []);
      setClaimableFabricatorProduct(validProduct);
      localStorage.setItem(cacheKey, JSON.stringify(updatedUserData));
      console.log("[fetchUserData] Fetched and updated user data");
    }
  } catch (error) {
    console.error("[fetchUserData] Error fetching user data:", error);
    showToast("error", "Failed to sync data", "Please try again or reconnect.", 3000);
  }
};

// Calculate cumulative EXP required to reach a given level
const getCumulativeExpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 32 * (Math.pow(2, level - 1) - 1);
};

// Calculate EXP required to advance from current level to next
const getExpRequiredForNextLevel = (level: number): number => {
  return 32 * Math.pow(2, level - 1);
};

// Calculate progress percentage toward next level
const getExpProgressPercentage = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  const expForNextLevel = getExpRequiredForNextLevel(level);
  const expTowardNextLevel = Math.max(0, exp - baseExp);
  return (expTowardNextLevel / expForNextLevel) * 100;
};

// Calculate EXP toward current level for display
const getExpTowardNextLevel = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  return Math.max(0, exp - baseExp);
};


const getClaimableBuildings = () => {
  return Object.keys(userData.buildingClaimables).filter(
    (building) => userData.buildingClaimables[building] > 0
  );
};

// Music-related functions
const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const newVolume = Number(event.target.value);
  setVolume(newVolume);
  if (audioRef.current) {
    audioRef.current.volume = newVolume / 100;
    audioRef.current.muted = newVolume === 0;
    console.log("Volume set to:", newVolume);
  }
};

const handleVolumeClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsVolumeOpen(!isVolumeOpen);
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const togglePlayPause = () => {
  if (!audioRef.current) {
    console.error("Audio ref is null");
    return;
  }

  const audio = audioRef.current;

  if (isPlaying) {
    audio.pause();
    setIsPlaying(false);
    console.log("Audio paused");
  } else {
    if (audio.src !== AUDIO_TRACKS[currentTrack].src) {
      audio.src = AUDIO_TRACKS[currentTrack].src;
    }
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        console.log("Audio started playing");
        updateTime();
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
showToast("error", "Playback Failed", "Could not play audio. Check console.", 3000);
      });
  }
};

const changeTrack = (direction: 'next' | 'prev') => {
  if (!audioRef.current) {
    console.error("Audio ref is null");
    return;
  }
  const audio = audioRef.current;
  audio.pause(); // Pause current track

  const newTrack = direction === 'next'
    ? (currentTrack + 1) % AUDIO_TRACKS.length
    : (currentTrack - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length;

  setCurrentTrack(newTrack);
  setCurrentTime(0); // Reset time for new track
  audio.src = AUDIO_TRACKS[newTrack].src;

  // Wait for the audio to be ready before playing
  const playWhenReady = () => {
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        console.log("Track changed and playing");
        updateTime();
      })
      .catch((error) => {
        console.error("Error playing new track:", error);
showToast("error", "Playback Failed", "Could not play the new track.", 3000);
      });
  };

  audio.addEventListener('canplay', playWhenReady, { once: true });
};

const updateTime = () => {
  if (!audioRef.current) {
    console.error("Audio ref is null");
    return;
  }
  const time = audioRef.current.currentTime || 0;
  const dur = audioRef.current.duration || 0;
  setCurrentTime(time);
  setDuration(dur);
  console.log("Time updated - current:", time, "duration:", dur);
};

useEffect(() => {
  console.log("userData updated:", userData);
  console.log("Active Profession:", userData.activeProfession);
  console.log("Visible Buildings:", getVisibleBuildings(userData.activeProfession));
}, [userData]);


// Audio setup useEffect
// Audio setup useEffect
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) {
    console.warn("Audio element not found during setup");
    return;
  }

  const setupAudio = () => {
    audio.src = AUDIO_TRACKS[currentTrack].src;
    audio.volume = volume / 100;
    audio.muted = volume === 0;

    const handleTimeUpdate = () => {
      updateTime();
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      console.log("Metadata loaded, duration:", audio.duration);
    };

    const handleSongEnd = () => {
      console.log("Song ended, switching to next");
      changeTrack('next');
    };

    const handleError = (e: Event) => {
      console.error("Audio load error:", e);
showToast("error", "Audio Load Error", "Failed to load audio file. Check console.", 3000);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleSongEnd);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleSongEnd);
      audio.removeEventListener('error', handleError);
    };
  };

  const cleanup = setupAudio();
  return cleanup;
}, [currentTrack]); // Dependencies remain the same

// Volume update useEffect
useEffect(() => {
  if (!audioRef.current) {
    console.warn("Audio element not found during volume update");
    return;
  }
  const audio = audioRef.current;
  audio.volume = volume / 100;
  audio.muted = volume === 0;
  console.log("Volume updated to:", volume);
}, [volume]);

// Volume update useEffect with fix
useEffect(() => {
  const updateVolume = () => {
    if (!audioRef.current) {
      console.error("Audio ref is null");
      return;
    }
    const audio = audioRef.current;
    audio.volume = volume / 100;
    audio.muted = volume === 0;
    console.log("Volume updated to:", volume);
  };

  const timeout = setTimeout(updateVolume, 0);
  return () => clearTimeout(timeout);
}, [volume]);


const shouldShowProgressBars = !isInventoryOpen && !isSkillPointsModalOpen && !isMarketOpen && !isLaboratoryOpen && !isFabricatorModalOpen && !isProfessionModalOpen && !isTransferFormOpen && !isNameFormOpen && !isConfirmModalOpen;



  // Replace the saveUserData function with this updated version:

// Utility for deep comparison that handles Date objects and nested structures
const areEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!areEqual(obj1[key], obj2[key])) return false;
  }
  return true;
};

const saveUserData = async (updatedData: UserData) => {
  if (!publicKey) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to save data.", 3000);
    return;
  }

  if (areEqual(userData, updatedData)) {
    console.log("[saveUserData] No changes detected, skipping save.");
    return;
  }

  setIsClaiming2(true)
  try {
    const response = await fetch(`${API_BASE}/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const result = await response.json();
    console.log("[saveUserData] Save result:", result);
    if (response.ok) {
      setIsClaiming2(false)
      localStorage.setItem(`userData_${updatedData.wallet}`, JSON.stringify(updatedData));
      console.log("[saveUserData] Data saved successfully for wallet:", updatedData.wallet);
    } else {
      console.warn("[saveUserData] Error:", result.error);
      showToast("error", "Failed to Save", result.error || "No user document found.", 3000);
    }
  } catch (error) {
    console.error("[saveUserData] Error saving user data:", error);
    showToast("error", "Failed to Save Data", "Changes are only saved locally.", 3000);
  }
};







  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel((prev) => {
          const delta = e.deltaY < 0 ? 0.1 : -0.1; // Zoom in or out
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev + delta));
          if (mapContainerRef.current) {
            const container = mapContainerRef.current;
            const centerX = container.scrollLeft + container.offsetWidth / 2;
            const centerY = container.scrollTop + container.offsetHeight / 2;
            const newMapSize = calculateMapSize(newZoom);
            container.scrollLeft = (centerX * (newMapSize.width / (baseMapSize * prev))) - container.offsetWidth / 2;
            container.scrollTop = (centerY * (newMapSize.height / (baseMapSize * prev))) - container.offsetHeight / 2;
          }
          return newZoom;
        });
      }
    };
  
    document.addEventListener("wheel", handleWheel, { passive: false });
  
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

const renderResourceToastContent = (message: string, items: { key: ResourceKey | "text"; amount: number; text?: string }[]) => {
  return (
    <div className="flex flex-col gap-1">
      <span>{message}</span>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, amount, text }) => {
          if (key === "text" && text) {
            return (
              <div key={key} className="flex items-center gap-1">
                <span>{text}</span>
              </div>
            );
          }
          if (key === "ufos") {
            return (
              <div key={key} className="flex items-center gap-1">
                <img
                  src={GAME_ASSETS.coin || "/placeholder.svg"}
                  alt="UFOS"
                  className="w-6 h-6"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                  loading="lazy"
                />
                <span>{formatNumber(amount)}</span>
              </div>
            );
          }
          const resource = resources.find((r) => r.key === key);
          if (!resource) {
            console.warn(`[renderResourceToastContent] Resource not found for key: ${key}`);
            return null;
          }
          return (
            <div key={key} className="flex items-center gap-1">
              <img
                src={resource.image || "/placeholder.svg"}
                alt={resource.name}
                className="w-6 h-6"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                loading="lazy"
              />
              <span>{formatNumber(amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};



  const fabricatorProducts: Record<string, FabricatorProduct> = {
    IonThruster: {
      name: "Ion Thruster",
      requirements: {
        plasmaFluid: 10,
        metaMaterials: 5,
        advancedComponents: 10,
        fullPowerCell: 1,
      },
      cycleHours: 16,
      output: { ionThruster: 1 },
      outputKey: "ionThruster",
    },
    SolarPanel: {
      name: "Solar Panel",
      requirements: {
        quantumCells: 50,
        alloyIngots: 200,
        circuitBoards: 20,
        fullPowerCell: 1,
      },
      cycleHours: 12,
      output: { solarPanel: 1 },
      outputKey: "solarPanel",
    },

    LifeSupportModule: {
      name: "Life Support Module",
      requirements: {
        purifiedWater: 20,
        bioPolymers: 10,
        catalysts: 50,
        fullPowerCell: 1,
      },
      cycleHours: 14,
      output: { lifeSupportModule: 1 },
      outputKey: "lifeSupportModule",
    },
    TradeBeacon: {
      name: "Trade Beacon",
      requirements: {
        galacticBonds: 5,
        processedGems: 10,
        roboticModules: 5,
        fullPowerCell: 1,
      },
      cycleHours: 14,
      output: { tradeBeacon: 1 },
      outputKey: "tradeBeacon",
    },
    HydroCore: {
      name: "Hydro Core",
      requirements: {
        fusionFluid: 5,
        superAlloys: 10,
        energyCores: 20,
        fullPowerCell: 2,
      },
      cycleHours: 16,
      output: { hydroCore: 1 },
      outputKey: "hydroCore",
    },
    BioCircuit: {
      name: "Bio Circuit",
      requirements: {
        nanoOrganics: 5,
        bioPolymers: 10,
        plasmaCores: 5,
        circuitBoards: 20,
        fullPowerCell: 2,
      },
      cycleHours: 18,
      output: { bioCircuit: 1 },
      outputKey: "bioCircuit",
    },
    BioReactorCore: {
      name: "Bio-Reactor Core",
      requirements: {
        bioPolymers: 10,
        hydrogenFuel: 10,
        advancedComponents: 10,
        fullPowerCell: 1,
      },
      cycleHours: 14,
      output: { bioReactorCore: 1 },
      outputKey: "bioReactorCore",
    },
    HoloProjector: {
      name: "Holo-Projector",
      requirements: {
        processedGems: 10,
        plasmaCores: 5,
        cryptoCredits: 10,
        fullPowerCell: 1,
      },
      cycleHours: 16,
      output: { holoProjector: 1 },
      outputKey: "holoProjector",
    },
    NanoAssembler: {
      name: "Nano Assembler",
      requirements: {
        roboticModules: 10,
        advancedComponents: 20,
        metaMaterials: 5,
        quantumChemicals: 5,
        fullPowerCell: 2,
      },
      cycleHours: 20,
      output: { nanoAssembler: 1 },
      outputKey: "nanoAssembler",
    },
    CrystalMatrix: {
      name: "Crystal Matrix",
      requirements: {
        exoticCrystals: 5,
        antimatterCells: 3,
        nanoCatalysts: 10,
        fullPowerCell: 2,
      },
      cycleHours: 22,
      output: { crystalMatrix: 1 },
      outputKey: "crystalMatrix",
    },
    NeuralInterface: {
      name: "Neural Interface",
      requirements: {
        nanoOrganics: 5,
        quantumChemicals: 5,
        roboticModules: 10,
        fullPowerCell: 2,
      },
      cycleHours: 18,
      output: { neuralInterface: 1 },
      outputKey: "neuralInterface",
    },
    GravitonShield: {
      name: "Graviton Shield",
      requirements: {
        exoticCrystals: 10,
        fusionFluid: 5,
        metaMaterials: 5,
        fullPowerCell: 2,
      },
      cycleHours: 20,
      output: { gravitonShield: 1 },
      outputKey: "gravitonShield",
    },
    
    AntimatterWarhead: {
      name: "Antimatter Warhead",
      requirements: {
        antimatterCells: 3,
        superAlloys: 10,
        galacticBonds: 5,
        fullPowerCell: 2,
      },
      cycleHours: 22,
      output: { antimatterWarhead: 1 },
      outputKey: "antimatterWarhead",
    },
    QuantumDrive: {
      name: "Quantum Drive",
      requirements: {
        exoticCrystals: 10,
        fusionFluid: 5,
        antimatterCells: 3,
        nanoOrganics: 10,
        metaMaterials: 5,
        quantumChemicals: 5,
        roboticModules: 5,
        galacticBonds: 5,
        fullPowerCell: 2,
      },
      cycleHours: 24,
      output: { quantumDrive: 1 },
      outputKey: "quantumDrive",
    },
  };

  const ConfirmationModal = () => {
    if (!isConfirmModalOpen || !confirmModalDetails) return null;
  
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
        <Card className="w-[95vw] max-w-[360px] bg-gray-800 border-gray-600 text-white">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Confirm Action</h2>
            <p className="text-sm text-gray-300 mb-4">{confirmModalDetails.message}</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-xs text-black cursor-pointer"
                aria-label="Cancel action"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  confirmModalDetails.action();
                  setIsConfirmModalOpen(false);
                }}
                className="text-xs cursor-pointer"
                aria-label="Confirm action"
              >
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const buildingConfig: Record<string, Product> = {
  // Geologist: Produces crystalOre, rareEarths, processedGems, exoticCrystals
  CrystalMine: {
    requirements: { halite: 10, co2: 20, fullPowerCell: 1 },
    cycleHours: 6,
    output: { crystalOre: 200 },
    name: "Crystal Mine",
  },
  CrystalRefinery: {
    requirements: { crystalOre: 1000, fullPowerCell: 1 },
    cycleHours: 8,
    output: { rareEarths: 20 },
    name: "Crystal Refinery",
  },
  GemProcessor: {
    requirements: { rareEarths: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { processedGems: 10 },
    name: "Gem Processor",
  },
  CrystalSynthesizer: {
    requirements: { processedGems: 10, rareEarths: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { exoticCrystals: 5 },
    name: "Crystal Synthesizer",
  },

  // HydroEngineer: Produces purifiedWater, plasmaFluid, hydrogenFuel, fusionFluid
  AdvancedFilter: {
    requirements: { ice: 1000, fullPowerCell: 1 },
    cycleHours: 6,
    output: { purifiedWater: 50 },
    name: "Advanced Filter",
  },
  PlasmaReactor: {
    requirements: { purifiedWater: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { plasmaFluid: 20 },
    name: "Plasma Reactor",
  },
  HydrogenExtractor: {
    requirements: { purifiedWater: 100, fullPowerCell: 1 },
    cycleHours: 10,
    output: { hydrogenFuel: 10 },
    name: "Hydrogen Extractor",
  },
  FusionPlant: {
    requirements: { hydrogenFuel: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { fusionFluid: 5 },
    name: "Fusion Plant",
  },

  // PowerTechnician: Produces quantumCells, energyCores, plasmaCores, antimatterCells
  QuantumFoundry: {
    requirements: { co2: 100, halite: 10, fullPowerCell: 1 },
    cycleHours: 6,
    output: { quantumCells: 50 },
    name: "Quantum Foundry",
  },
  CoreReactor: {
    requirements: { quantumCells: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { energyCores: 20 },
    name: "Core Reactor",
  },
  PlasmaCoreFabricator: {
    requirements: { energyCores: 20, quantumCells: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { plasmaCores: 10 },
    name: "Plasma Core Fabricator",
  },
  AntimatterGenerator: {
    requirements: { plasmaCores: 10, energyCores: 10, fullPowerCell: 2 },
    cycleHours: 12,
    output: { antimatterCells: 5 },
    name: "Antimatter Generator",
  },

  // Botanist: Produces biofiber, sporeEssence, bioPolymers, nanoOrganics
  BiopolymerGreenhouse: {
    requirements: { water: 50, co2: 20, fullPowerCell: 1 },
    cycleHours: 6,
    output: { biofiber: 50 },
    name: "Biopolymer Greenhouse",
  },
  MyceliumExtractor: {
    requirements: { biofiber: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { sporeEssence: 20 },
    name: "Mycelium Extractor",
  },
  BioPolymerSynthesizer: {
    requirements: { sporeEssence: 20, biofiber: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { bioPolymers: 10 },
    name: "Bio Polymer Synthesizer",
  },
  NanoOrganicLab: {
    requirements: { bioPolymers: 10, sporeEssence: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { nanoOrganics: 5 },
    name: "Nano Organic Lab",
  },

  // Metallurgist: Produces alloyIngots, nanosteel, superAlloys, metaMaterials
  SmeltingForge: {
    requirements: { halite: 50, co2: 20, fullPowerCell: 1 },
    cycleHours: 6,
    output: { alloyIngots: 50 },
    name: "Smelting Forge",
  },
  Nanoforge: {
    requirements: { alloyIngots: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { nanosteel: 20 },
    name: "Nanoforge",
  },
  SuperAlloyForge: {
    requirements: { nanosteel: 20, alloyIngots: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { superAlloys: 10 },
    name: "Super Alloy Forge",
  },
  MetaMaterialSynthesizer: {
    requirements: { superAlloys: 10, nanosteel: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { metaMaterials: 5 },
    name: "Meta Material Synthesizer",
  },

  // Chemist: Produces catalysts, polymers, nanoCatalysts, quantumChemicals
  ChemicalSynthesizer: {
    requirements: { water: 50, co2: 20, fullPowerCell: 1 },
    cycleHours: 6,
    output: { catalysts: 50 },
    name: "Chemical Synthesizer",
  },
  PolymerizationPlant: {
    requirements: { catalysts: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { polymers: 20 },
    name: "Polymerization Plant",
  },
  NanoCatalystLab: {
    requirements: { polymers: 20, catalysts: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { nanoCatalysts: 10 },
    name: "Nano Catalyst Lab",
  },
  QuantumChemSynthesizer: {
    requirements: { nanoCatalysts: 10, polymers: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { quantumChemicals: 5 },
    name: "Quantum Chem Synthesizer",
  },

  // Mechanic: Produces spareParts, circuitBoards, advancedComponents, roboticModules
  AssemblyWorkshop: {
    requirements: { halite: 50, water: 20, fullPowerCell: 1 },
    cycleHours: 6,
    output: { spareParts: 50 },
    name: "Assembly Workshop",
  },
  ElectronicsFabricator: {
    requirements: { spareParts: 100, fullPowerCell: 1 },
    cycleHours: 8,
    output: { circuitBoards: 20 },
    name: "Electronics Fabricator",
  },
  ComponentFabricator: {
    requirements: { circuitBoards: 20, spareParts: 50, fullPowerCell: 1 },
    cycleHours: 10,
    output: { advancedComponents: 10 },
    name: "Component Fabricator",
  },
  RoboticsAssembler: {
    requirements: { advancedComponents: 10, circuitBoards: 20, fullPowerCell: 2 },
    cycleHours: 12,
    output: { roboticModules: 5 },
    name: "Robotics Assembler",
  },

  // Trader: Produces tradeContracts, marketTokens, cryptoCredits, galacticBonds
  CommerceHub: {
    requirements: { fullPowerCell: 1, ufos: 1000 },
    cycleHours: 6,
    output: { tradeContracts: 20 },
    name: "Commerce Hub",
  },
  TokenMinter: {
    requirements: { tradeContracts: 20, fullPowerCell: 1 },
    cycleHours: 8,
    output: { marketTokens: 10 },
    name: "Token Minter",
  },
  CryptoExchange: {
    requirements: { marketTokens: 10, tradeContracts: 20, fullPowerCell: 1 },
    cycleHours: 10,
    output: { cryptoCredits: 10 },
    name: "Crypto Exchange",
  },
  BondIssuer: {
    requirements: { cryptoCredits: 10, marketTokens: 10, fullPowerCell: 2 },
    cycleHours: 12,
    output: { galacticBonds: 5 },
    name: "Bond Issuer",
  },

  // Interstellar Fabricator: Handled by fabricatorProducts
  InterstellarFabricator: {
    requirements: {},
    cycleHours: 0,
    output: {},
    name: "Interstellar Fabricator",
  },
};
  const getResourceDisplayName = (key: string): string => {
    const resource = resources.find((r) => r.key === key);
    return resource ? resource.name : key; // Fallback to key if not found
  };

// Modified getProgressItems to use display progress states
const getProgressItems = (
  userData: UserData,
  displayScavengerProgress: number,
  displayCadProgress: number,
  displayWaterFilterProgress: number,
  displayWorkshopProgress: number,
  displayPowerCellProgress: number[],
  displayBuildingProgress: { [key: string]: number },
  buildingConfig: Record<string, Product>,
  buildingAssetMap: { [key: string]: keyof typeof GAME_ASSETS }
): ProgressItem[] => {
  const items: ProgressItem[] = [];

  // Scavenger
  if (userData.scavengerWorking > 0 || userData.scavengerWorkingEnd > 0) {
    items.push({
      key: "scavenger",
      progress: displayScavengerProgress,
      cycleHours: 6,
      icon: GAME_ASSETS.ice,
      displayName: "Ice Mining",
    });
  }

  // CAD
  if (userData.cadWorking > 0 || userData.cadWorkingEnd > 0) {
    items.push({
      key: "cad",
      progress: displayCadProgress,
      cycleHours: 6,
      icon: GAME_ASSETS.co2,
      displayName: "C.A.D. Mining",
    });
  }

  // Water Filter
  if (userData.chargingWaterFilter > 0 || userData.claimableWater > 0) {
    items.push({
      key: "waterFilter",
      progress: displayWaterFilterProgress,
      cycleHours: 8,
      icon: GAME_ASSETS.water,
      displayName: "Water Filtering",
    });
  }

  // Workshop
  if (userData.chargingWorkShop > 0 || userData.claimableEmptyPowerCell > 0) {
    items.push({
      key: "workshop",
      progress: displayWorkshopProgress,
      cycleHours: 10,
      icon: GAME_ASSETS.batteryEmpty,
      displayName: "Workshop",
    });
  }

  // Power Cell Slots
  powerCellSlots.forEach((slot, index) => {
    if (slot.isCharging || slot.isClaimable) {
      items.push({
        key: `powerCellSlot_${slot.id}`,
        progress: displayPowerCellProgress[index] || 0,
        cycleHours: 12,
        icon: GAME_ASSETS.batteryCharging,
        displayName: `Power Cell Slot ${slot.id + 1}`,
      });
    }
  });

  // Buildings
  Object.keys(buildingConfig).forEach((building) => {
    if (userData.buildingTimestamps[building] || userData.buildingClaimables[building] > 0) {
      let config: Product | FabricatorProduct = buildingConfig[building];
      let cycleHours = config.cycleHours;
      let outputKey: keyof typeof GAME_ASSETS;

      if (building === "InterstellarFabricator" && userData.selectedFabricatorProduct) {
        const fabricatorConfig = fabricatorProducts[userData.selectedFabricatorProduct];
        if (fabricatorConfig) {
          config = fabricatorConfig;
          cycleHours = fabricatorConfig.cycleHours;
          outputKey = fabricatorConfig.outputKey;
        } else {
          return;
        }
      } else {
        outputKey = Object.keys(config.output)[0] as keyof typeof GAME_ASSETS;
        if (!outputKey || !(outputKey in GAME_ASSETS)) {
          outputKey = buildingAssetMap[building];
        }
      }

      items.push({
        key: building,
        progress: displayBuildingProgress[building] || 0,
        cycleHours: cycleHours,
        icon: GAME_ASSETS[outputKey] || GAME_ASSETS[buildingAssetMap[building]] || "/placeholder.svg",
        displayName: config.name,
      });
    }
  });

  return items;
};

    // Update progress bars
useEffect(() => {
  const interval = setInterval(() => {
    updateProgressBars();
  }, 1000);

  return () => clearInterval(interval);
}, [userData, powerCellSlots]);
  
const updateProgressBars = () => {
  const now = new Date();
  let userDataChanged = false;
  let updatedUserData = { ...userData };

  // Power cell slots display progress
  const updatedDisplayProgress = powerCellSlots.map((slot) => {
    if (slot.isCharging && slot.timeStamp) {
      const elapsed = (now.getTime() - slot.timeStamp.getTime()) / 1000;
      const total = 12 * 60 * 60;
      const progress = Math.min(100, (elapsed / total) * 100);

      if (progress >= 100 && !slot.isClaimable) {
        console.log(`[updateProgressBars] Power cell slot ${slot.id} completed`);
        userDataChanged = true;
        updatedUserData = {
          ...updatedUserData,
          claimableFullPowerCell: (updatedUserData.claimableFullPowerCell || 0) + 1,
          powerCellSlots: updatedUserData.powerCellSlots.map((s) =>
            s.id === slot.id ? { ...s, isCharging: false, isClaimable: true, timeStamp: null } : s
          ),
        };
        if (!notifiedActions[`powerCellSlot_${slot.id}`]) {
          showToast(
            "success",
            "Power Cell Charged!",
            `Power cell slot ${slot.id + 1} is now fully charged and ready to claim.`,
            3000
          );
          markActionNotified(`powerCellSlot_${slot.id}`);
        }
        return 100;
      }
      return progress;
    } else if (slot.isClaimable) {
      return 100;
    }
    return 0;
  });
  setDisplayPowerCellProgress(updatedDisplayProgress);

  // Scavenger display progress
  if (userData.scavengerWorking > 0 && userData.timeStampScavenger) {
    const elapsed = (now.getTime() - userData.timeStampScavenger.getTime()) / 1000;
    const total = 6 * 60 * 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    setDisplayScavengerProgress(progress);
    if (progress >= 100 && userData.scavengerWorkingEnd === 0) {
      userDataChanged = true;
      updatedUserData = {
        ...updatedUserData,
        scavengerWorking: 0,
        scavengerWorkingEnd: 1,
        timeStampScavenger: null,
      };
      if (!notifiedActions["scavenger"]) {
        showToast("success", "Ice Mining Complete!", "Your ice miner has finished. Claim your rewards!", 3000);
        markActionNotified("scavenger");
      }
    }
  } else if (userData.scavengerWorkingEnd > 0) {
    setDisplayScavengerProgress(100);
  } else {
    setDisplayScavengerProgress(0);
  }

  // CAD display progress
  if (userData.cadWorking > 0 && userData.timeStampCad) {
    const elapsed = (now.getTime() - userData.timeStampCad.getTime()) / 1000;
    const total = 6 * 60 * 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    setDisplayCadProgress(progress);
    if (progress >= 100 && userData.cadWorkingEnd === 0) {
      userDataChanged = true;
      updatedUserData = {
        ...updatedUserData,
        cadWorking: 0,
        cadWorkingEnd: 1,
        timeStampCad: null,
      };
      if (!notifiedActions["cad"]) {
        showToast("success", "C.A.D. Complete!", "Your C.A.D. has finished. Claim your rewards!", 3000);
        markActionNotified("cad");
      }
    }
  } else if (userData.cadWorkingEnd > 0) {
    setDisplayCadProgress(100);
  } else {
    setDisplayCadProgress(0);
  }

  // Water Filter display progress
  if (userData.chargingWaterFilter > 0 && userData.timeStampW) {
    const elapsed = (now.getTime() - userData.timeStampW.getTime()) / 1000;
    const total = 8 * 60 * 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    setDisplayWaterFilterProgress(progress);
    if (progress >= 100 && userData.claimableWater === 0) {
      userDataChanged = true;
      updatedUserData = {
        ...updatedUserData,
        chargingWaterFilter: 0,
        claimableWater: 1,
        timeStampW: null,
      };
      if (!notifiedActions["waterFilter"]) {
        showToast("success", "Water Filtering Complete!", "Your water filter has finished processing.", 3000);
        markActionNotified("waterFilter");
      }
    }
  } else if (userData.claimableWater > 0) {
    setDisplayWaterFilterProgress(100);
  } else {
    setDisplayWaterFilterProgress(0);
  }

  // Workshop display progress
  if (userData.chargingWorkShop > 0 && userData.timeStampS) {
    const elapsed = (now.getTime() - userData.timeStampS.getTime()) / 1000;
    const total = 10 * 60 * 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    setDisplayWorkshopProgress(progress);
    if (progress >= 100 && userData.claimableEmptyPowerCell === 0) {
      userDataChanged = true;
      updatedUserData = {
        ...updatedUserData,
        chargingWorkShop: 0,
        claimableEmptyPowerCell: 1,
        timeStampS: null,
      };
      if (!notifiedActions["workshop"]) {
        showToast("success", "Workshop Complete!", "Your workshop has finished repairing power cells.", 3000);
        markActionNotified("workshop");
      }
    }
  } else if (userData.claimableEmptyPowerCell > 0) {
    setDisplayWorkshopProgress(100);
  } else {
    setDisplayWorkshopProgress(0);
  }

  // Buildings display progress
  const newBuildingProgress: { [key: string]: number } = {};
  Object.keys(buildingConfig).forEach((building) => {
    const timestamp = userData.buildingTimestamps[building];
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      let total = buildingConfig[building].cycleHours * 60 * 60;
      if (building === "InterstellarFabricator" && userData.selectedFabricatorProduct) {
        const config = fabricatorProducts[userData.selectedFabricatorProduct];
        if (config) {
          total = config.cycleHours * 60 * 60;
        } else {
          userDataChanged = true;
          updatedUserData = {
            ...updatedUserData,
            buildingTimestamps: {
              ...updatedUserData.buildingTimestamps,
              [building]: null,
            },
            selectedFabricatorProduct: null,
            claimableFabricatorProduct: null,
          };
          setDisplayFabricatorProgress(0);
          newBuildingProgress[building] = 0;
          return;
        }
      }
      const elapsed = (now.getTime() - timestamp.getTime()) / 1000;
      const progress = Math.min(100, (elapsed / total) * 100);

      if (progress >= 100 && userData.buildingClaimables[building] === 0) {
        userDataChanged = true;
        const newClaimableCount = (userData.buildingClaimables[building] || 0) + 1;
        const newClaimableProduct =
          building === "InterstellarFabricator" && userData.selectedFabricatorProduct
            ? userData.selectedFabricatorProduct
            : userData.claimableFabricatorProduct;

        updatedUserData = {
          ...updatedUserData,
          buildingTimestamps: {
            ...updatedUserData.buildingTimestamps,
            [building]: null,
          },
          buildingClaimables: {
            ...updatedUserData.buildingClaimables,
            [building]: newClaimableCount,
          },
          claimableFabricatorProduct: newClaimableProduct,
        };

        if (!notifiedActions[building]) {
          if (building === "InterstellarFabricator") {
            setDisplayFabricatorProgress(100);
            setClaimableFabricatorProduct(newClaimableProduct);
            showToast(
              "success",
              "Production Complete",
              `Interstellar Fabricator production is ready to claim!`,
              3000
            );
            setIsFabricatorModalOpen(true);
          } else {
            showToast(
              "success",
              "Production Complete",
              `${buildingConfig[building]?.name || building} production is ready to claim!`,
              3000
            );
          }
          markActionNotified(building);
        }
      }
      newBuildingProgress[building] = progress;
    } else if (userData.buildingClaimables[building] > 0) {
      newBuildingProgress[building] = 100;
    } else {
      newBuildingProgress[building] = 0;
    }
  });
  setDisplayBuildingProgress(newBuildingProgress);

  // Fabricator progress
  if (userData.buildingTimestamps.InterstellarFabricator && userData.selectedFabricatorProduct) {
    const timestamp = userData.buildingTimestamps.InterstellarFabricator;
    if (timestamp) {
      const config = fabricatorProducts[userData.selectedFabricatorProduct];
      if (config) {
        const total = config.cycleHours * 60 * 60;
        const elapsed = (now.getTime() - timestamp.getTime()) / 1000;
        const progress = Math.min(100, (elapsed / total) * 100);
        setDisplayFabricatorProgress(progress);
      }
    }
  } else if (userData.claimableFabricatorProduct) {
    setDisplayFabricatorProgress(100);
  } else {
    setDisplayFabricatorProgress(0);
  }

  if (userDataChanged) {
    setUserData(updatedUserData);
    setPowerCellSlots(updatedUserData.powerCellSlots);
    saveUserData(updatedUserData);
  }
};

// Modified claimAllPowerCells - no progress
const claimAllPowerCells = async () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (isActionLocked) {
    return;
  }

  const claimableSlots = powerCellSlots.filter((slot) => slot.isClaimable);
  if (claimableSlots.length === 0) {
    return;
  }

  setIsActionLocked(true);

  try {
    const updatedSlots = powerCellSlots.map((slot) =>
      slot.isClaimable
        ? { ...slot, isCharging: false, isClaimable: false, timeStamp: null }
        : slot
    );

    const totalCells = claimableSlots.length;

    const updatedUserData = {
      ...userData,
      fullPowerCell: userData.fullPowerCell + totalCells,
      claimableFullPowerCell: userData.claimableFullPowerCell - totalCells,
      powerCellSlots: updatedSlots,
    };

    if (userData.selectedNFT) {
      await addNFTExperience(32 * totalCells);
    }

    setPowerCellSlots(updatedSlots);
    setUserData(updatedUserData);
    await saveUserData(updatedUserData);

    showToast("success", "Power Cells Claimed", `You've claimed ${totalCells} fully charged power cell${totalCells > 1 ? 's' : ''}!`, 3000);
  } catch (error) {
    console.error("[claimAllPowerCells] Error:", error);
  } finally {
    setIsActionLocked(false);
  }
};

useEffect(() => {
  const mapElement = mapContainerRef.current;
  if (!mapElement) return;

  let velocityX = 0;
  let velocityY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  const friction = isMobile ? 0.9 : 0.85;
  const damping = 0.95;
  let animationFrameId: number;

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const getPinchDistance = (touches: TouchList) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPinchMidpoint = (touches: TouchList) => {
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isDragging.current = true;
    isPinching.current = false;
    startX.current = e.pageX;
    startY.current = e.pageY;
    scrollLeft.current = mapElement.scrollLeft;
    scrollTop.current = mapElement.scrollTop;
    lastX = e.pageX;
    lastY = e.pageY;
    lastTime = performance.now();
    velocityX = 0;
    velocityY = 0;
    mapElement.style.cursor = "grabbing";
    cancelAnimationFrame(animationFrameId);
    mapElement.style.userSelect = "none";
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      isPinching.current = false;
      startX.current = e.touches[0].pageX;
      startY.current = e.touches[0].pageY;
      scrollLeft.current = mapElement.scrollLeft;
      scrollTop.current = mapElement.scrollTop;
      lastX = e.touches[0].pageX;
      lastY = e.touches[0].pageY;
      lastTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      mapElement.style.cursor = "grabbing";
      cancelAnimationFrame(animationFrameId);
      mapElement.style.userSelect = "none";
    } else if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior to handle it manually
      isDragging.current = false;
      isPinching.current = true;
      initialPinchDistance.current = getPinchDistance(e.touches);
      initialZoom.current = zoomLevel;
      pinchMidpoint.current = getPinchMidpoint(e.touches);
      cancelAnimationFrame(animationFrameId);
      mapElement.style.userSelect = "none";
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      mapElement.style.cursor = "grab";
      mapElement.style.userSelect = "auto";
      animateMomentum();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (isDragging.current && e.touches.length < 2) {
      isDragging.current = false;
      mapElement.style.cursor = "grab";
      mapElement.style.userSelect = "auto";
      animateMomentum();
    }
    if (isPinching.current && e.touches.length < 2) {
      isPinching.current = false;
      mapElement.style.userSelect = "auto";
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const currentTime = performance.now();
    const x = e.pageX;
    const y = e.pageY;
    const deltaX = x - lastX;
    const deltaY = y - lastY;
    const deltaTime = (currentTime - lastTime) / 1000;
    const mapSize = calculateMapSize(zoomLevel);

    const walkX = (x - startX.current) * 1.0;
    const walkY = (y - startY.current) * 1.0;
    mapElement.scrollLeft = clamp(scrollLeft.current - walkX, 0, mapSize.width - mapElement.offsetWidth);
    mapElement.scrollTop = clamp(scrollTop.current - walkY, 0, mapSize.height - mapElement.offsetHeight);

    if (deltaTime > 0) {
      velocityX = (deltaX / deltaTime) * 0.02;
      velocityY = (deltaY / deltaTime) * 0.02;
    }

    lastX = x;
    lastY = y;
    lastTime = currentTime;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging.current && e.touches.length === 1) {
      e.preventDefault();
      const currentTime = performance.now();
      const x = e.touches[0].pageX;
      const y = e.touches[0].pageY;
      const deltaX = x - lastX;
      const deltaY = y - lastY;
      const deltaTime = (currentTime - lastTime) / 1000;
      const mapSize = calculateMapSize(zoomLevel);

      const walkX = (x - startX.current) * 1.0;
      const walkY = (y - startY.current) * 1.0;
      mapElement.scrollLeft = clamp(scrollLeft.current - walkX, 0, mapSize.width - mapElement.offsetWidth);
      mapElement.scrollTop = clamp(scrollTop.current - walkY, 0, mapSize.height - mapElement.offsetHeight);

      if (deltaTime > 0) {
        velocityX = (deltaX / deltaTime) * 0.02;
        velocityY = (deltaY / deltaTime) * 0.02;
      }

      lastX = x;
      lastY = y;
      lastTime = currentTime;
    } else if (isPinching.current && e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getPinchDistance(e.touches);
      const scaleFactor = currentDistance / initialPinchDistance.current;
      const newZoom = clamp(initialZoom.current * scaleFactor, minZoom, maxZoom);

      setZoomLevel((prev) => {
        if (newZoom === prev) return prev;

        const rect = mapElement.getBoundingClientRect();
        const midpoint = getPinchMidpoint(e.touches);
        const relativeX = midpoint.x - rect.left;
        const relativeY = midpoint.y - rect.top;

        const mapSizeBefore = calculateMapSize(prev);
        const mapSizeAfter = calculateMapSize(newZoom);
        const zoomRatio = newZoom / prev;

        const newScrollLeft = (mapElement.scrollLeft + relativeX) * zoomRatio - relativeX;
        const newScrollTop = (mapElement.scrollTop + relativeY) * zoomRatio - relativeY;

        mapElement.scrollLeft = clamp(newScrollLeft, 0, mapSizeAfter.width - mapElement.offsetWidth);
        mapElement.scrollTop = clamp(newScrollTop, 0, mapSizeAfter.height - mapElement.offsetHeight);

        return newZoom;
      });
    }
  };

  const animateMomentum = () => {
    const mapSize = calculateMapSize(zoomLevel);
    const currentScrollLeft = mapElement.scrollLeft;
    const currentScrollTop = mapElement.scrollTop;

    velocityX *= friction * damping;
    velocityY *= friction * damping;

    const isAtLeftEdge = currentScrollLeft <= 0 && velocityX > 0;
    const isAtRightEdge = currentScrollLeft >= mapSize.width - mapElement.offsetWidth && velocityX < 0;
    const isAtTopEdge = currentScrollTop <= 0 && velocityY > 0;
    const isAtBottomEdge = currentScrollTop >= mapSize.height - mapElement.offsetHeight && velocityY < 0;

    if (
      (Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5) ||
      isAtLeftEdge ||
      isAtRightEdge ||
      isAtTopEdge ||
      isAtBottomEdge
    ) {
      velocityX = 0;
      velocityY = 0;
      cancelAnimationFrame(animationFrameId);
      return;
    }

    mapElement.scrollLeft = clamp(currentScrollLeft - velocityX, 0, mapSize.width - mapElement.offsetWidth);
    mapElement.scrollTop = clamp(currentScrollTop - velocityY, 0, mapSize.height - mapElement.offsetHeight);

    animationFrameId = requestAnimationFrame(animateMomentum);
  };

  mapElement.style.overscrollBehavior = "contain";
  mapElement.style.scrollBehavior = "auto";

  mapElement.addEventListener("mousedown", handleMouseDown);
  mapElement.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("touchend", handleTouchEnd);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("touchmove", handleTouchMove, { passive: false });

  return () => {
    mapElement.removeEventListener("mousedown", handleMouseDown);
    mapElement.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("touchmove", handleTouchMove);
    cancelAnimationFrame(animationFrameId);
    mapElement.style.userSelect = "auto";
    mapElement.style.overscrollBehavior = "auto";
    mapElement.style.scrollBehavior = "smooth";
  };
}, [isMobile, zoomLevel]);


// Handle zoom with mouse wheel
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    if (!mapContainerRef.current) return;
    e.preventDefault();

    const container = mapContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setZoomLevel((prev) => {
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, prev + delta));

      // Calculate the mouse position relative to the map
      const mapSizeBefore = calculateMapSize(prev);
      const mapSizeAfter = calculateMapSize(newZoom);
      const zoomRatio = newZoom / prev;

      // Adjust scroll position to keep the mouse point stable
      const newScrollLeft = (container.scrollLeft + mouseX) * zoomRatio - mouseX;
      const newScrollTop = (container.scrollTop + mouseY) * zoomRatio - mouseY;

      // Clamp scroll positions to prevent going out of bounds
      container.scrollLeft = Math.max(0, Math.min(newScrollLeft, mapSizeAfter.width - container.offsetWidth));
      container.scrollTop = Math.max(0, Math.min(newScrollTop, mapSizeAfter.height - container.offsetHeight));

      return newZoom;
    });
  };

  const mapElement = mapContainerRef.current;
  if (mapElement) {
    mapElement.addEventListener("wheel", handleWheel, { passive: false });
  }

  return () => {
    if (mapElement) {
      mapElement.removeEventListener("wheel", handleWheel);
    }
  };
}, []);

// Zoom in function
const zoomIn = () => {
  if (!mapContainerRef.current) return;

  setZoomLevel((prev) => {
    const newZoom = Math.min(maxZoom, prev + 0.1);
    const container = mapContainerRef.current!;
    const mapSizeBefore = calculateMapSize(prev);
    const mapSizeAfter = calculateMapSize(newZoom);
    const zoomRatio = newZoom / prev;

    // Center zoom on the viewport's center
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;

    const newScrollLeft = (container.scrollLeft + centerX) * zoomRatio - centerX;
    const newScrollTop = (container.scrollTop + centerY) * zoomRatio - centerY;

    // Clamp scroll positions
    container.scrollLeft = Math.max(0, Math.min(newScrollLeft, mapSizeAfter.width - container.offsetWidth));
    container.scrollTop = Math.max(0, Math.min(newScrollTop, mapSizeAfter.height - container.offsetHeight));

    return newZoom;
  });
};

// Zoom out function
const zoomOut = () => {
  if (!mapContainerRef.current) return;

  setZoomLevel((prev) => {
    const newZoom = Math.max(minZoom, prev - 0.1);
    const container = mapContainerRef.current!;
    const mapSizeBefore = calculateMapSize(prev);
    const mapSizeAfter = calculateMapSize(newZoom);
    const zoomRatio = newZoom / prev;

    // Center zoom on the viewport's center
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;

    const newScrollLeft = (container.scrollLeft + centerX) * zoomRatio - centerX;
    const newScrollTop = (container.scrollTop + centerY) * zoomRatio - centerY;

    // Clamp scroll positions
    container.scrollLeft = Math.max(0, Math.min(newScrollLeft, mapSizeAfter.width - container.offsetWidth));
    container.scrollTop = Math.max(0, Math.min(newScrollTop, mapSizeAfter.height - container.offsetHeight));

    return newZoom;
  });
};
  const buildingAssetMap: { [key: string]: keyof typeof GAME_ASSETS } = {
    CrystalMine: "crystalMine",
    CrystalRefinery: "crystalRefinery",
    AdvancedFilter: "advancedFilter",
    PlasmaReactor: "plasmaReactor",
    QuantumFoundry: "quantumFoundry",
    CoreReactor: "coreReactor",
    BiopolymerGreenhouse: "biopolymerGreenhouse",
    MyceliumExtractor: "myceliumExtractor",
    SmeltingForge: "smeltingForge",
    Nanoforge: "nanoForge",
    ChemicalSynthesizer: "chemicalSynthesizer",
    PolymerizationPlant: "polymerizationPlant",
    AssemblyWorkshop: "assemblyWorkshop",
    ElectronicsFabricator: "electronicsFabricator",
    CommerceHub: "commerceHub",
    TokenMinter: "tokenMinter",
    GemProcessor: "gemProcessor",
    CrystalSynthesizer: "crystalSynthesizer",
    HydrogenExtractor: "hydrogenExtractor",
    FusionPlant: "fusionPlant",
    PlasmaCoreFabricator: "plasmaCoreFabricator",
    AntimatterGenerator: "antimatterGenerator",
    BioPolymerSynthesizer: "bioPolymerSynthesizer",
    NanoOrganicLab: "nanoOrganicLab",
    SuperAlloyForge: "superAlloyForge",
    MetaMaterialSynthesizer: "metaMaterialSynthesizer",
    NanoCatalystLab: "nanoCatalystLab",
    QuantumChemSynthesizer: "quantumChemSynthesizer",
    ComponentFabricator: "componentFabricator",
    RoboticsAssembler: "roboticsAssembler",
    CryptoExchange: "cryptoExchange",
    BondIssuer: "bondIssuer",
    InterstellarFabricator: "interstellarFabricator",

  };


 const getVisibleBuildings = (activeProfession: string | null) => {
  if (!activeProfession) {
    return [];
  }
  const buildings = Object.keys(buildingProfessionMap).filter(
    (building) =>
      buildingProfessionMap[building] === activeProfession ||
      building === "InterstellarFabricator" // Allow for all professions
  );
  buildings.forEach((building) => {
    const assetKey = buildingAssetMap[building];

  });
  if (buildings.includes("InterstellarFabricator")) {
  } else {
  }
  return buildings;
};

const resetAndSelectProfession = async (newProfession: string) => {
  if (!walletConnected) {
showToast("error", "Wallet Not Connected", "Connect your wallet first.", 3000);    return;
  }
  if (userData.activeProfession === newProfession) {
showToast("error", "Already Selected", `You are already a ${newProfession}.`, 3000);    return;
  }
  const resetCost = 10000;
  if (userData.ufos < resetCost) {
showToast("error", "Not Enough UFOS", `You need ${resetCost} UFOS to reset and change professions.`, 3000);    return;
  }
  const updatedProfessions = { ...userData.professions };
  if (userData.activeProfession) {
    updatedProfessions[userData.activeProfession] = { level: 0, efficiencyBonus: 0 };
  }
  const updatedUserData = {
    ...userData,
    activeProfession: newProfession,
    professions: updatedProfessions,
    ufos: userData.ufos - resetCost,
    professionSwitchTimestamp: null,
  };
  setUserData(updatedUserData);
  await saveUserData(updatedUserData);
  await fetchUserData(userData.wallet); // Re-fetch to ensure sync
showToast("success", "Profession Changed", `You reset your skills and are now a ${newProfession}! Cost: ${resetCost} UFOS.`, 3000);
};
const upgradeProfessionSkill = (profession: string) => {
  if (!walletConnected) {
showToast("error", "Wallet Not Connected", "Connect your wallet first.", 3000);    return;
  }

  if (profession !== userData.activeProfession) {
showToast("error", "Invalid Profession", `You can only upgrade your active profession: ${userData.activeProfession || "None"}.`, 3000);
    return;
  }

  const currentLevel = userData.professions[profession].level;
  if (currentLevel >= 10) {
showToast("error", "Max Level Reached", "This profession is already at max level.", 3000);    return;
  }

  const costs = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const cost = costs[currentLevel];
  if (userData.ufos < cost) {
showToast("error", "Not Enough UFOS", `You need ${cost.toLocaleString()} UFOS to upgrade.`, 3000);    return;
  }

  const newLevel = currentLevel + 1;
  const updatedProfessions = {
    ...userData.professions,
    [profession]: {
      level: newLevel,
      efficiencyBonus: [0, 0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.28, 2.5, 5][newLevel],
    },
  };

  const updatedUserData = {
    ...userData,
    professions: updatedProfessions,
    ufos: userData.ufos - cost,
  };

  setUserData(updatedUserData);
  saveUserData(updatedUserData);

  if (newLevel === 10) {
showToast("success", "Max Level Achieved!", `Congratulations! Your ${profession} skill has reached the maximum level of 10! Efficiency Bonus: 500%.`, 5000);
  } else {
showToast("success", "Skill Upgraded", `${profession} skill upgraded to Level ${newLevel}! Efficiency Bonus: ${(updatedProfessions[profession].efficiencyBonus * 100).toFixed(2)}%.`, 3000);
  }
};
const startBuildingProduction = async (building: string, product?: string) => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Connect your wallet first.", 3000);
    return;
  }

  const requiredProfession = buildingProfessionMap[building];
  if (requiredProfession && requiredProfession !== "All" && userData.activeProfession !== requiredProfession) {
    showToast("error", "Wrong Profession", `Only a ${requiredProfession} can operate the ${buildingConfig[building]?.name || building}.`, 3000);
    return;
  }

  if (userData.buildingTimestamps[building] || userData.buildingClaimables[building] > 0) {
    showToast("error", "Production in Progress", `${buildingConfig[building]?.name || building} is already producing or has results to claim.`, 3000);
    return;
  }

  let config = buildingConfig[building];
  let buildingDisplayName = buildingConfig[building]?.name || building;

  if (building === "InterstellarFabricator") {
    if (!product || !fabricatorProducts[product]) {
      showToast("error", "No Product Selected", "Please select a valid product to produce.", 3000);
      return;
    }
    config = fabricatorProducts[product];
    buildingDisplayName = fabricatorProducts[product]?.name || product;
  }

  if (!config) {
    showToast("error", "Invalid Building", `${buildingDisplayName} is not recognized.`, 3000);
    return;
  }

  if (config.currencyRequirements?.ufos && userData.ufos < config.currencyRequirements.ufos) {
    showToast("error", "Insufficient UFOS", `You need ${config.currencyRequirements.ufos} UFOS.`, 3000);
    return;
  }

  for (const [resource, amount] of Object.entries(config.requirements)) {
    if ((userData[resource as keyof UserData] as number) < (amount as number)) {
      showToast("error", "Insufficient Resources", `You need ${amount} ${resources.find((r) => r.key === resource)?.name || resource}.`, 3000);
      return;
    }
  }

  const currentTime = new Date();
  const updatedUserData = {
    ...userData,
    ufos: config.currencyRequirements?.ufos ? userData.ufos - config.currencyRequirements.ufos : userData.ufos,
    ...Object.keys(config.requirements).reduce(
      (acc, resource) => ({
        ...acc,
        [resource]: (userData[resource as keyof UserData] as number) - (config.requirements[resource as ResourceKey] || 0),
      }),
      {} as Partial<UserData>
    ),
    buildingTimestamps: {
      ...userData.buildingTimestamps,
      [building]: currentTime,
    },
    buildingClaimables: {
      ...userData.buildingClaimables,
      [building]: 0,
    },
    selectedFabricatorProduct: building === "InterstellarFabricator" ? product || null : userData.selectedFabricatorProduct,
    claimableFabricatorProduct: building === "InterstellarFabricator" ? product || null : userData.claimableFabricatorProduct,
  };

  console.log("[startBuildingProduction] Sending buildingTimestamps for", building, ":", {
    timestamp: currentTime.toISOString(),
    buildingTimestamps: updatedUserData.buildingTimestamps,
  });

  setUserData(updatedUserData);
  await saveUserData(updatedUserData);
  clearActionNotification(building);
  showToast("success", "Production Started", `${buildingDisplayName} will complete in ${config.cycleHours} hours.`, 3000);
};
  
const claimBuildingOutput = async (building: string) => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Connect your wallet first.", 3000);
    return;
  }
  if (isClaiming) return;
  setIsClaiming(true);

  const requiredProfession = buildingProfessionMap[building];
  if (requiredProfession && requiredProfession !== "All" && userData.activeProfession !== requiredProfession) {
    showToast("error", "Wrong Profession", `Only a ${requiredProfession} can claim from the ${buildingConfig[building]?.name || building}.`, 3000);
    setIsClaiming(false);
    return;
  }

  if (!userData.buildingClaimables[building]) {
    showToast("error", "Nothing to Claim", `${buildingConfig[building]?.name || building} hasn't completed production.`, 3000);
    setIsClaiming(false);
    return;
  }

  let config = buildingConfig[building];
  let selectedProductKey = userData.claimableFabricatorProduct;
  let buildingDisplayName = buildingConfig[building]?.name || building;

  if (building === "InterstellarFabricator") {
    if (!selectedProductKey || !fabricatorProducts[selectedProductKey]) {
      console.warn(`[claimBuildingOutput] Invalid or missing claimableFabricatorProduct: ${selectedProductKey}`);
      selectedProductKey = Object.keys(fabricatorProducts)[0];
      showToast("warning", "Product Issue", "No valid product selected. Using default product for claiming.", 3000);
    }
    config = fabricatorProducts[selectedProductKey];
    buildingDisplayName = fabricatorProducts[selectedProductKey]?.name || selectedProductKey;
  }

  if (!config) {
    showToast("error", "Invalid Building/Product", `${buildingDisplayName} or product is not recognized.`, 3000);
    setIsClaiming(false);
    return;
  }

  const profession = userData.activeProfession;
  const bonus = profession && userData.professions[profession]?.efficiencyBonus || 0;
  const buildingLevel = userData.buildingLevels[building] || 1;
  const levelBonus = (buildingLevel - 1) * 0.1;

  const output: Partial<Record<ResourceKey, number>> = {};

  for (const [resource, amount] of Object.entries(config.output)) {
    if (resources.some((r) => r.key === resource)) {
      let nftBonus = 0;
      if (nftLevelData && userData.activeProfession) {
        nftBonus = calculateTotalBonus(
          nftLevelData.skills,
          nftLevelData.traits,
          userData.activeProfession,
          resource as ResourceKey
        );
      }
      const totalBonus = bonus + levelBonus + nftBonus;
      output[resource as ResourceKey] = Math.floor(amount * (1 + totalBonus));
    }
  }

  const updatedResources = Object.keys(output).reduce((acc, resource) => {
    const resourceKey = resource as ResourceKey;
    return {
      ...acc,
      [resourceKey]: ((userData[resourceKey] as number) || 0) + (output[resourceKey] || 0),
    };
  }, {} as Partial<UserData>);

  const updatedUserData: UserData = {
    ...userData,
    ...updatedResources,
    buildingTimestamps: {
      ...userData.buildingTimestamps,
      [building]: null,
    },
    buildingClaimables: {
      ...userData.buildingClaimables,
      [building]: 0,
    },
    selectedFabricatorProduct: building === "InterstellarFabricator" ? null : userData.selectedFabricatorProduct,
    claimableFabricatorProduct: building === "InterstellarFabricator" ? null : userData.claimableFabricatorProduct,
  };

  if (userData.selectedNFT) {
    await addNFTExperience(128);
  }

  setUserData(updatedUserData);
  setClaimableFabricatorProduct(null);
  await saveUserData(updatedUserData);
  if (building === "InterstellarFabricator") {
    setFabricatorProgress(0);
  }
  setIsClaiming(false);
  setIsFabricatorModalOpen(false);
  setTimeout(() => setUserData((prev) => ({ ...prev })), 0);
  showToast("success", "Output Claimed", Object.entries(output).map(([key, amount]) => ({
    key: key as ResourceKey,
    amount,
  })), 2500);
};
  

  const handleScavengerComplete = () => {
    const updatedUserData = {
      ...userData,
      scavengerWorking: 0,
      scavengerWorkingEnd: 1, // Mark as claimable, but don't award resources yet
      timeStampScavenger: null,
    };
  
    setUserData(updatedUserData);
    saveUserData(updatedUserData);
  
showToast("success", "Ice Mining Complete!", "Your ice miner has finished. Claim your rewards!", 3000);

      markActionNotified("scavenger");

  };

  const handleCadComplete = () => {
    const updatedUserData = {
      ...userData,
      cadWorking: 0,
      cadWorkingEnd: 1, // Mark as claimable, but don't award resources yet
      timeStampCad: null,
    };
  
    setUserData(updatedUserData);
    saveUserData(updatedUserData);
  
showToast("success", "C.A.D. Complete!", "Your C.A.D. has finished. Claim your rewards!", 3000);
      markActionNotified("cad");

  };

  const handleWaterFilterComplete = () => {
    const updatedUserData = {
      ...userData,
      chargingWaterFilter: 0,
      claimableWater: 1,
      timeStampW: null,
    }

    setUserData(updatedUserData)
    saveUserData(updatedUserData)

 showToast("success", "Water Filtering Complete!", "Your water filter has finished processing.", 3000);
      markActionNotified("waterFilter");

  }

  const handleWorkshopComplete = () => {
    const updatedUserData = {
      ...userData,
      chargingWorkShop: 0,
      claimableEmptyPowerCell: 1,
      timeStampS: null,
    }

    setUserData(updatedUserData)
    saveUserData(updatedUserData)

showToast("success", "Workshop Complete!", "Your workshop has finished repairing power cells.", 3000);
      markActionNotified("workshop");

  }

const startScavenger = () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.fullPowerCell < 1) {
    showToast("error", "Not Enough Full Power Cells", "You need at least one full power cell to start the ice miner.", 3000);
    return;
  }

  if (userData.scavengerWorking > 0 || userData.scavengerWorkingEnd > 0) {
    showToast("error", "Already Mining", "Your ice miner is already working or has results to claim.", 3000);
    return;
  }

  const updatedUserData = {
    ...userData,
    fullPowerCell: userData.fullPowerCell - 1,
    scavengerWorking: 1,
    scavengerWorkingEnd: 0,
    timeStampScavenger: new Date(),
  };

  console.log("[startScavenger] Sending updatedUserData:", {
    ...updatedUserData,
    timeStampScavenger: updatedUserData.timeStampScavenger?.toISOString(),
  });

  setUserData(updatedUserData);
  saveUserData(updatedUserData);
  clearActionNotification("scavenger");
  showToast("success", "Ice Mining Started", "Your Ice Miner will complete in 6 hours.", 3000);
};

const startCad = () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.cadWorking > 0 || userData.cadWorkingEnd > 0) {
    showToast("error", "Already Mining", "Your C.A.D. is already working or has results to claim.", 3000);
    return;
  }

  if (userData.fullPowerCell < 1) {
    showToast("error", "Not Enough Full Power Cells", "You need one full power cell to start the C.A.D.", 3000);
    return;
  }

  const updatedUserData = {
    ...userData,
    fullPowerCell: userData.fullPowerCell - 1,
    cadWorking: 1,
    cadWorkingEnd: 0, // Ensure this is reset
    timeStampCad: new Date(),
  };

  setUserData(updatedUserData);
  saveUserData(updatedUserData);
  clearActionNotification("cad");
  showToast("success", "C.A.D. Started", "Your C.A.D. will complete in 6 hours.", 3000);
};

const claimScavengerResults = async () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.scavengerWorkingEnd < 1) {
    showToast("error", "Nothing to Claim", "Your ice miner hasn't completed its work yet.", 3000);
    return;
  }

  const profession = userData.activeProfession;
  const bonus = profession && userData.professions[profession]?.efficiencyBonus || 0;
  const nftBonus = nftLevelData?.totalBonus || 0;
  const totalBonus = bonus + nftBonus;

  const iceFound = Math.floor(Math.random() * 200) + 200;
  const iceFoundBonus = Math.floor(iceFound * (1 + totalBonus) * 100) / 100;
  const ufosFound = Math.floor(Math.random() * 90) + 100;
  const haliteGained = Math.floor(Math.random() * 2) + 2;
  const haliteGainedBonus = Math.floor(haliteGained * (1 + totalBonus) * 100) / 100;
  const brokenPowerCellFound = Math.random() < 0.5 ? 1 : 0;
  const emptyPowerCellFound = brokenPowerCellFound === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

  const updatedUserData = {
    ...userData,
    scavengerWorking: 0,
    scavengerWorkingEnd: 0,
    timeStampScavenger: null,
    ice: userData.ice + iceFoundBonus,
    ufos: userData.ufos + ufosFound,
    halite: userData.halite + haliteGainedBonus,
    emptyPowerCell: userData.emptyPowerCell + emptyPowerCellFound,
    brokenPowerCell: userData.brokenPowerCell + brokenPowerCellFound,
  };

  setUserData(updatedUserData);
  await saveUserData(updatedUserData);

  if (userData.selectedNFT) {
    await addNFTExperience(64);
  }

  showToast("success", "Mining Results Claimed", [
    { key: "ice" as ResourceKey, amount: iceFoundBonus },
    { key: "ufos" as ResourceKey, amount: ufosFound },
    ...(haliteGained ? [{ key: "halite" as ResourceKey, amount: haliteGainedBonus }] : []),
    ...(emptyPowerCellFound ? [{ key: "emptyPowerCell" as ResourceKey, amount: emptyPowerCellFound }] : []),
    ...(brokenPowerCellFound ? [{ key: "brokenPowerCell" as ResourceKey, amount: brokenPowerCellFound }] : []),
  ], 3000);
};

const claimCadResults = async () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.cadWorkingEnd < 1) {
    showToast("error", "Nothing to Claim", "Your C.A.D. hasn't completed its work yet.", 3000);
    return;
  }

  const profession = userData.activeProfession;
  const bonus = profession && userData.professions[profession]?.efficiencyBonus || 0;
  const nftBonus = nftLevelData?.totalBonus || 0;
  const totalBonus = bonus + nftBonus;

  const co2Found = Math.floor(Math.random() * 10) + 3;
  const co2FoundBonus = co2Found * (1 + totalBonus);
  const ufosFound = Math.floor(Math.random() * 90) + 100;
  const emptyPowerCellFound = Math.random() < 0.5 ? 1 : 0;
  const brokenPowerCellFound = emptyPowerCellFound === 0 ? 1 : 0;

  const updatedUserData = {
    ...userData,
    cadWorking: 0,
    cadWorkingEnd: 0,
    timeStampCad: null,
    co2: userData.co2 + co2FoundBonus,
    ufos: userData.ufos + ufosFound,
    brokenPowerCell: userData.brokenPowerCell + brokenPowerCellFound,
  };

  setUserData(updatedUserData);
  await saveUserData(updatedUserData);

  if (userData.selectedNFT) {
    await addNFTExperience(64);
  }

  showToast("success", "Mining Results Claimed", [
    { key: "co2" as ResourceKey, amount: co2FoundBonus },
    { key: "ufos" as ResourceKey, amount: ufosFound },
    ...(brokenPowerCellFound ? [{ key: "brokenPowerCell" as ResourceKey, amount: brokenPowerCellFound }] : []),
  ], 3000);
};

const startWaterFilter = () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.chargingWaterFilter > 0 || userData.claimableWater > 0) {
    showToast("error", "Already Filtering", "Your water filter is already working or has results to claim.", 3000);
    return;
  }

  if (userData.fullPowerCell < 1 || userData.ice < 1000) {
    showToast("error", "Insufficient Resources", "You need 1 full power cell and 1000 ice to start the water filter.", 3000);
    return;
  }

  const updatedUserData = {
    ...userData,
    fullPowerCell: userData.fullPowerCell - 1,
    ice: userData.ice - 1000,
    chargingWaterFilter: 1,
    claimableWater: 0, // Reset claimable
    timeStampW: new Date(),
  };

  setUserData(updatedUserData);
  saveUserData(updatedUserData);
  clearActionNotification("waterFilter");
  showToast("success", "Water Filtering Started", "Your water filter will complete in 8 hours.", 3000);
};

const claimWaterFilterResults = async () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.claimableWater < 1) {
    showToast("error", "Nothing to Claim", "Your water filter hasn't completed its work yet.", 3000);
    return;
  }

  const profession = userData.activeProfession;
  const bonus = profession && userData.professions[profession]?.efficiencyBonus || 0;
  const nftBonus = nftLevelData?.totalBonus || 0;
  const totalBonus = bonus + nftBonus;

  const waterGained = Math.floor(Math.random() * 5) + 1;
  const waterGainedBonus = waterGained * (1 + totalBonus);
  const haliteGained = Math.floor(Math.random() * 2) + 5;
  const haliteGainedBonus = haliteGained * (1 + totalBonus);
  const brokenPowerCellGained = Math.random() < 0.5 ? 1 : 0;
  const emptyPowerCellGained = brokenPowerCellGained === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

  const updatedUserData = {
    ...userData,
    chargingWaterFilter: 0,
    claimableWater: 0,
    timeStampW: null,
    water: userData.water + waterGainedBonus,
    halite: userData.halite + haliteGainedBonus,
    emptyPowerCell: userData.emptyPowerCell + emptyPowerCellGained,
    brokenPowerCell: userData.brokenPowerCell + brokenPowerCellGained,
  };

  setUserData(updatedUserData);
  await saveUserData(updatedUserData);

  if (userData.selectedNFT) {
    await addNFTExperience(64);
  }

  showToast("success", "Water Filter Results Claimed", [
    { key: "water" as ResourceKey, amount: waterGainedBonus },
    { key: "halite" as ResourceKey, amount: haliteGainedBonus },
    ...(emptyPowerCellGained ? [{ key: "emptyPowerCell" as ResourceKey, amount: emptyPowerCellGained }] : []),
    ...(brokenPowerCellGained ? [{ key: "brokenPowerCell" as ResourceKey, amount: brokenPowerCellGained }] : []),
  ], 3000);
};



const startWorkshop = () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.chargingWorkShop > 0 || userData.claimableEmptyPowerCell > 0) {
    showToast("error", "Already Working", "Your workshop is already working or has results to claim.", 3000);
    return;
  }

  if (userData.fullPowerCell < 1 || userData.brokenPowerCell < 10) {
    showToast("error", "Insufficient Resources", "You need 1 full power cell and 10 broken power cells to start the workshop.", 3000);
    return;
  }

  const updatedUserData = {
    ...userData,
    fullPowerCell: userData.fullPowerCell - 1,
    brokenPowerCell: userData.brokenPowerCell - 10,
    water: userData.water - 5,
    halite: userData.halite - 1,
    chargingWorkShop: 1,
    claimableEmptyPowerCell: 0, // Reset claimable
    timeStampS: new Date(),
  };

  setUserData(updatedUserData);
  saveUserData(updatedUserData);
  clearActionNotification("workshop");
  showToast("success", "Workshop Started", "Your workshop will complete repairs in 10 hours.", 3000);
};

const claimWorkshopResults = async () => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.claimableEmptyPowerCell < 1) {
    showToast("error", "Nothing to Claim", "Your workshop hasn't completed its work yet.", 3000);
    return;
  }

  const brokenPowerCellGained = Math.random() < 0.5 ? 1 : 0;
  const emptyPowerCellGained = brokenPowerCellGained === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

  const updatedUserData = {
    ...userData,
    chargingWorkShop: 0,
    claimableEmptyPowerCell: 0,
    timeStampS: null,
    emptyPowerCell: userData.emptyPowerCell + emptyPowerCellGained,
    brokenPowerCell: userData.brokenPowerCell + brokenPowerCellGained,
  };

  setUserData(updatedUserData);
  await saveUserData(updatedUserData);

  if (userData.selectedNFT) {
    await addNFTExperience(64);
  }

  showToast("success", "Workshop Results Claimed", [
    { key: "emptyPowerCell" as ResourceKey, amount: emptyPowerCellGained },
    ...(brokenPowerCellGained ? [{ key: "brokenPowerCell" as ResourceKey, amount: brokenPowerCellGained }] : []),
  ], 3000);
};

  const buyResource = (resourceKey: string, quantity: number) => {
    if (!walletConnected) {
showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
      return;
    }
  
    const resource = marketResources.find((r) => r.key === resourceKey);
    if (!resource) {
showToast("error", "Invalid Resource", "This resource is not available for purchase.", 3000);
      return;
    }
  
    if (!resource.buyPrice) {
showToast("error", "Not Available for Purchase", `${resource.name} cannot be bought at this time.`, 3000);
      return;
    }
  
    const totalCost = quantity * resource.buyPrice;
    if (quantity <= 0 || !Number.isInteger(quantity)) {
showToast("error", "Invalid Quantity", "Please enter a positive integer quantity.", 3000);
      return;
    }
  
    if (userData.ufos < totalCost) {
showToast("error", "Not Enough UFOS", `You need ${totalCost} UFOS to buy ${quantity} ${resource.name}(s).`, 3000);
      return;
    }
  
    // Show confirmation modal
    setConfirmModalDetails({
      action: () => {
        const updatedUserData = {
          ...userData,
          ufos: userData.ufos - totalCost,
          [resourceKey]: (userData[resourceKey as keyof UserData] as number) + quantity,
        };
  
        setUserData(updatedUserData);
        saveUserData(updatedUserData);
  
showToast("success", "Purchase Successful", [
  { key: resource.key as ResourceKey, amount: quantity },
], 3000);
      },
      message: `Buy ${quantity} ${resource.name}(s) for ${totalCost} UFOS?`,
    });
    setIsConfirmModalOpen(true);
  };

  // Define a mapping for resource keys to Firestore field names
const firestoreFieldMap: Record<string, string> = {
  emptyPowerCell: "EmptyPowerCell",
  fullPowerCell: "FullPowerCell",
  solarPanel: "SolarPanel",
  ionThruster: "IonThruster",
  lifeSupportModule: "LifeSupportModule",
  quantumDrive: "QuantumDrive",
  nanoAssembler: "NanoAssembler",
  bioCircuit: "BioCircuit",
  crystalMatrix: "CrystalMatrix",
  hydroCore: "HydroCore",
  tradeBeacon: "TradeBeacon",
  gravitonShield: "GravitonShield",
  neuralInterface: "NeuralInterface",
  antimatterWarhead: "AntimatterWarhead",
  holoProjector: "HoloProjector",
  bioReactorCore: "BioReactorCore",
};


const sellResource = async (resourceKey: string, quantity: number) => {
  if (!walletConnected || isActionLoading) {
    showToast(
      "error",
      isActionLoading ? "Action in Progress" : "Wallet Not Connected",
      isActionLoading
        ? "Please wait for the current action to complete."
        : "Please connect your wallet to play the game.",
      3000
    );
    return;
  }

  const resource = marketResources.find((r) => r.key === resourceKey);
  if (!resource) {
    showToast("error", "Invalid Resource", "This resource is not available for sale.", 3000);
    return;
  }

  if (!resource.sellPrice) {
    showToast("error", "Not Available for Sale", `${resource.name} cannot be sold at this time.`, 3000);
    return;
  }

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    showToast("error", "Invalid Quantity", "Please enter a positive integer quantity.", 3000);
    return;
  }

  if ((userData[resourceKey as keyof UserData] as number) < quantity) {
    showToast(
      "error",
      `Not Enough ${resource.name}`,
      `You need at least ${quantity} ${resource.name}(s) to sell.`,
      3000
    );
    return;
  }

  setConfirmModalDetails({
    action: async () => {
      setIsActionLoading(true);
      try {
        const totalEarned = quantity * resource.sellPrice;
        const firestoreField = firestoreFieldMap[resourceKey] || resourceKey;

        // Perform Firestore transaction
        const walletAddress = userData.wallet;
        const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", walletAddress));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("User document not found");
        }

        const docRef = doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);
        await runTransaction(firestore, async (transaction) => {
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists()) {
            throw new Error("User document does not exist");
          }

          const currentData = docSnap.data();
          const currentResourceAmount = currentData[firestoreField] || 0;
          const currentUfos = currentData.UFOS || 0;

          if (currentResourceAmount < quantity) {
            throw new Error(`Insufficient ${resource.name} in Firestore: ${currentResourceAmount} available`);
          }

          // Update Firestore
          transaction.update(docRef, {
            [firestoreField]: currentResourceAmount - quantity,
            UFOS: currentUfos + totalEarned,
            LastUpdated: serverTimestamp(),
          });
        });

        // Optimistic UI update after successful transaction
        const updatedUserData = {
          ...userData,
          [resourceKey]: (userData[resourceKey as keyof UserData] as number) - quantity,
          ufos: userData.ufos + totalEarned,
        };
        setUserData(updatedUserData);
        setTradeQuantity((prev) => ({ ...prev, [resourceKey]: 1 }));

        // Invalidate cache to ensure fresh data on next fetch
        localStorage.removeItem(`userData_${walletAddress}`);

        // Show success toast
        showToast(
          "success",
          "Sale Successful",
          [
            { key: resource.key as ResourceKey, amount: -quantity },
            { key: "ufos" as ResourceKey, amount: totalEarned },
          ],
          3000
        );

        // Award EXP for selling
        if (userData.selectedNFT) {
          await addNFTExperience(32);
        }
      } catch (error: unknown) {
        console.error("[sellResource] Error:", error);
        let errorMessage = typeof error === "string" ? error : (error as Error).message || "Unknown error";
        showToast("error", "Sale Failed", `An error occurred: ${errorMessage}`, 5000);

        // Re-fetch data to ensure UI is in sync
        await fetchUserData(userData.wallet);
      } finally {
        setIsActionLoading(false);
      }
    },
    message: `Sell ${quantity} ${resource.name}(s) for ${quantity * resource.sellPrice} UFOS?`,
  });
  setIsConfirmModalOpen(true);
};
  const buyEmptyPowerCell = () => {
    const quantity = tradeQuantity.emptyPowerCell || 1;
    buyResource("emptyPowerCell", quantity);
  };
  
  const sellFullPowerCell = () => {
    const quantity = tradeQuantity.fullPowerCell || 1;
    sellResource("fullPowerCell", quantity);
  };

  const getWalletProvider = (): PhantomProvider | SolflareProvider | null => {
    if (!window.solana && !window.solflare) return null;
    const walletProvider = connectedWalletType === "phantom" ? window.solana : window.solflare;
    if (!walletProvider || !walletProvider.publicKey) return null;
    return walletProvider as PhantomProvider | SolflareProvider;
  };

  const VALID_PROFESSIONS = [
  "Geologist",
  "HydroEngineer",
  "PowerTechnician",
  "Botanist",
  "Metallurgist",
  "Chemist",
  "Mechanic",
  "Trader",
] as const;

type Profession = typeof VALID_PROFESSIONS[number];

const isValidProfession = (profession: string | null): profession is Profession => {
  return profession !== null && (VALID_PROFESSIONS as readonly string[]).includes(profession);
};


  // Generate 8-byte instruction discriminators
  const getInstructionDiscriminator = (instructionName: string): Buffer => {
    const hash = sha256(`global:${instructionName}`);
    return Buffer.from(hash, "hex").slice(0, 8); // Take first 8 bytes
  };

  const formatTimeRemainingHours = (secondsRemaining: number): string => {
    if (secondsRemaining <= 0) return "0h 0m";
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
const claimDailyReward = async () => {
  if (!walletConnected || !publicKey || !wallet || !wallet.adapter) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to claim the daily reward.", 3000);
    return;
  }

  // Check daily claim cooldown
  const now = new Date();
  if (userData.timeStampDailyClaim) {
    const lastClaim = new Date(userData.timeStampDailyClaim);
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastClaim < 24) {
      const hoursRemaining = formatTimeRemainingHours((24 - hoursSinceLastClaim) * 3600);
      showToast("error", "Daily Reward Not Available", `You can claim again in ${hoursRemaining}.`, 3000);
      return;
    }
  }

  setIsClaiming(true);

const connection = new Connection(NETWORK, "confirmed");
const version = await connection.getVersion();
console.log("Solana version:", version);
  console.log("Connection", connection);
  const recipientAddress = new PublicKey("5qFEDDbxE1qdgpGooZnimt9Snxt1pntuuygywF1fQXoe");
  const transferAmountLamports = 0.001 * web3.LAMPORTS_PER_SOL; // 0.001 SOL in lamports

  try {
    // Check user's SOL balance
    const balance = await connection.getBalance(publicKey);
    console.log("balance", balance);
    const minimumBalance = transferAmountLamports; // Fee buffer of 0.00001 SOL
    if (balance < minimumBalance) {
      throw new Error(`Insufficient SOL balance. Need at least ${minimumBalance / web3.LAMPORTS_PER_SOL} SOL, have ${balance / web3.LAMPORTS_PER_SOL} SOL.`);
    }

    // Create a transaction
    const transaction = new Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientAddress,
        lamports: transferAmountLamports,
      })
    );

    // Set recent blockhash
 const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = publicKey;

    // Convert to VersionedTransaction for wallet adapter compatibility
    const versionedTx = new VersionedTransaction(
      new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: transaction.instructions,
      }).compileToV0Message()
    );
const simulation = await connection.simulateTransaction(versionedTx);
console.log("Simulation result:", simulation);


    // Send the transaction using the wallet adapter (includes signing)
    const signature = await wallet.adapter.sendTransaction(versionedTx, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    // Confirm the transaction
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Transaction failed to confirm");
    }

    console.log("Transaction hash:", signature);

    // Calculate UFOS reward with streak count
    const nftCount = userData.nfts;
    const tier = determineUserTier(nftCount);
    let streakCount = 1; // Default for first claim
    if (userData.timeStampDailyClaim) {
      const lastClaim = new Date(userData.timeStampDailyClaim);
      const daysSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24);
      streakCount = daysSinceLastClaim <= 2 ? (userData.streakCount || 0) + 1 : 1;
    }
    const rewardAmount = nftCount * 100 + streakCount;

    // Update user data in Firestore
    const updatedUserData = {
      ...userData,
      ufos: userData.ufos + rewardAmount,
      timeStampDailyClaim: now,
      streakCount: streakCount,
    };
    setUserData(updatedUserData);
    await saveUserData(updatedUserData);

    if (userData.selectedNFT) {
      await addNFTExperience(256);
    }

    showToast("success", "Daily Reward Claimed", [
      { key: "ufos" as ResourceKey, amount: rewardAmount },
      { key: "text", amount: 0, text: `Holding ${nftCount} Crypto UFOs NFTs! Streak: ${streakCount}` },
    ], 5000);
  } catch (error: any) {
  console.error("Error claiming daily reward:", error, error.stack);
  let errorMessage = error.message || "Unknown error";
  if (error instanceof web3.SendTransactionError) {
    const logs = await error.getLogs(connection);
    console.error("Transaction logs:", logs);
    errorMessage = `Transaction failed: ${error.message}. Logs: ${logs.join(", ")}`;
  } else if (errorMessage.includes("Insufficient SOL balance")) {
    errorMessage = error.message;
  }
  showToast("error", "Claim Failed", `Failed to claim daily reward: ${errorMessage}`, 3000);
} finally {
    setIsClaiming(false);
  }
};

const handleTransferUfos = async (e: FormEvent) => {
  e.preventDefault();

  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (transferWallet === userData.wallet) {
    showToast("error", "Invalid Transfer", "You cannot transfer UFOS to yourself.", 3000);
    return;
  }

  if (transferAmount <= 0 || transferAmount > userData.ufos) {
    showToast("error", "Invalid Amount", "Please enter a valid amount to transfer.", 3000);
    return;
  }

  if (!firestore) {
    showToast("error", "Database Not Connected", "Cannot transfer UFOS without database connection.", 3000);
    return;
  }

  try {
    // Check if recipient wallet exists
    const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", transferWallet));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showToast("error", "Recipient Not Found", "The recipient wallet does not exist in the database.", 3000);
      return;
    }

    // Get recipient data
    const recipientDocRef = doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);
    const recipientData = querySnapshot.docs[0].data();

    // Get sender document
    const senderQuery = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", userData.wallet));
    const senderSnapshot = await getDocs(senderQuery);
    if (senderSnapshot.empty) {
      showToast("error", "Sender Not Found", "Your wallet data could not be found.", 3000);
      return;
    }
    const senderDocRef = doc(firestore, "UFOSperWallet", senderSnapshot.docs[0].id);

    // Update sender and recipient in a transaction
    await runTransaction(firestore, async (transaction) => {
      const senderDoc = await transaction.get(senderDocRef);
      const recipientDoc = await transaction.get(recipientDocRef);

      if (!senderDoc.exists() || !recipientDoc.exists()) {
        throw new Error("Sender or recipient document not found");
      }

      transaction.update(senderDocRef, {
        UFOS: (senderDoc.data().UFOS || 0) - transferAmount,
      });

      transaction.update(recipientDocRef, {
        UFOS: (recipientDoc.data().UFOS || 0) + transferAmount,
      });
    });

    // Update local user data
    const updatedUserData = {
      ...userData,
      ufos: userData.ufos - transferAmount,
    };

    setUserData(updatedUserData);
    saveUserData(updatedUserData);

    showToast("success", "Transfer Successful", [
      { key: "ufos" as ResourceKey, amount: transferAmount },
    ], 3000);

    setIsTransferFormOpen(false);
    setTransferAmount(0);
    setTransferWallet("");
  } catch (error) {
    console.error("Error transferring UFOS:", error);
    showToast("error", "Transfer Failed", "There was an error processing your transfer.", 3000);
  }
};

  const handleChangeName = async (e: FormEvent) => {
    e.preventDefault()

    if (!walletConnected) {
showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
      return
    }

    if (!newName.trim()) {
showToast("error", "Invalid Name", "Please enter a valid name.", 3000);
      return
    }

    const updatedUserData = {
      ...userData,
      name: newName,
    }

    setUserData(updatedUserData)
    saveUserData(updatedUserData)

showToast("success", "Name Changed", `Your name has been updated to ${newName}.`, 3000);
    setIsNameFormOpen(false)
    setNewName("")
  }

  // Format time remaining for progress bars
  const formatTimeRemaining = (progress: number, totalHours: number) => {
    if (progress >= 100) return "Complete!";
    if (totalHours <= 0) return "Invalid Duration";
  
    const totalSeconds = totalHours * 3600;
    const remainingSeconds = totalSeconds * (1 - progress / 100);
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = Math.floor(remainingSeconds % 60);
  
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper function to get the correct battery image based on state
// Modified getBatteryImage to not use progress
const getBatteryImage = (isCharging: boolean, isClaimable: boolean) => {
  if (isClaimable) return GAME_ASSETS.batteryFull
  if (isCharging) return GAME_ASSETS.batteryCharging
  return GAME_ASSETS.batteryEmpty
}

const handlePowerCellSlotComplete = (slotId: number) => {
  const actionKey = `powerCellSlot_${slotId}`;
  if (notifiedActions[actionKey]) {
    console.log(`[handlePowerCellSlotComplete] Notification already shown for slot ${slotId}, skipping toast`);
    return;
  }

  const updatedSlots = powerCellSlots.map((slot) => {
    if (slot.id === slotId) {
      return {
        ...slot,
        isCharging: false,
        isClaimable: true,
        timeStamp: null,
        progress: 100,
      };
    }
    return slot;
  });

  const updatedUserData = {
    ...userData,
    powerCellSlots: updatedSlots,
    claimableFullPowerCell: userData.claimableFullPowerCell + 1,
  };

  setPowerCellSlots(updatedSlots);
  setUserData(updatedUserData);
  saveUserData(updatedUserData); // Save immediately to Firestore

  showToast("success", "Power Cell Charged!", `Power cell slot ${slotId + 1} is now fully charged and ready to claim.`, 3000);
  markActionNotified(actionKey);
};
// Modified startPowerCellSlotCharging - remove progress
const startPowerCellSlotCharging = (slotId: number) => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (userData.emptyPowerCell < 1) {
    showToast("error", "Not Enough Empty Power Cells", "You need at least one empty power cell to start charging.", 3000);
    return;
  }

  const slot = powerCellSlots.find((s) => s.id === slotId);
  if (slot?.isCharging) {
    showToast("error", "Already Charging", "This slot is already charging a power cell.", 3000);
    return;
  }

  if (slot?.isClaimable) {
    showToast("error", "Claim First", "Please claim the charged power cell first.", 3000);
    return;
  }

  const currentTime = new Date();
  const updatedSlots = powerCellSlots.map((slot) => {
    if (slot.id === slotId) {
      return {
        ...slot,
        isCharging: true,
        isClaimable: false,
        timeStamp: currentTime,
        // Remove progress: 0,
      };
    }
    return slot;
  });

  const updatedUserData = {
    ...userData,
    emptyPowerCell: userData.emptyPowerCell - 1,
    powerCellSlots: updatedSlots,
  };

  setPowerCellSlots(updatedSlots);
  setUserData(updatedUserData);
  saveUserData(updatedUserData);
  clearActionNotification(`powerCellSlot_${slotId}`);

  showToast("success", "Charging Started", "Your power cell will be charged in 12 hours.", 3000);
};

// Modified claimPowerCellSlot - no progress
const claimPowerCellSlot = async (slotId: number) => {
  if (!walletConnected) {
    showToast("error", "Wallet Not Connected", "Please connect your wallet to play the game.", 3000);
    return;
  }

  if (isActionLocked) {
    showToast("error", "Action in Progress", "Please wait for the current action to complete.", 3000);
    return;
  }

  const slot = powerCellSlots.find((s) => s.id === slotId);
  if (!slot?.isClaimable) {
    showToast("error", "Nothing to Claim", "No power cell slots are ready to claim.", 3000);
    return;
  }

  setIsActionLocked(true);

  try {
    const updatedSlots = powerCellSlots.map((s) =>
      s.id === slotId
        ? { ...s, isCharging: false, isClaimable: false, timeStamp: null }
        : s
    );

    const updatedUserData = {
      ...userData,
      fullPowerCell: userData.fullPowerCell + 1,
      claimableFullPowerCell: userData.claimableFullPowerCell - 1,
      powerCellSlots: updatedSlots,
    };

    if (userData.selectedNFT) {
      await addNFTExperience(32);
    }

    setPowerCellSlots(updatedSlots);
    setUserData(updatedUserData);
    await saveUserData(updatedUserData);

    showToast("success", "Power Cell Claimed", "You've claimed a fully charged power cell!", 3000);
  } catch (error) {
    console.error("[claimPowerCellSlot] Error:", error);
    showToast("error", "Claim Failed", "Failed to claim power cell. Please try again.", 3000);
  } finally {
    setIsActionLocked(false);
  }
};


{isActionLocked && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
    <div className="text-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
      <p>Processing action, please wait...</p>
    </div>
  </div>
)}
if (!imagesLoaded || isLoading || isLoadingUserData) {
  return (
    <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container text-white">
      <div className="text-center">
        <div className="cypherpunk-spinner mx-auto mb-4"></div>
        <img
          src="/loading.gif"
          alt="Loading"
          className="w-128 h-128 mx-auto mb-4"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        <p className="cypherpunk-loading-text mb-2">
          {isLoadingUserData ? "Fetching NFTs from wallet..." : "Loading game data..."}
        </p>
        <div
          className="cypherpunk-loading-progress"
          role="progressbar"
          aria-valuenow={loadingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading progress"
        >
          <div
            className="cypherpunk-loading-progress-bar"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="cypherpunk-loading-percent mt-2">{Math.round(loadingProgress)}%</p>
      </div>
    </div>
  );
}
if (isMobile) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Orbitron']">
      <Toaster richColors position="top-right" />
      <audio ref={audioRef} preload="auto" />
      <ConfirmationModal />
      <StandardToastModal
        isOpen={toastState.isOpen}
        onClose={() => setToastState((prev) => ({ ...prev, isOpen: false }))}
        type={toastState.type}
        title={toastState.title}
        description={toastState.description}
        duration={toastState.duration}
      />

      {/* Loading Layer */}
      {isClaiming && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000]">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-4"></div>
            <p className="text-base">Processing...</p>
          </div>
        </div>
      )}
            {/* Loading Layer */}
      {isClaiming2 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000]">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-4"></div>
            <p className="text-base">Processing...</p>
          </div>
        </div>
      )}
    {/* Wallet Button in Top-Left */}
    <div className="fixed top-4 left-4 z-[1000]">
      <WalletMultiButton
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-['Orbitron'] py-2 px-4 rounded-full shadow-[0_0_10px_rgba(0,255,204,0.3)] hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-700 transition-all"
        aria-label="Connect or disconnect wallet"
      />
    </div>
      {/* Hamburger Menu */}
      <div className="fixed top-4 right-4 z-[1]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-black/80 border-[#00ffcc]/50 hover:bg-black/90 w-12 h-12 rounded-full shadow-[0_0_10px_rgba(0,255,204,0.3)] cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="#00ffcc" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </Button>
        {hasClaimable && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Sidebar */}
      <motion.div
        className="fixed top-0 right-0 w-[45%] h-[100%] bg-black/90 border-r border-[#00ffcc]/30 z-[500] flex flex-col p-4 overflow-y-auto"
        initial={{ x: "-100%" }}
        animate={{ x: isSidebarOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#00ffcc]">Menu</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="text-white hover:text-[#00ffcc] w-8 h-8"
            aria-label="Close menu"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>
        <div className="space-y-2">
          {/* Player Info */}
<div className="bg-gray-900/50 p-3 rounded-lg border border-[#00ffcc]/20">
  <div className="flex items-center gap-2 flex-wrap">
    <div>
      <button onClick={() => setIsNameFormOpen(true)}>
        <h4 className="text-base font-bold text-[#00ffcc]">{userData.name || "Player"}</h4>
      </button>
      <p className="text-xs text-gray-400">NFTs: {userData.nfts} (Tier: {determineUserTier(userData.nfts)})</p>
    </div>
    <div className="flex items-center gap-1">
      <img src={GAME_ASSETS.coin} alt="UFOS" className="w-5 h-5" />
      <p className="text-xs text-yellow-400">{formatNumber(userData.ufos)} UFOS</p>
    </div>
    <button
      onClick={() => window.location.href = "/pfp"}
      className="cursor-pointer flex-shrink-0 ml-2"
    >
      {userData.selectedNFT ? (
        <img
          src={userData.selectedNFT}
          alt="Profile Picture"
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
          <span className="text-white text-sm">PFP</span>
        </div>
      )}
    </button>
    {nftLevelData && userData.selectedNFT && (
      <div className="mt-1">
        <p className="text-xs">UFO #{nftLevelData.nftId}: Level {nftLevelData.level}</p>
        <Progress
          value={getExpProgressPercentage(nftLevelData.exp, nftLevelData.level)}
          className="w-24 h-1 [&>div]:bg-yellow-400"
          aria-label="EXP progress"
        />
        <span className="text-xs text-yellow-400">
          EXP: {getExpTowardNextLevel(nftLevelData.exp, nftLevelData.level)}/{getExpRequiredForNextLevel(nftLevelData.level)}
        </span>
      </div>
    )}
  </div>
</div>
          {/* Menu Items */}
          {[
            { label: "Daily Claim", icon: Gift, action: claimDailyReward },
            { label: "Set Profession", icon: userData.activeProfession ? professionIcons[userData.activeProfession] : UserCog, action: () => setIsProfessionModalOpen(true) },
            { label: "Inventory", icon: Package, action: () => setIsInventoryOpen(true) },
            { label: "Change PFP", icon: LucideImage, action: () => window.location.href = "/pfp" },
            { label: "Change Name", icon: Edit, action: () => setIsNameFormOpen(true) },
            { label: "Transfer UFOS", icon: Send, action: () => setIsTransferFormOpen(true) },
            { label: "Marketplace", icon: Store, action: () => window.open(INTERSTELLAR_MARKETPLACE_URL, "_blank") },
            { label: "Skill Points", icon: Ticket, action: () => {
                if (!userData.activeProfession) {
                  showToast("error", "No Profession Selected", "Please select a profession first.", 3000);
                  return;
                }
                if (!userData.selectedNFT) {
                  showToast("error", "No NFT Selected", "Please select an NFT.", 3000);
                  return;
                }
                if (isNFTDataLoading) {
                  showToast("error", "NFT Data Loading", "Please wait while NFT data is loading.", 3000);
                  return;
                }
                setIsSkillPointsModalOpen(true);
              }
            },
          ].map(({ label, icon: Icon, action }) => (
            <Button
              key={label}
              variant="outline"
              className="w-[100%] bg-transparent border-[#00ffcc]/30 text-white text-[0.5rem] min-h-[48px] flex items-center gap-2 hover:bg-[#00ffcc]/10 hover:scale-105 transition-all z-[1000]"
              onClick={action}
              aria-label={label}
            >
             
              <span>{label}</span> <Icon className="w-5 h-5" />
            </Button>
          ))}
          {hasClaimable && (
            <Button
              variant="outline"
              className="w-[100%] bg-red-500/20 border-red-500 text-white text-[0.5rem] min-h-[48px] animate-pulse z-[1000]"
              onClick={() => setShowClaimableDetails(true)}
              aria-label="View claimable resources"
            >
              Claimable Resources!
            </Button>
          )}
        </div>
      </motion.div>

      {/* Back to Main Button */}
      <Button
        onClick={() => (window.location.href = "/")}
        className="fixed bottom-4 left-4 z-[1000] bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm py-2 px-4 rounded-full shadow-[0_0_10px_rgba(0,255,204,0.3)] flex items-center gap-2"
        aria-label="Back to main page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Button>

      {/* Game Map */}
      <div className="absolute inset-0 overflow-hidden">
  <div
  ref={mapContainerRef}
  className="relative overflow-auto touch-pan-y touch-pan-x cursor-grab map-container"
  style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
>
          <div
            ref={mapRef}
            className="relative"
            style={{
              width: `${calculateMapSize(zoomLevel).width}px`,
              height: `${calculateMapSize(zoomLevel).height}px`,
              backgroundImage: `url(${GAME_ASSETS.background || "/placeholder.svg"})`,
              backgroundSize: `${100 * zoomLevel}%`,
              backgroundRepeat: "repeat",
            }}
          >
            <div
              className="absolute top-0 left-0"
              style={{
                width: `${baseMapSize}px`,
                height: `${baseMapSize}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
              }}
            >
              <div
                className="absolute top-0 left-0 w-[2000px] h-[2000px] bg-contain bg-no-repeat"
                style={{ backgroundImage: `url(${GAME_ASSETS.landMap || "/placeholder.svg"})` }}
              >
                  {/* Always show Laboratory and Market */}
                  <Button
                    variant="ghost"
                    className="absolute top-[600px] left-[100px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setIsLaboratoryOpen(true)}
                    style={{
                      backgroundImage: `url(${GAME_ASSETS.powerCellCharger || "/placeholder.svg"})`,
                      backgroundColor: "transparent",
                    }}
                    aria-label="Open Power Cell Charger"
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[250px] left-[600px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setIsMarketOpen(true)}
                    style={{ backgroundImage: `url(${GAME_ASSETS.market || "/placeholder.svg"})`, backgroundColor: "transparent" }}
                    aria-label="Open Market"
                  />
                  {/* Always show Scavenger, Workshop, Water Filter, CAD */}
                  <Button
                    variant="ghost"
                    className="absolute top-[925px] left-[1020px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1001]"
                    onClick={userData?.scavengerWorkingEnd > 0 ? claimScavengerResults : startScavenger}
                    style={{ backgroundImage: `url(${GAME_ASSETS.iceMiner || "/placeholder.svg"})`, backgroundColor: "transparent" }}
                    aria-label={userData?.scavengerWorkingEnd > 0 ? "Claim Scavenger Results" : "Start Scavenger"}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[950px] left-[625px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1001]"
                    onClick={userData?.claimableEmptyPowerCell > 0 ? claimWorkshopResults : startWorkshop}
                    style={{ backgroundImage: `url(${GAME_ASSETS.workshop || "/placeholder.svg"})`, backgroundColor: "transparent" }}
                    aria-label={userData?.claimableEmptyPowerCell > 0 ? "Claim Workshop Results" : "Start Workshop"}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[750px] left-[350px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1002]"
                    onClick={userData?.claimableWater > 0 ? claimWaterFilterResults : startWaterFilter}
                    style={{ backgroundImage: `url(${GAME_ASSETS.waterFilter || "/placeholder.svg"})`, backgroundColor: "transparent" }}
                    aria-label={userData?.claimableWater > 0 ? "Claim Water Filter Results" : "Start Water Filter"}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[750px] left-[1350px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1001]"
                    onClick={userData?.cadWorkingEnd > 0 ? claimCadResults : startCad}
                    style={{ backgroundImage: `url(${GAME_ASSETS.cad || "/placeholder.svg"})`, backgroundColor: "transparent" }}
                    aria-label={userData?.cadWorkingEnd > 0 ? "Claim CAD Results" : "Start CAD"}
                  />
                  {/* Dynamically render profession-specific buildings */}
                  {getVisibleBuildings(userData?.activeProfession || "").map((building) => {
                    const buildingPositions: { [key: string]: { top: string; left: string; width: string; height: string } } = {
                      CrystalMine: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      CrystalRefinery: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      GemProcessor: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      CrystalSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      AdvancedFilter: { top: "95px", left: "850px", width: "350px", height: "350px" },
                      PlasmaReactor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      HydrogenExtractor: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      FusionPlant: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      QuantumFoundry: { top: "95px", left: "870px", width: "300px", height: "300px" },
                      CoreReactor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      PlasmaCoreFabricator: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      AntimatterGenerator: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      BiopolymerGreenhouse: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      MyceliumExtractor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      BioPolymerSynthesizer: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      NanoOrganicLab: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      SmeltingForge: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      Nanoforge: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      SuperAlloyForge: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      MetaMaterialSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      ChemicalSynthesizer: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      PolymerizationPlant: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      NanoCatalystLab: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      QuantumChemSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      AssemblyWorkshop: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      ElectronicsFabricator: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      ComponentFabricator: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      RoboticsAssembler: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      CommerceHub: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      TokenMinter: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      CryptoExchange: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      BondIssuer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      InterstellarFabricator: { top: "400px", left: "950px", width: "400px", height: "400px" },
                    };
                    const position = buildingPositions[building] || { top: "0px", left: "0px", width: "350px", height: "350px" };
                    const assetKey = buildingAssetMap[building];
                    return (
                      <Button
                        key={building}
                        variant="ghost"
                        className="absolute bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[999]"
                        style={{
                          top: position.top,
                          left: position.left,
                          width: position.width,
                          height: position.height,
                          backgroundImage: `url(${GAME_ASSETS[assetKey] || "/placeholder.svg"})`,
                          backgroundColor: "transparent",
                        }}
                        onClick={
                          userData?.buildingClaimables[building] > 0
                            ? () => claimBuildingOutput(building)
                            : building === "InterstellarFabricator"
                            ? () => setIsFabricatorModalOpen(true)
                            : () => startBuildingProduction(building)
                        }
                        aria-label={
                          userData?.buildingClaimables[building] > 0
                            ? `Claim ${building} output`
                            : building === "InterstellarFabricator"
                            ? "Open Interstellar Fabricator"
                            : `Start ${building} production`
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
  
<div className="fixed bottom-16 left-4 z-[1000] flex flex-col gap-1 items-center">
  <span className="text-white bg-black/50 px-2 py-1 rounded text-xs">
    Zoom: {(zoomLevel * 100).toFixed(0)}%
  </span>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="icon"
      onClick={zoomIn}
      className="bg-black/50 hover:bg-black/70 w-10 h-10 cursor-pointer"
      aria-label="Zoom in"
    >
      <ZoomIn className="h-5 w-5" />
    </Button>
    <Button
      variant="outline"
      size="icon"
      onClick={zoomOut}
      className="bg-black/50 hover:bg-black/70 w-10 h-10 cursor-pointer"
      aria-label="Zoom out"
    >
      <ZoomOut className="h-5 w-5" />
    </Button>
  </div>
</div>

<div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-[300] bg-black/70 rounded-md p-2 max-h-[30vh] overflow-y-auto">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-xs font-bold text-green-400">Progress</h3>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setProgressBars}
      className="text-white hover:text-gray-300 cursor-pointer"
      aria-label={progressBars ? "Hide progress bars" : "Show progress bars"}
    >
      {progressBars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </Button>
  </div>
  {shouldShowProgressBars && (
    <div className="space-y-1">
      {getProgressItems(
        userData,
        displayScavengerProgress,
        displayCadProgress,
        displayWaterFilterProgress,
        displayWorkshopProgress,
        displayPowerCellProgress,
        displayBuildingProgress,
        buildingConfig,
        buildingAssetMap
      ).map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <img
            src={item.icon || "/placeholder.svg"}
            alt={item.displayName}
            className="w-4 h-4"
            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            loading="lazy"
          />
          <div className="flex flex-col w-24">
            <div className="cypherpunk-progress">
              <div
                className="cypherpunk-progress-bar"
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            <span className="cypherpunk-time mt-1">
              {formatTimeRemaining(item.progress, item.cycleHours)}
            </span>
          </div>
          {item.key.startsWith("powerCellSlot_") && (
            <span className="cypherpunk-slot-number">
              {parseInt(item.key.split("_")[1]) + 1}
            </span>
          )}
        </div>
      ))}
    </div>
  )}
</div>
  
{/* Music Controls */}
<div className="fixed bottom-4 right-4 w-25 z-30 flex flex-col gap-2 items-end z-[200]">
  <Button
    onClick={() => setShowMusicControls(!showMusicControls)}
    className="cypherpunk-button w-25 cypherpunk-button-purple p-2 rounded-full glow-hover"
  >
    {showMusicControls ? "Hide" : "Show"} Music
  </Button>
  {showMusicControls && (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => changeTrack("prev")}
          className="cypherpunk-button w-5 cypherpunk-button-blue p-2 rounded-full glow-hover"
        >
          ⏮
        </Button>
        <Button
          onClick={togglePlayPause}
          className="cypherpunk-button w-5 cypherpunk-button-green p-2 rounded-full glow-hover"
        >
          {isPlaying ? <Pause className="w-5 h-5 cypherpunk-icon-glow" /> : <Play className="w-5 h-5 cypherpunk-icon-glow" />}
        </Button>
        <Button
          onClick={() => changeTrack("next")}
          className="cypherpunk-button w-5 cypherpunk-button-blue p-2 rounded-full glow-hover"
        >
          ⏭
        </Button>
        <div className="relative z-40">
          <Button
            onClick={handleVolumeClick}
            className="cypherpunk-button w-5 cypherpunk-button-purple p-2 rounded-full glow-hover"
          >
            <Volume2 className="w-5 h-5 cypherpunk-icon-glow" />
          </Button>
          {isVolumeOpen && (
            <div
              className="absolute bottom-16 right-0 w-12 bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 shadow-lg flex justify-center z-[1000] cypherpunk-border"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-6 rotate-[-90deg] translate-x-[-25%] accent-[#00ffaa] cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
      <div className="marquee-container bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 text-sm flex items-center w-12 overflow-hidden z-30 cypherpunk-border">
        <div className="marquee-text">
          {AUDIO_TRACKS[currentTrack].title}
          <span className="inline-block mx-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </>
  )}
</div>
          {/* Version Number */}
<div className="fixed bottom-8 right-4 z-30 text-xs text-gray-400">
  V0.2.3
</div>
  
         
  
          {/* Modals */}
{isLaboratoryOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
    <Card className="w-[95vw] max-w-[500px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col z-[999]">
      <CardContent className="p-4 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 z-[999]">
          <div>
            <h2 className="text-base font-bold text-green-400">Power Cell Charger</h2>
            <p className="text-xs text-gray-400">
              {getPowerCellSlots(userData?.nfts || 0)} slots (Tier {determineUserTier(userData?.nfts || 0)})
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLaboratoryOpen(false)}
            className="text-white hover:text-gray-300 w-8 h-8 cursor-pointer"
            disabled={isActionLocked}
            aria-label="Close Power Cell Charger modal"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>
        {/* Claim All Button */}
        <div className="mb-4">
          <Button
            onClick={claimAllPowerCells}
            disabled={
              isActionLocked ||
              !powerCellSlots.some((slot) => slot.isClaimable) ||
              !walletConnected
            }
            className={`w-full text-sm py-2 ${
              powerCellSlots.some((slot) => slot.isClaimable) && !isActionLocked && walletConnected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-600 cursor-not-allowed"
            }`}
            aria-label="Claim all power cells"
          >
            {isActionLocked ? "Processing..." : "Claim All Power Cells"}
          </Button>
        </div>
<div className="grid grid-cols-2 gap-2">
  {powerCellSlots.map((slot, index) => (
    <div key={slot.id} className="relative">
      <Button
        variant="ghost"
        className="w-full h-[60px] bg-gray-900/50 border border-gray-600 rounded-md flex items-center justify-center cursor-pointer"
        onClick={() =>
          slot.isClaimable ? claimPowerCellSlot(slot.id) : startPowerCellSlotCharging(slot.id)
        }
        disabled={isActionLocked}
        aria-label={slot.isClaimable ? `Claim power cell slot ${slot.id + 1}` : `Start charging power cell slot ${slot.id + 1}`}
      >
        <img
          src={getBatteryImage(slot.isCharging, slot.isClaimable) || "/placeholder.svg"}
          alt="Power Cell"
          className="w-12 h-12"
          loading="lazy"
        />
      </Button>
      {(slot.isCharging || slot.isClaimable) && (
        <div className="mt-1">
          <div className="cypherpunk-progress">
            <div
              className="cypherpunk-progress-bar"
              style={{ width: `${displayPowerCellProgress[index] || 0}%` }}
            ></div>
          </div>
          <p className="cypherpunk-time mt-1">
            {formatTimeRemaining(displayPowerCellProgress[index] || 0, 12)}
          </p>
        </div>
      )}
      <div className="absolute top-1 left-1 cypherpunk-slot-number">
        {slot.id + 1}
      </div>
    </div>
  ))}
</div>
        {isActionLocked && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Processing claim...</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
  
{isFabricatorModalOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
    <Card className="w-[90%] max-w-[600px] bg-gray-900 border-white text-white max-h-[80vh] flex flex-col z-[999]">
      <CardContent className="p-6 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-[999]">
          <h2 className="text-xl font-bold text-purple-400">Interstellar Fabricator</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsFabricatorModalOpen(false)} className="text-white">
            X
          </Button>
        </div>
        {userData.buildingClaimables.InterstellarFabricator > 0 ? (
          <div className="mb-4 text-center">
            <p className="text-lg text-green-400 mb-2">
              Production Complete: {userData.claimableFabricatorProduct
                ? fabricatorProducts[userData.claimableFabricatorProduct]?.name || "Product"
                : "Unknown Product"} Ready!
            </p>
            <Button
              onClick={() => claimBuildingOutput("InterstellarFabricator")}
              className="w-full bg-green-500 hover:bg-green-600 text-lg py-2"
              disabled={isClaiming}
            >
              {isClaiming
                ? "Claiming..."
                : `Claim ${userData.claimableFabricatorProduct
                    ? fabricatorProducts[userData.claimableFabricatorProduct]?.name || "Product"
                    : "Product"}`}
            </Button>
          </div>
        ) : userData.buildingTimestamps.InterstellarFabricator && userData.selectedFabricatorProduct ? (
          <div className="mb-4 text-center">
            <p className="text-sm text-yellow-400">
              Producing: {fabricatorProducts[userData.selectedFabricatorProduct]?.name || "Unknown"}
            </p>
            <Progress value={displayFabricatorProgress} className="h-2 w-full [&>div]:bg-green-500 mt-2" />
            <p className="text-xs mt-1">
              {formatTimeRemaining(
                displayFabricatorProgress,
                fabricatorProducts[userData.selectedFabricatorProduct]?.cycleHours || 24
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Select a product to begin production:</p>
            {Object.entries(fabricatorProducts).map(([productKey, product]) => {
              const canProduce = Object.entries(product.requirements).every(
                ([resource, amount]) => (userData[resource as keyof UserData] as number) >= amount
              );
              return (
                <div key={productKey} className="p-4 border border-gray-700 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={GAME_ASSETS[product.outputKey as keyof typeof GAME_ASSETS] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      <div>
                        <h3 className="text-lg font-medium text-purple-500">{product.name}</h3>
                        <p className="text-sm text-gray-400">Cycle: {product.cycleHours} hours</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => startBuildingProduction("InterstellarFabricator", productKey)}
                      disabled={!canProduce}
                      className={canProduce ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500"}
                    >
                      Produce
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-yellow-400">Requirements:</p>
                    <ul className="text-sm text-gray-400">
                      {Object.entries(product.requirements).map(([resource, amount]) => (
                        <li key={resource}>
                          {getResourceDisplayName(resource)}: {amount} (Available: {(userData[resource as keyof UserData] as number) || 0})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
  
          {isSkillPointsModalOpen && userData.selectedNFT && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] backdrop-blur-sm"
            onClick={() => setIsSkillPointsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-points-modal-title"
          >
            <Card
              className="w-[95vw] max-w-[500px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col rounded-lg shadow-[0_0_20px_rgba(0,255,204,0.3)]"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <CardContent className="p-4 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="flex justify-between items-center mb-4 top-0 bg-gray-800 z-[999] border-b border-gray-600/50 pb-2">
                  <h2 id="skill-points-modal-title" className="text-base font-bold text-green-400 font-['Orbitron']">
                    Crypto UFO #{extractNFTId(userData.selectedNFT)}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSkillPointsModalOpen(false)}
                    className="text-white hover:text-gray-300 hover:bg-gray-700/50 w-8 h-8 rounded-full"
                    aria-label="Close Skill Points modal"
                  >
                    <span className="text-lg">X</span>
                  </Button>
                </div>

                {isNFTDataLoading && (
                  <div className="text-center flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-2"></div>
                    <p className="text-sm text-gray-300">Loading NFT data...</p>
                  </div>
                )}

                {!isNFTDataLoading && !nftLevelData && (
                  <div className="text-center flex items-center justify-center flex-col h-40">
                    <p className="text-sm text-red-400 mb-4">Failed to load NFT data.</p>
                    <Button
                      onClick={() => fetchNFTLevelData(extractNFTId(userData.selectedNFT))}
                      className="bg-blue-500 hover:bg-blue-600 text-sm px-4 py-2 rounded-md"
                      aria-label="Retry loading NFT data"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {!isNFTDataLoading && nftLevelData && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={userData.selectedNFT || "/placeholder.svg"}
                        alt={`Crypto UFO ${extractNFTId(userData.selectedNFT)}`}
                        className="w-12 h-12 rounded-md object-cover border border-gray-600"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        loading="lazy"
                      />
                      <div className="text-center">
                        <p className="text-sm text-white">Level: {nftLevelData.level}</p>
                        <p className="text-sm text-white">
                          EXP: {getExpTowardNextLevel(nftLevelData.exp, nftLevelData.level)}/{getExpRequiredForNextLevel(nftLevelData.level)}
                        </p>
                        <Progress
                          value={getExpProgressPercentage(nftLevelData.exp, nftLevelData.level)}
                          className="w-24 h-1 [&>div]:bg-yellow-400 mt-2"
                          aria-label="EXP progress"
                        />
                        <p className="text-sm text-yellow-400 mt-2">
                          Available Points: {nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)} | Total Bonus: {(nftLevelData.totalBonus * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-purple-400 mb-2">Traits</p>
                      {Object.entries(nftLevelData.traits || {})
                        .filter(([trait]) => trait !== "Rarity Rank")
                        .sort(([aTrait], [bTrait]) => aTrait.localeCompare(bTrait))
                        .length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(nftLevelData.traits || {})
                            .filter(([trait]) => trait !== "Rarity Rank")
                            .sort(([aTrait], [bTrait]) => aTrait.localeCompare(bTrait))
                            .map(([trait, value]) => (
                              <div
                                key={trait}
                                className="p-2 bg-gray-900/50 rounded-lg border border-gray-700/50 text-center"
                              >
                                <p className="text-xs text-gray-300 whitespace-normal break-words">
                                  <span className="font-medium">{trait}</span>: {value}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center">No traits available</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-500 mb-2">Skills</p>
                      {Object.entries(nftLevelData.skills || {})
                        .filter(([skillName]) => {
                          const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                          return resourceMatch && resources.find((r) => r.key === resourceMatch[1]);
                        })
                        .sort(([aSkillName], [bSkillName]) => {
                          const aResource = aSkillName.replace(/ Efficiency$/i, "");
                          const bResource = bSkillName.replace(/ Efficiency$/i, "");
                          const aDisplayName = getResourceDisplayName(aResource);
                          const bDisplayName = getResourceDisplayName(bResource);
                          return aDisplayName.localeCompare(bDisplayName);
                        })
                        .length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(nftLevelData.skills || {})
                            .filter(([skillName]) => {
                              const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                              return resourceMatch && resources.find((r) => r.key === resourceMatch[1]);
                            })
                            .sort(([aSkillName], [bSkillName]) => {
                              const aResource = aSkillName.replace(/ Efficiency$/i, "");
                              const bResource = bSkillName.replace(/ Efficiency$/i, "");
                              const aDisplayName = getResourceDisplayName(aResource);
                              const bDisplayName = getResourceDisplayName(bResource);
                              return aDisplayName.localeCompare(bDisplayName);
                            })
                            .map(([skillName, skill]) => {
                              const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                              const rawResource = resourceMatch ? resourceMatch[1] : null;
                              if (!rawResource) return null;

                              const resourceKey = rawResource as ResourceKey;
                              const resource = resources.find((r) => r.key === resourceKey);
                              if (!resource) return null;

                              const matchingTraitKeys = Object.keys(traitResourceMap).filter((key) =>
                                Object.values(traitResourceMap[key]).includes(resourceKey)
                              );
                              let traitKey: string | null = null;
                              let traitValue: string | number | null = null;
                              for (const key of matchingTraitKeys) {
                                const resourceMap = traitResourceMap[key];
                                const foundTraitValue = Object.keys(resourceMap).find(
                                  (val) => resourceMap[val] === resourceKey
                                );
                                if (foundTraitValue && nftLevelData.traits[key] === foundTraitValue) {
                                  traitKey = key;
                                  traitValue = foundTraitValue;
                                  break;
                                }
                              }

                              if (!traitKey || !traitValue) return null;

                              const displayName = getResourceDisplayName(resourceKey);

                              return (
                                <div
                                  key={skillName}
                                  className="p-2 border border-gray-700 rounded-lg bg-gray-900/50 flex flex-col items-center gap-2"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <img
                                      src={resource.image || "/placeholder.svg"}
                                      alt={resource.name}
                                      className="w-6 h-6 flex-shrink-0 rounded-md"
                                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                      loading="lazy"
                                    />
                                    <p className="text-xs font-medium text-white text-center flex-grow">
                                      {displayName}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-300">Level: {skill.level}/10</p>
                                  <p className="text-xs text-gray-300">Bonus: {(skill.bonus * 100).toFixed(2)}%</p>
                                  <Button
                                    onClick={() => allocateSkillPoint(extractNFTId(userData.selectedNFT), skillName)}
                                    disabled={
                                      skill.level >= 10 ||
                                      (nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)) <= 0 ||
                                      isActionLocked
                                    }
                                    className={`w-full text-xs py-1.5 ${
                                      skill.level < 10 &&
                                      (nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)) > 0 &&
                                      !isActionLocked
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-gray-500 cursor-not-allowed"
                                    }`}
                                    aria-label={`Upgrade ${displayName} Efficiency`}
                                  >
                                    Upgrade
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center">No skills available</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
          {isMarketOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] overflow-auto">
              <Card className="w-[95vw] max-w-[500px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col z-[999]">
                <CardContent className="p-4 flex-grow overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-amber-400">Market</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMarketOpen(false)}
                      className="text-white hover:text-gray-300 w-8 h-8 cursor-pointer"
                      aria-label="Close Market modal"
                    >
                      <span className="text-lg">X</span>
                    </Button>
                  </div>
                  <Tabs defaultValue="buy" onValueChange={setActiveMarketTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-700">
                      <TabsTrigger
                        value="buy"
                        className="text-sm py-2 data-[state=active]:bg-amber-500 data-[state=active]:text-black"
                      >
                        Buy
                      </TabsTrigger>
                      <TabsTrigger
                        value="sell"
                        className="text-sm py-2 data-[state=active]:bg-green-500 data-[state=active]:text-black"
                      >
                        Sell
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="buy" className="mt-4">
                      <div className="space-y-4">
                        {marketResources
                          .filter((resource) => resource.buyPrice !== undefined)
                          .map((resource) => {
                            const quantity = tradeQuantity[resource.key] || 1;
                            const totalCost = quantity * resource.buyPrice;
                            const canAfford = userData?.ufos >= totalCost && quantity > 0 && Number.isInteger(quantity);
                            return (
                              <div
                                key={resource.key}
                                className="flex flex-col items-start justify-between p-3 border border-gray-600 rounded-lg bg-gray-900/50"
                              >
                                <div className="flex items-center mb-2">
                                  <img
                                    src={resource.image || "/placeholder.svg"}
                                    alt={resource.name}
                                    className="w-12 h-12 mr-3 rounded-md"
                                    loading="lazy"
                                  />
                                  <div>
                                    <h3 className="text-base font-semibold text-red-400">{resource.name}</h3>
                                    <p className="text-xs text-yellow-300">Price: {resource.buyPrice} UFOS each</p>
                                    <p className="text-xs text-gray-300">Available UFOS: {userData?.ufos?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-gray-300">
                                      Total Cost: {totalCost.toLocaleString()} UFOS
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setTradeQuantity({
                                        ...tradeQuantity,
                                        [resource.key]: Math.floor((userData?.ufos || 0) / resource.buyPrice) || 1,
                                      })
                                    }
                                    className="text-xs text-black cursor-pointer"
                                    aria-label="Set maximum buy quantity"
                                  >
                                    Max
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tradeQuantity[resource.key] || ""}
                                    onChange={(e) =>
                                      setTradeQuantity({
                                        ...tradeQuantity,
                                        [resource.key]: Number(e.target.value),
                                      })
                                    }
                                    className="w-16 text-white bg-gray-700 border-gray-600 text-xs"
                                    placeholder="Qty"
                                    aria-label="Buy quantity"
                                  />
                                  <Button
                                    onClick={() => {
                                      if (canAfford) {

                                          buyResource(resource.key, quantity);
                                        
                                      }
                                    }}
                                    disabled={!canAfford}
                                    className={`cursor-pointer text-sm ${canAfford ? "bg-green-500 hover:bg-green-600" : "bg-gray-600"}`}
                                    aria-label={`Buy ${quantity} ${resource.name}`}
                                  >
                                    Buy
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </TabsContent>
<TabsContent value="sell" className="mt-4">
  <div className="space-y-4">
    {marketResources
      .filter((resource) => resource.sellPrice !== undefined)
      .map((resource) => {
        const quantity = tradeQuantity[resource.key] || 1;
        const totalEarned = quantity * resource.sellPrice;
        const canSell =
          (userData[resource.key as keyof UserData] as number) >= quantity &&
          quantity > 0 &&
          Number.isInteger(quantity);
        return (
          <div
            key={resource.key}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-600 rounded-lg bg-gray-900/50"
          >
            <div className="flex items-center mb-2 sm:mb-0">
              <img
                src={resource.image || "/placeholder.svg"}
                alt={resource.name}
                className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 rounded-md"
                loading="lazy"
              />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-green-400">{resource.name}</h3>
                <p className="text-sm text-yellow-300">Price: {formatNumber(resource.sellPrice)} UFOS each</p>
                <p className="text-sm text-gray-300">
                  Owned: {formatNumber(userData[resource.key as keyof UserData] as number)}
                </p>
                <p className="text-sm text-gray-300">
                  Total Earned: {formatNumber(totalEarned)} UFOS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTradeQuantity({
                    ...tradeQuantity,
                    [resource.key]: userData[resource.key as keyof UserData] as number,
                  })
                }
                className="text-xs text-black cursor-pointer"
                aria-label="Set maximum sell quantity"
              >
                Max
              </Button>
              <Input
                type="number"
                min="1"
                value={tradeQuantity[resource.key] || ""}
                onChange={(e) =>
                  setTradeQuantity({
                    ...tradeQuantity,
                    [resource.key]: Number(e.target.value),
                  })
                }
                className="w-20 text-white bg-gray-700 border-gray-600"
                placeholder="Qty"
                aria-label="Sell quantity"
              />
              <Button
                onClick={() => {
                  if (canSell && !isActionLoading) {
                    sellResource(resource.key, quantity);
                  }
                }}
                disabled={!canSell || isActionLoading}
                className={`cursor-pointer ${canSell && !isActionLoading ? "bg-green-500 hover:bg-green-600" : "bg-gray-600"}`}
                aria-label={`Sell ${quantity} ${resource.name}`}
              >
                {isActionLoading ? "Processing..." : "Sell"}
              </Button>
            </div>
          </div>
        );
      })}
  </div>
</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
  
 {isProfessionModalOpen && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] backdrop-blur-sm"
    onClick={() => setIsProfessionModalOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="profession-modal-title"
  >
    <Card
      className="w-[95vw] max-w-[360px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col rounded-lg shadow-2xl z-[999]"
      onClick={(e) => e.stopPropagation()}
      ref={(node) => {
        if (node && isProfessionModalOpen) {
          node.focus();
        }
      }}
      tabIndex={-1}
    >
      <CardContent className="p-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h2 id="profession-modal-title" className="text-base font-bold text-green-400">
            Choose Profession
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsProfessionModalOpen(false)}
            aria-label="Close profession modal"
            className="text-white hover:text-gray-300 hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
          >
            <span className="text-sm">X</span>
          </Button>
        </div>
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-md p-2 mb-3">
          <p className="text-xs text-yellow-300 font-medium">
            <span className="font-bold">Warning:</span> Changing professions costs 10,000 UFOS and resets your current profession's skills to Level 0.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {VALID_PROFESSIONS.slice().sort().map((profession) => {
            const IconComponent = professionIcons[profession];
            const isActive = userData?.activeProfession === profession;
            return (
              <div
                key={profession}
                className={`p-3 border ${isActive ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-900/50'} rounded-lg shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-purple-400'}`} />
                  <h3 className={`text-base font-medium ${isActive ? 'text-green-400' : 'text-white'}`}>
                    {profession}
                  </h3>
                </div>
                <p className="text-xs text-gray-300">Level: {userData?.professions[profession]?.level || 0}</p>
                <p className="text-xs text-gray-300">
                  Efficiency Bonus: {formatNumber((userData?.professions[profession]?.efficiencyBonus * 100) || 0)}%
                </p>
                <div className="flex flex-col gap-2 mt-2">
                  {isActive ? (
                    <Button
                      disabled
                      className="w-full bg-green-600 text-white text-xs py-1.5 px-3 rounded-md"
                      aria-label={`${profession} is currently active`}
                    >
                      Active
                    </Button>
                  ) : (
                    <Button
                      onClick={() => resetAndSelectProfession(profession)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105"
                      aria-label={`Reset and select ${profession}`}
                    >
                      Reset & Select (10,000 UFOS)
                    </Button>
                  )}
                  {userData?.professions[profession]?.level < 10 && (
                    <Button
                      onClick={() => upgradeProfessionSkill(profession)}
                      disabled={profession !== userData?.activeProfession}
                      className={`w-full ${
                        profession === userData?.activeProfession
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-gray-600 cursor-not-allowed'
                      } text-white text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105`}
                      title={
                        profession !== userData?.activeProfession
                          ? `Switch to ${profession} to upgrade`
                          : `Upgrade ${profession}`
                      }
                      aria-label={`Upgrade ${profession}`}
                    >
                      Upgrade (
                      {[1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000][
                        userData?.professions[profession]?.level || 0
                      ].toLocaleString()}{" "}
                      UFOS)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </div>
)}
  
          {isTransferFormOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
              <Card className="w-[95vw] max-w-[360px] bg-black border-white max-h-[80vh] flex flex-col z-[999]">
                <CardContent className="p-4 flex-grow overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-yellow-400">Transfer UFOS</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTransferFormOpen(false)}
                      className="text-white cursor-pointer"
                      aria-label="Close Transfer UFOS modal"
                    >
                      X
                    </Button>
                  </div>
                  <form onSubmit={handleTransferUfos} className="space-y-4">
                    <div>
                      <label className="block mb-1 text-white text-xs" htmlFor="recipient-wallet">
                        Recipient Wallet
                      </label>
                      <Input
                        id="recipient-wallet"
                        type="text"
                        value={transferWallet}
                        onChange={(e) => setTransferWallet(e.target.value)}
                        placeholder="Enter wallet address"
                        required
                        className="text-white text-xs"
                        aria-label="Recipient wallet address"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-white text-xs" htmlFor="transfer-amount">
                        Amount
                      </label>
                      <Input
                        id="transfer-amount"
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        min="1"
                        max={userData?.ufos || 0}
                        required
                        className="text-white text-xs"
                        aria-label="Transfer amount"
                      />
                      <p className="text-white text-xs mt-1">Available: {userData?.ufos || 0} UFOS</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTransferFormOpen(false)}
                        className="text-xs cursor-pointer"
                        aria-label="Cancel transfer"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="text-xs cursor-pointer" aria-label="Confirm transfer">
                        Transfer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
  
          {isNameFormOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
              <Card className="w-[95vw] max-w-[360px] bg-black border-white max-h-[80vh] flex flex-col z-[999]">
                <CardContent className="p-4 flex-grow overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-green-400">Change Name</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNameFormOpen(false)}
                      className="text-white cursor-pointer"
                      aria-label="Close Change Name modal"
                    >
                      X
                    </Button>
                  </div>
                  <form onSubmit={handleChangeName} className="space-y-4">
                    <div>
                      <label className="block mb-1 text-white text-xs" htmlFor="new-name">
                        New Name
                      </label>
                      <Input
                        id="new-name"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your new name"
                        required
                        className="text-white text-xs"
                        aria-label="New player name"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNameFormOpen(false)}
                        className="text-xs cursor-pointer"
                        aria-label="Cancel name change"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="text-xs cursor-pointer" aria-label="Save new name">
                        Save
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
  
          {showClaimableDetails && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001]">
              <Card className="w-[85vw] max-w-[300px] bg-black border-white max-h-[80vh] flex flex-col">
                <CardContent className="p-4 flex-grow overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-red-400">Claimable Resources</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("Closing Modal");
                        setShowClaimableDetails(false);
                      }}
                      className="text-white cursor-pointer"
                      aria-label="Close Claimable Resources modal"
                    >
                      X
                    </Button>
                  </div>
                  <ul className="text-xs">
                    {getClaimableBuildings().length > 0 ? (
                      getClaimableBuildings().map((building) => (
                        <li key={building} className="text-white">
                {building}: {formatNumber(userData?.buildingClaimables[building] || 0)} ready
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No buildings ready</li>
                    )}
                    {userData?.scavengerWorkingEnd > 0 && (
                      <li className="text-white">Scavenger: Ready to claim</li>
                    )}
                    {userData?.cadWorkingEnd > 0 && (
                      <li className="text-white">C.A.D.: Ready to claim</li>
                    )}
                    {userData?.claimableWater > 0 && (
                      <li className="text-white">Water Filter: Ready to claim</li>
                    )}
                    {userData?.claimableEmptyPowerCell > 0 && (
                      <li className="text-white">Workshop: Ready to claim</li>
                    )}
                    {powerCellSlots.some((slot) => slot.isClaimable) && (
                      <li className="text-white">Power Cell Slots: Ready to claim</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
  
{isInventoryOpen && (
  <div
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-sm"
    onClick={() => setIsInventoryOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="inventory-modal-title"
  >
    <Card
      className="w-[95vw] max-w-[900px] bg-gray-900/95 border border-[#00ffcc]/50 text-white max-h-[85vh] flex flex-col rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)]"
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <CardContent className="p-4 sm:p-6 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ffcc]/50 scrollbar-track-gray-800">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900/95 z-[1000] border-b border-[#00ffcc]/30 pb-3">
          <h2 id="inventory-modal-title" className="text-xl sm:text-2xl font-bold text-[#00ffcc] font-['Orbitron']">
            Inventory
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInventoryOpen(false)}
            className="text-white hover:text-[#00ffcc] hover:bg-gray-700/50 w-8 h-8"
            aria-label="Close inventory modal"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>

        {/* Search and Sort Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-1/2 bg-gray-800 border-[#00ffcc]/30 text-white text-sm placeholder-gray-400 focus:ring-[#00ffcc] focus:border-[#00ffcc] p-2"
            aria-label="Search inventory"
          />
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm text-gray-300 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-select"
              className="bg-gray-800 border-[#00ffcc]/30 text-white text-sm rounded-md p-2 focus:ring-[#00ffcc] focus:border-[#00ffcc] w-full sm:w-auto"
              value={sortOption}
              aria-label="Sort inventory"
            >
              <option value="name">Name</option>
              <option value="quantity-desc">Quantity (High to Low)</option>
              <option value="quantity-asc">Quantity (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          value={inventoryTab}
          onValueChange={setInventoryTab}
          className="w-full"
        >
          <TabsList className="flex flex-wrap gap-2 mb-20 bg-transparent p-2 rounded-lg">
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              All
            </TabsTrigger>
            {Object.keys(professionIcons).map((profession) => (
              <TabsTrigger
                key={profession}
                value={profession.toLowerCase()}
                className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
              >
                {profession}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="basic"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              Basic
            </TabsTrigger>
            <TabsTrigger
              value="components"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              Components
            </TabsTrigger>
          </TabsList>
          {["all", ...Object.keys(professionIcons).map(p => p.toLowerCase()), "basic", "components"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-15">
                {resources
                  .filter((resource) => {
                    const matchesTab =
                      tab === "all" ||
                      (resourceProfessionMap[resource.key] || "").toLowerCase() === tab;
                    const matchesSearch = resource.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                    return (
                      matchesTab &&
                      matchesSearch &&
                      (userData[resource.key as keyof UserData] as number) >= 1
                    );
                  })
                  .sort((a, b) => {
                    const quantityA = userData[a.key as keyof UserData] as number;
                    const quantityB = userData[b.key as keyof UserData] as number;
                    if (sortOption === "quantity-desc") return quantityB - quantityA;
                    if (sortOption === "quantity-asc") return quantityA - quantityB;
                    return a.name.localeCompare(b.name);
                  })
                  .map((resource) => (
                    <div
                      key={resource.key}
                      className="flex items-center justify-between p-3 t-500 border border-[#00ffcc]/30 rounded-lg bg-gray-900/70 hover:bg-gray-800/80 transition-all hover:shadow-[0_0_10px_rgba(0,255,204,0.2)] group"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={resource.image || "/placeholder.svg"}
                          alt={resource.name}
                          className="w-12 h-12 rounded-md object-cover"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-[#00ffcc] font-['Orbitron']">
                            {resource.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {formatNumber(userData[resource.key as keyof UserData] as number)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#00ffcc] hover:text-white hover:bg-[#00ffcc]/20 text-xs"
                          aria-label={`View details for ${resource.name}`}
                          onClick={() => showToast("info", resource.name, `Details for ${resource.name} (to be implemented)`, 3000)}
                        >
                          Info
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  </div>
)}
        </div>        </div>

      );
    }
    
  if (!isMobile) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <Toaster richColors position="top-right" />
        <audio ref={audioRef} preload="auto" />
      <ConfirmationModal /> {/* Add here */}
        <StandardToastModal
    isOpen={toastState.isOpen}
    onClose={() => setToastState((prev) => ({ ...prev, isOpen: false }))}
    type={toastState.type}
    title={toastState.title}
    description={toastState.description}
    duration={toastState.duration}
  />
        {/* Loading Layer */}
        {isClaiming && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p>Preparing transaction...</p>
            </div>
          </div>
        )}

                    {/* Loading Layer */}
      {isClaiming2 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000]">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-4"></div>
            <p className="text-base">Processing...</p>
          </div>
        </div>
      )}

        {/* Top Bar: Wallet Info */}
<div className="fixed top-0 left-0 right-0 h-16 bg-black/80 border-b border-gray-700 z-[1000] flex items-center justify-between px-4">
  <div className="flex items-center gap-4">
    <button onClick={() => window.location.href = "/pfp"} className="cursor-pointer">
      {userData.selectedNFT ? (
        <img
          src={userData.selectedNFT}
          alt="Profile Picture"
          className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center hover:opacity-80 transition-opacity">
          <span className="text-white text-sm">PFP</span>
        </div>
      )}
    </button>
    <button onClick={() => setIsNameFormOpen(true)}>
      <h3 className="text-lg font-bold text-green-400 cursor-pointer hover:text-green-300 transition-colors">
        {userData.name || "Player"}
      </h3>
    </button>
    {nftLevelData && userData.selectedNFT && (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs">Crypto UFO #{nftLevelData.nftId}: Level {nftLevelData.level}</span>
        <div className="flex items-center gap-2">
          <Progress
            value={getExpProgressPercentage(nftLevelData.exp, nftLevelData.level)}
            className="w-20 h-1 [&>div]:bg-yellow-400"
            aria-label="EXP progress"
          />
          <span className="text-xs text-yellow-400">
            EXP: {getExpTowardNextLevel(nftLevelData.exp, nftLevelData.level)}/{getExpRequiredForNextLevel(nftLevelData.level)}
          </span>
        </div>
      </div>
    )}
    <div className="flex items-center gap-2">
      <img src={GAME_ASSETS.coin || "/placeholder.svg"} alt="UFOS" className="w-6 h-6 animate-pulse" />
      <span className="text-yellow-400">{formatNumber(userData.ufos)} UFOS</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">NFTs: {userData.nfts}</span>
      <span className="text-xs text-red-400">(Tier: {determineUserTier(userData.nfts)})</span>
    </div>
    <span className="text-sm text-gray-400">V0.2.3</span>
    <Button
      onClick={() => (window.location.href = "/")}
      className="fixed top-4 right-5 z-[1000] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md border border-blue-300 glow-hover flex items-center gap-2 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Main
    </Button>
  </div>
</div>

        <div className="fixed top-16 bottom-16 left-0 w-48 bg-black/80 border-r border-gray-700 z-[1000] flex flex-col gap-2 p-4">
  <Button
    variant="outline"
    className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
    onClick={claimDailyReward}
  >
    
    <span>Daily Claim</span> <Gift />
  </Button>
<Button
  variant="outline"
  className="w-full bg-transparent cursor-pointer profession-button py-2 px-2 flex items-center gap-1.5 min-h-[64px]"
  onClick={() => setIsProfessionModalOpen(true)}
  aria-label="Open profession modal"
>  
    Set Profession:

  {userData?.activeProfession && professionIcons[userData.activeProfession] ? (
    React.createElement(professionIcons[userData.activeProfession], {
   
    })
  ) : (
    <UserCog />
  )}
</Button>
  <Button
    variant="outline"
    className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
    onClick={() => setIsInventoryOpen(true)}
  >
    
    <span>Inventory</span>
    <Package />
  </Button>
  <Button
    variant="outline"
    className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
    onClick={() => window.location.href = "/pfp"}
  >
 
    <span>Change PFP</span>
     <LucideImage />
  </Button>
  <Button
    variant="outline"
    className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
    onClick={() => setIsNameFormOpen(true)}
  >
   
    <span>Change Name</span>
     <Edit />
  </Button>
    <Button
    variant="outline"
    className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
    onClick={() => window.open(INTERSTELLAR_MARKETPLACE_URL, '_blank')}
    aria-label="Open Interstellar Marketplace"
  >
   
    <span>Marketplace</span>
     <Store />
  </Button>
<Button
  variant="outline"
  className="w-full bg-transparent cursor-pointer text-lg py-2 min-h-[80px] text-center whitespace-normal overflow-visible px-2 flex items-center justify-center gap-2"
  onClick={(e) => {
    e.stopPropagation();
    if (!userData.activeProfession) {

      return;
    }
    if (!userData.selectedNFT) {
showToast("error", "No NFT Selected", "Please select an NFT to view skill points.", 3000);
      return;
    }
    if (isNFTDataLoading) {
showToast("error", "NFT Data Loading", "Please wait while NFT data is loading.", 3000);
      return;
    }
    if (!nftLevelData) {
showToast("error", "NFT Data Not Loaded", "NFT data failed to load. Please try again.", 3000);
      return;
    }
    if (!nftLevelData.traits || Object.keys(nftLevelData.traits).length === 0) {
showToast("error", "No Traits Available", "Failed to load NFT traits. Please try again.", 3000);
      return;
    }
    if (!nftLevelData.skills || Object.keys(nftLevelData.skills).length === 0) {
      // Trigger a re-fetch and delay modal opening
      fetchNFTLevelData(extractNFTId(userData.selectedNFT)).then(() => {
        setTimeout(() => {
          console.log("[Skill Points Button] Setting isSkillPointsModalOpen to true");
          setIsSkillPointsModalOpen(true);
        }, 500); // Small delay to ensure state is updated
      });
      return;
    }
    console.log("[Skill Points Button] Setting isSkillPointsModalOpen to true");
    setIsSkillPointsModalOpen(true);
  }}
  aria-label="Open skill points modal"
>
  
  <span>Skill Points</span>
  <Ticket />
</Button>
  {hasClaimable && (
    <div
      className="relative"
      onMouseEnter={() => {
        console.log("Mouse Enter - Showing Tooltip");
        setShowClaimableDetails(true);
      }}
      onMouseLeave={() => {
        console.log("Mouse Leave - Hiding Tooltip");
        setShowClaimableDetails(false);
      }}
    >
      <span className="bg-red-500 text-white text-center text-xs rounded-full px-2 py-1 animate-pulse cursor-pointer">
        Claimable Resources!
      </span>
      {showClaimableDetails && (
        <div className="absolute left-0 top-8 w-48 bg-black/90 border border-gray-700 rounded-md p-2 text-xs z-[1001]">
          <h3 className="font-bold text-green-400 mb-1">Claimable Resources:</h3>
          <ul>
            {getClaimableBuildings().length > 0 ? (
              getClaimableBuildings().map((building) => (
                <li key={building} className="text-white">
                  {building}: {userData.buildingClaimables[building]} ready
                </li>
              ))
            ) : (
              <li className="text-gray-400"></li>
            )}
            {userData.scavengerWorkingEnd > 0 && (
              <li className="text-white">Ice Miner: Ready to claim</li>
            )}
            {userData.cadWorkingEnd > 0 && (
              <li className="text-white">C.A.D.: Ready to claim</li>
            )}
            {userData.claimableWater > 0 && (
              <li className="text-white">Water Filter: Ready to claim</li>
            )}
            {userData.claimableEmptyPowerCell > 0 && (
              <li className="text-white">Workshop: Ready to claim</li>
            )}
            {powerCellSlots.some((slot) => slot.isClaimable) && (
              <li className="text-white">Power Cell Slots: Ready to claim</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )}
</div>


  
        {/* Right Bar: Empty for now */}
        <div className="fixed top-16 bottom-16 right-0 w-48 bg-black/80 border-l border-gray-700 z-[1000]">
          {/* Placeholder for future content */}
                      <div className="cyberpunk-wallet-controls">

              <div className="flex items-center gap-2">
    <WalletMultiButton className="flex items-center bg-purple-300 text-black gap-2 h-9 px-4 py-2 cursor-pointer" />
  </div>
    </div>

        </div>
  {/* Music Controls */}
<div className="fixed bottom-4 w-40 right-4 z-30 flex flex-col gap-2 items-end z-[1000]">
  <Button
    onClick={() => setShowMusicControls(!showMusicControls)}
    className="cypherpunk-button w-40 cypherpunk-button-purple p-2 rounded-full glow-hover"
  >
    {showMusicControls ? "Hide" : "Show"} Music
  </Button>
  {showMusicControls && (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => changeTrack("prev")}
          className="cypherpunk-button w-9 cypherpunk-button-blue p-2 rounded-full glow-hover"
        >
          ⏮
        </Button>
        <Button
          onClick={togglePlayPause}
          className="cypherpunk-button w-9 cypherpunk-button-green p-2 rounded-full glow-hover"
        >
          {isPlaying ? <Pause className="w-5 h-5 cypherpunk-icon-glow" /> : <Play className="w-5 h-5 cypherpunk-icon-glow" />}
        </Button>
        <Button
          onClick={() => changeTrack("next")}
          className="cypherpunk-button w-9 cypherpunk-button-blue p-2 rounded-full glow-hover"
        >
          ⏭
        </Button>
        <div className="relative z-40">
          <Button
            onClick={handleVolumeClick}
            className="cypherpunk-button w-9 cypherpunk-button-purple p-2 rounded-full glow-hover"
          >
            <Volume2 className="w-5 h-5 cypherpunk-icon-glow" />
          </Button>
          {isVolumeOpen && (
            <div
              className="absolute bottom-16 right-0 w-12 bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 shadow-lg flex justify-center z-[1000] cypherpunk-border"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-6 rotate-[-90deg] translate-x-[-25%] accent-[#00ffaa] cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
      <div className="marquee-container bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 text-sm flex items-center w-36 overflow-hidden z-30 cypherpunk-border">
        <div className="marquee-text">
          {AUDIO_TRACKS[currentTrack].title}
          <span>       </span>
          <span className="inline-block mx-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </>
  )}
</div>
        {/* Game Map Container */}
        <div className="absolute top-16 bottom-16 left-48 right-48 overflow-hidden">
          <div
            ref={mapContainerRef}
            className="relative overflow-auto cursor-grab"
            style={{
              width: `${containerSize.width}px`,
              height: `${containerSize.height}px`,
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              ref={mapRef}
              className="relative"
              style={{
                width: `${calculateMapSize(zoomLevel).width}px`,
                height: `${calculateMapSize(zoomLevel).height}px`,
                backgroundImage: `url(${GAME_ASSETS.background})`,
                backgroundSize: `${100 * zoomLevel}%`,
                backgroundRepeat: "repeat",
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{
                  width: `${baseMapSize}px`,
                  height: `${baseMapSize}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                }}
              >
                <div
                  className="absolute top-[100px] left-[0px] w-[2000px] h-[2000px] bg-contain bg-no-repeat"
                  style={{ backgroundImage: `url(${GAME_ASSETS.landMap})` }}
                >
                  {/* Always show Laboratory and Market */}
                  <Button
                    variant="ghost"
                    className="absolute top-[600px] left-[100px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setIsLaboratoryOpen(true)}
                    style={{
                      backgroundImage: `url(${GAME_ASSETS.powerCellCharger})`,
                      backgroundColor: "transparent",
                    }}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[250px] left-[600px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setIsMarketOpen(true)}
                    style={{ backgroundImage: `url(${GAME_ASSETS.market})`, backgroundColor: "transparent" }}
                  />
                  {/* Always show Scavenger, Workshop, Water Filter, CAD */}
                  <Button
                    variant="ghost"
                    className="absolute top-[925px] left-[1020px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1000]"
                    onClick={userData.scavengerWorkingEnd > 0 ? claimScavengerResults : startScavenger}
                    style={{ backgroundImage: `url(${GAME_ASSETS.iceMiner})`, backgroundColor: "transparent" }}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[875px] left-[550px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1000]"
                    onClick={userData.claimableEmptyPowerCell > 0 ? claimWorkshopResults : startWorkshop}
                    style={{ backgroundImage: `url(${GAME_ASSETS.workshop})`, backgroundColor: "transparent" }}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[750px] left-[1300px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1000]"
                    onClick={userData.claimableWater > 0 ? claimWaterFilterResults : startWaterFilter}
                    style={{ backgroundImage: `url(${GAME_ASSETS.waterFilter})`, backgroundColor: "transparent" }}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-[600px] left-[1600px] w-[350px] h-[350px] bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[1000]"
                    onClick={userData.cadWorkingEnd > 0 ? claimCadResults : startCad}
                    style={{ backgroundImage: `url(${GAME_ASSETS.cad})`, backgroundColor: "transparent" }}
                  />
                  {/* Dynamically render profession-specific buildings */}
                  {getVisibleBuildings(userData.activeProfession).map((building) => {
                    const buildingPositions: { [key: string]: { top: string; left: string; width: string; height: string } } = {
                      CrystalMine: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      CrystalRefinery: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      GemProcessor: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      CrystalSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      AdvancedFilter: { top: "95px", left: "850px", width: "350px", height: "350px" },
                      PlasmaReactor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      HydrogenExtractor: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      FusionPlant: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      QuantumFoundry: { top: "95px", left: "870px", width: "300px", height: "300px" },
                      CoreReactor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      PlasmaCoreFabricator: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      AntimatterGenerator: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      BiopolymerGreenhouse: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      MyceliumExtractor: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      BioPolymerSynthesizer: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      NanoOrganicLab: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      SmeltingForge: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      Nanoforge: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      SuperAlloyForge: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      MetaMaterialSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      ChemicalSynthesizer: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      PolymerizationPlant: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      NanoCatalystLab: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      QuantumChemSynthesizer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      AssemblyWorkshop: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      ElectronicsFabricator: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      ComponentFabricator: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      RoboticsAssembler: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      CommerceHub: { top: "95px", left: "870px", width: "350px", height: "350px" },
                      TokenMinter: { top: "550px", left: "500px", width: "350px", height: "350px" },
                      CryptoExchange: { top: "425px", left: "1350px", width: "350px", height: "350px" },
                      BondIssuer: { top: "750px", left: "850px", width: "350px", height: "350px" },
                      InterstellarFabricator: { top: "400px", left: "950px", width: "400px", height: "400px" },
                    };

                    const position = buildingPositions[building] || { top: "0px", left: "0px", width: "350px", height: "350px" };
                    const assetKey = buildingAssetMap[building];

                    return (
                      <Button
                        key={building}
                        variant="ghost"
                        className="absolute bg-contain bg-no-repeat hover:scale-105 transition-transform cursor-pointer z-[999]"
                        style={{
                          top: position.top,
                          left: position.left,
                          width: position.width,
                          height: position.height,
                          backgroundImage: `url(${GAME_ASSETS[assetKey] || "/placeholder.svg"})`,
                          backgroundColor: "transparent",
                        }}
                        onClick={
                          userData.buildingClaimables[building] > 0
                            ? () => claimBuildingOutput(building)
                            : building === "InterstellarFabricator"
                            ? () => setIsFabricatorModalOpen(true)
                            : () => startBuildingProduction(building)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

{/* Zoom Controls and Progress Bar Toggle */}
        <div className="fixed bottom-20 left-52 z-[1000] flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            className="bg-black/50 hover:bg-black/70 cursor-pointer"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            className="bg-black/50 hover:bg-black/70 cursor-pointer"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-white bg-black/50 px-2 py-1 rounded">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </span>
       {/* Updated Progress Bar Toggle Button with Text */}
<Button
  variant="outline"
  onClick={() => setProgressBars(progressBars)}
  className="bg-black/50 hover:bg-black/70 cursor-pointer flex items-center gap-1 px-3 py-1"
>
  <Activity className="h-5 w-5" />
  <span className="text-sm">{progressBars ? "Hide Progress Bars" : "Show Progress Bars"}</span>
</Button>
      </div>
          {isSkillPointsModalOpen && userData.selectedNFT && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] backdrop-blur-sm"
            onClick={() => setIsSkillPointsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-points-modal-title"
          >
            <Card
              className="w-[95vw] max-w-[500px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col rounded-lg shadow-[0_0_20px_rgba(0,255,204,0.3)]"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <CardContent className="p-4 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="flex justify-between items-center mb-4 top-0 bg-gray-800 z-[999] border-b border-gray-600/50 pb-2">
                  <h2 id="skill-points-modal-title" className="text-base font-bold text-green-400 font-['Orbitron']">
                    Crypto UFO #{extractNFTId(userData.selectedNFT)}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSkillPointsModalOpen(false)}
                    className="text-white hover:text-gray-300 hover:bg-gray-700/50 w-8 h-8 rounded-full"
                    aria-label="Close Skill Points modal"
                  >
                    <span className="text-lg">X</span>
                  </Button>
                </div>

                {isNFTDataLoading && (
                  <div className="text-center flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-2"></div>
                    <p className="text-sm text-gray-300">Loading NFT data...</p>
                  </div>
                )}

                {!isNFTDataLoading && !nftLevelData && (
                  <div className="text-center flex items-center justify-center flex-col h-40">
                    <p className="text-sm text-red-400 mb-4">Failed to load NFT data.</p>
                    <Button
                      onClick={() => fetchNFTLevelData(extractNFTId(userData.selectedNFT))}
                      className="bg-blue-500 hover:bg-blue-600 text-sm px-4 py-2 rounded-md"
                      aria-label="Retry loading NFT data"
                    >
                      Retry
                    </Button>
                  </div>
                )}

{!isNFTDataLoading && nftLevelData && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={userData.selectedNFT || "/placeholder.svg"}
                        alt={`Crypto UFO ${extractNFTId(userData.selectedNFT)}`}
                        className="w-12 h-12 rounded-md object-cover border border-gray-600"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        loading="lazy"
                      />
                      <div className="text-center">
                        <p className="text-sm text-white">Level: {nftLevelData.level}</p>
                        <p className="text-sm text-white">
                          EXP: {getExpTowardNextLevel(nftLevelData.exp, nftLevelData.level)}/{getExpRequiredForNextLevel(nftLevelData.level)}
                        </p>
                        <Progress
                          value={getExpProgressPercentage(nftLevelData.exp, nftLevelData.level)}
                          className="w-24 h-1 [&>div]:bg-yellow-400 mt-2"
                          aria-label="EXP progress"
                        />
                        <p className="text-sm text-yellow-400 mt-2">
                          Available Points: {nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)} | Total Bonus: {(nftLevelData.totalBonus * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-purple-400 mb-2">Traits</p>
                      {Object.entries(nftLevelData.traits || {})
                        .filter(([trait]) => trait !== "Rarity Rank")
                        .sort(([aTrait], [bTrait]) => aTrait.localeCompare(bTrait))
                        .length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(nftLevelData.traits || {})
                            .filter(([trait]) => trait !== "Rarity Rank")
                            .sort(([aTrait], [bTrait]) => aTrait.localeCompare(bTrait))
                            .map(([trait, value]) => (
                              <div
                                key={trait}
                                className="p-2 bg-gray-900/50 rounded-lg border border-gray-700/50 text-center"
                              >
                                <p className="text-xs text-gray-300 whitespace-normal break-words">
                                  <span className="font-medium">{trait}</span>: {value}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center">No traits available</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-500 mb-2">Skills</p>
                      {Object.entries(nftLevelData.skills || {})
                        .filter(([skillName]) => {
                          const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                          return resourceMatch && resources.find((r) => r.key === resourceMatch[1]);
                        })
                        .sort(([aSkillName], [bSkillName]) => {
                          const aResource = aSkillName.replace(/ Efficiency$/i, "");
                          const bResource = bSkillName.replace(/ Efficiency$/i, "");
                          const aDisplayName = getResourceDisplayName(aResource);
                          const bDisplayName = getResourceDisplayName(bResource);
                          return aDisplayName.localeCompare(bDisplayName);
                        })
                        .length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(nftLevelData.skills || {})
                            .filter(([skillName]) => {
                              const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                              return resourceMatch && resources.find((r) => r.key === resourceMatch[1]);
                            })
                            .sort(([aSkillName], [bSkillName]) => {
                              const aResource = aSkillName.replace(/ Efficiency$/i, "");
                              const bResource = bSkillName.replace(/ Efficiency$/i, "");
                              const aDisplayName = getResourceDisplayName(aResource);
                              const bDisplayName = getResourceDisplayName(bResource);
                              return aDisplayName.localeCompare(bDisplayName);
                            })
                            .map(([skillName, skill]) => {
                              const resourceMatch = skillName.match(/^(.+) Efficiency$/i);
                              const rawResource = resourceMatch ? resourceMatch[1] : null;
                              if (!rawResource) return null;

                              const resourceKey = rawResource as ResourceKey;
                              const resource = resources.find((r) => r.key === resourceKey);
                              if (!resource) return null;

                              const matchingTraitKeys = Object.keys(traitResourceMap).filter((key) =>
                                Object.values(traitResourceMap[key]).includes(resourceKey)
                              );
                              let traitKey: string | null = null;
                              let traitValue: string | number | null = null;
                              for (const key of matchingTraitKeys) {
                                const resourceMap = traitResourceMap[key];
                                const foundTraitValue = Object.keys(resourceMap).find(
                                  (val) => resourceMap[val] === resourceKey
                                );
                                if (foundTraitValue && nftLevelData.traits[key] === foundTraitValue) {
                                  traitKey = key;
                                  traitValue = foundTraitValue;
                                  break;
                                }
                              }

                              if (!traitKey || !traitValue) return null;

                              const displayName = getResourceDisplayName(resourceKey);

                              return (
                                <div
                                  key={skillName}
                                  className="p-2 border border-gray-700 rounded-lg bg-gray-900/50 flex flex-col items-center gap-2"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <img
                                      src={resource.image || "/placeholder.svg"}
                                      alt={resource.name}
                                      className="w-6 h-6 flex-shrink-0 rounded-md"
                                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                      loading="lazy"
                                    />
                                    <p className="text-xs font-medium text-white text-center flex-grow">
                                      {displayName}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-300">Level: {skill.level}/10</p>
                                  <p className="text-xs text-gray-300">Bonus: {(skill.bonus * 100).toFixed(2)}%</p>
                                  <Button
                                    onClick={() => allocateSkillPoint(extractNFTId(userData.selectedNFT), skillName)}
                                    disabled={
                                      skill.level >= 10 ||
                                      (nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)) <= 0 ||
                                      isActionLocked
                                    }
                                    className={`w-full text-xs py-1.5 ${
                                      skill.level < 10 &&
                                      (nftLevelData.level - Object.values(nftLevelData.skills).reduce((sum, s) => sum + s.level, 0)) > 0 &&
                                      !isActionLocked
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-gray-500 cursor-not-allowed"
                                    }`}
                                    aria-label={`Upgrade ${displayName} Efficiency`}
                                  >
                                    Upgrade
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center">No skills available</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

  
        {/* Inventory Modal */}
{isInventoryOpen && (
  <div
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-sm"
    onClick={() => setIsInventoryOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="inventory-modal-title"
  >
    <Card
      className="w-[95vw] max-w-[900px] bg-gray-900/95 border border-[#00ffcc]/50 text-white max-h-[85vh] flex flex-col rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)]"
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <CardContent className="p-4 sm:p-6 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ffcc]/50 scrollbar-track-gray-800">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900/95 z-[1000] border-b border-[#00ffcc]/30 pb-3">
          <h2 id="inventory-modal-title" className="text-xl sm:text-2xl font-bold text-[#00ffcc] font-['Orbitron']">
            Inventory
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInventoryOpen(false)}
            className="text-white hover:text-[#00ffcc] hover:bg-gray-700/50 w-8 h-8"
            aria-label="Close inventory modal"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>

        {/* Search and Sort Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-1/2 bg-gray-800 border-[#00ffcc]/30 text-white text-sm placeholder-gray-400 focus:ring-[#00ffcc] focus:border-[#00ffcc] p-2"
            aria-label="Search inventory"
          />
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm text-gray-300 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-select"
              className="bg-gray-800 border-[#00ffcc]/30 text-white text-sm rounded-md p-2 focus:ring-[#00ffcc] focus:border-[#00ffcc] w-full sm:w-auto"
              value={sortOption}
              aria-label="Sort inventory"
            >
              <option value="name">Name</option>
              <option value="quantity-desc">Quantity (High to Low)</option>
              <option value="quantity-asc">Quantity (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          value={inventoryTab}
          onValueChange={setInventoryTab}
          className="w-full"
        >
          <TabsList className="flex flex-wrap gap-2 mb-6 bg-transparent p-2 rounded-lg">
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              All
            </TabsTrigger>
            {Object.keys(professionIcons).map((profession) => (
              <TabsTrigger
                key={profession}
                value={profession.toLowerCase()}
                className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
              >
                {profession}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="basic"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              Basic
            </TabsTrigger>
            <TabsTrigger
              value="components"
              className="text-xs sm:text-sm py-2 px-3 sm:px-4 min-w-[80px] bg-gray-700 rounded-lg data-[state=active]:bg-[#00ffcc] data-[state=active]:text-black font-['Orbitron'] hover:bg-[#00ffcc]/20"
            >
              Components
            </TabsTrigger>
          </TabsList>
          {["all", ...Object.keys(professionIcons).map(p => p.toLowerCase()), "basic", "components"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources
                  .filter((resource) => {
                    const matchesTab =
                      tab === "all" ||
                      (resourceProfessionMap[resource.key] || "").toLowerCase() === tab;
                    const matchesSearch = resource.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                    return (
                      matchesTab &&
                      matchesSearch &&
                      (userData[resource.key as keyof UserData] as number) >= 1
                    );
                  })
                  .sort((a, b) => {
                    const quantityA = userData[a.key as keyof UserData] as number;
                    const quantityB = userData[b.key as keyof UserData] as number;
                    if (sortOption === "quantity-desc") return quantityB - quantityA;
                    if (sortOption === "quantity-asc") return quantityA - quantityB;
                    return a.name.localeCompare(b.name);
                  })
                  .map((resource) => (
                    <div
                      key={resource.key}
                      className="relative flex items-center justify-between p-3 border border-[#00ffcc]/30 rounded-lg bg-gray-900/70 hover:bg-gray-800/80 transition-all hover:shadow-[0_0_10px_rgba(0,255,204,0.2)] group"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={resource.image || "/placeholder.svg"}
                          alt={resource.name}
                          className="w-12 h-12 rounded-md object-cover"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-[#00ffcc] font-['Orbitron']">
                            {resource.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {formatNumber(userData[resource.key as keyof UserData] as number)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#00ffcc] hover:text-white hover:bg-[#00ffcc]/20 text-xs"
                          aria-label={`View details for ${resource.name}`}
                          onClick={() => showToast("info", resource.name, `Details for ${resource.name} (to be implemented)`, 3000)}
                        >
                          Info
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  </div>
)}
  
        {/* Existing Modals */}
{isLaboratoryOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
    <Card className="w-[95vw] max-w-[500px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col z-[999]">
      <CardContent className="p-4 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 z-[999]">
          <div>
            <h2 className="text-base font-bold text-green-400">Power Cell Charger</h2>
            <p className="text-xs text-gray-400">
              {getPowerCellSlots(userData?.nfts || 0)} slots (Tier {determineUserTier(userData?.nfts || 0)})
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLaboratoryOpen(false)}
            className="text-white hover:text-gray-300 w-8 h-8 cursor-pointer"
            disabled={isActionLocked}
            aria-label="Close Power Cell Charger modal"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>
        {/* Claim All Button */}
        <div className="mb-4">
          <Button
            onClick={claimAllPowerCells}
            disabled={
              isActionLocked ||
              !powerCellSlots.some((slot) => slot.isClaimable) ||
              !walletConnected
            }
            className={`w-full text-sm py-2 ${
              powerCellSlots.some((slot) => slot.isClaimable) && !isActionLocked && walletConnected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-600 cursor-not-allowed"
            }`}
            aria-label="Claim all power cells"
          >
            {isActionLocked ? "Processing..." : "Claim All Power Cells"}
          </Button>
        </div>
<div className="grid grid-cols-2 gap-2">
  {powerCellSlots.map((slot, index) => (
    <div key={slot.id} className="relative">
      <Button
        variant="ghost"
        className="w-full h-[60px] bg-gray-900/50 border border-gray-600 rounded-md flex items-center justify-center cursor-pointer"
        onClick={() =>
          slot.isClaimable ? claimPowerCellSlot(slot.id) : startPowerCellSlotCharging(slot.id)
        }
        disabled={isActionLocked}
        aria-label={slot.isClaimable ? `Claim power cell slot ${slot.id + 1}` : `Start charging power cell slot ${slot.id + 1}`}
      >
        <img
          src={getBatteryImage(slot.isCharging, slot.isClaimable) || "/placeholder.svg"}
          alt="Power Cell"
          className="w-12 h-12"
          loading="lazy"
        />
      </Button>
      {(slot.isCharging || slot.isClaimable) && (
        <div className="mt-1">
          <div className="cypherpunk-progress">
            <div
              className="cypherpunk-progress-bar"
              style={{ width: `${displayPowerCellProgress[index] || 0}%` }}
            ></div>
          </div>
          <p className="cypherpunk-time mt-1">
            {formatTimeRemaining(displayPowerCellProgress[index] || 0, 12)}
          </p>
        </div>
      )}
      <div className="absolute top-1 left-1 cypherpunk-slot-number">
        {slot.id + 1}
      </div>
    </div>
  ))}
</div>
        {isActionLocked && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Processing claim...</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
  
 {isProfessionModalOpen && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] backdrop-blur-sm"
    onClick={() => setIsProfessionModalOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="profession-modal-title"
  >
    <Card
      className="w-[95vw] max-w-[360px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col rounded-lg shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      ref={(node) => {
        if (node && isProfessionModalOpen) {
          node.focus();
        }
      }}
      tabIndex={-1}
    >
      <CardContent className="p-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h2 id="profession-modal-title" className="text-base font-bold text-green-400">
            Choose Profession
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsProfessionModalOpen(false)}
            aria-label="Close profession modal"
            className="text-white hover:text-gray-300 hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
          >
            <span className="text-sm">X</span>
          </Button>
        </div>
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-md p-2 mb-3">
          <p className="text-xs text-yellow-300 font-medium">
            <span className="font-bold">Warning:</span> Changing professions costs 10,000 UFOS and resets your current profession's skills to Level 0.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {VALID_PROFESSIONS.slice().sort().map((profession) => {
            const IconComponent = professionIcons[profession];
            const isActive = userData?.activeProfession === profession;
            return (
              <div
                key={profession}
                className={`p-3 border ${isActive ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-900/50'} rounded-lg shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-purple-400'}`} />
                  <h3 className={`text-base font-medium ${isActive ? 'text-green-400' : 'text-white'}`}>
                    {profession}
                  </h3>
                </div>
                <p className="text-xs text-gray-300">Level: {userData?.professions[profession]?.level || 0}</p>
                <p className="text-xs text-gray-300">
                  Efficiency Bonus: {formatNumber((userData?.professions[profession]?.efficiencyBonus * 100) || 0)}%
                </p>
                <div className="flex flex-col gap-2 mt-2">
                  {isActive ? (
                    <Button
                      disabled
                      className="w-full bg-green-600 text-white text-xs py-1.5 px-3 rounded-md"
                      aria-label={`${profession} is currently active`}
                    >
                      Active
                    </Button>
                  ) : (
                    <Button
                      onClick={() => resetAndSelectProfession(profession)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105"
                      aria-label={`Reset and select ${profession}`}
                    >
                      Reset & Select (10,000 UFOS)
                    </Button>
                  )}
                  {userData?.professions[profession]?.level < 10 && (
                    <Button
                      onClick={() => upgradeProfessionSkill(profession)}
                      disabled={profession !== userData?.activeProfession}
                      className={`w-full ${
                        profession === userData?.activeProfession
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-gray-600 cursor-not-allowed'
                      } text-white text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105`}
                      title={
                        profession !== userData?.activeProfession
                          ? `Switch to ${profession} to upgrade`
                          : `Upgrade ${profession}`
                      }
                      aria-label={`Upgrade ${profession}`}
                    >
                      Upgrade (
                      {[1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000][
                        userData?.professions[profession]?.level || 0
                      ].toLocaleString()}{" "}
                      UFOS)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </div>
)}
{/* Interstellar Fabricator Modal */}
{isFabricatorModalOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
    <Card className="w-[90%] max-w-[600px] bg-gray-900 border-white text-white max-h-[80vh] flex flex-col z-[999]">
      <CardContent className="p-6 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-[999]">
          <h2 className="text-xl font-bold text-purple-400">Interstellar Fabricator</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsFabricatorModalOpen(false)} className="text-white">
            X
          </Button>
        </div>
        {userData.buildingClaimables.InterstellarFabricator > 0 ? (
          <div className="mb-4 text-center">
            <p className="text-lg text-green-400 mb-2">
              Production Complete: {userData.claimableFabricatorProduct
                ? fabricatorProducts[userData.claimableFabricatorProduct]?.name || "Product"
                : "Unknown Product"} Ready!
            </p>
            <Button
              onClick={() => claimBuildingOutput("InterstellarFabricator")}
              className="w-full bg-green-500 hover:bg-green-600 text-lg py-2"
              disabled={isClaiming}
            >
              {isClaiming
                ? "Claiming..."
                : `Claim ${userData.claimableFabricatorProduct
                    ? fabricatorProducts[userData.claimableFabricatorProduct]?.name || "Product"
                    : "Product"}`}
            </Button>
          </div>
        ) : userData.buildingTimestamps.InterstellarFabricator && userData.selectedFabricatorProduct ? (
          <div className="mb-4 text-center">
            <p className="text-sm text-yellow-400">
              Producing: {fabricatorProducts[userData.selectedFabricatorProduct]?.name || "Unknown"}
            </p>
            <Progress value={displayFabricatorProgress} className="h-2 w-full [&>div]:bg-green-500 mt-2" />
            <p className="text-xs mt-1">
              {formatTimeRemaining(
                displayFabricatorProgress,
                fabricatorProducts[userData.selectedFabricatorProduct]?.cycleHours || 24
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Select a product to begin production:</p>
            {Object.entries(fabricatorProducts).map(([productKey, product]) => {
              const canProduce = Object.entries(product.requirements).every(
                ([resource, amount]) => (userData[resource as keyof UserData] as number) >= amount
              );
              return (
                <div key={productKey} className="p-4 border border-gray-700 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={GAME_ASSETS[product.outputKey as keyof typeof GAME_ASSETS] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      <div>
                        <h3 className="text-lg font-medium text-purple-500">{product.name}</h3>
                        <p className="text-sm text-gray-400">Cycle: {product.cycleHours} hours</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => startBuildingProduction("InterstellarFabricator", productKey)}
                      disabled={!canProduce}
                      className={canProduce ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500"}
                    >
                      Produce
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-yellow-400">Requirements:</p>
                    <ul className="text-sm text-gray-400">
                      {Object.entries(product.requirements).map(([resource, amount]) => (
                        <li key={resource}>
                          {getResourceDisplayName(resource)}: {amount} (Available: {(userData[resource as keyof UserData] as number) || 0})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
  {isMarketOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] overflow-auto">
    <Card className="w-[95%] sm:w-[90%] md:max-w-[800px] bg-gray-800 border-gray-600 text-white max-h-[80vh] flex flex-col z-[999]">
      <CardContent className="p-4 sm:p-6 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-amber-400">Market</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMarketOpen(false)}
            className="text-white hover:text-gray-300 w-8 h-8 cursor-pointer"
          >
            <span className="text-lg">X</span>
          </Button>
        </div>
        <Tabs defaultValue="buy" onValueChange={setActiveMarketTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-700">
            <TabsTrigger
              value="buy"
              className="text-base sm:text-lg py-2 sm:py-3 data-[state=active]:bg-amber-500 data-[state=active]:text-black"
            >
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="text-base sm:text-lg py-2 sm:py-3 data-[state=active]:bg-green-500 data-[state=active]:text-black"
            >
              Sell
            </TabsTrigger>
          </TabsList>
          <TabsContent value="buy" className="mt-4">
            <div className="space-y-4">
              {marketResources
                .filter((resource) => resource.buyPrice !== undefined)
                .map((resource) => {
                  const quantity = tradeQuantity[resource.key] || 1;
                  const totalCost = quantity * resource.buyPrice;
                  const canAfford = userData.ufos >= totalCost && quantity > 0 && Number.isInteger(quantity);
                  return (
                    <div
                      key={resource.key}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-600 rounded-lg bg-gray-900/50"
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        <img
                          src={resource.image || "/placeholder.svg"}
                          alt={resource.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 rounded-md"
                          loading="lazy"
                        />
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-red-400">{resource.name}</h3>
                          <p className="text-sm text-yellow-300">Price: {formatNumber(resource.buyPrice)} UFOS each</p>
                          <p className="text-sm text-gray-300">Available UFOS: {formatNumber(userData.ufos)}</p>
                          <p className="text-sm text-gray-300">
                            Total Cost: {formatNumber(totalCost)} UFOS
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setTradeQuantity({
                              ...tradeQuantity,
                              [resource.key]: Math.floor(userData.ufos / resource.buyPrice) || 1,
                            })
                          }
                          className="text-xs text-black cursor-pointer"
                        >
                          Max
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={tradeQuantity[resource.key] || ""}
                          onChange={(e) =>
                            setTradeQuantity({
                              ...tradeQuantity,
                              [resource.key]: Number(e.target.value),
                            })
                          }
                          className="w-20 text-white bg-gray-700 border-gray-600"
                          placeholder="Qty"
                        />
                        <Button
                          onClick={() => {
                            if (canAfford) {
                              // Show confirmation dialog
                                buyResource(resource.key, quantity);
                              
                            }
                          }}
                          disabled={!canAfford}
                          className={`cursor-pointer ${canAfford ? "bg-green-500 hover:bg-green-600" : "bg-gray-600"}`}
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
<TabsContent value="sell" className="mt-4">
  <div className="space-y-4">
    {marketResources
      .filter((resource) => resource.sellPrice !== undefined)
      .map((resource) => {
        const quantity = tradeQuantity[resource.key] || 1;
        const totalEarned = quantity * resource.sellPrice;
        const canSell =
          (userData[resource.key as keyof UserData] as number) >= quantity &&
          quantity > 0 &&
          Number.isInteger(quantity);
        return (
          <div
            key={resource.key}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-600 rounded-lg bg-gray-900/50"
          >
            <div className="flex items-center mb-2 sm:mb-0">
              <img
                src={resource.image || "/placeholder.svg"}
                alt={resource.name}
                className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 rounded-md"
                loading="lazy"
              />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-green-400">{resource.name}</h3>
                <p className="text-sm text-yellow-300">Price: {formatNumber(resource.sellPrice)} UFOS each</p>
                <p className="text-sm text-gray-300">
                  Owned: {formatNumber(userData[resource.key as keyof UserData] as number)}
                </p>
                <p className="text-sm text-gray-300">
                  Total Earned: {formatNumber(totalEarned)} UFOS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTradeQuantity({
                    ...tradeQuantity,
                    [resource.key]: userData[resource.key as keyof UserData] as number,
                  })
                }
                className="text-xs text-black cursor-pointer"
                aria-label="Set maximum sell quantity"
              >
                Max
              </Button>
              <Input
                type="number"
                min="1"
                value={tradeQuantity[resource.key] || ""}
                onChange={(e) =>
                  setTradeQuantity({
                    ...tradeQuantity,
                    [resource.key]: Number(e.target.value),
                  })
                }
                className="w-20 text-white bg-gray-700 border-gray-600"
                placeholder="Qty"
                aria-label="Sell quantity"
              />
              <Button
                onClick={() => {
                  if (canSell && !isActionLoading) {
                    sellResource(resource.key, quantity);
                  }
                }}
                disabled={!canSell || isActionLoading}
                className={`cursor-pointer ${canSell && !isActionLoading ? "bg-green-500 hover:bg-green-600" : "bg-gray-600"}`}
                aria-label={`Sell ${quantity} ${resource.name}`}
              >
                {isActionLoading ? "Processing..." : "Sell"}
              </Button>
            </div>
          </div>
        );
      })}
  </div>
</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
)}
  
        {isTransferFormOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
            <Card className="w-[400px] bg-black border-white z-[999]">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-yellow-400">Transfer UFOS</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsTransferFormOpen(false)} className="text-white cursor-pointer">
                    X
                  </Button>
                </div>
                <form onSubmit={handleTransferUfos} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-white">Recipient Wallet</label>
                    <Input
                      type="text"
                      value={transferWallet}
                      onChange={(e) => setTransferWallet(e.target.value)}
                      placeholder="Enter recipient wallet address"
                      required
                      className="text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-white">Amount</label>
                    <Input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      min="1"
                      max={userData.ufos}
                      required
                      className="text-white"
                    />
                    <p className="text-white mt-1">Available: {userData.ufos} UFOS</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsTransferFormOpen(false)} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button type="submit" className="cursor-pointer">Transfer</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
  
        {isNameFormOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
            <Card className="w-[400px] bg-black border-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-green-400">Change Name</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsNameFormOpen(false)} className="text-white cursor-pointer">
                    X
                  </Button>
                </div>
                <form onSubmit={handleChangeName} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-white">New Name:</label>
                    <Input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter your new name"
                      required
                      className="text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsNameFormOpen(false)} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button type="submit" className="cursor-pointer">Save</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
  
       
{/* Progress Indicators (Conditionally Rendered) */}

{shouldShowProgressBars && (
  <div className="fixed right-125 z-40">
    {getProgressItems(
      userData,
      displayScavengerProgress,
      displayCadProgress,
      displayWaterFilterProgress,
      displayWorkshopProgress,
      displayPowerCellProgress,
      displayBuildingProgress,
      buildingConfig,
      buildingAssetMap
    ).map((item, index) => (
      <div
        key={item.key}
        className="absolute bg-black/80 p-2 rounded-md border border-[#00ffaa]/30"
        style={{
          top: `${100 + index * 40}px`,
          left: "0px",
        }}
      >
        <div className="flex items-center gap-2">
          <img
            src={item.icon}
            alt={item.displayName}
            className="w-5 h-5"
            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
          />
          <div className="flex flex-col w-40">
            <div className="cypherpunk-progress">
              <div
                className="cypherpunk-progress-bar"
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            <span className="cypherpunk-time mt-1">
              {formatTimeRemaining(item.progress, item.cycleHours)}
            </span>
          </div>
          {item.key.startsWith("powerCellSlot_") && (
            <span className="cypherpunk-slot-number">
              {parseInt(item.key.split("_")[1]) + 1}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)}
        <Analytics />
        <SpeedInsights />

      </div>
    );
  }
}

const WrappedCryptoUFOsGame = () => {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CryptoUFOsGame />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WrappedCryptoUFOsGame;



