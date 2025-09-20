const { onRequest, setGlobalOptions } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2/logger"); // Add v2 logger
const admin = require("firebase-admin");
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { sha256 } = require("js-sha256");
const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Solana Configuration
const NETWORK = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const connection = new Connection(NETWORK, "confirmed");
const PROGRAM_ID = new PublicKey("CzQLNvYoi8E9ymB6LPC9M9EX9H1hRavvFMAguRqSeRmb");
const RECIPIENT_ADDRESS = new PublicKey("5qFEDDbxE1qdgpGooZnimt9Snxt1pntuuygywF1fQXoe");
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb";

// Express app for rate limiting
const app = express();
app.use(express.json());

// Rate limiting middleware to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
app.use(limiter);

// Building and Fabricator Configurations
const buildingConfig = {
  CrystalMine: { requirements: { halite: 10, co2: 20, fullPowerCell: 1 }, cycleHours: 6, output: { crystalOre: 200 }, name: "Crystal Mine" },
  CrystalRefinery: { requirements: { crystalOre: 1000, fullPowerCell: 1 }, cycleHours: 8, output: { rareEarths: 20 }, name: "Crystal Refinery" },
  GemProcessor: { requirements: { rareEarths: 50, fullPowerCell: 1 }, cycleHours: 10, output: { processedGems: 10 }, name: "Gem Processor" },
  CrystalSynthesizer: { requirements: { processedGems: 10, rareEarths: 20, fullPowerCell: 2 }, cycleHours: 12, output: { exoticCrystals: 5 }, name: "Crystal Synthesizer" },
  AdvancedFilter: { requirements: { ice: 1000, fullPowerCell: 1 }, cycleHours: 6, output: { purifiedWater: 50 }, name: "Advanced Filter" },
  PlasmaReactor: { requirements: { purifiedWater: 100, fullPowerCell: 1 }, cycleHours: 8, output: { plasmaFluid: 20 }, name: "Plasma Reactor" },
  HydrogenExtractor: { requirements: { purifiedWater: 100, fullPowerCell: 1 }, cycleHours: 10, output: { hydrogenFuel: 10 }, name: "Hydrogen Extractor" },
  FusionPlant: { requirements: { hydrogenFuel: 20, fullPowerCell: 2 }, cycleHours: 12, output: { fusionFluid: 5 }, name: "Fusion Plant" },
  QuantumFoundry: { requirements: { co2: 100, halite: 10, fullPowerCell: 1 }, cycleHours: 6, output: { quantumCells: 50 }, name: "Quantum Foundry" },
  CoreReactor: { requirements: { quantumCells: 100, fullPowerCell: 1 }, cycleHours: 8, output: { energyCores: 20 }, name: "Core Reactor" },
  PlasmaCoreFabricator: { requirements: { energyCores: 20, quantumCells: 50, fullPowerCell: 1 }, cycleHours: 10, output: { plasmaCores: 10 }, name: "Plasma Core Fabricator" },
  AntimatterGenerator: { requirements: { plasmaCores: 10, energyCores: 10, fullPowerCell: 2 }, cycleHours: 12, output: { antimatterCells: 5 }, name: "Antimatter Generator" },
  BiopolymerGreenhouse: { requirements: { water: 50, co2: 20, fullPowerCell: 1 }, cycleHours: 6, output: { biofiber: 50 }, name: "Biopolymer Greenhouse" },
  MyceliumExtractor: { requirements: { biofiber: 100, fullPowerCell: 1 }, cycleHours: 8, output: { sporeEssence: 20 }, name: "Mycelium Extractor" },
  BioPolymerSynthesizer: { requirements: { sporeEssence: 20, biofiber: 50, fullPowerCell: 1 }, cycleHours: 10, output: { bioPolymers: 10 }, name: "Bio Polymer Synthesizer" },
  NanoOrganicLab: { requirements: { bioPolymers: 10, sporeEssence: 20, fullPowerCell: 2 }, cycleHours: 12, output: { nanoOrganics: 5 }, name: "Nano Organic Lab" },
  SmeltingForge: { requirements: { halite: 50, co2: 20, fullPowerCell: 1 }, cycleHours: 6, output: { alloyIngots: 50 }, name: "Smelting Forge" },
  Nanoforge: { requirements: { alloyIngots: 100, fullPowerCell: 1 }, cycleHours: 8, output: { nanosteel: 20 }, name: "Nanoforge" },
  SuperAlloyForge: { requirements: { nanosteel: 20, alloyIngots: 50, fullPowerCell: 1 }, cycleHours: 10, output: { superAlloys: 10 }, name: "Super Alloy Forge" },
  MetaMaterialSynthesizer: { requirements: { superAlloys: 10, nanosteel: 20, fullPowerCell: 2 }, cycleHours: 12, output: { metaMaterials: 5 }, name: "Meta Material Synthesizer" },
  ChemicalSynthesizer: { requirements: { water: 50, co2: 20, fullPowerCell: 1 }, cycleHours: 6, output: { catalysts: 50 }, name: "Chemical Synthesizer" },
  PolymerizationPlant: { requirements: { catalysts: 100, fullPowerCell: 1 }, cycleHours: 8, output: { polymers: 20 }, name: "Polymerization Plant" },
  NanoCatalystLab: { requirements: { polymers: 20, catalysts: 50, fullPowerCell: 1 }, cycleHours: 10, output: { nanoCatalysts: 10 }, name: "Nano Catalyst Lab" },
  QuantumChemSynthesizer: { requirements: { nanoCatalysts: 10, polymers: 20, fullPowerCell: 2 }, cycleHours: 12, output: { quantumChemicals: 5 }, name: "Quantum Chem Synthesizer" },
  AssemblyWorkshop: { requirements: { halite: 50, water: 20, fullPowerCell: 1 }, cycleHours: 6, output: { spareParts: 50 }, name: "Assembly Workshop" },
  ElectronicsFabricator: { requirements: { spareParts: 100, fullPowerCell: 1 }, cycleHours: 8, output: { circuitBoards: 20 }, name: "Electronics Fabricator" },
  ComponentFabricator: { requirements: { circuitBoards: 20, spareParts: 50, fullPowerCell: 1 }, cycleHours: 10, output: { advancedComponents: 10 }, name: "Component Fabricator" },
  RoboticsAssembler: { requirements: { advancedComponents: 10, circuitBoards: 20, fullPowerCell: 2 }, cycleHours: 12, output: { roboticModules: 5 }, name: "Robotics Assembler" },
  CommerceHub: { requirements: { fullPowerCell: 1, ufos: 1000 }, cycleHours: 6, output: { tradeContracts: 20 }, name: "Commerce Hub" },
  TokenMinter: { requirements: { tradeContracts: 20, fullPowerCell: 1 }, cycleHours: 8, output: { marketTokens: 10 }, name: "Token Minter" },
  CryptoExchange: { requirements: { marketTokens: 10, tradeContracts: 20, fullPowerCell: 1 }, cycleHours: 10, output: { cryptoCredits: 10 }, name: "Crypto Exchange" },
  BondIssuer: { requirements: { cryptoCredits: 10, marketTokens: 10, fullPowerCell: 2 }, cycleHours: 12, output: { galacticBonds: 5 }, name: "Bond Issuer" },
  InterstellarFabricator: { requirements: {}, cycleHours: 0, output: {}, name: "Interstellar Fabricator" },
};

const fabricatorProducts = {
  IonThruster: { requirements: { plasmaFluid: 10, metaMaterials: 5, advancedComponents: 10, fullPowerCell: 1 }, cycleHours: 16, output: { ionThruster: 1 }, name: "Ion Thruster" },
  SolarPanel: { requirements: { quantumCells: 50, alloyIngots: 200, circuitBoards: 20, fullPowerCell: 1 }, cycleHours: 12, output: { solarPanel: 1 }, name: "Solar Panel" },
  LifeSupportModule: { requirements: { purifiedWater: 20, bioPolymers: 10, catalysts: 50, fullPowerCell: 1 }, cycleHours: 14, output: { lifeSupportModule: 1 }, name: "Life Support Module" },
  TradeBeacon: { requirements: { galacticBonds: 5, processedGems: 10, roboticModules: 5, fullPowerCell: 1 }, cycleHours: 14, output: { tradeBeacon: 1 }, name: "Trade Beacon" },
  HydroCore: { requirements: { fusionFluid: 5, superAlloys: 10, energyCores: 20, fullPowerCell: 2 }, cycleHours: 16, output: { hydroCore: 1 }, name: "Hydro Core" },
  BioCircuit: { requirements: { nanoOrganics: 5, bioPolymers: 10, plasmaCores: 5, circuitBoards: 20, fullPowerCell: 2 }, cycleHours: 18, output: { bioCircuit: 1 }, name: "Bio Circuit" },
  BioReactorCore: { requirements: { bioPolymers: 10, hydrogenFuel: 10, advancedComponents: 10, fullPowerCell: 1 }, cycleHours: 14, output: { bioReactorCore: 1 }, name: "Bio-Reactor Core" },
  HoloProjector: { requirements: { processedGems: 10, plasmaCores: 5, cryptoCredits: 10, fullPowerCell: 1 }, cycleHours: 16, output: { holoProjector: 1 }, name: "Holo-Projector" },
  NanoAssembler: { requirements: { roboticModules: 10, advancedComponents: 20, metaMaterials: 5, quantumChemicals: 5, fullPowerCell: 2 }, cycleHours: 20, output: { nanoAssembler: 1 }, name: "Nano Assembler" },
  CrystalMatrix: { requirements: { exoticCrystals: 5, antimatterCells: 3, nanoCatalysts: 10, fullPowerCell: 2 }, cycleHours: 22, output: { crystalMatrix: 1 }, name: "Crystal Matrix" },
  NeuralInterface: { requirements: { nanoOrganics: 5, quantumChemicals: 5, roboticModules: 10, fullPowerCell: 2 }, cycleHours: 18, output: { neuralInterface: 1 }, name: "Neural Interface" },
  GravitonShield: { requirements: { exoticCrystals: 10, fusionFluid: 5, metaMaterials: 5, fullPowerCell: 2 }, cycleHours: 20, output: { gravitonShield: 1 }, name: "Graviton Shield" },
  AntimatterWarhead: { requirements: { antimatterCells: 3, superAlloys: 10, galacticBonds: 5, fullPowerCell: 2 }, cycleHours: 22, output: { antimatterWarhead: 1 }, name: "Antimatter Warhead" },
  QuantumDrive: { requirements: { exoticCrystals: 10, fusionFluid: 5, antimatterCells: 3, nanoOrganics: 10, metaMaterials: 5, quantumChemicals: 5, roboticModules: 5, galacticBonds: 5, fullPowerCell: 2 }, cycleHours: 24, output: { quantumDrive: 1 }, name: "Quantum Drive" },
};

const marketResources = [
  { key: "emptyPowerCell", buyPrice: 50 },
  { key: "fullPowerCell", sellPrice: 100 },
  { key: "ionThruster", sellPrice: 1000 },
  { key: "solarPanel", sellPrice: 2500 },
  { key: "lifeSupportModule", sellPrice: 5000 },
  { key: "tradeBeacon", sellPrice: 5000 },
  { key: "hydroCore", sellPrice: 5500 },
  { key: "bioCircuit", sellPrice: 6000 },
  { key: "bioReactorCore", sellPrice: 6500 },
  { key: "holoProjector", sellPrice: 7000 },
  { key: "nanoAssembler", sellPrice: 7500 },
  { key: "crystalMatrix", sellPrice: 8000 },
  { key: "neuralInterface", sellPrice: 8500 },
  { key: "gravitonShield", sellPrice: 9000 },
  { key: "antimatterWarhead", sellPrice: 9500 },
  { key: "quantumDrive", sellPrice: 10000 },
];

const VALID_PROFESSIONS = [
  "Geologist",
  "HydroEngineer",
  "PowerTechnician",
  "Botanist",
  "Metallurgist",
  "Chemist",
  "Mechanic",
  "Trader",
];

const buildingProfessionMap = {
  CrystalMine: "Geologist",
  CrystalRefinery: "Geologist",
  GemProcessor: "Geologist",
  CrystalSynthesizer: "Geologist",
  AdvancedFilter: "HydroEngineer",
  PlasmaReactor: "HydroEngineer",
  HydrogenExtractor: "HydroEngineer",
  FusionPlant: "HydroEngineer",
  QuantumFoundry: "PowerTechnician",
  CoreReactor: "PowerTechnician",
  PlasmaCoreFabricator: "PowerTechnician",
  AntimatterGenerator: "PowerTechnician",
  BiopolymerGreenhouse: "Botanist",
  MyceliumExtractor: "Botanist",
  BioPolymerSynthesizer: "Botanist",
  NanoOrganicLab: "Botanist",
  SmeltingForge: "Metallurgist",
  Nanoforge: "Metallurgist",
  SuperAlloyForge: "Metallurgist",
  MetaMaterialSynthesizer: "Metallurgist",
  ChemicalSynthesizer: "Chemist",
  PolymerizationPlant: "Chemist",
  NanoCatalystLab: "Chemist",
  QuantumChemSynthesizer: "Chemist",
  AssemblyWorkshop: "Mechanic",
  ElectronicsFabricator: "Mechanic",
  ComponentFabricator: "Mechanic",
  RoboticsAssembler: "Mechanic",
  CommerceHub: "Trader",
  TokenMinter: "Trader",
  CryptoExchange: "Trader",
  BondIssuer: "Trader",
  InterstellarFabricator: "All",
};

// Helper Functions
const getPowerCellSlots = (nftCount) => {
  if (nftCount >= 1000) return 33;
  if (nftCount >= 950) return 32;
  if (nftCount >= 900) return 31;
  if (nftCount >= 850) return 30;
  if (nftCount >= 800) return 29;
  if (nftCount >= 750) return 28;
  if (nftCount >= 700) return 27;
  if (nftCount >= 650) return 26;
  if (nftCount >= 600) return 25;
  if (nftCount >= 550) return 24;
  if (nftCount >= 500) return 23;
  if (nftCount >= 450) return 22;
  if (nftCount >= 400) return 21;
  if (nftCount >= 350) return 20;
  if (nftCount >= 300) return 19;
  if (nftCount >= 250) return 18;
  if (nftCount >= 200) return 17;
  if (nftCount >= 150) return 16;
  if (nftCount >= 140) return 15;
  if (nftCount >= 130) return 14;
  if (nftCount >= 120) return 13;
  if (nftCount >= 110) return 12;
  if (nftCount >= 100) return 11;
  if (nftCount >= 90) return 10;
  if (nftCount >= 80) return 9;
  if (nftCount >= 70) return 8;
  if (nftCount >= 60) return 7;
  if (nftCount >= 50) return 6;
  if (nftCount >= 40) return 5;
  if (nftCount >= 30) return 4;
  if (nftCount >= 20) return 3;
  if (nftCount >= 10) return 2;
  return 1;
};

const determineUserTier = (nftCount) => {
  if (nftCount >= 1000) return 32;
  if (nftCount >= 950) return 31;
  if (nftCount >= 900) return 30;
  if (nftCount >= 850) return 29;
  if (nftCount >= 800) return 28;
  if (nftCount >= 750) return 27;
  if (nftCount >= 700) return 26;
  if (nftCount >= 650) return 25;
  if (nftCount >= 600) return 24;
  if (nftCount >= 550) return 23;
  if (nftCount >= 500) return 22;
  if (nftCount >= 450) return 21;
  if (nftCount >= 400) return 20;
  if (nftCount >= 350) return 19;
  if (nftCount >= 300) return 18;
  if (nftCount >= 250) return 17;
  if (nftCount >= 200) return 16;
  if (nftCount >= 150) return 15;
  if (nftCount >= 140) return 14;
  if (nftCount >= 130) return 13;
  if (nftCount >= 120) return 12;
  if (nftCount >= 110) return 11;
  if (nftCount >= 100) return 10;
  if (nftCount >= 90) return 9;
  if (nftCount >= 80) return 8;
  if (nftCount >= 70) return 7;
  if (nftCount >= 60) return 6;
  if (nftCount >= 50) return 5;
  if (nftCount >= 40) return 4;
  if (nftCount >= 30) return 3;
  if (nftCount >= 20) return 2;
  if (nftCount >= 10) return 1;
  return 0;
};

const verifySignature = async (publicKey, signature, message) => {
  try {
    const publicKeyObj = new PublicKey(publicKey);
    const signatureBuffer = Buffer.from(signature, "base64");
    const messageBuffer = Buffer.from(message);
    // Placeholder for signature verification (requires client-side signing)
    // Use nacl.sign.detached.verify in production
    return true; // Mocked for now
  } catch (error) {
     logger.error("Signature verification failed:", error);
    return false;
  }
};

const getUserDocRef = async (wallet) => {
  const q = db.collection("UFOSperWallet").where("Wallet", "==", wallet);
  const querySnapshot = await q.get();
  if (querySnapshot.empty) {
    throw new Error("User not found");
  }
  return querySnapshot.docs[0].ref;
};

// Initialize User
app.post("/initializeUser", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "initializeUser"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const nftCount = await fetchAssetsByGroup(wallet);
    const slotCount = getPowerCellSlots(nftCount);
    const initialSlots = Array.from({ length: slotCount }, (_, i) => ({
      id: i,
      isCharging: false,
      isClaimable: false,
      timeStamp: null,
      progress: 0,
    }));

    const userData = {
      Wallet: wallet,
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
      Professions: {
        Geologist: { level: 0, efficiencyBonus: 0 },
        HydroEngineer: { level: 0, efficiencyBonus: 0 },
        PowerTechnician: { level: 0, efficiencyBonus: 0 },
        Botanist: { level: 0, efficiencyBonus: 0 },
        Metallurgist: { level: 0, efficiencyBonus: 0 },
        Chemist: { level: 0, efficiencyBonus: 0 },
        Mechanic: { level: 0, efficiencyBonus: 0 },
        Trader: { level: 0, efficiencyBonus: 0 },
      },
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
    };

    await db.collection("UFOSperWallet").add({
      ...userData,
      LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send({ message: "User initialized", userData });
  } catch (error) {
     logger.error("Initialize user error:", error);
    res.status(500).send({ error: "Failed to initialize user" });
  }
});

// Fetch NFT Count
async function fetchAssetsByGroup(wallet) {
  try {
    let page = 1;
    let ownedNFTs = 0;

    while (page) {
      const response = await fetch(NETWORK, {
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
            limit: 1000,
          },
        }),
      });

      const { result } = await response.json();
      if (result && result.items) {
        ownedNFTs += result.items.filter(
          (item) => item.ownership.owner === wallet && (item.burnt === false || item.burnt === undefined)
        ).length;
      }
      page = result.total === 1000 ? page + 1 : null;
    }
    return ownedNFTs;
  } catch (error) {
     logger.error("Fetch assets error:", error);
    return 0;
  }
}

// Start Scavenger
app.post("/startScavenger", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "startScavenger"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ScavengerWorking > 0) throw new Error("Scavenger already working");
      if (userData.FullPowerCell < 1) throw new Error("Insufficient full power cells");

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell - 1,
        ScavengerWorking: 1,
        TimeStampScavenger: admin.firestore.FieldValue.serverTimestamp(),
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Scavenger started" });
  } catch (error) {
     logger.error("Start scavenger error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Scavenger Results
app.post("/claimScavenger", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimScavenger"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ScavengerWorkingEnd < 1) throw new Error("Nothing to claim");
      if (userData.TimeStampScavenger) {
        const elapsedSeconds = (Date.now() - userData.TimeStampScavenger.toDate().getTime()) / 1000;
        if (elapsedSeconds < 6 * 60 * 60) throw new Error("Scavenger not complete");
      }

      const profession = userData.ActiveProfession;
      const bonus = profession && userData.Professions[profession]?.efficiencyBonus || 0;
      const nftBonus = await getNFTBonus(userData.SelectedNFT, wallet);
      const totalBonus = bonus + nftBonus;

      const iceFound = Math.floor(Math.random() * 200) + 200;
      const iceFoundBonus = Math.floor(iceFound * (1 + totalBonus));
      const ufosFound = Math.floor(Math.random() * 90) + 100;
      const haliteGained = Math.floor(Math.random() * 2) + 2;
      const haliteGainedBonus = Math.floor(haliteGained * (1 + totalBonus));
      const brokenPowerCellFound = Math.random() < 0.5 ? 1 : 0;
      const emptyPowerCellFound = brokenPowerCellFound === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

      transaction.update(userDocRef, {
        ScavengerWorkingEnd: 0,
        Ice: userData.Ice + iceFoundBonus,
        UFOS: userData.UFOS + ufosFound,
        Halite: userData.Halite + haliteGainedBonus,
        EmptyPowerCell: userData.EmptyPowerCell + emptyPowerCellFound,
        BrokenPowerCell: userData.BrokenPowerCell + brokenPowerCellFound,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 64, transaction);
      }
    });
    res.status(200).send({ message: "Scavenger rewards claimed" });
  } catch (error) {
     logger.error("Claim scavenger error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Start CAD
app.post("/startCad", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "startCad"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.cadWorking > 0) throw new Error("CAD already working");
      if (userData.FullPowerCell < 1) throw new Error("Insufficient full power cells");

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell - 1,
        cadWorking: 1,
        TimeStampCad: admin.firestore.FieldValue.serverTimestamp(),
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "CAD started" });
  } catch (error) {
     logger.error("Start CAD error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim CAD Results
app.post("/claimCad", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimCad"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.cadWorkingEnd < 1) throw new Error("Nothing to claim");
      if (userData.TimeStampCad) {
        const elapsedSeconds = (Date.now() - userData.TimeStampCad.toDate().getTime()) / 1000;
        if (elapsedSeconds < 6 * 60 * 60) throw new Error("CAD not complete");
      }

      const profession = userData.ActiveProfession;
      const bonus = profession && userData.Professions[profession]?.efficiencyBonus || 0;
      const nftBonus = await getNFTBonus(userData.SelectedNFT, wallet);
      const totalBonus = bonus + nftBonus;

      const co2Found = Math.floor(Math.random() * 10) + 3;
      const co2FoundBonus = Math.floor(co2Found * (1 + totalBonus));
      const ufosFound = Math.floor(Math.random() * 90) + 100;
      const brokenPowerCellFound = Math.random() < 0.5 ? 1 : 0;

      transaction.update(userDocRef, {
        cadWorkingEnd: 0,
        co2: userData.co2 + co2FoundBonus,
        UFOS: userData.UFOS + ufosFound,
        BrokenPowerCell: userData.BrokenPowerCell + brokenPowerCellFound,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 64, transaction);
      }
    });
    res.status(200).send({ message: "CAD rewards claimed" });
  } catch (error) {
     logger.error("Claim CAD error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Start Water Filter
app.post("/startWaterFilter", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "startWaterFilter"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ChargingWaterFilter > 0) throw new Error("Water filter already working");
      if (userData.FullPowerCell < 1 || userData.Ice < 1000) throw new Error("Insufficient resources");

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell - 1,
        Ice: userData.Ice - 1000,
        ChargingWaterFilter: 1,
        TimeStampW: admin.firestore.FieldValue.serverTimestamp(),
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Water filter started" });
  } catch (error) {
     logger.error("Start water filter error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Water Filter Results
app.post("/claimWaterFilter", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimWaterFilter"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ClaimableWater < 1) throw new Error("Nothing to claim");
      if (userData.TimeStampW) {
        const elapsedSeconds = (Date.now() - userData.TimeStampW.toDate().getTime()) / 1000;
        if (elapsedSeconds < 8 * 60 * 60) throw new Error("Water filter not complete");
      }

      const profession = userData.ActiveProfession;
      const bonus = profession && userData.Professions[profession]?.efficiencyBonus || 0;
      const nftBonus = await getNFTBonus(userData.SelectedNFT, wallet);
      const totalBonus = bonus + nftBonus;

      const waterGained = Math.floor(Math.random() * 5) + 1;
      const waterGainedBonus = Math.floor(waterGained * (1 + totalBonus));
      const haliteGained = Math.floor(Math.random() * 2) + 5;
      const haliteGainedBonus = Math.floor(haliteGained * (1 + totalBonus));
      const brokenPowerCellFound = Math.random() < 0.5 ? 1 : 0;
      const emptyPowerCellFound = brokenPowerCellFound === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

      transaction.update(userDocRef, {
        ClaimableWater: 0,
        Water: userData.Water + waterGainedBonus,
        Halite: userData.Halite + haliteGainedBonus,
        EmptyPowerCell: userData.EmptyPowerCell + emptyPowerCellFound,
        BrokenPowerCell: userData.BrokenPowerCell + brokenPowerCellFound,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 64, transaction);
      }
    });
    res.status(200).send({ message: "Water filter rewards claimed" });
  } catch (error) {
     logger.error("Claim water filter error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Start Workshop
app.post("/startWorkshop", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "startWorkshop"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ChargingWorkShop > 0) throw new Error("Workshop already working");
      if (userData.FullPowerCell < 1 || userData.BrokenPowerCell < 10 || userData.Water < 5 || userData.Halite < 1) {
        throw new Error("Insufficient resources");
      }

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell - 1,
        BrokenPowerCell: userData.BrokenPowerCell - 10,
        Water: userData.Water - 5,
        Halite: userData.Halite - 1,
        ChargingWorkShop: 1,
        TimeStampS: admin.firestore.FieldValue.serverTimestamp(),
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Workshop started" });
  } catch (error) {
     logger.error("Start workshop error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Workshop Results
app.post("/claimWorkshop", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimWorkshop"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ClaimableEmptyPowerCell < 1) throw new Error("Nothing to claim");
      if (userData.TimeStampS) {
        const elapsedSeconds = (Date.now() - userData.TimeStampS.toDate().getTime()) / 1000;
        if (elapsedSeconds < 10 * 60 * 60) throw new Error("Workshop not complete");
      }

      const brokenPowerCellFound = Math.random() < 0.5 ? 1 : 0;
      const emptyPowerCellFound = brokenPowerCellFound === 1 ? 0 : Math.random() < 0.5 ? 1 : 0;

      transaction.update(userDocRef, {
        ClaimableEmptyPowerCell: 0,
        EmptyPowerCell: userData.EmptyPowerCell + emptyPowerCellFound,
        BrokenPowerCell: userData.BrokenPowerCell + brokenPowerCellFound,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 64, transaction);
      }
    });
    res.status(200).send({ message: "Workshop rewards claimed" });
  } catch (error) {
     logger.error("Claim workshop error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Start Power Cell Charging
app.post("/startPowerCellCharging", async (req, res) => {
  const { wallet, signature, slotId } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !Number.isInteger(slotId)) {
    return res.status(400).send({ error: "Invalid wallet or slot ID" });
  }
  if (!(await verifySignature(wallet, signature, `startPowerCellCharging_${slotId}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const slot = userData.PowerCellSlots.find((s) => s.id === slotId);
      if (!slot) throw new Error("Invalid slot ID");
      if (slot.isCharging || slot.isClaimable) throw new Error("Slot is already in use");
      if (userData.EmptyPowerCell < 1) throw new Error("Insufficient empty power cells");

      const updatedSlots = userData.PowerCellSlots.map((s) =>
        s.id === slotId ? { ...s, isCharging: true, isClaimable: false, timeStamp: admin.firestore.FieldValue.serverTimestamp(), progress: 0 } : s
      );

      transaction.update(userDocRef, {
        EmptyPowerCell: userData.EmptyPowerCell - 1,
        PowerCellSlots: updatedSlots,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: `Power cell charging started in slot ${slotId}` });
  } catch (error) {
     logger.error("Start power cell charging error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Power Cell
app.post("/claimPowerCell", async (req, res) => {
  const { wallet, signature, slotId } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !Number.isInteger(slotId)) {
    return res.status(400).send({ error: "Invalid wallet or slot ID" });
  }
  if (!(await verifySignature(wallet, signature, `claimPowerCell_${slotId}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const slot = userData.PowerCellSlots.find((s) => s.id === slotId);
      if (!slot || !slot.isClaimable) throw new Error("No power cell to claim");
      if (slot.timeStamp) {
        const elapsedSeconds = (Date.now() - slot.timeStamp.toDate().getTime()) / 1000;
        if (elapsedSeconds < 12 * 60 * 60) throw new Error("Power cell not fully charged");
      }

      const updatedSlots = userData.PowerCellSlots.map((s) =>
        s.id === slotId ? { ...s, isCharging: false, isClaimable: false, timeStamp: null, progress: 0 } : s
      );

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell + 1,
        ClaimableFullPowerCell: userData.ClaimableFullPowerCell - 1,
        PowerCellSlots: updatedSlots,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 32, transaction);
      }
    });
    res.status(200).send({ message: `Power cell claimed from slot ${slotId}` });
  } catch (error) {
     logger.error("Claim power cell error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim All Power Cells
app.post("/claimAllPowerCells", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimAllPowerCells"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const claimableSlots = userData.PowerCellSlots.filter((slot) => slot.isClaimable);
      if (claimableSlots.length === 0) throw new Error("No power cells to claim");

      const updatedSlots = userData.PowerCellSlots.map((slot) =>
        slot.isClaimable ? { ...slot, isCharging: false, isClaimable: false, timeStamp: null, progress: 0 } : slot
      );

      transaction.update(userDocRef, {
        FullPowerCell: userData.FullPowerCell + claimableSlots.length,
        ClaimableFullPowerCell: userData.ClaimableFullPowerCell - claimableSlots.length,
        PowerCellSlots: updatedSlots,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 32 * claimableSlots.length, transaction);
      }
    });
    res.status(200).send({ message: "All power cells claimed" });
  } catch (error) {
     logger.error("Claim all power cells error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Start Building Production
app.post("/startBuildingProduction", async (req, res) => {
  const { wallet, signature, building, product } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !building || (building === "InterstellarFabricator" && !product)) {
    return res.status(400).send({ error: "Invalid wallet, building, or product" });
  }
  if (!(await verifySignature(wallet, signature, `startBuildingProduction_${building}_${product || ""}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const requiredProfession = buildingProfessionMap[building];
      if (requiredProfession && requiredProfession !== "All" && userData.ActiveProfession !== requiredProfession) {
        throw new Error(`Only a ${requiredProfession} can operate this building`);
      }
      if (userData.BuildingTimestamps[building]) throw new Error("Production already in progress");

      let config = buildingConfig[building];
      if (building === "InterstellarFabricator") {
        if (!fabricatorProducts[product]) throw new Error("Invalid product");
        config = fabricatorProducts[product];
      }

      for (const [resource, amount] of Object.entries(config.requirements)) {
        if ((userData[resource] || 0) < amount) {
          throw new Error(`Insufficient ${resource}`);
        }
      }

      const updates = {
        BuildingTimestamps: {
          ...userData.BuildingTimestamps,
          [building]: admin.firestore.FieldValue.serverTimestamp(),
        },
        SelectedFabricatorProduct: building === "InterstellarFabricator" ? product : userData.SelectedFabricatorProduct,
        ClaimableFabricatorProduct: building === "InterstellarFabricator" ? product : userData.ClaimableFabricatorProduct,
      };

      for (const [resource, amount] of Object.entries(config.requirements)) {
        updates[resource] = (userData[resource] || 0) - amount;
      }

      transaction.update(userDocRef, {
        ...updates,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Building production started" });
  } catch (error) {
     logger.error("Start building production error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Building Output
app.post("/claimBuildingOutput", async (req, res) => {
  const { wallet, signature, building } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !building) {
    return res.status(400).send({ error: "Invalid wallet or building" });
  }
  if (!(await verifySignature(wallet, signature, `claimBuildingOutput_${building}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (!userData.BuildingClaimables[building]) throw new Error("Nothing to claim");

      let config = buildingConfig[building];
      let selectedProductKey = userData.ClaimableFabricatorProduct;
      if (building === "InterstellarFabricator") {
        if (!selectedProductKey || !fabricatorProducts[selectedProductKey]) {
          selectedProductKey = Object.keys(fabricatorProducts)[0];
        }
        config = fabricatorProducts[selectedProductKey];
      }

      if (userData.BuildingTimestamps[building]) {
        const elapsedSeconds = (Date.now() - userData.BuildingTimestamps[building].toDate().getTime()) / 1000;
        if (elapsedSeconds < config.cycleHours * 60 * 60) throw new Error("Production not complete");
      }

      const profession = userData.ActiveProfession;
      const bonus = profession && userData.Professions[profession]?.efficiencyBonus || 0;
      const buildingLevel = userData.BuildingLevels[building] || 1;
      const levelBonus = (buildingLevel - 1) * 0.1;
      const nftBonus = await getNFTBonus(userData.SelectedNFT, wallet);
      const totalBonus = bonus + levelBonus + nftBonus;

      const output = {};
      for (const [resource, amount] of Object.entries(config.output)) {
        output[resource] = Math.floor(amount * (1 + totalBonus));
      }

      const updates = {
        BuildingTimestamps: { ...userData.BuildingTimestamps, [building]: null },
        BuildingClaimables: { ...userData.BuildingClaimables, [building]: 0 },
        SelectedFabricatorProduct: building === "InterstellarFabricator" ? null : userData.SelectedFabricatorProduct,
        ClaimableFabricatorProduct: building === "InterstellarFabricator" ? null : userData.ClaimableFabricatorProduct,
      };

      for (const [resource, amount] of Object.entries(output)) {
        updates[resource] = (userData[resource] || 0) + amount;
      }

      transaction.update(userDocRef, {
        ...updates,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 128, transaction);
      }
    });
    res.status(200).send({ message: "Building output claimed" });
  } catch (error) {
     logger.error("Claim building output error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Buy Resource
app.post("/buyResource", async (req, res) => {
  const { wallet, signature, resourceKey, quantity } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !resourceKey || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).send({ error: "Invalid wallet, resource, or quantity" });
  }
  if (!(await verifySignature(wallet, signature, `buyResource_${resourceKey}_${quantity}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const resource = marketResources.find((r) => r.key === resourceKey);
    if (!resource || !resource.buyPrice) throw new Error("Resource not available for purchase");

    const totalCost = quantity * resource.buyPrice;
    const userDocRef = await getUserDocRef(wallet);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.UFOS < totalCost) throw new Error("Insufficient UFOS");

      transaction.update(userDocRef, {
        UFOS: userData.UFOS - totalCost,
        [resourceKey]: (userData[resourceKey] || 0) + quantity,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Resource purchased" });
  } catch (error) {
     logger.error("Buy resource error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Sell Resource
app.post("/sellResource", async (req, res) => {
  const { wallet, signature, resourceKey, quantity } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !resourceKey || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).send({ error: "Invalid wallet, resource, or quantity" });
  }
  if (!(await verifySignature(wallet, signature, `sellResource_${resourceKey}_${quantity}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const resource = marketResources.find((r) => r.key === resourceKey);
    if (!resource || !resource.sellPrice) throw new Error("Resource not available for sale");

    const totalEarned = quantity * resource.sellPrice;
    const userDocRef = await getUserDocRef(wallet);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if ((userData[resourceKey] || 0) < quantity) throw new Error(`Insufficient ${resourceKey}`);

      transaction.update(userDocRef, {
        [resourceKey]: (userData[resourceKey] || 0) - quantity,
        UFOS: userData.UFOS + totalEarned,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 32, transaction);
      }
    });
    res.status(200).send({ message: "Resource sold" });
  } catch (error) {
     logger.error("Sell resource error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Claim Daily Reward
app.post("/claimDailyReward", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet)) {
    return res.status(400).send({ error: "Invalid wallet address" });
  }
  if (!(await verifySignature(wallet, signature, "claimDailyReward"))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.TimeStampDailyClaim) {
        const hoursSinceLastClaim = (Date.now() - userData.TimeStampDailyClaim.toDate().getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) throw new Error("Daily reward not available yet");
      }

      const balance = await connection.getBalance(new PublicKey(wallet));
      const transferAmountLamports = 0.0001 * LAMPORTS_PER_SOL;
      if (balance < transferAmountLamports + 10000) {
        throw new Error("Insufficient SOL balance");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet),
          toPubkey: RECIPIENT_ADDRESS,
          lamports: transferAmountLamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(wallet);

      const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString("base64");

      const nftCount = userData.NFTs;
      const streakCount = userData.TimeStampDailyClaim
        ? (Date.now() - userData.TimeStampDailyClaim.toDate().getTime()) / (1000 * 60 * 60 * 24) <= 2
          ? userData.StreakCount + 1
          : 1
        : 1;
      const rewardAmount = nftCount * 100 + streakCount;

      transaction.update(userDocRef, {
        UFOS: userData.UFOS + rewardAmount,
        TimeStampDailyClaim: admin.firestore.FieldValue.serverTimestamp(),
        StreakCount: streakCount,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (userData.SelectedNFT) {
        await addNFTExperience(userData.SelectedNFT, wallet, 256, transaction);
      }

      res.status(200).send({ message: "Daily reward claimed", serializedTx });
    });
  } catch (error) {
     logger.error("Claim daily reward error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Transfer UFOS
app.post("/transferUfos", async (req, res) => {
  const { wallet, signature, recipientWallet, amount } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !recipientWallet || !PublicKey.isOnCurve(recipientWallet) || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).send({ error: "Invalid wallet or amount" });
  }
  if (wallet === recipientWallet) {
    return res.status(400).send({ error: "Cannot transfer to self" });
  }
  if (!(await verifySignature(wallet, signature, `transferUfos_${recipientWallet}_${amount}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const senderDocRef = await getUserDocRef(wallet);
    const recipientDocRef = await getUserDocRef(recipientWallet);

    await db.runTransaction(async (transaction) => {
      const senderDoc = await transaction.get(senderDocRef);
      const recipientDoc = await transaction.get(recipientDocRef);
      if (!senderDoc.exists || !recipientDoc.exists) throw new Error("Sender or recipient not found");

      const senderData = senderDoc.data();
      if (senderData.UFOS < amount) throw new Error("Insufficient UFOS");

      transaction.update(senderDocRef, {
        UFOS: senderData.UFOS - amount,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      const recipientData = recipientDoc.data();
      transaction.update(recipientDocRef, {
        UFOS: recipientData.UFOS + amount,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "UFOS transferred" });
  } catch (error) {
     logger.error("Transfer UFOS error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Change Name
app.post("/changeName", async (req, res) => {
  const { wallet, signature, newName } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !newName || typeof newName !== "string" || newName.trim().length === 0) {
    return res.status(400).send({ error: "Invalid wallet or name" });
  }
  if (!(await verifySignature(wallet, signature, `changeName_${newName}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");

      transaction.update(userDocRef, {
        Name: newName.trim(),
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Name changed" });
  } catch (error) {
     logger.error("Change name error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Select Profession
app.post("/selectProfession", async (req, res) => {
  const { wallet, signature, profession } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !VALID_PROFESSIONS.includes(profession)) {
    return res.status(400).send({ error: "Invalid wallet or profession" });
  }
  if (!(await verifySignature(wallet, signature, `selectProfession_${profession}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ActiveProfession === profession) throw new Error("Profession already selected");
      const resetCost = 10000;
      if (userData.UFOS < resetCost) throw new Error("Insufficient UFOS");

      const updatedProfessions = { ...userData.Professions };
      if (userData.ActiveProfession) {
        updatedProfessions[userData.ActiveProfession] = { level: 0, efficiencyBonus: 0 };
      }

      transaction.update(userDocRef, {
        ActiveProfession: profession,
        Professions: updatedProfessions,
        UFOS: userData.UFOS - resetCost,
        ProfessionSwitchTimestamp: null,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Profession selected" });
  } catch (error) {
     logger.error("Select profession error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Upgrade Profession
app.post("/upgradeProfession", async (req, res) => {
  const { wallet, signature, profession } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !VALID_PROFESSIONS.includes(profession)) {
    return res.status(400).send({ error: "Invalid wallet or profession" });
  }
  if (!(await verifySignature(wallet, signature, `upgradeProfession_${profession}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      if (userData.ActiveProfession !== profession) throw new Error("Can only upgrade active profession");
      const currentLevel = userData.Professions[profession].level;
      if (currentLevel >= 10) throw new Error("Max level reached");

      const costs = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
      const cost = costs[currentLevel];
      if (userData.UFOS < cost) throw new Error("Insufficient UFOS");

      const newLevel = currentLevel + 1;
      const updatedProfessions = {
        ...userData.Professions,
        [profession]: {
          level: newLevel,
          efficiencyBonus: [0, 0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.28, 2.5, 5][newLevel],
        },
      };

      transaction.update(userDocRef, {
        Professions: updatedProfessions,
        UFOS: userData.UFOS - cost,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: "Profession upgraded" });
  } catch (error) {
     logger.error("Upgrade profession error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Add NFT Experience
async function addNFTExperience(nftId, wallet, expToAdd, transaction) {
  if (!nftId) return;

  const docRef = db.collection("CryptoUFOs").doc(nftId);
  const docSnap = await transaction.get(docRef);
  let currentExp = 0;
  let currentLevel = 1;
  let skills = {};
  let totalBonus = 0;
  let traits = {};

  if (docSnap.exists) {
    const data = docSnap.data();
    currentExp = data.EXP || 0;
    currentLevel = data.LEVEL || 1;
    skills = data.Skills || {};
    totalBonus = data.TotalBonus || 0;
    traits = data.Traits || {};
  }

  const newExp = currentExp + expToAdd;
  let newLevel = currentLevel;
  let totalExpRequired = 0;
  for (let i = 1; i <= newLevel; i++) {
    totalExpRequired += i === 1 ? 0 : 32 * Math.pow(2, i - 2);
  }

  while (newExp >= totalExpRequired + 32 * Math.pow(2, newLevel - 1)) {
    newLevel++;
    totalExpRequired += 32 * Math.pow(2, newLevel - 2);
  }

  if (newLevel > currentLevel) {
    totalBonus = await calculateTotalBonus(skills, traits, "Geologist");
  }

  transaction.set(docRef, {
    EXP: newExp,
    LEVEL: newLevel,
    Skills: skills,
    TotalBonus: totalBonus,
    Traits: traits,
    LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function calculateTotalBonus(skills, traits, profession) {
  let totalBonus = Object.values(skills).reduce((sum, skill) => sum + skill.bonus, 0);
  if (traits[profession]) {
    totalBonus += Number(traits[profession]) / 100;
  }
  return totalBonus;
}

async function getNFTBonus(nftId, wallet) {
  if (!nftId) return 0;
  const nftDoc = await db.collection("CryptoUFOs").doc(nftId).get();
  if (!nftDoc.exists) return 0;
  const nftData = nftDoc.data();
  return nftData.TotalBonus || 0;
}

// Upgrade Building
app.post("/upgradeBuilding", async (req, res) => {
  const { wallet, signature, building } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !building || !buildingConfig[building]) {
    return res.status(400).send({ error: "Invalid wallet or building" });
  }
  if (!(await verifySignature(wallet, signature, `upgradeBuilding_${building}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const requiredProfession = buildingProfessionMap[building];
      if (requiredProfession && requiredProfession !== "All" && userData.ActiveProfession !== requiredProfession) {
        throw new Error(`Only a ${requiredProfession} can upgrade this building`);
      }

      const currentLevel = userData.BuildingLevels[building] || 1;
      if (currentLevel >= 10) throw new Error("Max building level reached");

      const upgradeCost = currentLevel * 1000;
      if (userData.UFOS < upgradeCost) throw new Error(`Insufficient UFOS for upgrade (need ${upgradeCost})`);

      transaction.update(userDocRef, {
        UFOS: userData.UFOS - upgradeCost,
        BuildingLevels: {
          ...userData.BuildingLevels,
          [building]: currentLevel + 1,
        },
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: `Building ${building} upgraded` });
  } catch (error) {
     logger.error("Upgrade building error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Select NFT
app.post("/selectNFT", async (req, res) => {
  const { wallet, signature, nftId } = req.body;
  if (!wallet || !PublicKey.isOnCurve(wallet) || !nftId) {
    return res.status(400).send({ error: "Invalid wallet or NFT ID" });
  }
  if (!(await verifySignature(wallet, signature, `selectNFT_${nftId}`))) {
    return res.status(401).send({ error: "Invalid signature" });
  }

  try {
    const userDocRef = await getUserDocRef(wallet);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      const nftDoc = await db.collection("CryptoUFOs").doc(nftId).get();
      if (!nftDoc.exists) throw new Error("NFT not found");

      transaction.update(userDocRef, {
        SelectedNFT: nftId,
        LastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    res.status(200).send({ message: `NFT ${nftId} selected` });
  } catch (error) {
     logger.error("Select NFT error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Periodic Update for Timestamps
exports.updateTimestamps = functions.pubsub.schedule("every 5 minutes").onRun(async () => {
  try {
    const usersSnapshot = await db.collection("UFOSperWallet").get();
    const now = Date.now();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const updates = {};

      if (userData.ScavengerWorking > 0 && userData.TimeStampScavenger) {
        const elapsedSeconds = (now - userData.TimeStampScavenger.toDate().getTime()) / 1000;
        if (elapsedSeconds >= 6 * 60 * 60) {
          updates.ScavengerWorking = 0;
          updates.ScavengerWorkingEnd = 1;
        }
      }

      if (userData.cadWorking > 0 && userData.TimeStampCad) {
        const elapsedSeconds = (now - userData.TimeStampCad.toDate().getTime()) / 1000;
        if (elapsedSeconds >= 6 * 60 * 60) {
          updates.cadWorking = 0;
                   updates.cadWorkingEnd = 1;
        }
      }

      if (userData.ChargingWaterFilter > 0 && userData.TimeStampW) {
        const elapsedSeconds = (now - userData.TimeStampW.toDate().getTime()) / 1000;
        if (elapsedSeconds >= 8 * 60 * 60) {
          updates.ChargingWaterFilter = 0;
          updates.ClaimableWater = 1;
        }
      }

      if (userData.ChargingWorkShop > 0 && userData.TimeStampS) {
        const elapsedSeconds = (now - userData.TimeStampS.toDate().getTime()) / 1000;
        if (elapsedSeconds >= 10 * 60 * 60) {
          updates.ChargingWorkShop = 0;
          updates.ClaimableEmptyPowerCell = 1;
        }
      }

      if (userData.PowerCellSlots.some((slot) => slot.isCharging)) {
        const updatedSlots = userData.PowerCellSlots.map((slot) => {
          if (slot.isCharging && slot.timeStamp) {
            const elapsedSeconds = (now - slot.timeStamp.toDate().getTime()) / 1000;
            const progress = Math.min((elapsedSeconds / (12 * 60 * 60)) * 100, 100);
            return {
              ...slot,
              progress,
              isClaimable: progress >= 100,
              isCharging: progress < 100,
            };
          }
          return slot;
        });
        updates.PowerCellSlots = updatedSlots;
        updates.ClaimableFullPowerCell = updatedSlots.filter((slot) => slot.isClaimable).length;
      }

      for (const [building, timestamp] of Object.entries(userData.BuildingTimestamps)) {
        if (timestamp) {
          const config = building === "InterstellarFabricator" ? fabricatorProducts[userData.SelectedFabricatorProduct || Object.keys(fabricatorProducts)[0]] : buildingConfig[building];
          if (config) {
            const elapsedSeconds = (now - timestamp.toDate().getTime()) / 1000;
            if (elapsedSeconds >= config.cycleHours * 60 * 60) {
              updates.BuildingClaimables = { ...userData.BuildingClaimables, [building]: 1 };
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await userDoc.ref.update({ ...updates, LastUpdated: admin.firestore.FieldValue.serverTimestamp() });
      }
    }
  } catch (error) {
     logger.error("Update timestamps error:", error);
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);