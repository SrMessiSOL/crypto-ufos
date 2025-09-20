// api/wallet.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { PublicKey } from "@solana/web3.js";

// Firebase configuration (ensure these are stored securely, e.g., in Vercel environment variables)
const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const API_URL = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb";

// Default user data structure
const defaultUserData = {
  wallet: "",
  name: "Player",
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
  selectedNFT: null,
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
  buildingLevels: {},
  buildingTimestamps: {},
  buildingClaimables: {},
  selectedFabricatorProduct: null,
  streakCount: 0,
  claimableFabricatorProduct: null,
};

// Function to determine power cell slots based on NFT count
function getPowerCellSlots(nftCount) {
  if (nftCount >= 1000) return 33;
  if (nftCount >= 950) return 32;
  // ... (rest of the function as in the frontend)
  return 1;
}

// Function to fetch assets by group
async function fetchAssetsByGroup(collectionAddress, publicKey) {
  const cacheKey = `nftCount_${publicKey}_${collectionAddress}`;
  const cachedData = process.env.NODE_ENV === "production" ? null : localStorage.getItem(cacheKey); // LocalStorage not available server-side in production
  const now = Date.now();
  if (cachedData) {
    const { count, timestamp } = JSON.parse(cachedData);
    if (now - timestamp < 3600000) {
      console.log("[fetchAssetsByGroup] Using cached NFT count:", count);
      return count;
    }
  }

  try {
    let page = 1;
    const ownedNFTs = [];

    while (page) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "getAssetsByGroup",
          params: {
            groupKey: "collection",
            groupValue: collectionAddress,
            page: page,
            limit: 1000,
          },
        }),
      });

      const { result } = await response.json();
      if (result && result.items) {
        const ownedAssets = result.items.filter(
          (item) => item.ownership.owner === publicKey && (item.burnt === false || item.burnt === undefined)
        );
        ownedNFTs.push(...ownedAssets);
      }

      if (result.total !== 1000) {
        page = null;
      } else {
        page++;
      }
    }

    // Cache result (in a serverless context, consider using a cache like Redis)
    if (process.env.NODE_ENV !== "production") {
      localStorage.setItem(cacheKey, JSON.stringify({ count: ownedNFTs.length, timestamp: now }));
    }
    return ownedNFTs.length;
  } catch (error) {
    console.error("Error fetching assets by group:", error);
    return 0;
  }
}

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const firestore = getFirestore(app);

// API Handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, walletAddress, signature } = req.body;

  if (!walletAddress || !signature) {
    return res.status(400).json({ error: "Wallet address and signature are required" });
  }

  // Verify signature (simplified; implement proper signature verification)
  try {
    const publicKey = new PublicKey(walletAddress);
    // Add signature verification logic here if needed
  } catch (error) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  try {
    if (action === "connect") {
      // Fetch NFT count
      const nftCount = await fetchAssetsByGroup(COLLECTION_ADDRESS, walletAddress);

      // Query Firestore for user data
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", walletAddress));
      const querySnapshot = await getDocs(q);
      let userData = { ...defaultUserData, wallet: walletAddress };

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        userData = {
          ...defaultUserData,
          wallet: docData.Wallet || walletAddress,
          name: docData.Name || "Player",
          nfts: nftCount,
          ufos: docData.UFOS || 0,
          // ... (map all fields as in handleWalletConnect)
          powerCellSlots: docData.PowerCellSlots?.map((slot) => ({
            ...slot,
            timeStamp: slot.timeStamp ? new Date(slot.timeStamp.seconds * 1000) : null,
          })) || [],
          selectedNFT: docData.SelectedNFT || null,
          activeProfession: docData.ActiveProfession || null,
          professionSwitchTimestamp: docData.ProfessionSwitchTimestamp
            ? new Date(docData.ProfessionSwitchTimestamp.seconds * 1000)
            : null,
          // ... (include other fields)
        };
      } else {
        const slotCount = getPowerCellSlots(nftCount);
        const initialSlots = Array.from({ length: slotCount }, (_, i) => ({
          id: i,
          isCharging: false,
          isClaimable: false,
          timeStamp: null,
          progress: 0,
        }));

        userData = {
          ...defaultUserData,
          wallet: walletAddress,
          nfts: nftCount,
          powerCellSlots: initialSlots,
        };

        await addDoc(collection(firestore, "UFOSperWallet"), {
          ...userData,
          TimeStamp: null,
          TimeStampScavenger: null,
          TimeStampCad: null,
          TimeStampW: null,
          TimeStampS: null,
          TimeStampDailyClaim: null,
          LastUpdated: serverTimestamp(),
        });
      }

      return res.status(200).json({
        success: true,
        message: `Connected wallet: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}. NFTs: ${nftCount}`,
        userData,
      });
    } else if (action === "disconnect") {
      // Clear cache or any server-side session data if applicable
      return res.status(200).json({
        success: true,
        message: "Wallet disconnected successfully",
        userData: defaultUserData,
      });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error(`Error in wallet ${action}:`, error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}