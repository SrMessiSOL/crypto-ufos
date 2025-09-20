"use client";


import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, setDoc, doc } from "firebase/firestore";
import { Play, Pause, Volume2 } from "lucide-react";
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
import "./BurnPage.css"; // Import GMGenerator's CSS
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
}

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const NETWORK = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const API_URL = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";
const COLLECTION_ADDRESS = "53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb";
// Dynamically import WalletConnect to avoid SSR
const MODAL_DEBOUNCE_MS = 100;

// Define interfaces for the API response structure
interface HeliusAsset {
  id: string
  burnt: boolean
  ownership: {
    owner: string
  }
  content?: {
    json_uri?: string
  }
  uri?: string
}

interface HeliusResponse {
  jsonrpc: string
  result: {
    items: HeliusAsset[]
    total: number
  }
  id: string
}

interface NFTData {
  id: string
  name: string
  image: string
  metadata?: any
}

function ProfilePicInner() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMusicControls, setShowMusicControls] = useState(true);

        // Wallet adapter hooks
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();


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
    
  interface HeliusAsset {
    id: string;
    burnt: boolean;
    ownership: { owner: string };
    content?: { json_uri?: string };
    uri?: string;
  }

  interface HeliusResponse {
    jsonrpc: string;
    result: { items: HeliusAsset[]; total: number };
    id: string;
  }

  interface NFTData {
    id: string;
    name: string;
    image: string;
    metadata?: any;
  }

  const [userData, setUserData] = useState<{
    wallet: string;
    name?: string;
    pfp?: string;
    ufos?: number;
  }>({
    wallet: "",
    name: "Guest",
    pfp: "/default-pfp.png",
    ufos: 0,
  });

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
          toast.error("Playback Failed", {
            description: "Could not play the new track.",
            duration: 3000,
          });
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
  
  // Audio setup useEffect
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
        changeTrack('next');
      };
  
      const handleError = (e: Event) => {
        console.error("Audio load error:", e);
        toast.error("Audio Load Error", {
          description: "Failed to load audio file. Check console.",
          duration: 3000,
        });
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
  
    const timeout = setTimeout(() => {
      const cleanup = setupAudio();
      return cleanup;
    }, 0);
  
    return () => clearTimeout(timeout);
  }, [currentTrack]);
  
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

   // Ensure component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Firebase on client only
  useEffect(() => {
    if (!isMounted) return;
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirestore(db);
      console.log("Firebase initialized");
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      toast.error("Failed to connect to database");
    }
  }, [isMounted]);

  // Update wallet state on connection change
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      setWalletConnected(true);
      setWalletAddress(address);
      fetchNFTsWithMetadata(address);
    } else {
      setWalletConnected(false);
      setWalletAddress(null);
      setOwnedNFTs([]);
      setSelectedNFT(null);
      setUserData({ wallet: "", name: "Guest", pfp: "/default-pfp.png", ufos: 0 });
    }
  }, [connected, publicKey]);

  // Fetch user data from Firestore
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
          if (docData.SelectedNFT) {
            setSelectedNFT(docData.SelectedNFT);
          }
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

  // Modal fix logic
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

  async function fetchNFTsWithMetadata(publicKey: string): Promise<NFTData[]> {
    setIsLoading(true);
    try {
      console.log("Fetching NFTs for:", publicKey);
      let page: number | null = 1;
      const ownedNFTs: NFTData[] = [];

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
              page: page,
              limit: 1000,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: HeliusResponse = await response.json();
        console.log("Page", page, "response:", result);

        if (result.result && result.result.items) {
          const ownedAssets = result.result.items.filter(
            (item: HeliusAsset) =>
              item.ownership.owner === publicKey &&
              (item.burnt === false || item.burnt === undefined)
          );
          const metadataPromises = ownedAssets.map(async (asset: HeliusAsset) => {
            const metadataURI = asset.content?.json_uri || asset.uri || "";
            const metadata = await fetchNFTMetadata(metadataURI);
            return {
              id: asset.id,
              name: metadata?.name || "Unknown NFT",
              image: metadata?.image || "#",
              metadata: metadata,
            };
          });

          const nftsWithMetadata = await Promise.all(metadataPromises);
          ownedNFTs.push(...nftsWithMetadata);
        }

        page = result.result.total !== 1000 ? null : page + 1;
      }

      console.log("Total NFTs:", ownedNFTs);
      setOwnedNFTs(ownedNFTs);
      return ownedNFTs;
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast.error("Failed to fetch NFTs", {
        description: "Please try again later.",
        duration: 3000,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchNFTMetadata(metadataURI: string): Promise<any> {
    try {
      const response: Response = await fetch(metadataURI);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Error fetching metadata from", metadataURI, ":", error);
      return null;
    }
  }

  const handleNFTSelect = async (nftImage: string) => {
    if (!firestore || !walletAddress) return;

    setSelectedNFT(nftImage);

    try {
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", walletAddress));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);
        await updateDoc(docRef, { SelectedNFT: nftImage });
        toast.success("Profile Picture Updated", {
          description: "Your new profile picture has been saved!",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error saving profile picture:", error);
      toast.error("Error saving profile picture");
    }
  };

  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container">
        <div className="text-center mt-25 z-10">
          <div className="cypherpunk-spinner mx-auto mb-4"></div>
          <img src="/loading.gif" alt="Loading" className="w-128 h-128 mx-auto mb-4" />
          <p className="cypherpunk-loading-text">Fetching NFTs...</p>
        </div>
      </div>
    );
  }
 return (
    <div className="min-h-screen text-white flex flex-col relative overflow-x-hidden cypherpunk-loading-container">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900/80 to-black/80 z-10"></div>
      <div className="relative z-20 flex flex-col min-h-screen">
        <Toaster richColors position="top-right" />
        <audio ref={audioRef} preload="auto" />
        <div className="flex flex-col items-center mb-4">
          <h1 className="flex items-center bg-gradient-to-r text-6xl font-semibold from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
            SELECT PROFILE PICTURE
          </h1>
        </div>
                    <div className="cyberpunk-wallet-controls z-[1002]">
              <WalletMultiButton className="w-full max-w-xs text-center items-center justify-center cypherpunk-button cypherpunk-button-purple text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 z-[1002]" />
            </div>
        <div className="bg-gray-800/80 p-4 cypherpunk-border w-full flex justify-center mb-8 z-[10]">
          <div className="flex flex-col items-center gap-4 max-w-screen-xl w-full">
            {walletAddress && (
              <img
                src={selectedNFT || "/default-pfp.png"}
                alt="Profile Picture"
                className="w-16 h-16 rounded-full border-2 border-golden-yellow/50 shadow-md shadow-golden-yellow/20"
                onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
              />
            )}
            <h2
              className="text-xl font-bold text-green-500 text-center cypherpunk-glitch-text"
              data-text={userData.name || (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Guest")}
            >
              {userData.name || (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Guest")}
            </h2>
            <div className="flex items-center gap-2">
              <img src="/UFO_v3.gif" alt="UFO" className="w-8 h-8" />
              <h2 className="text-lg font-semibold text-blue-500">
                NFTs: <span className="text-blue-500">{ownedNFTs.length}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <img src="/Coin_Anim.gif" alt="UFOS" className="w-8 h-8" />
              <h2 className="text-lg font-semibold text-yellow-500">
                $UFOS: <span className="text-yellow-500">{userData.ufos?.toLocaleString() || 0}</span>
              </h2>
            </div>

            <Button
              onClick={() => (window.location.href = "/farm")}
              className="w-full max-w-xs cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg flex items-center gap-2"
              disabled={isLoading}
            >
              Back to Game
            </Button>
          </div>
        </div>
        <main className="p-4 md:p-8 max-w-screen-xl mx-auto w-full">
          {isLoading ? (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[1001] cypherpunk-loading-container"
              aria-busy="true"
              role="alert"
            >
              <div className="text-center p-6 bg-gray-900/95 rounded-xl border border-[#00ffcc] shadow-lg shadow-[#00ffcc]/30">
                <div className="cypherpunk-spinner mx-auto mb-4"></div>
                <img
                  src="/loading.gif"
                  alt="Loading"
                  className="w-40 h-40 mx-auto mb-4"
                />
                <p className="text-sm cypherpunk-loading-text font-orbitron">Fetching NFTs...</p>
                <div className="cypherpunk-loading-progress mt-4">
                  <div className="cypherpunk-loading-progress-bar w-1/2"></div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="bg-gray-800/90 backdrop-blur-md cypherpunk-border rounded-xl shadow-xl shadow-sky-blue/20 w-full max-w-2xl mx-auto z-[10]">
              <CardContent className="p-4">
                {!walletConnected ? (
                  <p className="text-center text-sm text-gray-300 font-orbitron">
                    Please connect your wallet to select a profile picture
                  </p>
                ) : ownedNFTs.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {ownedNFTs.map((nft) => (
                      <div
                        key={nft.id}
                        className={`relative cursor-pointer rounded-md p-2 flex items-center justify-center glow-hover ${
                          selectedNFT === nft.image ? "cypherpunk-border" : "border-gray-700"
                        }`}
                        onClick={() => handleNFTSelect(nft.image)}
                      >
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full max-w-[150px] h-auto aspect-square object-contain rounded mx-auto"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        <p className="text-xs mt-1 text-center text-gray-300 font-orbitron truncate absolute bottom-2 left-0 right-0">
                          {nft.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-300 font-orbitron">
                    No NFTs found in your wallet from this collection
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </main>
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
}

export default function ProfilePic() {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ProfilePicInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}