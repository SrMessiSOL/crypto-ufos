"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { Connection, PublicKey, VersionedTransaction, SendTransactionError } from "@solana/web3.js";
import { getAssetWithProof, burn, findLeafAssetIdPda } from "@metaplex-foundation/mpl-bubblegum";
import { dasApi, DasApiInterface } from "@metaplex-foundation/digital-asset-standard-api";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey as umiPublicKey, Umi, Transaction, Signer } from "@metaplex-foundation/umi";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Play, Pause, Volume2, Flame } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "./BurnPage.css"; // Assuming you have a CSS file for styling
import "@solana/wallet-adapter-react-ui/styles.css"; // Required for WalletModalProvider

// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Game assets
const GAME_ASSETS = {
  phantomIcon: "/phantom-icon.png",
  solflareIcon: "https://avatars.githubusercontent.com/u/89903469?s=200&v=4",
  coin: "/Coin_Anim.gif",
  ufoLogo: "/UFO_v3.gif",
};

// Constants
const API_URL = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb";
const SPECIAL_NFT_NUMBERS = [
  9994, 9990, 9991, 9984, 9968, 9928, 9919, 9916, 9868, 9827, 9816, 9749, 9746, 9737, 9720, 9700, 9682, 9656,
  9635, 9562, 9542, 9510, 9484, 9496, 9477, 9455, 9404, 9297, 9262, 9257, 9225, 9192, 9155, 9097, 9049, 9046,
  9034, 9027, 9016, 8937, 8853, 8834, 8778, 8775, 8750, 8732, 8708, 8692, 8666, 8662, 8610, 8600, 8570, 8560,
  8502, 8434, 8423, 8415, 8308, 8297, 8260, 8251, 8174, 8156, 8141, 8109, 8085, 8069, 8042, 8007, 8004, 7956,
  7924, 7922, 7874, 7817, 7793, 7759, 7743, 7649, 7639, 7617, 7608, 7579, 7564, 7547, 7542, 7503, 7500, 7498,
  7492, 7475, 7471, 7424, 7391, 7364, 7354, 7293, 7281, 7173, 7188, 7198, 7157, 7155, 7147, 7192, 7045, 7109,
  7117, 7007, 6993, 6969, 6956, 6885, 6923, 6854, 6768, 6717, 6684, 6652, 6634, 6583, 6561, 6564, 6458, 6449,
  6444, 6372, 6342, 6293, 6248, 6255, 6254, 6249, 6151, 6119, 6066, 6026, 5998, 5862, 5851, 5832, 5646, 5544,
  5528, 5516, 5427, 5418, 5393, 5317, 5311, 5310, 4973, 5232, 5204, 5170, 5131, 5176, 4259, 4809, 4610, 4716,
  4469, 3973, 4257, 4210, 4180, 3447, 1962, 2661, 2515, 4149, 1600, 160, 2919, 2851, 2366, 3005, 2826, 666,
  1005, 3560, 1739, 150, 2275, 3429, 4129, 1386, 1357, 3228, 3381, 4398, 841, 284, 3331, 3164, 3083, 3084,
  3303, 3651, 2263, 4102, 1531, 4118, 527, 1184, 1024, 2445, 529, 2439, 482, 1167, 1139, 3877, 3710, 202,
  4074, 1988, 558, 4016, 1409, 4012, 3666, 238, 3068, 831, 56, 2323, 3674, 2042, 1224, 1581, 4086, 1192,
  51, 960, 718, 3891, 4141, 814, 497, 1804, 199,
];
const SOLANA_RPC = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";

// Wallet adapters
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];


// Interfaces
interface UserData {
  wallet: string;
  name?: string;
  pfp?: string;
  ufos?: number;
}

interface NFT {
  mint: string;
  name: string;
  image: string;
  compression?: {
    compressed: boolean;
    tree: string;
    leafId: number;
    creator_hash: string;
    data_hash: string;
  };
}

interface HeliusAsset {
  id: string;
  burnt: boolean;
  ownership: { owner: string };
  content?: { json_uri?: string };
  compression?: {
    compressed: boolean;
    tree: string;
    leaf_id: number;
    creator_hash: string;
    data_hash: string;
  };
}

interface HeliusResponse {
  jsonrpc: string;
  result: { items: HeliusAsset[]; total: number };
  id: string;
}

const BurnPageInner: React.FC = () => {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [userData, setUserData] = useState<UserData>({ wallet: "", name: "Guest", pfp: "/default-pfp.png" });
  const [selectedBurnNFT, setSelectedBurnNFT] = useState<string | null>(null);
  const [isBurning, setIsBurning] = useState(false);
  const [totalBurntNFTs, setTotalBurntNFTs] = useState<number>(0);
  const [totalNFTSupply, setTotalNFTSupply] = useState<number>(0);
  const isDataLoading = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMusicControls, setShowMusicControls] = useState(true);

  const { connection } = useConnection();
const { publicKey, connected, wallet } = useWallet();
const MODAL_DEBOUNCE_MS = 100;

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

  const fireEffectStyles = `
    @keyframes flicker {
      0% { text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px #ff4500, 0 0 40px #ff4500, 0 0 60px #ff4500, 0 0 80px #ff4500; }
      50% { text-shadow: 0 0 2px #fff, 0 0 8px #fff, 0 0 15px #ff8c00, 0 0 30px #ff8c00, 0 0 50px #ff8c00, 0 0 70px #ff8c00; }
      100% { text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px #ff4500, 0 0 40px #ff4500, 0 0 60px #ff4500, 0 0 80px #ff4500; }
    }
    .fire-effect {
      background: linear-gradient(90deg, #ff4500, #ff8c00, #ff4500);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: flicker 1.5s infinite alternate;
      font-weight: bold;
    }
  `;
  // Customize wallet modal styles with debouncing
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

  // Fetch total NFT supply and burnt count
  const fetchTotalNFTStats = async () => {
    try {
      let page = 1;
      let totalSupply = 0;
      let burntCount = 0;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByGroup",
            params: {
              groupKey: "collection",
              groupValue: COLLECTION_ADDRESS,
              page: page,
              limit: 1000,
            },
          }),
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result: HeliusResponse = await response.json();
        const items = result.result.items || [];

        totalSupply += items.length;
        burntCount += items.filter((item) => item.burnt === true).length;

        hasMorePages = items.length === 1000;
        page++;
      }

      setTotalNFTSupply(totalSupply);
      setTotalBurntNFTs(burntCount);
    } catch (error) {
      console.error("Error fetching total NFT stats:", error);
      toast.error("Failed to fetch total NFT stats");
      setTotalNFTSupply(0);
      setTotalBurntNFTs(0);
    }
  };

  // Initialize Firebase and fetch NFT stats
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
      fetchTotalNFTStats();
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      toast.error("Failed to connect to database");
      setIsLoading(false);
    }
  }, []);

  // Fetch NFTs when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchNFTs(publicKey.toString());
      if (firestore) {
        const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", publicKey.toString()));
        getDocs(q).then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            setUserData({
              wallet: docData.Wallet || publicKey.toString(),
              name: docData.Name || "Guest",
              pfp: docData.SelectedNFT || docData.PFP || "/default-pfp.png",
              ufos: docData.UFOS || 0,
            });
          } else {
            const newUserData = {
              wallet: publicKey.toString(),
              name: "New Player",
              pfp: "/default-pfp.png",
              ufos: 0,
            };
            setDoc(doc(collection(firestore, "UFOSperWallet")), {
              Wallet: publicKey.toString(),
              Name: newUserData.name,
              PFP: newUserData.pfp,
              UFOS: newUserData.ufos,
            }).then(() => {
              setUserData(newUserData);
            });
          }
        });
      }
    } else {
      setUserNFTs([]);
      setUserData({ wallet: "", name: "Guest", pfp: "/default-pfp.png" });
    }
  }, [connected, publicKey, firestore]);

  if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = fireEffectStyles;
    document.head.appendChild(styleSheet);
  }

async function fetchNFTs(publicKey: string): Promise<NFT[]> {
  isDataLoading.current = true; // Start loading
  try {
    let page: number | null = 1;
    const ownedNFTs: NFT[] = [];

    while (page) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "getAssetsByGroup",
          params: { groupKey: "collection", groupValue: COLLECTION_ADDRESS, page, limit: 1000 },
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result: HeliusResponse = await response.json();
      if (result.result && result.result.items) {
        const ownedAssets = result.result.items.filter(
          (item) => item.ownership.owner === publicKey && (item.burnt === false || item.burnt === undefined)
        );
        const nfts = await Promise.all(
          ownedAssets.map(async (asset) => {
            const metadataURI = asset.content?.json_uri || "";
            const metadata = await fetchNFTMetadata(metadataURI);
            return {
              mint: asset.id,
              name: metadata?.name || "Unknown NFT",
              image: metadata?.image || "/placeholder.svg",
              compression: asset.compression
                ? {
                    compressed: asset.compression.compressed,
                    tree: asset.compression.tree,
                    leafId: asset.compression.leaf_id,
                    creator_hash: asset.compression.creator_hash,
                    data_hash: asset.compression.data_hash,
                  }
                : undefined,
            };
          })
        );
        ownedNFTs.push(...nfts);
      }
      page = result.result.total !== 1000 ? null : page + 1;
    }

    ownedNFTs.sort((a, b) => {
      const getNumber = (name: string): number => {
        const match = name.match(/#(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNumber(b.name) - getNumber(a.name);
    });

    setUserNFTs(ownedNFTs);
    return ownedNFTs;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    toast.error("Failed to fetch NFTs");
    return [];
  } finally {
    isDataLoading.current = false; // Stop loading
  }
}

  async function fetchNFTMetadata(metadataURI: string): Promise<any> {
    try {
      const response = await fetch(metadataURI);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  }

  const updateUserUfos = async (wallet: string, newUfosBalance: number) => {
    if (!firestore) return;
    try {
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", wallet));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);
        await updateDoc(docRef, { UFOS: newUfosBalance });
        setUserData((prev) => ({ ...prev, ufos: newUfosBalance }));
      }
    } catch (error) {
      console.error("Error updating UFOS balance:", error);
      throw new Error("Failed to update UFOS balance");
    }
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
          toast.error("Playback Failed", {
            description: "Could not play audio. Check console.",
            duration: 3000,
          });
        });
    }
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
          toast.error("Playback Failed", {
            description: "Could not play the new track.",
            duration: 3000,
          });
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
        toast.error("Audio Load Error", {
          description: "Failed to load audio file. Check console.",
          duration: 3000,
        });
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

const burnNFT = async () => {
  if (!firestore || !connected || !publicKey || !wallet || !wallet.adapter) {
    toast.error("Cannot Burn NFT", {
      description: "Please connect your wallet and select an NFT to burn.",
      duration: 3000,
    });
    return;
  }

  setIsBurning(true);
  const umi = createUmi(SOLANA_RPC).use(dasApi()) as Umi & { rpc: DasApiInterface };
  const MAX_RETRIES = 3;
  let attempt = 0;

  // Create a UMI Signer from the wallet adapter
  const umiSigner: Signer = {
    publicKey: umiPublicKey(publicKey.toString()),
    signTransaction: async (tx: Transaction) => {
      const web3Tx = toWeb3JsTransaction(tx);
      const signature = await wallet.adapter.sendTransaction(web3Tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      return {
        ...tx,
        signatures: [new Uint8Array(Buffer.from(signature, "base64"))],
      };
    },
    signAllTransactions: async (txs: Transaction[]) => {
      const web3Txs = txs.map(toWeb3JsTransaction);
      const signatures = await Promise.all(
        web3Txs.map((tx) =>
          wallet.adapter.sendTransaction(tx, connection, {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          })
        )
      );
      return txs.map((tx, i) => ({
        ...tx,
        signatures: [new Uint8Array(Buffer.from(signatures[i], "base64"))],
      }));
    },
    // Omit signMessage since it's not needed for the burn transaction
    signMessage: async () => {
      throw new Error("signMessage is not supported by this wallet");
    },
  };

  while (attempt < MAX_RETRIES) {
    try {
      const nftToBurn = userNFTs.find((nft) => nft.mint === selectedBurnNFT);
      if (!nftToBurn || !nftToBurn.compression?.compressed) {
        toast.error("NFT Not Found or Not Compressed", {
          description: "Selected NFT is invalid or not a compressed NFT.",
          duration: 3000,
        });
        return;
      }

      const ownerPublicKey = publicKey;

      // Fetch asset data to validate
      const assetResponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "getAsset",
          params: { id: selectedBurnNFT },
        }),
      });

      const rpcAsset = (await assetResponse.json()).result;
      if (!rpcAsset) {
        throw new Error("Asset not found on blockchain");
      }

      console.log("RPC Asset:", rpcAsset); // Debug: Log asset data

      if (rpcAsset.ownership.owner !== ownerPublicKey.toBase58()) {
        throw new Error(
          `NFT is not owned by the expected owner. Expected ${ownerPublicKey.toBase58()} but got ${rpcAsset.ownership.owner}.`
        );
      }

      if (!rpcAsset.compression || !rpcAsset.compression.tree || typeof rpcAsset.compression.leaf_id !== "number") {
        throw new Error("Invalid compression data for NFT");
      }

      const leafNonce = rpcAsset.compression.leaf_id;
      const merkleTree = umiPublicKey(rpcAsset.compression.tree);
      const [assetId] = await findLeafAssetIdPda(umi, { merkleTree, leafIndex: leafNonce });

      console.log("Asset ID:", assetId); // Debug: Log asset ID

      // Fetch asset with proof
      const assetWithProof = await getAssetWithProof(umi, assetId);
      if (!assetWithProof.proof || assetWithProof.proof.length === 0) {
        throw new Error("Invalid Merkle proof returned");
      }

      console.log("Asset with Proof:", assetWithProof); // Debug: Log proof data

      // Build burn transaction
      const burnTxBuilder = burn(umi, {
        ...assetWithProof,
        leafOwner: umiSigner.publicKey,
      });

      // Set blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const txWithBlockhash = await burnTxBuilder
        .setBlockhash({ blockhash, lastValidBlockHeight })
        .setFeePayer(umiSigner)
        .build(umi);

      const versionedTx = toWeb3JsTransaction(txWithBlockhash);

      // Send transaction using wallet adapter
      const signature = await wallet.adapter.sendTransaction(versionedTx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 5,
      });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed to confirm: ${confirmation.value.err.toString()}`);
      }

      console.log("Burn transaction successful, signature:", signature);

      // Calculate reward
      const nftNumber = parseInt(nftToBurn.name.replace("Crypto UFO #", ""), 10);
      const isSpecial = SPECIAL_NFT_NUMBERS.includes(nftNumber);
      const reward = isSpecial ? 100000 : 25000;
      const newUfosBalance = (userData.ufos || 0) + reward;

      // Update Firestore
      await updateUserUfos(ownerPublicKey.toString(), newUfosBalance);

      // Log burn event
      try {
        const burnLogRef = doc(collection(firestore, "BurnLogs"));
        await setDoc(burnLogRef, {
          wallet: ownerPublicKey.toString(),
          timestamp: new Date().toISOString(),
          nftId: nftToBurn.mint,
          nftName: nftToBurn.name,
          reward: reward,
          transactionSignature: signature,
        });
        console.log("Burn log saved successfully");
      } catch (logError) {
        console.error("Error saving burn log:", logError);
        toast.warning("Burn successful, but failed to save burn log", {
          duration: 3000,
        });
      }

      // Update local state
      setUserNFTs((prev) => prev.filter((nft) => nft.mint !== selectedBurnNFT));
      setTotalBurntNFTs((prev) => prev + 1);
      toast.success(`NFT Burned!`, {
        description: `You burned ${nftToBurn.name} and received ${reward.toLocaleString()} $UFOS. Transaction: ${signature}`,
        duration: 5000,
      });

      setSelectedBurnNFT(null);
      break;
    } catch (error) {
      console.error(`Burn attempt ${attempt + 1} failed:`, error);
      let errorMessage = "Unknown error";
      let errorDescription = "An unexpected error occurred during the burn process.";

      if (error instanceof SendTransactionError) {
        const logs = error.logs || [];
        console.log("Transaction Logs:", logs);
        errorMessage = "Transaction Failed";
        errorDescription = `Simulation failed: ${error.message}\nLogs: ${logs.join("\n")}`;
        if (logs.some((log) => log.includes("AccountNotFound"))) {
          errorDescription = "One or more accounts (e.g., NFT, Merkle tree, or Bubblegum program) were not found on the blockchain. Please verify the NFT and network.";
        }
      } else if (error instanceof Error) {
        errorMessage = "Burn Failed";
        errorDescription = error.message;
        if (error.message.includes("AccountNotFound")) {
          errorDescription = "One or more accounts (e.g., NFT, Merkle tree, or Bubblegum program) were not found on the blockchain. Please verify the NFT and network.";
        }
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });

      attempt++;
      if (attempt >= MAX_RETRIES) {
        setIsBurning(false);
      }
    }
  }

  setIsBurning(false);
};

if (isLoading || isDataLoading.current) {
  return (
    <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container">
      <div className="text-center z-10">
        <div className="cypherpunk-spinner mx-auto mb-4"></div>
        <img src="/loading.gif" alt="Loading" className="w-128 h-128 mx-auto mb-4" />
        <p className="cypherpunk-loading-text">{isLoading ? "Loading..." : "Fetching NFTs..."}</p>
      </div>
    </div>
  );
}

  const burntPercentage = totalNFTSupply > 0 ? ((totalBurntNFTs / totalNFTSupply) * 100).toFixed(2) : "0.00";

return (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center w-full overflow-x-hidden">
    <Toaster richColors position="top-right" />
    <audio ref={audioRef} preload="auto" />
        <h1 className="flex items-center justify-center bg-gradient-to-r text-6xl font-semibold from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
      CRYPTO UFOS BURNER <Flame className="ml-2 w-18 h-18 text-violet-500 cypherpunk-icon-glow" />
    </h1>
      {/* Move Wallet Button to Top */}
  <div className="cyberpunk-wallet-controls fixed top-4 right-4">
    <WalletMultiButton className="w-full max-w-xs text-center items-center justify-center cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg" />
  </div>
    {/* Header */}
<div className="bg-gray-800/80 p-4 cypherpunk-border w-full flex justify-center mb-8 z-[10]">
  <div className="flex flex-col  items-center gap-4 max-w-screen-xl w-full">

    {userData.pfp && (
      <img
        src={userData.pfp || "/placeholder.svg"}
        alt={userData.name || "Player"}
        className="w-16 h-16 rounded-full border-2 border-white"
        onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
      />
    )}
    <span className="text-green-500 font-semibold text-lg">{userData.name}</span>
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <img src={

GAME_ASSETS.ufoLogo || "/placeholder.svg"} alt="UFO" className="w-6 h-6" />
        <span className="text-yellow-500">NFTs: {userNFTs.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <img src={GAME_ASSETS.coin || "/placeholder.svg"} alt="UFOS" className="w-6 h-6" />
        <span className="text-yellow-500">$UFOS: {userData.ufos?.toLocaleString() || 0}</span>
      </div>
    </div>
    <Button
      onClick={() => (window.location.href = "/")}
      className="w-full max-w-xs cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg"
      disabled={isBurning}
    >
      Back to Main Page
    </Button>
 

  </div>
</div>

    {/* Main Content */}
    <main className="p-4 w-full flex justify-center">
      <div className="max-w-screen-xl w-full">
        {/* Burn NFTs Section */}
        {connected && (
<Card className="bg-gray-800/80 backdrop-blur-md cypherpunk-border rounded-lg w-full max-w-2xl mx-auto mt-0 z-[10]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-blue-500 mb-4 text-center">Burn Your NFTs</h2>
              <p className="text-xs text-gray-300 mb-4 text-center">
                Burn an NFT to receive $UFOS rewards. Some NFTs have a bonus reward.
              </p>
              <p className="fire-effect text-xs text-gray-300 mb-4 text-center">
                <span>Burnt NFTs: {totalBurntNFTs.toLocaleString()} ({burntPercentage}%) 🔥</span>
              </p>
              {userNFTs.length === 0 ? (
                <p className="text-gray-300 text-center">No NFTs available to burn.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 justify-items-center">
                  {userNFTs.map((nft) => (
                    <div key={nft.mint} className="flex flex-col items-center">
                      <img
                        src={nft.image || "/placeholder.svg"}
                        alt={nft.name}
                        className={`w-20 h-20 rounded border-2 border-white cursor-pointer ${
                          selectedBurnNFT === nft.mint ? "ring-2 ring-red-500" : ""
                        }`}
                        onClick={() => !isBurning && setSelectedBurnNFT(nft.mint)}
                      />
                      <p className="text-xs text-center text-gray-300 mt-2 line-clamp-2">{nft.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  onClick={burnNFT}
                  disabled={!selectedBurnNFT || isBurning}
                  className="cypherpunk-button cypherpunk-button-red font-semibold py-2 px-4 rounded-lg"
                >
                  {isBurning ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Burning...
                    </>
                  ) : (
                    "Burn Selected NFT"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>

    {/* Music Controls */}
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 items-end">
      <Button
        onClick={() => setShowMusicControls(!showMusicControls)}
        className="cypherpunk-button cypherpunk-button-purple p-3 rounded-full glow-hover w-12 h-12 flex items-center justify-center"
      >
        {showMusicControls ? "Hide" : "Show"}
      </Button>
      {showMusicControls && (
        <>
          <div className="flex gap-2">
            <Button
              onClick={() => changeTrack("prev")}
              className="cypherpunk-button cypherpunk-button-blue p-3 rounded-full glow-hover w-12 h-12 flex items-center justify-center"
            >
              ⏮
            </Button>
            <Button
              onClick={togglePlayPause}
              className="cypherpunk-button cypherpunk-button-green p-3 rounded-full glow-hover w-12 h-12 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 cypherpunk-icon-glow" />
              ) : (
                <Play className="w-6 h-6 cypherpunk-icon-glow" />
              )}
            </Button>
            <Button
              onClick={() => changeTrack("next")}
              className="cypherpunk-button cypherpunk-button-blue p-3 rounded-full glow-hover w-12 h-12 flex items-center justify-center"
            >
              ⏭
            </Button>
            <div className="relative z-40">
              <Button
                onClick={handleVolumeClick}
                className="cypherpunk-button cypherpunk-button-purple p-3 rounded-full glow-hover w-12 h-12 flex items-center justify-center"
              >
                <Volume2 className="w-6 h-6 cypherpunk-icon-glow" />
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
          <div className="marquee-container bg-[#2a2a2a]/90 backdrop-blur-md rounded-lg p-2 text-sm flex items-center w-48 overflow-hidden z-30 cypherpunk-border">
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

    <Analytics />
    <SpeedInsights />
  </div>
);
};

// Wrap BurnPageInner with providers
const BurnPage = () => {
  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <BurnPageInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default BurnPage;