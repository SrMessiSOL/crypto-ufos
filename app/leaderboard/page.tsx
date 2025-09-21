"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Trophy, Medal, Crown, Coins } from "lucide-react";
import Link from "next/link";
import { Play, Pause, Volume2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import Modal from "react-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "./BurnPage.css"; // Assuming styles are in BurnPage.css
import "@solana/wallet-adapter-react-ui/styles.css"; // Required for WalletModalProvider


// Bind react-modal to app element for accessibility
if (typeof window !== "undefined") {
  const rootElement = document.getElementById("__next");
  if (rootElement) {
    Modal.setAppElement("#__next");
  } else {
    console.warn("Root element #__next not found. Using document.body as fallback for react-modal.");
    Modal.setAppElement(document.body);
  }
}

// Firebase configuration


const HELIUS_API_KEY = "";
const JSON_RPC_API_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const COLLECTION_ADDRESS = "";
const NETWORK = "https://mainnet.helius-rpc.com/";

// Wallet adapters
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

type GameAssets = Record<string, string>;

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

// Define keyMap with an explicit type
const keyMap: Partial<Record<string, ResourceKey>> = {
  alloyingots: "alloyIngots",
  cryptocredits: "cryptoCredits",
  energycores: "energyCores",
  superalloys: "superAlloys",
  holoprojector: "holoProjector",
  nanocatalysts: "nanoCatalysts",
  spareparts: "spareParts",
  advancedcomponents: "advancedComponents",
  circuitboards: "circuitBoards",
  hydrogenfuel: "hydrogenFuel",
  antimatterwarhead: "antimatterWarhead",
  biopolymers: "bioPolymers",
  exoticcrystals: "exoticCrystals",
  purifiedwater: "purifiedWater",
  sporeessence: "sporeEssence",
  antimattercells: "antimatterCells",
  quantumcells: "quantumCells",
  crystalore: "crystalOre",
  rareearths: "rareEarths",
  plasmafluid: "plasmaFluid",
  tradecontracts: "tradeContracts",
  markettokens: "marketTokens",
  processedgems: "processedGems",
  fusionfluid: "fusionFluid",
  plasmacores: "plasmaCores",
  nanoorganics: "nanoOrganics",
  metamaterials: "metaMaterials",
  quantumchemicals: "quantumChemicals",
  roboticmodules: "roboticModules",
  galacticbonds: "galacticBonds",
  solarpanel: "solarPanel",
  ionthruster: "ionThruster",
  lifesupportmodule: "lifeSupportModule",
  quantumdrive: "quantumDrive",
  nanoassembler: "nanoAssembler",
  biocircuit: "bioCircuit",
  crystalmatrix: "crystalMatrix",
  hydrocore: "hydroCore",
  tradebeacon: "tradeBeacon",
  gravitonshield: "gravitonShield",
  neuralinterface: "neuralInterface",
  bioreactorecore: "bioReactorCore",
};


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
  ].includes(value as ResourceKey);
};


interface PlayerData {
  id: string;
  name: string;
  wallet: string;
  ufos: number;
  minted?: number;
  burnt?: number;
  held?: number;
  rank?: number;
  PFP?: string;
}

interface NFTFetchResult {
  nfts: NFTData[];
  minted: number;
  burnt: number;
  held: number;
}

interface NFTData {
  id: string;
  name: string;
  burnt: boolean;
  owner: string;
}

interface ConnectedWalletData {
  wallet: string;
  name: string;
  ufos: number;
  minted: number;
  burnt: number;
  held: number;
  rank: number;
  PFP?: string;
}

interface HeliusResponse {
  jsonrpc: string;
  result: { items: HeliusAsset[]; total: number };
  id: string;
  error?: { code: number; message: string };
}

interface HeliusAsset {
  id: string;
  burnt: boolean;
  ownership: { owner: string };
  content?: { json_uri?: string };
}

interface PhantomProvider {
  publicKey: { toString(): string } | null;
  isPhantom: boolean;
  isConnected: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
}

interface SolflareProvider {
  publicKey: { toString(): string } | null;
  isSolflare: boolean;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
}

interface NFTLeaderboardData {
  id: string;
  level: number;
  exp: number;
  rarityRank: string;
  image: string;
  rank: number;
}

interface NFTSkill {
  name: string;
  level: number;
  bonus: number;
}

interface NFTSkillDetails {
  id: string;
  level: number;
  exp: number; // Add exp
  skills: { [skillName: string]: NFTSkill };
  availableSkillPoints: number;
  totalBonus: number; // Add totalBonus
}
const GAME_ASSETS: GameAssets = {
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


// Resource image map from NFTScanner
const resourceImageMap: Record<string, string> = {
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
};

// Resource display name map from NFTScanner
const resourceDisplayNameMap: Record<string, string> = {
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
};

const LeaderboardPageInner = () => {
  const { publicKey, wallet, connected } = useWallet();
  const { connection } = useConnection();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [totalUFOS, setTotalUFOS] = useState<number>(0);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWalletData | null>(null);
  const [loadingUFOS, setLoadingUFOS] = useState(true);
  const [loadingPodium, setLoadingPodium] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPodiumModalOpen, setIsPodiumModalOpen] = useState(false);
  const [isPodiumLoadingModalOpen, setIsPodiumLoadingModalOpen] = useState(false);
  const [nftLeaderboard, setNFTLeaderboard] = useState<NFTLeaderboardData[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(true);
  const [nftError, setNFTError] = useState<string | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedNFTSkills, setSelectedNFTSkills] = useState<NFTSkillDetails | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMusicControls, setShowMusicControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [podiumPlayers, setPodiumPlayers] = useState<PlayerData[]>([]);
  
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

  const metricsCache: { [wallet: string]: { result: NFTFetchResult; timestamp: number } } = {};
  const metadataCache: { [uri: string]: { metadata: unknown; timestamp: number } } = {};
  const CACHE_DURATION = 5 * 60 * 1000;
const MODAL_DEBOUNCE_MS = 100;

  const rateLimitDelay = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  async function fetchNFTMetadata(metadataURI: string): Promise<unknown> {
    const cached = metadataCache[metadataURI];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached metadata for URI: ${metadataURI}`);
      return cached.metadata;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(metadataURI, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const metadata = await response.json();
      metadataCache[metadataURI] = { metadata, timestamp: Date.now() };
      return metadata;
    } catch (error: unknown) {
      console.error(`Error fetching metadata for URI ${metadataURI}:`, error);
      return null;
    }
  }
useEffect(() => {
  fetchUFOSLeaderboard();
  fetchNFTLeaderboard();
}, []);
  // Style wallet modal to match GMGenerator
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

      const fetchWalletData = async () => {

        if (connected && publicKey) {

        try {
          const app = initializeApp(FIREBASE_CONFIG);
          const db = getFirestore(app);
          const q = query(collection(db, "UFOSperWallet"), where("Wallet", "==", publicKey.toString()));
          const querySnapshot = await getDocs(q);

          let walletData: ConnectedWalletData | null = null;
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            const ufos = docData.UFOS || 0;
            const defaultImages = ["/default-pfp.png", "/images/fallback-pfp.png"];
            const pfpUrl = defaultImages.includes(docData.SelectedNFT) && docData.SelectedNFT ? docData.SelectedNFT : docData.SelectedNFT || docData.SelectedNFT || "/default-pfp.png";
            console.log(`Connected wallet data: Wallet=${publicKey.toString()}, UFOS=${ufos}, PFP=${docData.SelectedNFT}, SelectedNFT=${docData.SelectedNFT}`);

            const rankQuery = query(collection(db, "UFOSperWallet"), orderBy("UFOS", "desc"));
            const rankSnapshot = await getDocs(rankQuery);
            let rank = 0;
            for (let i = 0; i < rankSnapshot.docs.length; i++) {
              if (rankSnapshot.docs[i].data().Wallet === publicKey.toString()) {
                rank = i + 1;
                break;
              }
            }

            const { minted, burnt, held } = await fetchNFTsWithBurnStatus(publicKey.toString());

            walletData = {
              wallet: publicKey.toString(),
              name: docData.Name || `Wallet ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
              ufos,
              minted,
              burnt,
              held,
              rank,
              PFP: pfpUrl,
            };
          } else {
            const { minted, burnt, held } = await fetchNFTsWithBurnStatus(publicKey.toString());
            walletData = {
              wallet: publicKey.toString(),
              name: `Wallet ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
              ufos: 0,
              minted,
              burnt,
              held,
              rank: 0,
              PFP: "/default-pfp.png",
            };
          }

          setConnectedWallet(walletData);
        } catch (error: unknown) {
          console.error(`Error fetching wallet data:`, error);
        } finally {
          setLoadingWallet(false);
        }

      }
      };

  useEffect(() => {
    if (connected && publicKey) {
      setLoadingWallet(true);
      fetchWalletData();
    } else {
      setConnectedWallet(null);
    }
  }, [connected, publicKey]);



const fetchSkillDetails = async (nftId: string, nftLevel: number) => {
  setLoadingSkills(true);
  setSkillsError(null);

  try {
    console.log(`Fetching skill details for NFT #${nftId}`);
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);

    const docRef = doc(db, "CryptoUFOs", nftId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`No data found for NFT #${nftId}`);
    }

    const data = docSnap.data();
    const skills = data.Skills || {};
    const exp = data.EXP || 0;

    const availableSkillPoints = nftLevel;
    const assignedSkillPoints = Object.values<NFTSkill>(skills).reduce((sum, skill) => sum + skill.level, 0);
    const remainingSkillPoints = availableSkillPoints - assignedSkillPoints;
    const totalBonus = Object.values<NFTSkill>(skills).reduce((sum, skill) => sum + skill.bonus, 0);

    const skillDetails: NFTSkillDetails = {
      id: nftId,
      level: data.LEVEL || 1,
      exp,
      skills,
      availableSkillPoints: Math.max(0, remainingSkillPoints),
      totalBonus,
    };

    setSelectedNFTSkills(skillDetails);
  } catch (err: unknown) {
    console.error(`Error fetching skill details for NFT ${nftId}:`, err);
    setSkillsError(`Failed to load skill details: ${err instanceof Error ? err.message : "Unknown error"}`);
  } finally {
    setLoadingSkills(false);
  }
};
const fetchUFOSLeaderboard = async () => {
  setLoadingUFOS(true);
  setError(null);

  try {
    console.log("Initializing Firebase for UFOS leaderboard...");
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);

    console.log("Fetching total $UFOS from Firebase...");
    const totalQuery = query(collection(db, "UFOSperWallet"));
    const totalSnapshot = await getDocs(totalQuery);
    console.log(`Fetched ${totalSnapshot.docs.length} documents for total UFOS`);

    const totalUFOS = totalSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      const ufos = data.UFOS || 0;
      console.log(`Wallet ${data.Wallet}: UFOS=${ufos}`);
      return sum + ufos;
    }, 0);
    setTotalUFOS(totalUFOS);
    console.log(`Total $UFOS farmed: ${totalUFOS}`);

    console.log("Fetching top 200 wallets from Firebase...");
    const q = query(collection(db, "UFOSperWallet"), orderBy("UFOS", "desc"), limit(200));
    const querySnapshot = await getDocs(q);

    console.log(`Fetched ${querySnapshot.docs.length} wallets from Firebase`);
    if (querySnapshot.empty) {
      console.warn("No wallets found in UFOSperWallet collection");
      setError("No players found in the database.");
      return;
    }

    const firebaseData = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      console.log(`Wallet data: ${data.Wallet}, UFOS: ${data.UFOS}, PFP: ${data.SelectedNFT}, SelectedNFT: ${data.SelectedNFT}`);
      const defaultImages = ["/default-pfp.png", "/images/fallback-pfp.png"];
      const pfpUrl = defaultImages.includes(data.SelectedNFT) && data.SelectedNFT ? data.SelectedNFT : data.SelectedNFT || data.SelectedNFT || "/default-pfp.png";
      return {
        id: doc.id,
        wallet: data.Wallet as string,
        name: data.Name || `Wallet ${data.Wallet?.slice(0, 4)}...${data.Wallet?.slice(-4)}`,
        ufos: data.UFOS || 0,
        rank: index + 1,
        PFP: pfpUrl,
      };
    });

    console.log("Setting players data:", firebaseData);
    setPlayers(firebaseData);
  } catch (err: unknown) {
    console.error("Error fetching $UFOS leaderboard:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setError(`Failed to load leaderboard data: ${errorMessage}`);
  } finally {
    setLoadingUFOS(false);
    console.log("UFOS leaderboard loading complete");
  }
};

const fetchNFTLeaderboard = async () => {
  setLoadingNFTs(true);
  setNFTError(null);

  try {
    console.log("Initializing Firebase for NFT leaderboard...");
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);

    console.log("Fetching top 20 NFTs from CryptoUFOs...");
    const q = query(
      collection(db, "CryptoUFOs"),
      orderBy("LEVEL", "desc"),
      orderBy("EXP", "desc"),
      limit(20)
    );
    const querySnapshot = await getDocs(q);

    console.log(`Fetched ${querySnapshot.docs.length} NFTs from Firebase`);
    if (querySnapshot.empty) {
      console.warn("No NFTs found in CryptoUFOs collection");
      setNFTError("No NFTs found in the database.");
      return;
    }

    const nftData: NFTLeaderboardData[] = [];
    let rank = 1;

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const nftId = doc.id;
      console.log(`Processing NFT #${nftId}: LEVEL=${data.LEVEL}, EXP=${data.EXP}`);

      const image =
        `https://bafybeigxxhol7amgewoep2falpmmdxsjshpceockpsbmyooutvknj5jkhy.ipfs.nftstorage.link/${nftId}` ||
        data.Image;
      console.log("NFTIMAGE", image);
      nftData.push({
        id: nftId,
        level: data.LEVEL || 1,
        exp: data.EXP || 0,
        rarityRank: data.Traits?.["Rarity Rank"] || "Unknown",
        image,
        rank,
      });

      rank++;
      await rateLimitDelay();
    }

    console.log("Setting NFT leaderboard data:", nftData);
    setNFTLeaderboard(nftData);
  } catch (err: unknown) {
    console.error("Error fetching NFT leaderboard:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setNFTError(`Failed to load NFT leaderboard: ${errorMessage}`);
  } finally {
    setLoadingNFTs(false);
    console.log("NFT leaderboard loading complete");
  }
};

const getCumulativeExpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 32 * (Math.pow(2, level - 1) - 1);
};

const getExpRequiredForNextLevel = (level: number): number => {
  if (level < 1) return 32;
  return 32 * Math.pow(2, level - 1);
};

const getExpTowardNextLevel = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  return Math.max(0, exp - baseExp);
};

const getExpProgressPercentage = (exp: number, level: number): number => {
  if (level < 1 || exp < 0) return 0;
  const baseExp = getCumulativeExpForLevel(level);
  const expForNextLevel = getExpRequiredForNextLevel(level);
  const expTowardNextLevel = Math.max(0, exp - baseExp);
  return Math.min(100, (expTowardNextLevel / expForNextLevel) * 100);
};

// Optional: Keep for backward compatibility or remove
const getExpRequiredForLevel = (level: number): number => {
  return getExpRequiredForNextLevel(level);
};




const fetchNFTsWithBurnStatus = async (wallet: string, retries = 3, backoff = 100): Promise<NFTFetchResult> => {
    console.log(`Fetching NFTs for wallet: ${wallet}`);

    const cached = metricsCache[wallet];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached NFT data for wallet: ${wallet}`);
      return cached.result;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const nfts: NFTData[] = [];
        let page = 1;
        let hasMore = true;
        const limit = 1000;

        while (hasMore) {
          const response = await fetch(JSON_RPC_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "my-id",
              method: "getAssetsByGroup",
              params: {
                groupKey: "collection",
                groupValue: COLLECTION_ADDRESS,
                page,
                limit,
              },
            }),
          });

          if (response.status === 429) {
            throw new Error(`HTTP error! Status: 429`);
          }
          if (!response.ok) {
            console.error(`Failed to fetch assets for wallet ${wallet}, page ${page}: Status ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data: HeliusResponse = await response.json();
          if (data.error) {
            console.error(`API error for wallet ${wallet}, page ${page}:`, data.error);
            throw new Error(data.error.message);
          }

          const assets: HeliusAsset[] = data.result.items || [];
          console.log(`Fetched ${assets.length} assets for wallet ${wallet}, page ${page}`);

          const walletAssets = assets.filter((asset) => asset.ownership.owner === wallet);
          console.log(`Found ${walletAssets.length} assets for wallet ${wallet} on page ${page}`);

          const metadataPromises = walletAssets.map(async (asset: HeliusAsset) => {
            try {
              const meta = await fetchNFTMetadata(asset.content?.json_uri || "");
              const name: string = meta && typeof meta === "object" && "name" in meta ? (meta.name as string) : `NFT ${asset.id.slice(0, 4)}`;
              return {
                id: asset.id,
                name,
                burnt: asset.burnt || false,
                owner: wallet,
              };
            } catch (error: unknown) {
              console.warn(`Failed to fetch metadata for NFT ${asset.id}:`, error);
              return {
                id: asset.id,
                name: `NFT ${asset.id.slice(0, 4)}`,
                burnt: asset.burnt || false,
                owner: wallet,
              };
            }
          });

          const batchNfts = await Promise.all(metadataPromises);
          nfts.push(...batchNfts);

          hasMore = assets.length === limit;
          page++;
          await rateLimitDelay();
        }

        const minted = nfts.length;
        const burnt = nfts.filter((nft) => nft.burnt).length;
        const held = nfts.filter((nft) => !nft.burnt).length;

        console.log(`Metrics for wallet ${wallet}: minted=${minted}, burnt=${burnt}, held=${held}`);
        console.log(`NFTs for wallet ${wallet}:`, nfts);

        const result: NFTFetchResult = { nfts, minted, burnt, held };
        metricsCache[wallet] = { result, timestamp: Date.now() };
        return result;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("429") && attempt < retries - 1) {
          console.warn(`Rate limit hit for wallet ${wallet}, retrying after ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return fetchNFTsWithBurnStatus(wallet, retries, backoff * 2);
        }
        console.error(`Error fetching NFTs for wallet ${wallet}:`, error);
        return { nfts: [], minted: 0, burnt: 0, held: 0 };
      }
    }
    console.error(`All retries failed for wallet ${wallet}`);
    return { nfts: [], minted: 0, burnt: 0, held: 0 };
  };

  const fetchPodiumData = async () => {
    setIsPodiumLoadingModalOpen(true);
    setError(null);

    try {
      console.log("Initializing Firebase for podium...");
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);

      console.log("Fetching top 3 wallets from Firebase...");
      const q = query(collection(db, "UFOSperWallet"), orderBy("UFOS", "desc"), limit(3));
      const querySnapshot = await getDocs(q);

      console.log(`Fetched ${querySnapshot.docs.length} wallets from Firebase`);
      if (querySnapshot.empty) {
        console.warn("No wallets found in UFOSperWallet collection");
        setError("No players found in the database.");
        setIsPodiumLoadingModalOpen(false);
        return;
      }

      const firebaseData = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`Wallet data: ${data.Wallet}, UFOS: ${data.UFOS}, PFP: ${data.SelectedNFT}, SelectedNFT: ${data.SelectedNFT}`);
        const defaultImages = ["/default-pfp.png", "/images/fallback-pfp.png"];
        const pfpUrl = defaultImages.includes(data.SelectedNFT) && data.SelectedNFT ? data.SelectedNFT : data.SelectedNFT || data.SelectedNFT || "/images/fallback-pfp.png";
        return {
          id: doc.id,
          wallet: data.Wallet as string,
          name: data.Name || `Wallet ${data.Wallet?.slice(0, 4)}...${data.Wallet?.slice(-4)}`,
          ufos: data.UFOS || 0,
          rank: index + 1,
          PFP: pfpUrl,
        };
      });

      const leaderboardData: PlayerData[] = [];
      const nftDataPerWallet: { [wallet: string]: NFTData[] } = {};

      for (const player of firebaseData) {
        if (!player.wallet) {
          console.warn(`Skipping player with missing wallet address: ${player.id}`);
          continue;
        }
        try {
          const { nfts, minted, burnt, held } = await fetchNFTsWithBurnStatus(player.wallet);
          nftDataPerWallet[player.wallet] = nfts;

          leaderboardData.push({
            id: player.id,
            name: player.name,
            wallet: player.wallet,
            ufos: player.ufos,
            minted,
            burnt,
            held,
            rank: player.rank,
            PFP: player.PFP,
          });
        } catch (error: unknown) {
          console.error(`Failed to fetch NFTs for wallet ${player.wallet}:`, error);
          leaderboardData.push({
            id: player.id,
            name: player.name,
            wallet: player.wallet,
            ufos: player.ufos,
            minted: 0,
            burnt: 0,
            held: 0,
            rank: player.rank,
            PFP: player.PFP,
          });
          nftDataPerWallet[player.wallet] = [];
        }
      }

      console.log("Podium data:", leaderboardData);
      setPodiumPlayers(leaderboardData);

      Object.entries(nftDataPerWallet).forEach(([wallet, nfts]) => {
        const burntNFTs = nfts.filter((nft) => nft.burnt);
        console.log(`Wallet ${wallet}: ${burntNFTs.length} burnt NFTs`, burntNFTs);
      });

      if (leaderboardData.length === 0) {
        setError("No valid wallet data found after processing.");
        setIsPodiumLoadingModalOpen(false);
        return;
      }

      setIsPodiumLoadingModalOpen(false);
      setIsPodiumModalOpen(true);
    } catch (err: unknown) {
      console.error("Error fetching podium data:", err);
      setError(`Failed to load podium data: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsPodiumLoadingModalOpen(false);
    }
  };


  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-gray-400 font-bold">{rank}</span>;
  };

  const getPlayerNameColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-white";
  };

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
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
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
        });
    }
  };

  const getDisplayName = (skillName: string): string => {
  const resource = skillName.replace(/ Efficiency$/i, "").toLowerCase();
  return resourceDisplayNameMap[resource] || resource
    .split(/(?=[A-Z])|_|-/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};


  const changeTrack = (direction: "next" | "prev") => {
    if (!audioRef.current) {
      console.error("Audio ref is null");
      return;
    }
    const audio = audioRef.current;
    audio.pause();

    const newTrack =
      direction === "next"
        ? (currentTrack + 1) % AUDIO_TRACKS.length
        : (currentTrack - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length;

    setCurrentTrack(newTrack);
    setCurrentTime(0);
    audio.src = AUDIO_TRACKS[newTrack].src;

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
        });
    };

    audio.addEventListener("canplay", playWhenReady, { once: true });
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
    const setupAudio = () => {
      if (!audioRef.current) {
        console.error("Audio ref is null");
        return;
      }

      const audio = audioRef.current;
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
        changeTrack("next");
      };

      const handleError = (e: Event) => {
        console.error("Audio load error:", e);
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleSongEnd);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleSongEnd);
        audio.removeEventListener("error", handleError);
      };
    };

    const timeout = setTimeout(() => {
      const cleanup = setupAudio();
      return cleanup;
    }, 0);

    return () => clearTimeout(timeout);
  }, [currentTrack]);

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
 return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white w-full">
      <Toaster richColors position="top-right" />
      <audio ref={audioRef} preload="auto" />

      <div className="p-1 md:p-2 max-w-[2000px] mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2 w-full">
          <Link href="/">
            <Button
              className="cypherpunk-button cypherpunk-button-blue flex items-center gap-2 px-3 py-1 text-sm glow-hover"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4 cypherpunk-icon-glow" />
              Back
            </Button>
          </Link>
          <div className="cyberpunk-wallet-controls">
            <div className="flex flex-col items-center mb-8">
              <WalletMultiButton
                className="cypherpunk-button cypherpunk-button-purple text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                disabled={loadingWallet}
              />
            </div>
          </div>
        </div>

{(connected && publicKey) && (
  <div className="mb-6 glow-hover" role="region" aria-label="Connected Wallet Information">
    <Card className="relative cypherpunk-border bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl shadow-xl p-4 md:p-6 backdrop-blur-md overflow-hidden w-full max-w-[2000px] mx-auto z-[10]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff00aa]/20 to-[#00ffaa]/20 opacity-40 pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-extrabold text-[#ff00aa] flex items-center gap-2 md:gap-3 tracking-tight">
          <img
            src={connectedWallet?.PFP || "/default-pfp.png"}
            alt="Profile Picture"
            className="h-10 w-10 md:h-14 md:w-14 rounded-full object-cover"
            aria-hidden="true"
            onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
          />
          Your Stats
        </h3>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs md:text-sm cypherpunk-time bg-[#2a2a2a]/50 px-2 py-1 rounded-full">
            {publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : "Connected"}
          </span>
        </div>
      </div>

      {loadingWallet ? (
        <div
          className="flex flex-col items-center justify-center min-h-[200px] w-full"
          aria-busy="true"
        >
          <img
            src="/loading.gif"
            alt="Loading wallet data"
            className="w-40 h-40 mb-4"
          />
          <p className="text-sm cypherpunk-loading-text font-orbitron text-center text-[#00ffaa]">
            Beaming up wallet data and NFTs... Please hold for ~1 minute
          </p>
          <div className="cypherpunk-loading-progress mt-4 w-full max-w-xs">
            <div className="cypherpunk-loading-progress-bar w-1/2"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-[#ef4444]" role="alert">
          <p>Failed to load wallet data. Please try again.</p>
          <Button
            onClick={fetchWalletData}
            className="mt-2 cypherpunk-button cypherpunk-button-blue"
          >
            Retry
          </Button>
        </div>
      ) : connectedWallet ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 animate-fade-in">
          {/* Wallet Data Display */}
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#ff00aa]/20 rounded-full">
              <Coins className="h-5 w-5 md:h-6 md:w-6 text-[#ff00aa] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">Name</p>
              <p
                className="text-sm md:text-lg font-semibold text-white truncate max-w-full"
                title={connectedWallet.name}
              >
                {connectedWallet.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#00ffaa]/20 rounded-full">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-[#00ffaa] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">Rank</p>
              <p className="text-sm md:text-lg font-semibold text-white">
                {connectedWallet.rank || "Unranked"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#ff00ff]/20 rounded-full">
              <Coins className="h-5 w-5 md:h-6 md:w-6 text-[#ff00ff] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">$UFOS</p>
              <p className="text-sm md:text-lg font-semibold text-white">
                {connectedWallet.ufos.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#9333ea]/20 rounded-full">
              <Medal className="h-5 w-5 md:h-6 md:w-6 text-[#9333ea] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">NFTs Minted</p>
              <p className="text-sm md:text-lg font-semibold text-white">
                {connectedWallet.minted.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#ef4444]/20 rounded-full">
              <Medal className="h-5 w-5 md:h-6 md:w-6 text-[#ef4444] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">NFTs Burnt</p>
              <p className="text-sm md:text-lg font-semibold text-white">
                {connectedWallet.burnt.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
            <div className="p-2 md:p-3 bg-[#14b8a6]/20 rounded-full">
              <Medal className="h-5 w-5 md:h-6 md:w-6 text-[#14b8a6] cypherpunk-icon-glow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[#00ffaa] uppercase tracking-wide">NFTs Held</p>
              <p className="text-sm md:text-lg font-semibold text-white">
                {connectedWallet.held.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-[#ef4444]" role="alert">
          <p>No wallet data available.</p>
        </div>
      )}
    </Card>
  </div>
)}

      <div className="cypherpunk-border bg-[#1a1a1a] rounded-xl w-full max-w-[2000px] mx-auto">
        <div className="border-b border-[#00ffaa]/30 pb-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold flex items-center text-[#ff00aa] justify-center gap-2">
            <Trophy className="h-6 w-6 text-[#ff00aa] cypherpunk-icon-glow" />
            CRYPTO UFOS LEADERBOARD
            <Trophy className="h-6 w-6 text-[#ff00aa] cypherpunk-icon-glow" />
          </h2>
        </div>
        <Tabs defaultValue="ufos" className="w-full">
          <TabsList className="tabs-list bg-[#2a2a2a] flex justify-center w-full p-[3px] !inline-flex">
            <TabsTrigger
              value="ufos"
              className="text-sm py-2 px-4 !w-auto !min-w-[120px] !flex-none data-[state=active]:bg-[#ff00aa] data-[state=active]:text-black glow-hover"
            >
              $UFOS Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="nfts"
              className="text-sm py-2 px-4 !w-auto !min-w-[120px] !flex-none data-[state=active]:bg-[#00ffaa] data-[state=active]:text-black glow-hover"
            >
              NFTs Leaderboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ufos">
            {loadingUFOS ? (
              <div className="p-4 text-center text-[#00ffaa] cypherpunk-loading-container">
                <p className="cypherpunk-loading-text">Loading $UFOS leaderboard...</p>
                <div className="cypherpunk-spinner mx-auto mt-4"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-[#ef4444]">
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="py-4 text-center bg-[#2a2a2a]/50">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="h-5 w-5 text-[#ff00aa] cypherpunk-icon-glow" />
                    <span className="text-lg font-bold text-[#ff00aa]">{totalUFOS.toLocaleString()}</span>
                    <span className="text-[#00ffaa]">Total $UFOS Farmed</span>
                  </div>
                </div>
                <div className="flex justify-center py-4">
                  <Button
                    onClick={() => fetchPodiumData()}
                    className="cypherpunk-button cypherpunk-button-blue font-semibold py-2 px-4 rounded-lg glow-hover"
                  >
                    View Podium with Detailed Stats
                  </Button>
                </div>
                <div className="p-0">
                  <div className="w-full">
                    <div className="block md:hidden space-y-3 p-3">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="bg-[#2a2a2a]/50 p-3 rounded-lg flex items-center justify-between cypherpunk-border"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6">{getRankIcon(player.rank || 0)}</div>
                            <img
                              src={player.PFP || "/default-pfp.png"}
                              alt={`${player.name}'s profile picture`}
                              className="h-6 w-6 rounded-full object-cover"
                              onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
                            />
                            <span
                              className={`font-medium text-sm ${getPlayerNameColor(
                                player.rank || 0
                              )} truncate max-w-[70%]`}
                            >
                              {player.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-[#00ffaa]">$UFOS</span>
                            <p className="text-sm font-bold text-[#ff00aa]">{player.ufos.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {players.length === 0 && (
                        <div className="py-8 text-center text-[#00ffaa]">
                          No players found. Be the first to join!
                        </div>
                      )}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead>
                          <tr className="bg-[#2a2a2a] text-[#00ffaa] text-sm">
                            <th className="py-2 px-3 text-left w-[10%]">Rank</th>
                            <th className="py-2 px-3 text-left w-[60%]">Player</th>
                            <th className="py-2 px-3 text-right w-[30%]">$UFOS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {players.map((player) => (
                            <tr
                              key={player.id}
                              className="border-t border-[#00ffaa]/30 hover:bg-[#3a3a3a]/50 transition-colors"
                            >
                              <td className="py-3 px-3">
                                <div className="flex justify-center items-center w-8 h-8">
                                  {getRankIcon(player.rank || 0)}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className={`flex items-center gap-3 font-medium ${getPlayerNameColor(player.rank || 0)}`}>
                                  <img
                                    src={player.PFP || "/default-pfp.png"}
                                    alt={`${player.name}'s profile picture`}
                                    className="h-8 w-8 rounded-full object-cover"
                                    onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
                                  />
                                  <span className="truncate">{player.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-[#ff00aa]">
                                {player.ufos.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {players.length === 0 && (
                      <div className="hidden md:block py-8 text-center text-[#00ffaa]">
                        No players found. Be the first to join!
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="nfts">
            {loadingNFTs ? (
              <div className="p-4 text-center text-[#00ffaa] cypherpunk-loading-container">
                <p className="cypherpunk-loading-text">Loading NFTs leaderboard...</p>
                <div className="cypherpunk-spinner mx-auto mt-4"></div>
              </div>
            ) : nftError ? (
              <div className="p-8 text-center text-[#ef4444]">
                <p>{nftError}</p>
              </div>
            ) : (
              <div className="p-0">
                <div className="w-full">
                  <div className="block md:hidden space-y-3 p-3">
                    {nftLeaderboard.map((nft) => (
                      <div
                        key={nft.id}
                        className="bg-[#2a2a2a]/50 p-3 rounded-lg flex flex-col gap-2 cypherpunk-border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6">{getRankIcon(nft.rank)}</div>
                            <img
                              src={nft.image}
                              alt={`Crypto UFO #${nft.id}`}
                              className="h-6 w-6 rounded-full object-cover"
                              onError={(e) => (e.currentTarget.src = "/default-nft.png")}
                            />
                            <span className={`font-medium text-sm ${getPlayerNameColor(nft.rank)} truncate max-w-[70%]`}>
                              Crypto UFO #{nft.id}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsSkillModalOpen(true);
                              fetchSkillDetails(nft.id, nft.level);
                            }}
                            className="text-[#9333ea] hover:text-[#a855f7] glow-hover"
                          >
                            View Skills
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[#00ffaa]">Level:</span>
                            <span className="font-bold text-[#00ffaa]">{nft.level}</span>
                          </div>
                          <div>
                            <span className="text-[#00ffaa]">EXP:</span>
                            <div className="flex items-center gap-2">
                              <div className="cypherpunk-progress w-24 h-1">
                                <div
                                  className="cypherpunk-progress-bar"
                                  style={{ width: `${getExpProgressPercentage(nft.exp, nft.level)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-[#00ffaa] font-bold">
                                {getExpTowardNextLevel(nft.exp, nft.level)}/{getExpRequiredForNextLevel(nft.level)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[#00ffaa]">Rarity Rank:</span>
                            <span className="font-bold text-[#ff00aa]">{nft.rarityRank}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {nftLeaderboard.length === 0 && (
                      <div className="py-8 text-center text-[#00ffaa]">
                        No NFTs found.
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="bg-[#2a2a2a] text-[#00ffaa] text-sm">
                          <th className="py-2 px-3 text-center w-[10%]">Rank</th>
                          <th className="py-2 px-3 text-center w-[30%]">NFT</th>
                          <th className="py-2 px-3 text-center w-[15%]">Level</th>
                          <th className="py-2 px-3 text-center w-[25%]">EXP</th>
                          <th className="py-2 px-3 text-center w-[15%]">Rarity Rank</th>
                          <th className="py-2 px-3 text-center w-[15%]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nftLeaderboard.map((nft) => (
                          <tr
                            key={nft.id}
                            className="border-t border-[#00ffaa]/30 hover:bg-[#3a3a3a]/50 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex justify-center items-center w-8 h-8">
                                {getRankIcon(nft.rank)}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className={`flex items-center gap-3 font-medium ${getPlayerNameColor(nft.rank)} justify-center`}>
                                <img
                                  src={nft.image}
                                  alt={`Crypto UFO #${nft.id}`}
                                  className="h-8 w-8 rounded-full object-cover"
                                  onError={(e) => (e.currentTarget.src = "/default-nft.png")}
                                />
                                <span className="truncate">{`Crypto UFO #${nft.id}`}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#00ffaa]">{nft.level}</td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="cypherpunk-progress w-24 h-1">
                                  <div
                                    className="cypherpunk-progress-bar"
                                    style={{ width: `${getExpProgressPercentage(nft.exp, nft.level)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-[#00ffaa] font-bold">
                                  {getExpTowardNextLevel(nft.exp, nft.level)}/{getExpRequiredForNextLevel(nft.level)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#ff00aa]">{nft.rarityRank}</td>
                            <td className="py-3 px-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsSkillModalOpen(true);
                                  fetchSkillDetails(nft.id, nft.level);
                                }}
                                className="text-[#9333ea] hover:text-[#a855f7] glow-hover"
                              >
                                View Skills
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {nftLeaderboard.length === 0 && (
                    <div className="hidden md:block py-8 text-center text-[#00ffaa]">
                      No NFTs found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

{/* Podium Loading Modal */}
<Modal
  isOpen={isPodiumLoadingModalOpen}
  onRequestClose={() => setIsPodiumLoadingModalOpen(false)}
  style={{
    content: {
      background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(26, 26, 26, 0.95))',
      color: '#ffffff',
      border: '1px solid var(--neon-blue)',
      borderRadius: '16px',
      maxWidth: '500px', // Reduced for better centering
      width: '90%',
      minHeight: '200px',
      margin: 'auto',
      padding: '1.5rem', // Reduced padding for mobile
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      overflowY: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 204, 0.3)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }}
  className="cypherpunk-border scrollbar-thin"
  aria-labelledby="podium-loading-modal-title"
  aria-describedby="podium-loading-modal-description"
>
  <div className="flex flex-col min-h-[150px] w-full">
    <div className="cypherpunk-spinner mx-auto mb-4"></div>
    <p
      id="podium-loading-modal-description"
      className="text-lg font-orbitron text-[#00ffaa] text-center"
    >
      Loading podium data...This may take a few minutes.
    </p>
  </div>
</Modal>

{/* Podium Modal */}
<Modal
  isOpen={isPodiumModalOpen}
  onRequestClose={() => setIsPodiumModalOpen(false)}
  style={{
    content: {
      background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(26, 26, 26, 0.95))',
      color: '#ffffff',
      border: '1px solid var(--neon-blue)',
      borderRadius: '16px',
      maxWidth: '1000px', // Kept for better centering
      width: '90%', // Adjusted for responsiveness
      height: '100%',
      minHeight: '350px', // Increased slightly to accommodate extra padding
      margin: 'auto',
      padding: '3rem 1.5rem', // Increased top/bottom padding for more space
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      overflowY: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 204, 0.3)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }}
  className="cypherpunk-border scrollbar-thin animate-fade-in"
  aria-labelledby="podium-modal-title"
>
  <div className="relative flex flex-col items-center mt-150 justify-center w-full min-h-[250px]">
    <Button
      onClick={() => setIsPodiumModalOpen(false)}
      className="fixed top-2 right-2 z-10 cypherpunk-button cypherpunk-button-red text-base py-1 px-3 rounded-full glow-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff4d4d] sm:text-sm sm:py-1 sm:px-2"
      aria-label="Close Podium modal"
    >
      X
    </Button>
    {error ? (
      <div className="p-4 md:p-6 text-center text-[#ef4444]">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-6 w-full">
        <h2
          id="podium-modal-title"
          className="text-2xl md:text-3xl font-bold text-[#ff00aa] font-orbitron flex items-center gap-3"
        >
          <Trophy className="h-8 w-8 text-[#ff00aa] cypherpunk-icon-glow" />
          Podium
          <Trophy className="h-8 w-8 text-[#ff00aa] cypherpunk-icon-glow" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl mx-auto">
          {podiumPlayers.map((player) => (
            <div
              key={player.id}
              className={`podium-card flex flex-col items-center p-4 md:p-6 rounded-xl transition-all duration-300 glow-hover ${
                player.rank === 1
                  ? 'bg-[#ff00aa]/20 border-[#ff00aa]'
                  : player.rank === 2
                  ? 'bg-[#00ffaa]/20 border-[#00ffaa]'
                  : 'bg-[#9333ea]/20 border-[#9333ea]'
              } cypherpunk-border`}
              role="group"
              aria-labelledby={`player-${player.id}-name`}
            >
              <div className="relative mb-4">
                <img
                  src={player.PFP || '/default-pfp.png'}
                  alt={`${player.name}'s profile picture`}
                  className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-[#00ffcc] glow-hover"
                  onError={(e) => (e.currentTarget.src = '/default-pfp.png')}
                  loading="lazy"
                />
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(player.rank || 0)}
                </div>
              </div>
              <p
                id={`player-${player.id}-name`}
                className={`text-base md:text-lg font-semibold ${getPlayerNameColor(
                  player.rank || 0
                )} truncate max-w-full font-orbitron`}
              >
                {player.name}
              </p>
              <p className="text-sm md:text-base text-[#00ffaa] mt-2">
                Rank: {player.rank}
              </p>
              <p className="text-sm md:text-base text-[#ff00aa] font-bold">
                $UFOS: {player.ufos.toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm md:text-base">
                <p className="text-[#00ffaa]">
                  Minted: {player.minted?.toLocaleString() || 0}
                </p>
                <p className="text-[#00ffaa]">
                  Burnt: {player.burnt?.toLocaleString() || 0}
                </p>
                <p className="text-[#00ffaa]">
                  Held: {player.held?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
        {podiumPlayers.length === 0 && (
          <p className="text-lg text-[#00ffaa] text-center font-orbitron">
            No podium players available.
          </p>
        )}
      </div>
    )}
  </div>
</Modal>

{/* Skill Modal */}
<Modal
  isOpen={isSkillModalOpen}
  onRequestClose={() => {
    setIsSkillModalOpen(false);
    setSelectedNFTSkills(null);
  }}
  style={{
    content: {
      background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(26, 26, 26, 0.95))',
      color: '#ffffff',
      border: '1px solid var(--neon-blue)',
      borderRadius: '16px',
      maxWidth: '1000px', // Kept for better centering
      width: '90%', // Adjusted for responsiveness
      height: '100%',
      minHeight: '350px', // Increased slightly to accommodate extra padding
      margin: 'auto',
      padding: '3rem 1.5rem', // Increased top/bottom padding for more space
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      overflowY: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 204, 0.3)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }}
  className="cypherpunk-border scrollbar-thin animate-fade-in"
  aria-labelledby="skill-modal-title"
>
  <div className="relative flex flex-col items-center justify-center w-full">
    <Button
      onClick={() => {
        setIsSkillModalOpen(false);
        setSelectedNFTSkills(null);
      }}
      className="fixed top-2 right-2 z-10 cypherpunk-button cypherpunk-button-red text-base py-1 px-3 rounded-full glow-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff4d4d] sm:text-sm sm:py-1 sm:px-2"
      aria-label="Close Skills modal"
    >
      X
    </Button>
    {loadingSkills ? (
      <div className="p-4 md:p-6 text-center text-[#00ffaa] cypherpunk-loading-container">
        <div className="cypherpunk-spinner mx-auto mb-4"></div>
        <p className="cypherpunk-loading-text text-lg font-orbitron">
          Loading skill details...
        </p>
      </div>
    ) : skillsError ? (
      <div className="p-4 md:p-6 text-center text-[#ef4444]">
        <p className="text-lg font-semibold">{skillsError}</p>
      </div>
    ) : selectedNFTSkills ? (
      <div className="flex flex-col mt-10 items-center mx-auto">
        <div className="flex flex-col mt-10 items-center gap-4">
          <h2
            id="skill-modal-title"
            className="text-xl md:text-2xl mt-10 font-bold text-[#00ffaa] font-orbitron"
          >
            Crypto UFO #{selectedNFTSkills.id}
          </h2>
          <img
            src={`https://bafybeigxxhol7amgewoep2falpmmdxsjshpceockpsbmyooutvknj5jkhy.ipfs.nftstorage.link/${selectedNFTSkills.id}`}
            alt={`Crypto UFO ${selectedNFTSkills.id}`}
            className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover cypherpunk-border glow-hover"
            onError={(e) => (e.currentTarget.src = '/default-nft.png')}
            loading="lazy"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm md:text-base text-white">
              Level: {selectedNFTSkills.level}
            </p>
            <p className="text-sm md:text-base text-white">
              Total EXP: {selectedNFTSkills.exp.toLocaleString()}
            </p>
            <div className="group relative">
              <p className="text-sm md:text-base text-white">
                EXP to Next Level: {getExpTowardNextLevel(selectedNFTSkills.exp || 0, selectedNFTSkills.level)}/
                {getExpRequiredForNextLevel(selectedNFTSkills.level)}
              </p>
              <span className="absolute hidden group-hover:block bg-[#2a2a2a] text-xs text-white p-2 rounded-md -top-12 left-1/2 transform -translate-x-1/2 w-48 text-center cypherpunk-border">
                This shows the EXP needed to reach Level {selectedNFTSkills.level + 1}. Total EXP: {selectedNFTSkills.exp.toLocaleString()}.
              </span>
            </div>
            <div className="cypherpunk-progress w-48 h-2 mt-2">
              <div
                className="cypherpunk-progress-bar"
                style={{ width: `${getExpProgressPercentage(selectedNFTSkills.exp || 0, selectedNFTSkills.level)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <p className="text-sm md:text-base text-[#ff00aa] text-center font-orbitron">
          Points: {selectedNFTSkills.availableSkillPoints} | Bonus: {(selectedNFTSkills.totalBonus * 100).toFixed(2)}%
        </p>
        <div className="w-full">
          <p className="text-sm md:text-base text-[#00ffaa] font-semibold mb-4 text-center font-orbitron">
            Skills
          </p>
          {Object.keys(selectedNFTSkills.skills).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(selectedNFTSkills.skills)
                .filter(([skillName]) => skillName.endsWith('Efficiency'))
                .sort(([aSkillName], [bSkillName]) => {
                  const aResource = aSkillName.replace(/ Efficiency$/i, '').toLowerCase();
                  const bResource = bSkillName.replace(/ Efficiency$/i, '').toLowerCase();
                  const aDisplayName = isResourceKey(aResource)
                    ? resourceDisplayNameMap[aResource]
                    : getDisplayName(aSkillName);
                  const bDisplayName = isResourceKey(bResource)
                    ? resourceDisplayNameMap[bResource]
                    : getDisplayName(bSkillName);
                  return aDisplayName.localeCompare(bDisplayName);
                })
                .map(([skillName, skill]) => {
                  let resource = skillName.replace(/ Efficiency$/i, '').toLowerCase();
                  if (resource in keyMap) {
                    resource = keyMap[resource]!;
                  }
                  if (!isResourceKey(resource)) {
                    console.warn(`Invalid resource key: ${resource}`);
                    return (
                      <div
                        key={skillName}
                        className="skill-card p-3 cypherpunk-border rounded-xl flex items-center gap-2 bg-[#2a2a2a]/50 glow-hover transition-all duration-300"
                      >
                        <img
                          src="/images/resources/placeholder.png"
                          alt="Unknown Resource"
                          className="w-10 h-10 object-contain"
                          loading="lazy"
                        />
                        <div>
                          <h4 className="text-sm md:text-base font-medium text-[#9333ea] font-orbitron">
                            {getDisplayName(skillName)} Efficiency
                          </h4>
                          <p className="text-xs md:text-sm text-white">
                            Level: {skill.level}
                          </p>
                          <p className="text-xs md:text-sm text-white">
                            Bonus: {(skill.bonus * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  }
                  const displayName = resourceDisplayNameMap[resource];
                  return (
                    <div
                      key={skillName}
                      className="skill-card p-3 cypherpunk-border rounded-xl flex items-center gap-2 bg-[#2a2a2a]/50 glow-hover transition-all duration-300"
                    >
                      <img
                        src={resourceImageMap[resource]}
                        alt={displayName}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          console.warn(`Missing image for resource: ${resource}`);
                          e.currentTarget.src = '/images/resources/placeholder.png';
                        }}
                        loading="lazy"
                      />
                      <div>
                        <h4 className="text-sm md:text-base font-medium text-[#9333ea] font-orbitron">
                          {displayName} Efficiency
                        </h4>
                        <p className="text-xs md:text-sm text-white">
                          Level: {skill.level}
                        </p>
                        <p className="text-xs md:text-sm text-white">
                          Bonus: {(skill.bonus * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm md:text-base text-[#00ffaa] text-center font-orbitron">
              No skills assigned.
            </p>
          )}
        </div>
      </div>
    ) : (
      <p className="text-sm md:text-base text-[#00ffaa] text-center font-orbitron">
        No skill data available.
      </p>
    )}
  </div>
</Modal>

      {/* Music Controls */}
      <div className="fixed bottom-2 right-2 z-30 flex flex-col gap-2 items-end">
        <Button
          onClick={() => setShowMusicControls(!showMusicControls)}
          className="cypherpunk-button cypherpunk-button-purple p-2 rounded-full glow-hover"
        >
          {showMusicControls ? "Hide" : "Show"} Music
        </Button>
        {showMusicControls && (
          <>
            <div className="flex gap-2">
              <Button
                onClick={() => changeTrack("prev")}
                className="cypherpunk-button cypherpunk-button-blue p-2 rounded-full glow-hover"
              >
                ⏮
              </Button>
              <Button
                onClick={togglePlayPause}
                className="cypherpunk-button cypherpunk-button-green p-2 rounded-full glow-hover"
              >
                {isPlaying ? <Pause className="w-5 h-5 cypherpunk-icon-glow" /> : <Play className="w-5 h-5 cypherpunk-icon-glow" />}
              </Button>
              <Button
                onClick={() => changeTrack("next")}
                className="cypherpunk-button cypherpunk-button-blue p-2 rounded-full glow-hover"
              >
                ⏭
              </Button>
              <div className="relative z-40">
                <Button
                  onClick={handleVolumeClick}
                  className="cypherpunk-button cypherpunk-button-purple p-2 rounded-full glow-hover"
                >
                  <Volume2 className="w-5 h-5 cypherpunk-icon-glow" />
                </Button>
                {isVolumeOpen && (
                  <div
                    className="absolute bottom-16 right-0 w-12 bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 shadow-lg flex justify-center z-50 cypherpunk-border"
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
                <span className="inline-block mx-4">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    <Analytics />
    <SpeedInsights />
  </div>
);
}

export default function LeaderboardPage() {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <LeaderboardPageInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );

}
