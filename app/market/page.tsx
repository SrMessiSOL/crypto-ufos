"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ConfirmationModal from "@/components/ConfirmationModal"; // Adjust path as needed
import { QueryDocumentSnapshot, QuerySnapshot } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "sonner";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  orderBy,
  Timestamp,
  onSnapshot,
  runTransaction,
  Transaction,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
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
import "@solana/wallet-adapter-react-ui/styles.css";
import "./BurnPage.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const NETWORK = "https://mainnet.helius-rpc.com/?api-key";
const MODAL_DEBOUNCE_MS = 100;

// Game assets and resources
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
  solflareIcon: "https://avatars.githubusercontent.com/u/89903469?s=200&v=4",
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
  gemProcessor: "/gem_processor.png",
  crystalSynthesizer: "/crystal_synthesizer.png",
  hydrogenExtractor: "/hydrogen_extractor.png",
  fusionPlant: "/fusion_plant.png",
  plasmaCoreFabricator: "/plasma_core_fabricator.png",
  antimatterGenerator: "/antimatter_generator.png",
  bioPolymerSynthesizer: "/bio_polymer_synthesizer.png",
  nanoOrganicLab: "/nano_organic_lab.png",
  superAlloyForge: "/super_alloy_forge.png",
  metaMaterialSynthesizer: "/meta_material_synthesizer.png",
  nanoCatalystLab: "/nano_catalyst_lab.png",
  quantumChemSynthesizer: "/quantum_chem_synthesizer.png",
  componentFabricator: "/component_fabricator.png",
  roboticsAssembler: "/robotics_assembler.png",
  cryptoExchange: "/crypto_exchange.png",
  bondIssuer: "/bond_issuer.png",
  interstellarFabricator: "/interstellar_fabricator.png",
  solarPanel: "/solar_panel.png",
  ionThruster: "/ion_thruster.png",
  lifeSupportModule: "/life_support_module.png",
  quantumDrive: "/quantum_drive.png",
};

const resources: { name: string; key: keyof UserData; image: string }[] = [
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
];

// Wallet provider interfaces
interface PhantomProvider {
  publicKey: { toString(): string } | null;
  isPhantom: boolean;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (tx: any) => Promise<any>;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  request: (request: { method: string; params?: any }) => Promise<any>;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
}

interface SolflareProvider {
  publicKey: { toString(): string } | null;
  isSolflare: boolean;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (tx: any) => Promise<any>;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
}

type WalletProvider = PhantomProvider | SolflareProvider;

// Interface for Market Order
interface MarketOrder {
  id: string;
  wallet: string;
  resource: keyof UserData;
  type: "buy" | "sell";
  amount: number;
  pricePerUnit: number;
  createdAt: Timestamp;
  status: "active" | "completed" | "cancelled";
}

interface MarketOrderLog {
  logId: string;
  orderId: string;
  wallet: string;
  action: "match" | "cancel" | "create";
  resource: keyof UserData;
  type: "buy" | "sell";
  amount: number;
  pricePerUnit: number;
  totalUfos: number;
  buyerWallet: string;
  sellerWallet: string;
  buyerBefore: { ufos: number; resource: number };
  buyerAfter: { ufos: number; resource: number };
  sellerBefore: { ufos: number; resource: number };
  sellerAfter: { ufos: number; resource: number };
  timestamp: Timestamp;
  status: "active" | "completed" | "cancelled";
}

// Interface for UserData
interface UserData {
  wallet: string;
  ufos: number;
  emptyPowerCell: number;
  fullPowerCell: number;
  brokenPowerCell: number;
  ice: number;
  co2: number;
  water: number;
  halite: number;
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
  galacticBonds: number;
}

function MarketPageContent() {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [buyAmount, setBuyAmount] = useState<string>("");
  const [buyPrice, setBuyPrice] = useState<string>("");
  const [sellAmount, setSellAmount] = useState<string>("");
  const [sellPrice, setSellPrice] = useState<string>("");
  const [activeResource, setActiveResource] = useState<keyof UserData>(resources[0].key as keyof UserData);
  const [isLoading, setIsLoading] = useState(true);
  const [lowestSellPrice, setLowestSellPrice] = useState<number | null>(null);
  const [averageSellPrice, setAverageSellPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const router = useRouter();
  const buyInputRef = useRef<HTMLInputElement>(null);
  const [totalUfosTraded, setTotalUfosTraded] = useState<number>(0);
  const [marketLogs, setMarketLogs] = useState<MarketOrderLog[]>([]);
  const [walletFilter, setWalletFilter] = useState<string>("");
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [tab, setTab] = useState<"your" | "all">("your");
  const [orderSort, setOrderSort] = useState<"price" | "amount" | "resource">("price");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("asc");
  const [activityFilter, setActivityFilter] = useState<string>("");
  const [orderPage, setOrderPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const itemsPerPage = 10;
  const [tradingOrderId, setTradingOrderId] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  // Type guard for resource keys
  const isResourceKey = (key: string): key is keyof UserData => {
    return resources.some((resource) => resource.key === key);
  };
const [triggerPosition, setTriggerPosition] = useState<{ x: number; y: number } | null>(null);


  // Utility to convert Firestore document data to UserData
  const mapFirestoreToUserData = (docData: { [key: string]: any }, wallet: string): UserData => {
    return {
      wallet: docData.Wallet || wallet,
      ufos: Number(docData.UFOS) || 0,
      emptyPowerCell: Number(docData.EmptyPowerCell) || 0,
      fullPowerCell: Number(docData.FullPowerCell) || 0,
      brokenPowerCell: Number(docData.BrokenPowerCell) || 0,
      ice: Number(docData.Ice) || 0,
      co2: Number(docData.co2) || 0,
      water: Number(docData.Water) || 0,
      halite: Number(docData.Halite) || 0,
      crystalOre: Number(docData.CrystalOre) || 0,
      rareEarths: Number(docData.RareEarths) || 0,
      purifiedWater: Number(docData.PurifiedWater) || 0,
      plasmaFluid: Number(docData.PlasmaFluid) || 0,
      quantumCells: Number(docData.QuantumCells) || 0,
      energyCores: Number(docData.EnergyCores) || 0,
      biofiber: Number(docData.Biofiber) || 0,
      sporeEssence: Number(docData.SporeEssence) || 0,
      alloyIngots: Number(docData.AlloyIngots) || 0,
      nanosteel: Number(docData.Nanosteel) || 0,
      catalysts: Number(docData.Catalysts) || 0,
      polymers: Number(docData.Polymers) || 0,
      spareParts: Number(docData.SpareParts) || 0,
      circuitBoards: Number(docData.CircuitBoards) || 0,
      tradeContracts: Number(docData.TradeContracts) || 0,
      marketTokens: Number(docData.MarketTokens) || 0,
      processedGems: Number(docData.ProcessedGems) || 0,
      exoticCrystals: Number(docData.ExoticCrystals) || 0,
      hydrogenFuel: Number(docData.HydrogenFuel) || 0,
      fusionFluid: Number(docData.FusionFluid) || 0,
      plasmaCores: Number(docData.PlasmaCores) || 0,
      antimatterCells: Number(docData.AntimatterCells) || 0,
      bioPolymers: Number(docData.BioPolymers) || 0,
      nanoOrganics: Number(docData.NanoOrganics) || 0,
      superAlloys: Number(docData.SuperAlloys) || 0,
      metaMaterials: Number(docData.MetaMaterials) || 0,
      nanoCatalysts: Number(docData.NanoCatalysts) || 0,
      quantumChemicals: Number(docData.QuantumChemicals) || 0,
      advancedComponents: Number(docData.AdvancedComponents) || 0,
      roboticModules: Number(docData.RoboticModules) || 0,
      cryptoCredits: Number(docData.CryptoCredits) || 0,
      galacticBonds: Number(docData.GalacticBonds) || 0,
    };
  };

  // Utility to convert UserData to Firestore document data
  const mapUserDataToFirestore = (userData: UserData): { [key: string]: any } => {
    return {
      Wallet: userData.wallet,
      UFOS: userData.ufos,
      EmptyPowerCell: userData.emptyPowerCell,
      FullPowerCell: userData.fullPowerCell,
      BrokenPowerCell: userData.brokenPowerCell,
      Ice: userData.ice,
      co2: userData.co2,
      Water: userData.water,
      Halite: userData.halite,
      CrystalOre: userData.crystalOre,
      RareEarths: userData.rareEarths,
      PurifiedWater: userData.purifiedWater,
      PlasmaFluid: userData.plasmaFluid,
      QuantumCells: userData.quantumCells,
      EnergyCores: userData.energyCores,
      Biofiber: userData.biofiber,
      SporeEssence: userData.sporeEssence,
      AlloyIngots: userData.alloyIngots,
      Nanosteel: userData.nanosteel,
      Catalysts: userData.catalysts,
      Polymers: userData.polymers,
      SpareParts: userData.spareParts,
      CircuitBoards: userData.circuitBoards,
      TradeContracts: userData.tradeContracts,
      MarketTokens: userData.marketTokens,
      ProcessedGems: userData.processedGems,
      ExoticCrystals: userData.exoticCrystals,
      HydrogenFuel: userData.hydrogenFuel,
      FusionFluid: userData.fusionFluid,
      PlasmaCores: userData.plasmaCores,
      AntimatterCells: userData.antimatterCells,
      BioPolymers: userData.bioPolymers,
      NanoOrganics: userData.nanoOrganics,
      SuperAlloys: userData.superAlloys,
      MetaMaterials: userData.metaMaterials,
      NanoCatalysts: userData.nanoCatalysts,
      QuantumChemicals: userData.quantumChemicals,
      AdvancedComponents: userData.advancedComponents,
      RoboticModules: userData.roboticModules,
      CryptoCredits: userData.cryptoCredits,
      GalacticBonds: userData.galacticBonds,
    };
  };

  const firestoreToUserDataFieldMap: { [key: string]: keyof UserData } = {
  UFOS: "ufos",
  EmptyPowerCell: "emptyPowerCell",
  FullPowerCell: "fullPowerCell",
  BrokenPowerCell: "brokenPowerCell",
  Ice: "ice",
  co2: "co2",
  Water: "water",
  Halite: "halite",
  CrystalOre: "crystalOre",
  RareEarths: "rareEarths",
  PurifiedWater: "purifiedWater",
  PlasmaFluid: "plasmaFluid",
  QuantumCells: "quantumCells",
  EnergyCores: "energyCores",
  Biofiber: "biofiber",
  SporeEssence: "sporeEssence",
  AlloyIngots: "alloyIngots",
  Nanosteel: "nanosteel",
  Catalysts: "catalysts",
  Polymers: "polymers",
  SpareParts: "spareParts",
  CircuitBoards: "circuitBoards",
  TradeContracts: "tradeContracts",
  MarketTokens: "marketTokens",
  ProcessedGems: "processedGems",
  ExoticCrystals: "exoticCrystals",
  HydrogenFuel: "hydrogenFuel",
  FusionFluid: "fusionFluid",
  PlasmaCores: "plasmaCores",
  AntimatterCells: "antimatterCells",
  BioPolymers: "bioPolymers",
  NanoOrganics: "nanoOrganics",
  SuperAlloys: "superAlloys",
  MetaMaterials: "metaMaterials",
  NanoCatalysts: "nanoCatalysts",
  QuantumChemicals: "quantumChemicals",
  AdvancedComponents: "advancedComponents",
  RoboticModules: "roboticModules",
  CryptoCredits: "cryptoCredits",
  GalacticBonds: "galacticBonds",
};

const getFirestoreFieldFromUserDataKey = (key: keyof UserData): string => {
  for (const [firestoreField, userDataKey] of Object.entries(firestoreToUserDataFieldMap)) {
    if (userDataKey === key) {
      return firestoreField;
    }
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
};


  // Calculate lowest and average sell prices
  const calculateMarketData = (resourceKey: keyof UserData) => {
    const sellOrders = orders.filter(
      (order) => order.resource === resourceKey && order.type === "sell"
    );
    if (sellOrders.length === 0) {
      setLowestSellPrice(null);
      setAverageSellPrice(null);
      return;
    }
    const prices = sellOrders.map((order) => order.pricePerUnit);
    const lowest = Math.min(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    setLowestSellPrice(lowest);
    setAverageSellPrice(Number(average.toFixed(2)));
  };

  // Fetch user data
  const fetchUserData = async (wallet: string) => {
    if (!firestore) return;
    try {
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", wallet));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const userData: UserData = mapFirestoreToUserData(docData, wallet);
        setUserData(userData);
      } else {
        const newDocRef = doc(collection(firestore, "UFOSperWallet"));
        const initialData: UserData = {
          wallet,
          ufos: 0,
          emptyPowerCell: 0,
          fullPowerCell: 0,
          brokenPowerCell: 0,
          ice: 0,
          co2: 0,
          water: 0,
          halite: 0,
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
        };
        await setDoc(newDocRef, mapUserDataToFirestore(initialData));
        setUserData(initialData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Fetch open orders
  const fetchOrders = async () => {
    if (!firestore) return;
    try {
      const q = query(
        collection(firestore, "MarketOrders"),
        where("status", "==", "active"),
        orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders: MarketOrder[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (!isResourceKey(data.resource)) {
              console.warn(`Invalid resource in order ${doc.id}: ${data.resource}`);
              return null;
            }
            return {
              id: doc.id,
              wallet: data.wallet,
              resource: data.resource,
              type: data.type as "buy" | "sell",
              amount: Number(data.amount) || 0,
              pricePerUnit: Number(data.pricePerUnit) || 0,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
              status: data.status as "active" | "completed" | "cancelled",
            };
          })
          .filter((order): order is MarketOrder => order !== null);
        setOrders(fetchedOrders);
        calculateMarketData(activeResource);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
const handleConfirmTrade = async () => {
  if (selectedOrder) {
    await tradeNow(selectedOrder);
    setIsModalOpen(false);
    setSelectedOrder(null);
  }
};

const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedOrder(null);
};
  // Fetch market logs
  const fetchMarketLogs = () => {
    if (!firestore) return;
    const startDate = new Date(Date.UTC(2025, 3, 5, 0, 0, 0));
    const startTimestamp = Timestamp.fromDate(startDate);
    let q = query(
      collection(firestore, "MarketOrderLogs"),
      where("timestamp", ">=", startTimestamp),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let fetchedLogs: MarketOrderLog[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            logId: data.logId,
            orderId: data.orderId,
            wallet: data.wallet,
            action: data.action,
            resource: data.resource,
            type: data.type,
            amount: Number(data.amount) || 0,
            pricePerUnit: Number(data.pricePerUnit) || 0,
            totalUfos: Number(data.totalUfos) || 0,
            buyerWallet: data.buyerWallet || "",
            sellerWallet: data.sellerWallet || "",
            buyerBefore: data.buyerBefore || { ufos: 0, resource: 0 },
            buyerAfter: data.buyerAfter || { ufos: 0, resource: 0 },
            sellerBefore: data.sellerBefore || { ufos: 0, resource: 0 },
            sellerAfter: data.sellerAfter || { ufos: 0, resource: 0 },
            timestamp: data.timestamp,
            status: data.status || "unknown",
          };
        });
        if (activityFilter) {
          fetchedLogs = fetchedLogs.filter(
            (log) => log.buyerWallet.includes(activityFilter) || log.sellerWallet.includes(activityFilter)
          );
        }
        setMarketLogs(fetchedLogs);
      },
      (error) => {
        console.error("Error fetching market logs:", error);
      }
    );
    return unsubscribe;
  };

  // Calculate total UFOS traded
  const calculateTotalUfosTraded = (logs: MarketOrderLog[]) => {
    const total = logs.reduce((sum, log) => {
      const ufos = Number(log.totalUfos) || 0;
      return sum + ufos;
    }, 0);
    console.log("Total UFOS Traded:", total);
    setTotalUfosTraded(total);
  };

  // Get user balances
  const getUserBalances = async (
    firestore: any,
    wallet: string,
    resource: keyof UserData
  ): Promise<{ ufos: number; resource: number }> => {
    const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", wallet));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.warn(`Wallet ${wallet} not found in UFOSperWallet`);
      return { ufos: 0, resource: 0 };
    }
    const docData = querySnapshot.docs[0].data();
    const userData = mapFirestoreToUserData(docData, wallet);
    return {
      ufos: userData.ufos,
      resource: Number(userData[resource]) || 0,
    };
  };

  // Get or create wallet document
  const getOrCreateWalletDoc = async (
    transaction: Transaction,
    firestore: any,
    wallet: string
  ): Promise<{ ref: any; data: any }> => {
    const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", wallet));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      return { ref: docSnapshot.ref, data: docSnapshot.data() };
    }

    const newDocRef = doc(collection(firestore, "UFOSperWallet"));
    const initialData: UserData = {
      wallet,
      ufos: 0,
      emptyPowerCell: 0,
      fullPowerCell: 0,
      brokenPowerCell: 0,
      ice: 0,
      co2: 0,
      water: 0,
      halite: 0,
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
    };
    transaction.set(newDocRef, mapUserDataToFirestore(initialData));
    return { ref: newDocRef, data: initialData };
  };
function OrdersSection() {
  return (
    <div className="fade-in">
      <h3 className="text-xl font-medium text-[#00ffaa] mb-4">Open Orders</h3>
      <Tabs defaultValue="sell" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sell">Sell Orders</TabsTrigger>
          <TabsTrigger value="buy">Buy Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="sell">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">{/* Sell orders table */}</table>
          </div>
        </TabsContent>
        <TabsContent value="buy">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">{/* Buy orders table */}</table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
  // Save market order log
const saveMarketOrderLog = (transaction: Transaction, firestore: any, log: MarketOrderLog) => {
  try {
    transaction.set(doc(firestore, "MarketOrderLogs", log.logId), {
      ...log,
      timestamp: Timestamp.fromDate(new Date()),
    });
    console.log(`Logged order change for order ${log.orderId}: ${log.action}`);
  } catch (error) {
    console.error(`Error saving log for order ${log.orderId}:`, error);
    throw error; // Rethrow to handle in the transaction
  }
};

  // Acquire lock
  const acquireLock = async (resource: keyof UserData): Promise<boolean> => {
    const lockRef = doc(firestore, "MarketLocks", resource);
    try {
      await runTransaction(firestore, async (transaction) => {
        const lockSnapshot = await transaction.get(lockRef);
        if (lockSnapshot.exists()) {
          const { locked, timestamp } = lockSnapshot.data();
          const lockAge = (Date.now() - timestamp.toDate().getTime()) / 1000;
          if (locked && lockAge < 5) {
            throw new Error("Resource is currently locked");
          }
        }
        transaction.set(lockRef, { locked: true, timestamp: Timestamp.fromDate(new Date()) });
      });
      return true;
    } catch (error) {
      console.warn(`Failed to acquire lock for ${resource}:`, error);
      return false;
    }
  };

  // Release lock
  const releaseLock = async (resource: keyof UserData) => {
    const lockRef = doc(firestore, "MarketLocks", resource);
    await setDoc(lockRef, { locked: false, timestamp: Timestamp.fromDate(new Date()) });
  };

  // Direct trade function
const tradeNow = async (order: MarketOrder) => {
  if (!walletConnected || !currentWalletAddress || !firestore) {
    toast.error("Please connect your wallet to trade.");
    return;
  }
  if (order.wallet === currentWalletAddress) {
    toast.error("Cannot trade with your own order.");
    return;
  }

  setIsSubmitting(true);
  setTradingOrderId(order.id);
  try {
    await runTransaction(firestore, async (transaction: Transaction) => {
      const lockAcquired = await acquireLock(order.resource);
      if (!lockAcquired) {
        throw new Error(`Could not acquire lock for ${order.resource}`);
      }

      try {
        // Verify order is still active
        const orderRef = doc(firestore, "MarketOrders", order.id);
        const orderSnapshot = await transaction.get(orderRef);
        if (!orderSnapshot.exists() || orderSnapshot.data().status !== "active") {
          throw new Error("Order is no longer active.");
        }

        const currentOrderAmount = Number(orderSnapshot.data().amount) || 0;
        if (currentOrderAmount <= 0) {
          throw new Error("Order has no remaining amount.");
        }

        // Get wallet data
        const buyerWallet = order.type === "sell" ? currentWalletAddress : order.wallet;
        const sellerWallet = order.type === "buy" ? currentWalletAddress : order.wallet;

        const buyerDoc = await getOrCreateWalletDoc(transaction, firestore, buyerWallet);
        const sellerDoc = await getOrCreateWalletDoc(transaction, firestore, sellerWallet);

        const buyerData: UserData = buyerDoc.data;
        const sellerData: UserData = sellerDoc.data;

        // Calculate trade amount
        let tradeAmount = currentOrderAmount;
        let ufosTransferred = tradeAmount * order.pricePerUnit;

        // Validate balances for the initiator of the trade
        if (order.type === "sell") {
          // Buyer is purchasing, check UFOS balance (since UFOS are not escrowed for direct buys)
          if (buyerData.ufos < ufosTransferred) {
            if (buyerData.ufos <= 0) {
              throw new Error(`Insufficient UFOS: You have ${buyerData.ufos}, need ${ufosTransferred}`);
            }
            tradeAmount = Math.floor(buyerData.ufos / order.pricePerUnit);
            if (tradeAmount <= 0) {
              throw new Error("Insufficient UFOS to trade any units.");
            }
            ufosTransferred = tradeAmount * order.pricePerUnit;
          }
        } else {
          // Seller is selling, check resource balance (since resources are not escrowed for direct sells)
          const sellerResourceAmount = Number(sellerData[order.resource]) || 0;
          if (sellerResourceAmount < tradeAmount) {
            if (sellerResourceAmount <= 0) {
              throw new Error(`Insufficient ${order.resource}: You have ${sellerResourceAmount}, need ${tradeAmount}`);
            }
            tradeAmount = sellerResourceAmount;
            ufosTransferred = tradeAmount * order.pricePerUnit;
          }
        }

        // Prompt for partial trades
        if (tradeAmount < currentOrderAmount) {
          const confirm = window.confirm(
            `Only ${tradeAmount} ${order.resource} can be traded due to insufficient balance. Proceed?`
          );
          if (!confirm) {
            throw new Error("Trade cancelled by user.");
          }
          ufosTransferred = tradeAmount * order.pricePerUnit;
        }

        // Update wallet balances
        const updatedBuyerData: UserData = {
          ...buyerData,
          ufos: order.type === "sell" ? buyerData.ufos - ufosTransferred : buyerData.ufos, // Deduct UFOS only for direct buys
          [order.resource]: (Number(buyerData[order.resource]) || 0) + tradeAmount, // Add resources to buyer
        };
        const updatedSellerData: UserData = {
          ...sellerData,
          ufos: sellerData.ufos + ufosTransferred, // Add UFOS to seller
          [order.resource]: order.type === "buy" ? (Number(sellerData[order.resource]) || 0) - tradeAmount : sellerData[order.resource], // Deduct resources only for direct sells
        };

        // Log balances
        const buyerBefore = {
          ufos: buyerData.ufos,
          resource: Number(buyerData[order.resource]) || 0,
        };
        const buyerAfter = {
          ufos: updatedBuyerData.ufos,
          resource: Number(updatedBuyerData[order.resource]) || 0,
        };
        const sellerBefore = {
          ufos: sellerData.ufos,
          resource: Number(sellerData[order.resource]) || 0,
        };
        const sellerAfter = {
          ufos: updatedSellerData.ufos,
          resource: Number(updatedSellerData[order.resource]) || 0,
        };

        // Create log entry
        const log: MarketOrderLog = {
          logId: `${order.id}-${Date.now()}`,
          orderId: order.id,
          wallet: currentWalletAddress,
          action: "match",
          resource: order.resource,
          type: order.type === "sell" ? "buy" : "sell",
          amount: tradeAmount,
          pricePerUnit: order.pricePerUnit,
          totalUfos: ufosTransferred,
          buyerWallet,
          sellerWallet,
          buyerBefore,
          buyerAfter,
          sellerBefore,
          sellerAfter,
          timestamp: Timestamp.fromDate(new Date()),
          status: tradeAmount === currentOrderAmount ? "completed" : "active",
        };
        await saveMarketOrderLog(transaction, firestore, log);

        // Update wallet documents
        transaction.update(buyerDoc.ref, mapUserDataToFirestore(updatedBuyerData));
        transaction.update(sellerDoc.ref, mapUserDataToFirestore(updatedSellerData));

        // Update order status
        if (tradeAmount === currentOrderAmount) {
          transaction.update(orderRef, { status: "completed" });
        } else {
          transaction.update(orderRef, { amount: currentOrderAmount - tradeAmount });
        }

        // Update local user data
        if (currentWalletAddress === buyerWallet) {
          setUserData(updatedBuyerData);
        } else {
          setUserData(updatedSellerData);
        }

        toast.success(`Successfully traded ${tradeAmount} ${order.resource} for ${ufosTransferred} UFOS!`);
      } finally {
        await releaseLock(order.resource);
      }
    });

    await fetchOrders();
    if (currentWalletAddress) {
      await fetchUserData(currentWalletAddress);
    }
  } catch (error: any) {
    console.error("Error processing trade:", error);
    toast.error(error.message || "Error processing trade.");
  } finally {
    setTradingOrderId(null);
    setIsSubmitting(false);
  }
};

  // Create buy order
const createBuyOrder = async () => {
  if (!walletConnected || !currentWalletAddress || !firestore) {
    toast.error("Please connect your wallet.");
    return;
  }
  const parsedBuyAmount = parseFloat(buyAmount);
  const parsedBuyPrice = parseFloat(buyPrice);
  if (isNaN(parsedBuyAmount) || parsedBuyAmount <= 0 || isNaN(parsedBuyPrice) || parsedBuyPrice <= 0) {
    toast.error("Please enter valid amount and price.");
    if (buyInputRef.current) buyInputRef.current.focus();
    return;
  }
  if (!isResourceKey(activeResource)) {
    toast.error("Invalid resource selected.");
    return;
  }

  setIsSubmitting(true);
  try {
    await runTransaction(firestore, async (transaction: Transaction) => {
      const lockAcquired = await acquireLock(activeResource);
      if (!lockAcquired) {
        throw new Error(`Could not acquire lock for ${activeResource}`);
      }

      try {
        // Read buyer wallet data
        const buyerDoc = await getOrCreateWalletDoc(transaction, firestore, currentWalletAddress);
        const buyerData = mapFirestoreToUserData(buyerDoc.data, currentWalletAddress);
        const totalCost = parsedBuyAmount * parsedBuyPrice;
        if (buyerData.ufos < totalCost) {
          throw new Error(`Insufficient UFOS: You have ${buyerData.ufos}, need ${totalCost}`);
        }

        // Deduct UFOS for the entire order amount (escrow)
        let updatedBuyerData: UserData = {
          ...buyerData,
          ufos: buyerData.ufos - totalCost,
        };

        // Prepare wallet updates
        const walletUpdates: Array<{ ref: any; data: UserData }> = [
          { ref: buyerDoc.ref, data: updatedBuyerData },
        ];
        const orderCreates: Array<{ ref: any; data: MarketOrder }> = [];
        const logs: MarketOrderLog[] = [];

        // Attempt to match the order
        const { remainingAmount, matched, ufosSpent, ufosReceived } = await matchOrder(
          {
            wallet: currentWalletAddress,
            resource: activeResource,
            type: "buy",
            amount: parsedBuyAmount,
            pricePerUnit: parsedBuyPrice,
          },
          transaction
        );

        // Update buyer data after matching
        updatedBuyerData = {
          ...updatedBuyerData,
          [activeResource]: (Number(buyerData[activeResource]) || 0) + (parsedBuyAmount - remainingAmount), // Add matched resources
        };
        walletUpdates[0] = { ref: buyerDoc.ref, data: updatedBuyerData };

        // Place remaining amount as a new order if any
        if (remainingAmount > 0) {
          const orderId = `${currentWalletAddress}-${Date.now()}`;
          const newOrder: MarketOrder = {
            id: orderId,
            wallet: currentWalletAddress,
            resource: activeResource,
            type: "buy",
            amount: remainingAmount,
            pricePerUnit: parsedBuyPrice,
            createdAt: Timestamp.fromDate(new Date()),
            status: "active",
          };
          orderCreates.push({ ref: doc(firestore, "MarketOrders", orderId), data: newOrder });

          const log: MarketOrderLog = {
            logId: `${orderId}-${Date.now()}`,
            orderId: orderId,
            wallet: currentWalletAddress,
            action: "create",
            resource: activeResource,
            type: "buy",
            amount: remainingAmount,
            pricePerUnit: parsedBuyPrice,
            totalUfos: remainingAmount * parsedBuyPrice,
            buyerWallet: currentWalletAddress,
            sellerWallet: "",
            buyerBefore: { ufos: buyerData.ufos, resource: Number(buyerData[activeResource]) || 0 },
            buyerAfter: {
              ufos: updatedBuyerData.ufos,
              resource: Number(updatedBuyerData[activeResource]) || 0,
            },
            sellerBefore: { ufos: 0, resource: 0 },
            sellerAfter: { ufos: 0, resource: 0 },
            timestamp: Timestamp.fromDate(new Date()),
            status: "active",
          };
          logs.push(log);
        }

        // Apply all writes
        for (const update of walletUpdates) {
          try {
            console.log(`Updating wallet ${update.data.wallet} at ${new Date().toISOString()}:`, mapUserDataToFirestore(update.data));
            transaction.update(update.ref, mapUserDataToFirestore(update.data));
          } catch (error) {
            console.error(`Failed to update wallet ${update.data.wallet} at ${new Date().toISOString()}:`, error);
            throw error;
          }
        }
        for (const create of orderCreates) {
          try {
            console.log(`Creating order ${create.data.id} at ${new Date().toISOString()}:`, create.data);
            transaction.set(create.ref, create.data);
          } catch (error) {
            console.error(`Failed to create order ${create.data.id} at ${new Date().toISOString()}:`, error);
            throw error;
          }
        }
        for (const log of logs) {
          console.log(`Saving log ${log.logId} at ${new Date().toISOString()}:`, log);
          saveMarketOrderLog(transaction, firestore, log);
        }

        setUserData(updatedBuyerData);
        toast.success(matched ? "Order matched successfully!" : "Buy order placed successfully!");
      } finally {
        await releaseLock(activeResource);
      }
    });

    setBuyAmount("");
    setBuyPrice("");
    await fetchOrders();
    if (currentWalletAddress) {
      await fetchUserData(currentWalletAddress);
    }
  } catch (error: any) {
    console.error("Error creating buy order:", error);
    toast.error(error.message || "Failed to place buy order.");
  } finally {
    setIsSubmitting(false);
  }
};
  // Create sell order
const createSellOrder = async () => {
  if (!walletConnected || !userData || !currentWalletAddress || !firestore) {
    toast.error("Please connect your wallet.");
    return;
  }
  const parsedSellAmount = parseFloat(sellAmount);
  const parsedSellPrice = parseFloat(sellPrice);
  if (isNaN(parsedSellAmount) || parsedSellAmount <= 0 || isNaN(parsedSellPrice) || parsedSellPrice <= 0) {
    toast.error("Please enter valid amount and price.");
    return;
  }
  if (!isResourceKey(activeResource)) {
    toast.error("Invalid resource selected.");
    return;
  }

  setIsSubmitting(true);
  try {
    await runTransaction(firestore, async (transaction: Transaction) => {
      const lockAcquired = await acquireLock(activeResource);
      if (!lockAcquired) {
        throw new Error(`Could not acquire lock for ${activeResource}`);
      }

      try {
        // Read seller wallet data
        const sellerDoc = await getOrCreateWalletDoc(transaction, firestore, currentWalletAddress);
        const sellerData = mapFirestoreToUserData(sellerDoc.data, currentWalletAddress);
        const resourceAmount = Number(sellerData[activeResource]) || 0;
        if (resourceAmount < parsedSellAmount) {
          throw new Error(`Insufficient ${activeResource}: You have ${resourceAmount}, need ${parsedSellAmount}`);
        }

        // Deduct resources for the entire order amount (escrow)
        let updatedSellerData: UserData = {
          ...sellerData,
          [activeResource]: resourceAmount - parsedSellAmount,
        };

        // Collect wallet updates
        const walletUpdates: Array<{ ref: any; data: UserData }> = [
          { ref: sellerDoc.ref, data: updatedSellerData },
        ];
        const orderCreates: Array<{ ref: any; data: MarketOrder }> = [];
        const logs: MarketOrderLog[] = [];

        // Attempt to match the order
        const { remainingAmount, matched, ufosReceived } = await matchOrder(
          {
            wallet: currentWalletAddress,
            resource: activeResource,
            type: "sell",
            amount: parsedSellAmount,
            pricePerUnit: parsedSellPrice,
          },
          transaction
        );

        // Update seller's UFOS balance if matched
        if (matched) {
          updatedSellerData = {
            ...updatedSellerData,
            ufos: updatedSellerData.ufos + ufosReceived,
          };
          walletUpdates[0] = { ref: sellerDoc.ref, data: updatedSellerData };
        }

        // Place remaining amount as a new order if any
        if (remainingAmount > 0) {
          const orderId = `${currentWalletAddress}-${Date.now()}`;
          const newOrder: MarketOrder = {
            id: orderId,
            wallet: currentWalletAddress,
            resource: activeResource,
            type: "sell",
            amount: remainingAmount,
            pricePerUnit: parsedSellPrice,
            createdAt: Timestamp.fromDate(new Date()),
            status: "active",
          };
          orderCreates.push({ ref: doc(firestore, "MarketOrders", orderId), data: newOrder });

          const log: MarketOrderLog = {
            logId: `${orderId}-${Date.now()}`,
            orderId: orderId,
            wallet: currentWalletAddress,
            action: "create",
            resource: activeResource,
            type: "sell",
            amount: remainingAmount,
            pricePerUnit: parsedSellPrice,
            totalUfos: remainingAmount * parsedSellPrice,
            buyerWallet: "",
            sellerWallet: currentWalletAddress,
            buyerBefore: { ufos: 0, resource: 0 },
            buyerAfter: { ufos: 0, resource: 0 },
            sellerBefore: { ufos: sellerData.ufos, resource: resourceAmount },
            sellerAfter: {
              ufos: updatedSellerData.ufos,
              resource: Number(updatedSellerData[activeResource]) || 0,
            },
            timestamp: Timestamp.fromDate(new Date()),
            status: "active",
          };
          logs.push(log);
        }

        // Apply all writes
        for (const update of walletUpdates) {
          try {
            console.log(`Updating wallet ${update.data.wallet} at ${new Date().toISOString()}:`, mapUserDataToFirestore(update.data));
            transaction.update(update.ref, mapUserDataToFirestore(update.data));
          } catch (error) {
            console.error(`Failed to update wallet ${update.data.wallet} at ${new Date().toISOString()}:`, error);
            throw error;
          }
        }
        for (const create of orderCreates) {
          try {
            console.log(`Creating order ${create.data.id} at ${new Date().toISOString()}:`, create.data);
            transaction.set(create.ref, create.data);
          } catch (error) {
            console.error(`Failed to create order ${create.data.id} at ${new Date().toISOString()}:`, error);
            throw error;
          }
        }
        for (const log of logs) {
          console.log(`Saving log ${log.logId} at ${new Date().toISOString()}:`, log);
          saveMarketOrderLog(transaction, firestore, log);
        }

        setUserData(updatedSellerData);
        toast.success(matched ? "Order matched successfully!" : "Sell order placed successfully!");
      } finally {
        await releaseLock(activeResource);
      }
    });

    setSellAmount("");
    setSellPrice("");
    await fetchOrders();
    if (currentWalletAddress) {
      await fetchUserData(currentWalletAddress);
    }
  } catch (error: any) {
    console.error("Error creating sell order:", error);
    toast.error(error.message || "Failed to place sell order.");
  } finally {
    setIsSubmitting(false);
  }
};

const matchOrder = async (
  newOrder: {
    wallet: string;
    resource: keyof UserData;
    type: "buy" | "sell";
    amount: number;
    pricePerUnit: number;
  },
  transaction: Transaction
): Promise<{ remainingAmount: number; matched: boolean; ufosSpent: number; ufosReceived: number }> => {
  if (!firestore || !currentWalletAddress) {
    throw new Error("Firestore or wallet not initialized");
  }

  const { wallet, resource, type, amount, pricePerUnit } = newOrder;
  let remainingAmount = amount;
  let matched = false;
  let ufosSpent = 0; // Track UFOS transferred for logging
  let ufosReceived = 0; // Track UFOS received for logging
  const logs: MarketOrderLog[] = [];
  const walletUpdates: Array<{ ref: any; data: UserData }> = [];
  const orderUpdates: Array<{ ref: any; data: { status?: string; amount?: number } }> = [];

  // Fetch compatible orders outside the transaction
  const oppositeType = type === "buy" ? "sell" : "buy";
  const q = query(
    collection(firestore, "MarketOrders"),
    where("resource", "==", resource),
    where("type", "==", oppositeType),
    where("status", "==", "active"),
    orderBy("pricePerUnit", type === "buy" ? "asc" : "desc"),
    orderBy("createdAt", "asc")
  );
  const querySnapshot: QuerySnapshot = await getDocs(q);
  const compatibleOrders: MarketOrder[] = querySnapshot.docs
    .map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      wallet: doc.data().wallet,
      resource: doc.data().resource as keyof UserData,
      type: doc.data().type as "buy" | "sell",
      amount: Number(doc.data().amount) || 0,
      pricePerUnit: Number(doc.data().pricePerUnit) || 0,
      createdAt: doc.data().createdAt,
      status: doc.data().status as "active" | "completed" | "cancelled",
    }))
    .filter(
      (order: MarketOrder) =>
        (type === "buy" && order.pricePerUnit <= pricePerUnit) ||
        (type === "sell" && order.pricePerUnit >= pricePerUnit)
    );

  // Process matches within the transaction
  for (const order of compatibleOrders) {
    if (remainingAmount <= 0) break;

    const orderRef = doc(firestore, "MarketOrders", order.id);
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists() || orderSnapshot.data().status !== "active") {
      console.warn(`Order ${order.id} is no longer active or does not exist`);
      continue;
    }

    const currentOrderAmount = Number(orderSnapshot.data().amount) || 0;
    if (currentOrderAmount <= 0) {
      console.warn(`Order ${order.id} has no remaining amount`);
      continue;
    }

    // Lock the specific order to prevent concurrent modifications
    const orderLockRef = doc(firestore, "MarketLocks", `${resource}-${order.id}`);
    const orderLockSnapshot = await transaction.get(orderLockRef);
    if (orderLockSnapshot.exists() && orderLockSnapshot.data().locked) {
      console.warn(`Order ${order.id} is currently locked`);
      continue;
    }
    transaction.set(orderLockRef, { locked: true, timestamp: Timestamp.fromDate(new Date()) });

    // Determine trade amount
    const tradeAmount = Math.min(remainingAmount, currentOrderAmount);
    const matchPrice = order.pricePerUnit;
    const ufosTransferred = tradeAmount * matchPrice;
    console.log(`Matching order ${order.id}: tradeAmount=${tradeAmount}, ufosTransferred=${ufosTransferred}`);

    // Track UFOS spent (buy orders) or received (sell orders) for logging
    if (type === "buy") {
      ufosSpent += ufosTransferred;
    } else {
      ufosReceived += ufosTransferred;
    }

    // Get wallet data
    const buyerWallet = type === "buy" ? wallet : order.wallet;
    const sellerWallet = type === "sell" ? wallet : order.wallet;

    const buyerDoc = await getOrCreateWalletDoc(transaction, firestore, buyerWallet);
    const sellerDoc = await getOrCreateWalletDoc(transaction, firestore, sellerWallet);

    const buyerData = mapFirestoreToUserData(buyerDoc.data, buyerWallet);
    const sellerData = mapFirestoreToUserData(sellerDoc.data, sellerWallet);

    // Update wallet balances (no deductions, only additions)
    const updatedBuyerData: UserData = {
      ...buyerData,
      [resource]: (Number(buyerData[resource]) || 0) + tradeAmount, // Add resources to buyer
    };
    const updatedSellerData: UserData = {
      ...sellerData,
      ufos: sellerData.ufos + ufosTransferred, // Add UFOS to seller
    };

    // Log balances for debugging
    const buyerBefore = { ufos: buyerData.ufos, resource: Number(buyerData[resource]) || 0 };
    const buyerAfter = { ufos: updatedBuyerData.ufos, resource: Number(updatedBuyerData[resource]) || 0 };
    const sellerBefore = { ufos: sellerData.ufos, resource: Number(sellerData[resource]) || 0 };
    const sellerAfter = { ufos: updatedSellerData.ufos, resource: Number(updatedSellerData[resource]) || 0 };
    console.log(`Buyer (${buyerWallet}) before: ufos=${buyerBefore.ufos}, ${resource}=${buyerBefore.resource}`);
    console.log(`Buyer (${buyerWallet}) after: ufos=${buyerAfter.ufos}, ${resource}=${buyerAfter.resource}`);
    console.log(`Seller (${sellerWallet}) before: ufos=${sellerBefore.ufos}, ${resource}=${sellerBefore.resource}`);
    console.log(`Seller (${sellerWallet}) after: ufos=${sellerAfter.ufos}, ${resource}=${sellerAfter.resource}`);

    // Prepare log entry
    const log: MarketOrderLog = {
      logId: `${order.id}-${Date.now()}`,
      orderId: order.id,
      wallet: currentWalletAddress,
      action: "match",
      resource,
      type: type === "buy" ? "buy" : "sell",
      amount: tradeAmount,
      pricePerUnit: matchPrice,
      totalUfos: ufosTransferred,
      buyerWallet,
      sellerWallet,
      buyerBefore,
      buyerAfter,
      sellerBefore,
      sellerAfter,
      timestamp: Timestamp.fromDate(new Date()),
      status: tradeAmount === currentOrderAmount ? "completed" : "active",
    };
    logs.push(log);

    // Prepare wallet updates
    walletUpdates.push({ ref: buyerDoc.ref, data: updatedBuyerData });
    walletUpdates.push({ ref: sellerDoc.ref, data: updatedSellerData });

    // Prepare order update
    orderUpdates.push({
      ref: orderRef,
      data: {
        ...(tradeAmount === currentOrderAmount ? { status: "completed" } : { amount: currentOrderAmount - tradeAmount }),
      },
    });

    // Release order lock
    transaction.set(orderLockRef, { locked: false, timestamp: Timestamp.fromDate(new Date()) });

    // Update local user data
    if (currentWalletAddress === buyerWallet) {
      setUserData(updatedBuyerData);
    } else if (currentWalletAddress === sellerWallet) {
      setUserData(updatedSellerData);
    }

    remainingAmount -= tradeAmount;
    matched = true;
  }

  // Apply all writes after matching loop
  for (const update of walletUpdates) {
    try {
      console.log(`Updating wallet ${update.data.wallet} at ${new Date().toISOString()}:`, mapUserDataToFirestore(update.data));
      transaction.update(update.ref, mapUserDataToFirestore(update.data));
    } catch (error) {
      console.error(`Failed to update wallet ${update.data.wallet} at ${new Date().toISOString()}:`, error);
      throw error;
    }
  }
  for (const update of orderUpdates) {
    try {
      console.log(`Updating order ${update.ref.id} at ${new Date().toISOString()}:`, update.data);
      transaction.update(update.ref, update.data);
    } catch (error) {
      console.error(`Failed to update order ${update.ref.id} at ${new Date().toISOString()}:`, error);
      throw error;
    }
  }
  for (const log of logs) {
    console.log(`Saving log ${log.logId} at ${new Date().toISOString()}:`, log);
    saveMarketOrderLog(transaction, firestore, log);
  }

  if (matched) {
    toast.success(`Matched ${amount - remainingAmount} ${resource} at ${pricePerUnit} UFOS/unit!`);
  }

  return { remainingAmount, matched, ufosSpent, ufosReceived };
};
  // Cancel order
const cancelOrder = async (order: MarketOrder) => {
  if (!firestore || !userData || !currentWalletAddress) return;
  if (order.wallet !== currentWalletAddress) {
    toast.error("Cannot cancel another user's order.");
    return;
  }

  setIsSubmitting(true);
  try {
    await runTransaction(firestore, async (transaction: Transaction) => {
      const lockAcquired = await acquireLock(order.resource);
      if (!lockAcquired) {
        throw new Error(`Could not acquire lock for ${order.resource}`);
      }

      try {
        const orderRef = doc(firestore, "MarketOrders", order.id);
        const orderSnapshot = await transaction.get(orderRef);
        if (!orderSnapshot.exists()) {
          throw new Error("Order no longer exists. It may have been matched by another player.");
        }

        const orderData = orderSnapshot.data();
        const currentOrderAmount = Number(orderData.amount) || 0;
        if (currentOrderAmount <= 0) {
          throw new Error("Order has already been fully matched.");
        }

        const userDoc = await getOrCreateWalletDoc(transaction, firestore, currentWalletAddress);
        const userDataDoc = mapFirestoreToUserData(userDoc.data, currentWalletAddress);
        const beforeBalances = await getUserBalances(firestore, currentWalletAddress, order.resource);

        let updatedUserData: UserData = { ...userDataDoc };
        if (order.type === "sell") {
          updatedUserData = {
            ...updatedUserData,
            [order.resource]: (Number(userDataDoc[order.resource]) || 0) + currentOrderAmount, // Refund resources
          };
        } else if (order.type === "buy") {
          updatedUserData = {
            ...updatedUserData,
            ufos: userDataDoc.ufos + (currentOrderAmount * order.pricePerUnit), // Refund UFOS
          };
        }

        const afterBalances = {
          ufos: updatedUserData.ufos,
          resource: Number(updatedUserData[order.resource]) || 0,
        };

        const log: MarketOrderLog = {
          logId: `${order.id}-${Date.now()}`,
          orderId: order.id,
          wallet: currentWalletAddress,
          action: "cancel",
          resource: order.resource,
          type: order.type,
          amount: currentOrderAmount,
          pricePerUnit: order.pricePerUnit,
          totalUfos: order.type === "buy" ? currentOrderAmount * order.pricePerUnit : 0,
          buyerWallet: order.type === "buy" ? currentWalletAddress : "",
          sellerWallet: order.type === "sell" ? currentWalletAddress : "",
          buyerBefore: order.type === "buy" ? beforeBalances : { ufos: 0, resource: 0 },
          buyerAfter: order.type === "buy" ? afterBalances : { ufos: 0, resource: 0 },
          sellerBefore: order.type === "sell" ? beforeBalances : { ufos: 0, resource: 0 },
          sellerAfter: order.type === "sell" ? afterBalances : { ufos: 0, resource: 0 },
          timestamp: Timestamp.fromDate(new Date()),
          status: "cancelled",
        };

        await saveMarketOrderLog(transaction, firestore, log);

        transaction.update(userDoc.ref, mapUserDataToFirestore(updatedUserData));
        transaction.update(orderRef, { status: "cancelled" });
        setUserData(updatedUserData);

        toast.success("Order cancelled successfully!");
      } finally {
        await releaseLock(order.resource);
      }
    });

    await fetchOrders();
    if (currentWalletAddress) {
      await fetchUserData(currentWalletAddress);
    }
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    toast.error(error.message || "Error cancelling order.");
  } finally {
    setIsSubmitting(false);
  }
};

  // MatchedOrders component
const MatchedOrders = ({
  marketLogs,
  currentWalletAddress,
}: {
  marketLogs: MarketOrderLog[];
  currentWalletAddress: string | null;
}) => {
  if (!currentWalletAddress) return null;

  const userMatchedOrders = marketLogs.filter(
    (log) =>
      log.status === "completed" &&
      log.action === "match" &&
      (log.buyerWallet === currentWalletAddress || log.sellerWallet === currentWalletAddress)
  );

  return (
    <div className="mb-6 fade-in">
      <h3 className="text-xl font-medium text-[#ff00aa] mb-4 glitch-pulse">Your Activity</h3>
      {userMatchedOrders.length === 0 ? (
        <div className="p-4 bg-[#2a2a2a]/50 cypherpunk-border rounded-lg glow-hover">
          <p className="text-[#00ffaa] text-sm text-center">No activity found for this wallet.</p>
        </div>
      ) : (
        <div className="scroll-container bg-[#2a2a2a]/50 rounded-lg cypherpunk-border glow-hover" style={{ maxHeight: '30vh', overflowY: 'auto' }}>
          <div className="space-y-4 p-4">
            {userMatchedOrders.map((log) => {
              const resourceName = resources.find((r) => r.key === log.resource)?.name || log.resource;
              const date = log.timestamp.toDate().toLocaleString('en-US', {
                timeZone: 'UTC',
                dateStyle: 'short',
                timeStyle: 'short',
              });
              return (
                <div
                  key={log.logId}
                  className="order-card bg-[#2a2a2a]/30 p-4 rounded-lg cypherpunk-border"
                >
                  <div className="space-y-2">
                    <p className="text-white text-sm">
                      <span className="font-medium">Resource:</span> {resourceName}
                    </p>
                    <p className="text-white text-sm">
                      <span className="font-medium">Type:</span> {log.buyerWallet === currentWalletAddress ? "Buy" : "Sell"}
                    </p>
                    <p className="text-white text-sm">
                      <span className="font-medium">Amount:</span> {log.amount.toLocaleString()}
                    </p>
                    <p className="text-white text-sm">
                      <span className="font-medium">Price:</span> {log.pricePerUnit} UFOS
                    </p>
                    <p className="text-white text-sm">
                      <span className="font-medium">Total:</span> {log.totalUfos.toLocaleString()} UFOS
                    </p>
                    <p className="text-white text-sm">
                      <span className="font-medium">Date:</span> {date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsLoading(false);
    }
  }, []);

  // Check wallet connection
  useEffect(() => {
    const checkWallet = async () => {
      const solana = window.solana;
      const solflare = window.solflare;

      let walletProvider: WalletProvider | undefined;
      if (solana?.isPhantom) {
        walletProvider = solana;
      } else if (solflare?.isSolflare) {
        walletProvider = solflare;
      }

      if (!walletProvider) {
        console.log("No wallet provider detected");
        return;
      }

      try {
        const response = await walletProvider.connect({ onlyIfTrusted: true });
        const publicKey = response.publicKey.toString();
        setCurrentWalletAddress(publicKey);
        setWalletConnected(true);
        fetchUserData(publicKey);
      } catch (error) {
        console.log("No wallet connected or user rejected connection:", error);
      }
    };
    checkWallet();
  }, [firestore]);

  // Wallet connection real-time listener
  useEffect(() => {
    if (walletConnected && currentWalletAddress && firestore) {
      const q = query(
        collection(firestore, "UFOSperWallet"),
        where("Wallet", "==", currentWalletAddress)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            const userData: UserData = mapFirestoreToUserData(docData, currentWalletAddress);
            setUserData(userData);
          }
        },
        (error) => {
          console.error("Error in real-time listener:", error);
        }
      );
      return () => unsubscribe();
    }
  }, [firestore, currentWalletAddress, walletConnected]);

  // Fetch open orders
  useEffect(() => {
    if (firestore) {
      fetchOrders();
    }
  }, [firestore]);

  // Fetch market logs
  useEffect(() => {
    if (firestore) {
      const unsubscribe = fetchMarketLogs();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [firestore, activeResource]);

  // Calculate total UFOS traded
  useEffect(() => {
    calculateTotalUfosTraded(marketLogs);
  }, [marketLogs]);

  // Update market data on resource or orders change
  useEffect(() => {
    calculateMarketData(activeResource);
    setBuyPrice(lowestSellPrice !== null ? lowestSellPrice.toString() : "");
  }, [activeResource, orders]);

  // Modal styling
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    const fixModalAndButtons = () => {
      const modal = document.querySelector(".wallet-adapter-modal") as HTMLElement | null;
      const modalContainer = document.querySelector(".wallet-adapter-modal-container") as HTMLElement | null;
      const connectMessage = document.querySelector(".wallet-connect-message") as HTMLElement | null;

      if (!modal || !modalContainer || !connectMessage) {
        return;
      }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white font-sans cypherpunk-loading-container">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="cypherpunk-spinner"></div>
          </div>
          <p className="text-lg cypherpunk-loading-text">Initializing Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white font-sans p-6 cypherpunk-loading-container">
<style jsx global>{`
  .scroll-container {
    scrollbar-width: thin;
    scrollbar-color: #00ffaa #2a2a2a;
  }

  .scroll-container::-webkit-scrollbar {
    width: 8px;
  }

  .scroll-container::-webkit-scrollbar-track {
    background: #2a2a2a;
    border-radius: 4px;
  }

  .scroll-container::-webkit-scrollbar-thumb {
    background: #00ffaa;
    border-radius: 4px;
    box-shadow: 0 0 10px #00ffaa;
  }

  .scroll-container::-webkit-scrollbar-thumb:hover {
    background: #ff00aa;
  }

  .cypherpunk-border {
    border: 1px solid #00ffaa;
    box-shadow: 0 0 10px rgba(0, 255, 170, 0.5);
  }

  .glow-hover:hover {
    box-shadow: 0 0 15px #00ffaa, 0 0 30px #ff00aa;
  }

  .cypherpunk-tabs-list {
    background: #1a1a1a;
    border: 1px solid #00ffaa;
  }

  .cypherpunk-tab-button {
    background: #2a2a2a;
    color: #00ffaa;
    transition: all 0.3s ease;
  }

  .cypherpunk-tab-button[data-state="active"] {
    background: #00ffaa;
    color: #0a0a0a;
    box-shadow: 0 0 10px #00ffaa;
  }

  .cypherpunk-button {
    transition: all 0.3s ease;
  }

  .cypherpunk-button-blue {
    background: linear-gradient(135deg, #00ccff, #00ffaa);
  }

  .cypherpunk-button-red {
    background: linear-gradient(135deg, #ff00aa, #cc00ff);
  }

  .cypherpunk-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px #00ffaa;
  }

  .cypherpunk-loading-container {
    position: relative;
  }

  .cypherpunk-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #00ffaa;
    border-top: 4px solid #ff00aa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .fade-in {
    animation: fadeIn 0.5s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .glitch-pulse {
    animation: glitchPulse 2s infinite;
  }

  @keyframes glitchPulse {
    0%, 100% { text-shadow: 0 0 5px #00ffaa, 0 0 10px #ff00aa; }
    50% { text-shadow: 0 0 10px #00ffaa, 0 0 20px #ff00aa; }
  }

  .cypherpunk-icon-glow {
    filter: drop-shadow(0 0 5px #00ffaa);
  }
`}</style>
      <Toaster richColors position="top-right" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <WalletMultiButton
          className="cypherpunk-button cypherpunk-button-purple text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
        />
      </div>
      <Button
        onClick={() => router.push("/farm")}
        className="mb-6 cypherpunk-button cypherpunk-button-blue text-white px-6 py-3 rounded-lg glow-hover"
        aria-label="Return to game"
      >
        Back to Game
      </Button>
      <Card className="max-w-5xl mx-auto bg-[#1a1a1a]/95 cypherpunk-border rounded-xl shadow-2xl fade-in">
        <CardContent className="p-8">
          <div className="relative">
            <h1 className="text-4xl font-bold text-[#ff00aa] mb-6 glitch-pulse">Interstellar Marketplace</h1>
            {showTooltip && walletConnected && (
              <div className="tooltip absolute top-0 right-0 bg-[#2a2a2a]/90 text-[#00ffaa] p-3 rounded-lg cypherpunk-border opacity-90 neon-flicker">
                <p className="text-sm">Select a resource, set your buy/sell amounts, or trade directly from open orders!</p>
                <button
                  className="text-xs text-[#00ffaa] mt-2 underline"
                  onClick={() => setShowTooltip(false)}
                >
                  Got it
                </button>
              </div>
            )}
          </div>
          {!walletConnected && (
            <p className="text-[#ff00aa] mb-6 bg-[#ff00aa]/10 p-4 rounded-lg cypherpunk-border">
              Please connect your wallet to start trading.
            </p>
          )}
          {userData && (
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 fade-in">
              <div className="bg-[#2a2a2a]/60 p-4 rounded-lg w-full sm:w-auto cypherpunk-border">
                <p className="text-sm text-[#00ffaa]">Wallet: {userData.wallet.slice(0, 6)}...{userData.wallet.slice(-4)}</p>
                <p className="text-lg font-semibold text-white">UFOS: {userData.ufos.toLocaleString()}</p>
              </div>
              <Select
                value={activeResource}
                onValueChange={(value) => isResourceKey(value) && setActiveResource(value)}
              >
                <SelectTrigger className="w-full sm:w-72 bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg focus:ring-2 focus:ring-[#ff00aa] glow-hover">
                  <SelectValue placeholder="Select Resource" />
                  <ChevronDown className="w-5 h-5 text-[#00ffaa] cypherpunk-icon-glow" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg max-h-64 overflow-y-auto">
                  {resources.map((resource) => (
                    <SelectItem key={resource.key} value={resource.key} className="flex items-center hover:bg-[#3a3a3a]/60">
                      <div className="flex items-center gap-3 py-2">
                        <img src={resource.image} alt={resource.name} className="w-6 h-6 object-contain" />
                        <span>{resource.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="mb-6 p-4 bg-[#2a2a2a]/50 cypherpunk-border rounded-lg glow-hover">
            <h3 className="text-xl font-medium text-[#00ffaa]">
              Total UFOS Traded Across All Resources: {totalUfosTraded.toLocaleString()} UFOS
              {walletFilter && ` (Filtered by Wallet: ${walletFilter.slice(0, 6)}...${walletFilter.slice(-4)})`}
            </h3>
          </div>
          <div className="mb-8 fade-in">
            <h2 className="text-2xl font-semibold text-[#ff00aa] mb-4 glitch-pulse">
              {resources.find((r) => r.key === activeResource)?.name || "Resource"} (
              {userData ? Number(userData[activeResource]).toLocaleString() || 0 : 0})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card className="bg-[#2a2a2a]/60 cypherpunk-border rounded-lg glow-hover">
                <CardContent className="p-4 flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#00ffaa]">Lowest Sell Price</h3>
                    <p className="text-xl font-bold text-white">
                      {lowestSellPrice ? `${lowestSellPrice} UFOS` : "N/A"}
                    </p>
                  </div>
                  <svg className="w-12 h-6" viewBox="0 0 100 50">
                    <polyline
                      points="0,50 20,40 40,45 60,30 80,35 100,20"
                      fill="none"
                      stroke="#ff00aa"
                      strokeWidth="2"
                    />
                  </svg>
                </CardContent>
              </Card>
              <Card className="bg-[#2a2a2a]/60 cypherpunk-border rounded-lg glow-hover">
                <CardContent className="p-4 flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#00ffaa]">Average Sell Price</h3>
                    <p className="text-xl font-bold text-white">
                      {averageSellPrice ? `${averageSellPrice} UFOS` : "N/A"}
                    </p>
                  </div>
                  <svg className="w-12 h-6" viewBox="0 0 100 50">
                    <polyline
                      points="0,50 20,45 40,40 60,35 80,30 100,25"
                      fill="none"
                      stroke="#00ffaa"
                      strokeWidth="2"
                    />
                  </svg>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#2a2a2a]/30 p-6 rounded-lg relative cypherpunk-border">
                <h3 className="text-xl font-medium text-[#00ffaa] mb-4 glitch-pulse">Buy Order</h3>
                {isSubmitting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg cypherpunk-loading-container">
                    <div className="cypherpunk-spinner"></div>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm text-[#00ffaa] mb-1" htmlFor="buy-amount">
                      Amount <div title="Number of units to buy" className="inline"><Info className="inline w-4 h-4 text-[#00ffaa] cypherpunk-icon-glow" /></div>
                    </label>
                    <Input
                      id="buy-amount"
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      min="0"
                      disabled={!walletConnected || isSubmitting}
                      className={`w-full bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg focus:ring-2 focus:ring-[#ff00aa] glow-hover ${parseFloat(buyAmount) <= 0 && buyAmount !== "" ? "border-[#ff00aa]" : ""}`}
                      placeholder="Enter amount"
                      aria-describedby="buy-amount-error"
                      ref={buyInputRef}
                    />
                    {parseFloat(buyAmount) <= 0 && buyAmount !== "" && (
                      <p id="buy-amount-error" className="text-xs text-[#ff00aa] mt-1">Amount must be greater than 0</p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm text-[#00ffaa] mb-1" htmlFor="buy-price">
                      Price per Unit (UFOS) <div title="Price per unit in UFOS" className="inline"><Info className="inline w-4 h-4 text-[#00ffaa] cypherpunk-icon-glow" /></div>
                    </label>
                    <Input
                      id="buy-price"
                      type="number"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      min="0"
                      disabled={!walletConnected || isSubmitting}
                      placeholder={lowestSellPrice ? `Lowest: ${lowestSellPrice}` : "Enter price"}
                      className={`w-full bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg focus:ring-2 focus:ring-[#ff00aa] glow-hover ${parseFloat(buyPrice) <= 0 && buyPrice !== "" ? "border-[#ff00aa]" : ""}`}
                      aria-describedby="buy-price-error"
                    />
                    {parseFloat(buyPrice) <= 0 && buyPrice !== "" && (
                      <p id="buy-price-error" className="text-xs text-[#ff00aa] mt-1">Price must be greater than 0</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={createBuyOrder}
                      disabled={!walletConnected || isSubmitting}
                      className="cypherpunk-button cypherpunk-button-blue text-white rounded-lg px-6 py-3 glow-hover"
                      aria-label="Place buy order"
                    >
                      Place Buy Order
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a]/30 p-6 rounded-lg relative cypherpunk-border">
                <h3 className="text-xl font-medium text-[#ff00aa] mb-4 glitch-pulse">Sell Order</h3>
                {isSubmitting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg cypherpunk-loading-container">
                    <div className="cypherpunk-spinner"></div>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm text-[#00ffaa] mb-1" htmlFor="sell-amount">
                      Amount <div title="Number of units to sell" className="inline"><Info className="inline w-4 h-4 text-[#00ffaa] cypherpunk-icon-glow" /></div>
                    </label>
                    <Input
                      id="sell-amount"
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      min="0"
                      disabled={!walletConnected || isSubmitting}
                      className={`w-full bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg focus:ring-2 focus:ring-[#ff00aa] glow-hover ${parseFloat(sellAmount) <= 0 && sellAmount !== "" ? "border-[#ff00aa]" : ""}`}
                      placeholder="Enter amount"
                      aria-describedby="sell-amount-error"
                    />
                    {parseFloat(sellAmount) <= 0 && sellAmount !== "" && (
                      <p id="sell-amount-error" className="text-xs text-[#ff00aa] mt-1">Amount must be greater than 0</p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm text-[#00ffaa] mb-1" htmlFor="sell-price">
                      Price per Unit (UFOS) <div title="Price per unit in UFOS" className="inline"><Info className="inline w-4 h-4 text-[#00ffaa] cypherpunk-icon-glow" /></div>
                    </label>
                    <Input
                      id="sell-price"
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      min="0"
                      disabled={!walletConnected || isSubmitting}
                      className={`w-full bg-[#2a2a2a] text-[#00ffaa] cypherpunk-border rounded-lg focus:ring-2 focus:ring-[#ff00aa] glow-hover ${parseFloat(sellPrice) <= 0 && sellPrice !== "" ? "border-[#ff00aa]" : ""}`}
                      placeholder="Enter price"
                      aria-describedby="sell-price-error"
                    />
                    {parseFloat(sellPrice) <= 0 && sellPrice !== "" && (
                      <p id="sell-price-error" className="text-xs text-[#ff00aa] mt-1">Price must be greater than 0</p>
                    )}
                  </div>
                  <Button
                    onClick={createSellOrder}
                    disabled={!walletConnected || isSubmitting}
                    className="cypherpunk-button cypherpunk-button-red text-white rounded-lg px-6 py-3 glow-hover"
                    aria-label="Place sell order"
                  >
                    Place Sell Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
<div className="fade-in">
<div className="fade-in">
  <h3 className="text-xl font-medium text-[#00ffaa] mb-4 glitch-pulse">Open Orders</h3>
  <Tabs defaultValue="sell" className="w-full">
    <TabsList className="cypherpunk-tabs-list grid w-full grid-cols-2 mb-4 gap-2">
      <TabsTrigger value="sell" className="cypherpunk-tab-button">Sell Orders</TabsTrigger>
      <TabsTrigger value="buy" className="cypherpunk-tab-button">Buy Orders</TabsTrigger>
    </TabsList>
    <TabsContent value="sell">
      <div className="scroll-container bg-[#2a2a2a]/30 rounded-lg cypherpunk-border glow-hover" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
        <div className="space-y-4 p-4">
          {orders
            .filter((order) => order.resource === activeResource && order.type === "sell")
            .sort((a, b) => a.pricePerUnit - b.pricePerUnit)
            .map((order) => (
              <div
                key={order.id}
                className="order-card bg-[#2a2a2a]/30 p-4 rounded-lg cypherpunk-border"
              >
                <div className="space-y-2">
                  <p className="text-white text-sm">
                    <span className="font-medium">Amount:</span> {order.amount.toLocaleString()}
                  </p>
                  <p className="text-white text-sm">
                    <span className="font-medium">Price:</span> {order.pricePerUnit} UFOS
                  </p>
                  <p className="text-white text-sm">
                    <span className="font-medium">Total:</span> {(order.amount * order.pricePerUnit).toLocaleString()} UFOS
                  </p>
                  <div className="pt-2">
                    {order.wallet === currentWalletAddress ? (
                      <Button
                        onClick={() => cancelOrder(order)}
                        disabled={isSubmitting}
                        className="cypherpunk-button cypherpunk-button-red w-full text-sm py-2"
                        aria-label={`Cancel sell order for ${order.amount} ${order.resource}`}
                      >
                        Cancel
                      </Button>
                    ) : (
<Button
  size="sm"
  onClick={() => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }}
  disabled={isSubmitting}
  className="cypherpunk-button cypherpunk-button-blue w-full text-sm py-2"
  aria-label={`Buy ${order.amount} ${order.resource}`}
>
  Buy Now
</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {orders.filter((order) => order.resource === activeResource && order.type === "sell").length === 0 && (
            <p className="text-center text-[#00ffaa] text-sm py-4">No sell orders available</p>
          )}
        </div>
      </div>
    </TabsContent>
    <TabsContent value="buy">
      <div className="scroll-container bg-[#2a2a2a]/30 rounded-lg cypherpunk-border glow-hover" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
        <div className="space-y-4 p-4">
          {orders
            .filter((order) => order.resource === activeResource && order.type === "buy")
            .sort((a, b) => b.pricePerUnit - a.pricePerUnit)
            .map((order) => (
              <div
                key={order.id}
                className="order-card bg-[#2a2a2a]/30 p-4 rounded-lg cypherpunk-border"
              >
                <div className="space-y-2">
                  <p className="text-white text-sm">
                    <span className="font-medium">Amount:</span> {order.amount.toLocaleString()}
                  </p>
                  <p className="text-white text-sm">
                    <span className="font-medium">Price:</span> {order.pricePerUnit} UFOS
                  </p>
                  <p className="text-white text-sm">
                    <span className="font-medium">Total:</span> {(order.amount * order.pricePerUnit).toLocaleString()} UFOS
                  </p>
                  <div className="pt-2">
                    {order.wallet === currentWalletAddress ? (
                      <Button
                        onClick={() => cancelOrder(order)}
                        disabled={isSubmitting}
                        className="cypherpunk-button cypherpunk-button-red w-full text-sm py-2"
                        aria-label={`Cancel buy order for ${order.amount} ${order.resource}`}
                      >
                        Cancel
                      </Button>
                    ) : (
<Button
  size="sm"
  onClick={() => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }}
  disabled={isSubmitting}
  className="cypherpunk-button cypherpunk-button-blue w-full text-sm py-2"
  aria-label={`Buy ${order.amount} ${order.resource}`}
>
  Sell Now
</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {orders.filter((order) => order.resource === activeResource && order.type === "buy").length === 0 && (
            <p className="text-center text-[#00ffaa] text-sm py-4">No buy orders available</p>
          )}
        </div>
      </div>
    </TabsContent>
  </Tabs>
</div>
</div>
          {walletConnected && (
            <MatchedOrders
              marketLogs={marketLogs}
              currentWalletAddress={currentWalletAddress}
            />
          )}
        </CardContent>
<ConfirmationModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  onConfirm={handleConfirmTrade}
  totalUfos={selectedOrder ? selectedOrder.amount * selectedOrder.pricePerUnit : 0}
  resource={resources.find((r) => r.key === selectedOrder?.resource)?.name || selectedOrder?.resource || ""}
  amount={selectedOrder?.amount || 0}
/>
      </Card>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default function MarketPage() {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MarketPageContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );

}
