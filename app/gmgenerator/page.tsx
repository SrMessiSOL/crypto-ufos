"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Toaster, toast } from "sonner";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, Coffee } from "lucide-react";
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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RefObject } from "react";
import "./BurnPage.css"; // Assuming styles are in BurnPage.css
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
  gmButton: "/gmbutton.png",
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

// Constants
const API_URL = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb";
const NETWORK = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";

// Interfaces
interface NFTAsset {
  id: string;
  burnt: boolean;
  content: { json_uri: string };
  ownership: { owner: string };
  metadata?: { name: string; image: string };
}

interface UserData {
  wallet: string;
  name?: string;
  pfp?: string;
  ufos?: number;
}

interface HeliusResponse {
  jsonrpc: string;
  result: {
    items: NFTAsset[];
    total: number;
  };
  id: string;
}

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const MODAL_DEBOUNCE_MS = 100;

const GMGeneratorContent = () => {
  const { publicKey, wallet, connect, disconnect, connecting, connected } = useWallet();
  const { connection } = useConnection();
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [selectedNFTImage, setSelectedNFTImage] = useState<string>("");
  const [combinedImageURL, setCombinedImageURL] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({ wallet: "", name: "Guest", pfp: "/default-pfp.png" });
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMusicControls, setShowMusicControls] = useState(true);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const fetchNFTMetadata = useCallback(async (metadataURI: string): Promise<{ name: string; image: string } | undefined> => {
    try {
      const response = await fetch(metadataURI);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const metadata = await response.json();
      if (!metadata.name || !metadata.image) return undefined;
      return metadata;
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return undefined;
    }
  }, []);


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
 const fetchAssetsByGroup = useCallback(async () => {
    if (!publicKey) return;

    setIsFetching(true);
    try {
      let page: number | null = 1;
      let ownedNFTs: NFTAsset[] = [];

      while (page) {
        const response: Response = await fetch(API_URL, {
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

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: HeliusResponse = await response.json();
        const { result } = data;
        if (result?.items) {
          const ownedAssets = result.items.filter(
            (item: NFTAsset) =>
              item.ownership.owner === publicKey.toString() &&
              (item.burnt === false || item.burnt === undefined)
          );
          ownedNFTs.push(...ownedAssets);
        }

        page = result.total !== 1000 ? null : page + 1;
      }

      const metadataPromises = ownedNFTs.map(async (asset) => {
        const metadata = await fetchNFTMetadata(asset.content.json_uri);
        return { ...asset, metadata };
      });

      const ownedNFTsWithMetadata: NFTAsset[] = await Promise.all(metadataPromises);

      ownedNFTsWithMetadata.sort((a, b) => {
        const getNumber = (name: string): number => {
          const match = name.match(/#(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getNumber(b.metadata?.name || "") - getNumber(a.metadata?.name || "");
      });

      setNfts(ownedNFTsWithMetadata);
    } catch (error: any) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setIsFetching(false);
    }
  }, [publicKey, fetchNFTMetadata]);

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);


  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  // Sync user data with Firebase
 useEffect(() => {
    if (publicKey && firestore) {
      const fetchUserData = async () => {
        const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", publicKey.toString()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setUserData({
            wallet: docData.Wallet || publicKey.toString(),
            name: docData.Name || "Guest",
            pfp: docData.PFP || docData.SelectedNFT || "/default-pfp.png",
            ufos: docData.UFOS || 0,
          });
        } else {
          const newUserData = {
            wallet: publicKey.toString(),
            name: "New Player",
            pfp: "/default-pfp.png",
            ufos: 0,
          };
          await setDoc(doc(collection(firestore, "UFOSperWallet")), {
            Wallet: publicKey.toString(),
            Name: newUserData.name,
            PFP: newUserData.pfp,
            UFOS: newUserData.ufos,
          });
          setUserData(newUserData);
        }
      };
      fetchUserData();
    }
  }, [publicKey, firestore]);

  // Fetch NFTs on wallet connect
  useEffect(() => {
    if (connected && publicKey) {
      fetchAssetsByGroup();
    }
  }, [connected, publicKey, fetchAssetsByGroup]);

  // Fetch NFTs on wallet connect
  useEffect(() => {
    if (connected && publicKey) {
      fetchAssetsByGroup();
    }
  }, [connected, publicKey, fetchAssetsByGroup]);

  // Generate GM image
  const generateImage = () => {
    if (!selectedNFTImage) {
      return;
    }

    setShowMusicControls(false);
    const nftImage = new Image();
    nftImage.crossOrigin = "Anonymous";
    nftImage.src = selectedNFTImage;

    nftImage.onload = () => {
      const armImage = new Image();
      armImage.crossOrigin = "Anonymous";
      armImage.src = "/GM.png";

      armImage.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = nftImage.width;
        canvas.height = nftImage.height;

        ctx.drawImage(nftImage, 0, 0);
        const armWidth = 350;
        const armHeight = 350;
        const armX = (nftImage.width - armWidth) / -25;
        const armY = nftImage.height - armHeight + 25;

        ctx.drawImage(armImage, armX, armY, armWidth, armHeight);
        const url = canvas.toDataURL("image/png");
        setCombinedImageURL(url);
        setShowMusicControls(true);
      };
    };
  };

  // Handle download
  const handleDownload = () => {
    if (!combinedImageURL) return;
    setShowMusicControls(false);
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = combinedImageURL;
      link.download = "CryptoUFO_GM.png";
      link.click();
      setTimeout(() => setShowMusicControls(true), 100);
    }, 100);
  };

  // Music-related functions
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      audioRef.current.muted = newVolume === 0;
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
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio.src !== AUDIO_TRACKS[currentTrack].src) {
        audio.src = AUDIO_TRACKS[currentTrack].src;
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          updateTime();
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }
  };

  const changeTrack = (direction: "next" | "prev") => {
    if (!audioRef.current) return;

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
          updateTime();
        })
        .catch((error) => {
          console.error("Error playing new track:", error);
        });
    };

    audio.addEventListener("canplay", playWhenReady, { once: true });
  };

  const updateTime = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime || 0;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(time);
    setDuration(dur);
  };

  // Audio setup useEffect
 useEffect(() => {
    const setupAudio = () => {
      if (!audioRef.current) return;

      const audio = audioRef.current;
      audio.src = AUDIO_TRACKS[currentTrack].src;
      audio.volume = volume / 100;
      audio.muted = volume === 0;

      const handleTimeUpdate = () => {
        updateTime();
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
      };

      const handleSongEnd = () => {
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

  // Volume update useEffect
  useEffect(() => {
    const updateVolume = () => {
      if (!audioRef.current) return;
      const audio = audioRef.current;
      audio.volume = volume / 100;
      audio.muted = volume === 0;
    };

    const timeout = setTimeout(updateVolume, 0);
    return () => clearTimeout(timeout);
  }, [volume]);

  // Dynamic marquee duration
  useEffect(() => {
    const updateMarqueeDuration = () => {
      if (marqueeRef.current) {
        const textWidth = marqueeRef.current.offsetWidth;
        const containerWidth = marqueeRef.current.parentElement?.offsetWidth || 192;
        const duration = Math.max(5, textWidth / 50);
        marqueeRef.current.style.animationDuration = `${duration}s`;
      }
    };

    updateMarqueeDuration();
    window.addEventListener("resize", updateMarqueeDuration);

    return () => window.removeEventListener("resize", updateMarqueeDuration);
  }, [currentTrack]);

  // Volume update useEffect
  useEffect(() => {
    const updateVolume = () => {
      if (!audioRef.current) return;
      const audio = audioRef.current;
      audio.volume = volume / 100;
      audio.muted = volume === 0;
    };

    const timeout = setTimeout(updateVolume, 0);
    return () => clearTimeout(timeout);
  }, [volume]);

  // Dynamic marquee duration
  useEffect(() => {
    const updateMarqueeDuration = () => {
      if (marqueeRef.current) {
        const textWidth = marqueeRef.current.offsetWidth;
        const containerWidth = marqueeRef.current.parentElement?.offsetWidth || 192;
        const duration = Math.max(5, textWidth / 50);
        marqueeRef.current.style.animationDuration = `${duration}s`;
      }
    };

    updateMarqueeDuration();
    window.addEventListener("resize", updateMarqueeDuration);

    return () => window.removeEventListener("resize", updateMarqueeDuration);
  }, [currentTrack]);

    // Render loading page when fetching NFTs
  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container">
        <div className="text-center z-10">
          <div className="cypherpunk-spinner mx-auto mb-4"></div>
          <img src="/loading.gif" alt="Loading" className="w-128 h-128 mx-auto mb-4" />
          <p className="cypherpunk-loading-text">Fetching NFTs...</p>
        </div>
      </div>
    );
  }
 return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900/80 to-black/80 z-10"></div>
      <div className="relative z-20 flex flex-col min-h-screen">
        <Toaster richColors position="top-right" />
        <audio ref={audioRef} preload="auto" />
        <div className="flex flex-col items-center mb-4">
          <h1 className="flex items-center bg-gradient-to-r text-6xl font-semibold from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
            CRYPTO UFOS GM GENERATOR
            <Coffee className="w-18 h-18 text-green-500 cypherpunk-icon-glow" aria-hidden="true" />
          </h1>
        </div>
            <div className="cyberpunk-wallet-controls">
              <div className="flex flex-col items-center mb-8">
                <WalletMultiButton className="cypherpunk-button cypherpunk-button-purple text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2" />
              </div>
            </div>
        {/* Header (Mobile Profile and Desktop Sidebar) */}
        <div className="bg-gray-800/80 p-4 cypherpunk-border w-full flex justify-center mb-8">
          <div className="flex flex-col items-center gap-4 max-w-screen-xl w-full">
            {userData.pfp && (
              <img
                src={userData.pfp}
                alt={userData.name || "Player"}
                className="w-16 h-16 rounded-full border-2 border-golden-yellow/50 shadow-md shadow-golden-yellow/20"
                onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
              />
            )}
            <h2 className="text-xl font-bold text-green-500 text-center cypherpunk-glitch-text" data-text={userData.name}>
              {userData.name}
            </h2>
            <div className="flex items-center gap-2">
              <img src={GAME_ASSETS.ufoLogo} alt="UFO" className="w-8 h-8" />
              <h2 className="text-lg font-semibold text-blue-500">
                NFTs: <span className="text-blue-500">{nfts.length}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <img src={GAME_ASSETS.coin} alt="UFOS" className="w-8 h-8" />
              <h2 className="text-lg font-semibold text-yellow-500">
                $UFOS: <span className="text-yellow-500">{userData.ufos?.toLocaleString() || 0}</span>
              </h2>
            </div>

            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full max-w-xs cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg"
              disabled={isFetching}
            >
              Back to Main Page
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-8 max-w-screen-xl mx-auto w-full">
          {/* GM Generator Content */}
          {connected && (
            <Card className="bg-gray-800/90 backdrop-blur-md cypherpunk-border rounded-xl shadow-xl shadow-sky-blue/20 w-full max-w-2xl mx-auto nft-container">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-blue-500 mb-4 cypherpunk-glitch-text font-orbitron" data-text="Generate GM Image">
                  Generate GM Image
                </h2>
                <p className="text-sm text-gray-300 mb-4 font-orbitron">
                  Select an NFT to generate a GM image with a coffee cup arm.
                </p>
                {nfts.length === 0 ? (
                  <p className="text-gray-300 font-orbitron">No NFTs available to generate GM image.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {nfts.map((asset) => (
                      <div key={asset.id} className="flex flex-col items-center">
                        <img
                          src={asset.metadata?.image || "/placeholder.svg"}
                          alt={asset.metadata?.name}
                          className={`w-20 h-20 rounded border-2 border-golden-yellow/50 cursor-pointer ${
                            selectedNFTImage === asset.metadata?.image ? "ring-2 ring-blue-500" : ""
                          }`}
                          onClick={() => !isFetching && setSelectedNFTImage(asset.metadata?.image || "")}
                        />
                        <p className="text-xs text-center text-gray-300 mt-2 line-clamp-2 font-orbitron">
                          {asset.metadata?.name || "Unknown NFT"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={generateImage}
                    disabled={!selectedNFTImage || isFetching}
                    className="cypherpunk-button cypherpunk-button-blue text-white font-semibold py-3 px-6 rounded-lg font-orbitron"
                  >
                    {isFetching ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Generating...
                      </>
                    ) : (
                      "Generate GM Image"
                    )}
                  </Button>
                  {combinedImageURL && (
                    <Button
                      onClick={handleDownload}
                      className="cypherpunk-button cypherpunk-button-green text-white font-semibold py-3 px-6 rounded-lg font-orbitron"
                    >
                      Download Image
                    </Button>
                  )}
                </div>
                {combinedImageURL && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={combinedImageURL}
                      alt="GM Image"
                      className="w-64 h-64 rounded border-2 border-golden-yellow/50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Music Controls */}
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
    </div>
  );
};

export default function GMGenerator() {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <GMGeneratorContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}