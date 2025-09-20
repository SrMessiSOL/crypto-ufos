"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { Play, Pause, Volume2, X, Ticket } from "lucide-react";
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
import "@solana/wallet-adapter-react-ui/styles.css"; // Required for WalletModalProvider
import "./RafflePage.css"; // New CSS file for raffle-specific styles

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

// Solana network configuration
const NETWORK = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db";

// Wallet adapters
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
const MODAL_DEBOUNCE_MS = 100;

// Game assets
const GAME_ASSETS = {
  phantomIcon: "/phantom-icon.png",
  solflareIcon: "https://avatars.githubusercontent.com/u/89903469?s=200&v=4",
  coin: "/Coin_Anim.gif",
  ufoLogo: "/UFO_v3.gif",
};

interface Raffle {
  id: string;
  name: string;
  prize: string;
  ticketPrice: number;
  endTime: Date;
  isActive: boolean;
  winner?: string;
  entries: { wallet: string; ticketCount: number }[];
  image?: string;
}

interface UserData {
  wallet: string;
  ethAddress?: string;
  ufos: number;
  raffleTickets?: { [raffleId: string]: number };
  name?: string;
  pfp?: string;
}

interface WinnerModalData {
  raffleName: string;
  prize: string;
  winner: string;
}

const RafflePageInner = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [userData, setUserData] = useState<UserData>({ wallet: "", ufos: 0, raffleTickets: {} });
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [filteredRaffles, setFilteredRaffles] = useState<Raffle[]>([]);
  const [ticketAmount, setTicketAmount] = useState<{ [raffleId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [timeTick, setTimeTick] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [ethAddressInput, setEthAddressInput] = useState<string>("");
  const processedRaffles = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<WinnerModalData | null>(null);
  const [showMusicControls, setShowMusicControls] = useState(true);
  
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

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirestore(db);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      toast.error("Failed to connect to database", { duration: 3000 });
      setIsLoading(false);
    }
  }, []);

  // Fetch user data on wallet connection
  const fetchUserData = async () => {
    if (!publicKey || !firestore) return;
    setLoadingWallet(true);
    setError(null);
    try {
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", publicKey.toString()));
      const querySnapshot = await getDocs(q);

      let userData: UserData;
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        userData = {
          wallet: docData.Wallet || publicKey.toString(),
          ethAddress: docData.EthAddress || "",
          ufos: docData.UFOS || 0,
          raffleTickets: docData.RaffleTickets || {},
          name: docData.Name || `Wallet ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
          pfp: docData.SelectedNFT || docData.PFP || "/default-pfp.png",
        };
        setEthAddressInput(docData.EthAddress || "");
      } else {
        userData = {
          wallet: publicKey.toString(),
          ethAddress: "",
          ufos: 0,
          raffleTickets: {},
          name: `Wallet ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
          pfp: "/default-pfp.png",
        };
        await setDoc(doc(collection(firestore, "UFOSperWallet")), {
          Wallet: userData.wallet,
          EthAddress: userData.ethAddress,
          UFOS: userData.ufos,
          RaffleTickets: userData.raffleTickets,
          Name: userData.name,
          PFP: userData.pfp,
        });
        setEthAddressInput("");
      }
      setUserData(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load wallet data. Please try again.");
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      setLoadingWallet(true);
      fetchUserData();
    } else {
      setUserData({ wallet: "", ufos: 0, raffleTickets: {} });
      setLoadingWallet(false);
      setError(null);
    }
  }, [connected, publicKey, firestore]);

  // Style wallet modal to match leaderboard
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

  // Fetch raffles and listen for changes
  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    const rafflesQuery = query(collection(firestore, "raffles"));
    const unsubscribe = onSnapshot(rafflesQuery, (snapshot) => {
      const raffleData: Raffle[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed Raffle",
          prize: data.prize || "No Prize",
          ticketPrice: typeof data.ticketPrice === "number" ? data.ticketPrice : 0,
          endTime: data.endTime ? new Date(data.endTime.seconds * 1000) : new Date(),
          isActive: typeof data.isActive === "boolean" ? data.isActive : false,
          entries: Array.isArray(data.entries) ? data.entries : [],
          winner: data.winner || undefined,
          image: data.image || "/placeholder.svg",
        };
      });
      setRaffles(raffleData);
      setFilteredRaffles(raffleData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to raffles:", error);
      toast.error("Failed to load raffles", { duration: 3000 });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  // Apply filter and sort
  useEffect(() => {
    let updatedRaffles = [...raffles];
    if (filterStatus === "active") {
      updatedRaffles = updatedRaffles.filter((raffle) => raffle.isActive && raffle.endTime > new Date());
    } else if (filterStatus === "ended") {
      updatedRaffles = updatedRaffles.filter((raffle) => !raffle.isActive || raffle.endTime <= new Date());
    }
    switch (sortBy) {
      case "ticketPriceAsc":
        updatedRaffles.sort((a, b) => a.ticketPrice - b.ticketPrice);
        break;
      case "ticketPriceDesc":
        updatedRaffles.sort((a, b) => b.ticketPrice - a.ticketPrice);
        break;
      case "timeRemainingAsc":
        updatedRaffles.sort((a, b) => a.endTime.getTime() - b.endTime.getTime());
        break;
      case "timeRemainingDesc":
        updatedRaffles.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
        break;
      default:
        break;
    }
    setFilteredRaffles(updatedRaffles);
  }, [raffles, filterStatus, sortBy]);

  // Combined real-time timer and raffle end checker
  useEffect(() => {
    if (!firestore || !raffles.length) return;
    const interval = setInterval(() => {
      setTimeTick((prev) => prev + 1);
      raffles.forEach((raffle) => {
        const now = new Date();
        if (raffle.isActive && raffle.endTime <= now && !raffle.winner && !processedRaffles.current.has(raffle.id)) {
          processedRaffles.current.add(raffle.id);
          pickWinner(raffle);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [raffles, firestore]);

  // Music-related functions (unchanged)
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
      audio.play().then(() => {
        setIsPlaying(true);
        updateTime();
      }).catch((error) => {
        console.error("Error playing audio:", error);
        toast.error("Playback Failed", { duration: 3000 });
      });
    }
  };

  const changeTrack = (direction: "next" | "prev") => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    audio.pause();
    const newTrack = direction === "next"
      ? (currentTrack + 1) % AUDIO_TRACKS.length
      : (currentTrack - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length;
    setCurrentTrack(newTrack);
    setCurrentTime(0);
    audio.src = AUDIO_TRACKS[newTrack].src;
    audio.play().then(() => {
      setIsPlaying(true);
      updateTime();
    }).catch((error) => {
      console.error("Error playing new track:", error);
      toast.error("Playback Failed", { duration: 3000 });
    });
  };

  const updateTime = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime || 0);
    setDuration(audioRef.current.duration || 0);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    audio.src = AUDIO_TRACKS[currentTrack].src;
    audio.volume = volume / 100;
    audio.muted = volume === 0;

    const handleTimeUpdate = () => updateTime();
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleSongEnd = () => changeTrack("next");
    const handleError = (e: Event) => {
      console.error("Audio load error:", e);
      toast.error("Audio Load Error", { duration: 3000 });
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
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
    audioRef.current.muted = volume === 0;
  }, [volume]);

  const saveUserData = async (updatedData: UserData) => {
    if (!firestore || !connected) return;
    try {
      const q = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", updatedData.wallet));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(firestore, "UFOSperWallet", querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          UFOS: updatedData.ufos,
          EthAddress: updatedData.ethAddress || "",
          RaffleTickets: updatedData.raffleTickets || {},
          Name: updatedData.name || "Guest",
          PFP: updatedData.pfp || "/default-pfp.png",
        });
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      toast.error("Failed to save data", { duration: 3000 });
    }
  };

  const saveEthAddress = async () => {
    if (!connected || !ethAddressInput) {
      toast.error("Invalid Input", {
        description: "Please connect your wallet and enter a valid ETH address.",
        duration: 3000,
      });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(ethAddressInput)) {
      toast.error("Invalid ETH Address", {
        description: "Please enter a valid Ethereum address.",
        duration: 3000,
      });
      return;
    }
    const updatedUserData = { ...userData, ethAddress: ethAddressInput };
    setUserData(updatedUserData);
    await saveUserData(updatedUserData);
    toast.success("ETH Address Saved", {
      description: "Your Ethereum address has been saved successfully.",
      duration: 3000,
    });
  };

  const buyTickets = async (raffle: Raffle, amount: number) => {
    if (!connected) {
      toast.error("Wallet Not Connected", {
        description: "Please connect your wallet to participate.",
        duration: 3000,
      });
      return;
    }
    if (raffle.endTime < new Date() || !raffle.isActive) {
      toast.error("Raffle Ended", {
        description: "This raffle has already ended.",
        duration: 3000,
      });
      return;
    }
    const totalCost = raffle.ticketPrice * amount;
    if (userData.ufos < totalCost) {
      toast.error("Not Enough UFOS", {
        description: `You need ${totalCost} UFOS to buy ${amount} tickets.`,
        duration: 3000,
      });
      return;
    }
    try {
      const updatedUserData = {
        ...userData,
        ufos: userData.ufos - totalCost,
        raffleTickets: {
          ...userData.raffleTickets,
          [raffle.id]: (userData.raffleTickets?.[raffle.id] || 0) + amount,
        },
      };
      setUserData(updatedUserData);
      await saveUserData(updatedUserData);
      const raffleRef = doc(firestore, "raffles", raffle.id);
      const existingEntry = raffle.entries.find((entry) => entry.wallet === userData.wallet);
      const updatedEntries = existingEntry
        ? raffle.entries.map((entry) =>
            entry.wallet === userData.wallet ? { ...entry, ticketCount: entry.ticketCount + amount } : entry
          )
        : [...raffle.entries, { wallet: userData.wallet, ticketCount: amount }];
      await updateDoc(raffleRef, { entries: updatedEntries });
      setRaffles((prev) => prev.map((r) => (r.id === raffle.id ? { ...r, entries: updatedEntries } : r)));
      toast.success("Tickets Purchased", {
        description: `You bought ${amount} tickets for ${raffle.name}!`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error buying tickets:", error);
      toast.error("Failed to buy tickets", { duration: 3000 });
    }
  };

  const pickWinner = async (raffle: Raffle) => {
    if (!raffle.isActive || raffle.winner) return;
    try {
      const weightedEntries: string[] = [];
      raffle.entries.forEach((entry) => {
        for (let i = 0; i < entry.ticketCount; i++) weightedEntries.push(entry.wallet);
      });
      if (weightedEntries.length === 0) {
        toast.error("No Entries", {
          description: `No one entered the raffle: ${raffle.name}.`,
          duration: 3000,
        });
        return;
      }
      const winnerIndex = Math.floor(Math.random() * weightedEntries.length);
      const winnerWallet = weightedEntries[winnerIndex];
      const raffleRef = doc(firestore, "raffles", raffle.id);
      await updateDoc(raffleRef, { isActive: false, winner: winnerWallet });
      setRaffles((prev) =>
        prev.map((r) => (r.id === raffle.id ? { ...r, isActive: false, winner: winnerWallet } : r))
      );
      const winnerQuery = query(collection(firestore, "UFOSperWallet"), where("Wallet", "==", winnerWallet));
      const winnerSnapshot = await getDocs(winnerQuery);
      if (!winnerSnapshot.empty) {
        const winnerDocRef = doc(firestore, "UFOSperWallet", winnerSnapshot.docs[0].id);
        const winnerData = winnerSnapshot.docs[0].data();
        let prizeUpdate: Record<string, any> = {};
        if (raffle.prize.includes("UFOS")) {
          const prizeAmount = parseInt(raffle.prize) || 0;
          prizeUpdate = { UFOS: (winnerData.UFOS || 0) + prizeAmount };
        }
        await updateDoc(winnerDocRef, prizeUpdate);
      }
      const usersQuery = query(collection(firestore, "UFOSperWallet"));
      const usersSnapshot = await getDocs(usersQuery);
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.RaffleTickets && userData.RaffleTickets[raffle.id]) {
          const updatedRaffleTickets = { ...userData.RaffleTickets };
          delete updatedRaffleTickets[raffle.id];
          await updateDoc(doc(firestore, "UFOSperWallet", userDoc.id), { RaffleTickets: updatedRaffleTickets });
          if (userData.Wallet === userData.wallet) {
            setUserData((prev) => ({ ...prev, raffleTickets: updatedRaffleTickets }));
          }
        }
      }
      setModalData({
        raffleName: raffle.name,
        prize: raffle.prize,
        winner: winnerWallet,
      });
      setIsModalOpen(true);
      toast.success("Raffle Ended", {
        description: `Winner of ${raffle.name}: ${winnerWallet.substring(0, 6)}...! Prize: ${raffle.prize}`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error picking winner:", error);
      toast.error("Failed to pick winner", { duration: 3000 });
    }
  };

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const timeDiff = endTime.getTime() - now.getTime();
    if (timeDiff <= 0) return "Ended";
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const WinnerModal = () => {
    if (!isModalOpen || !modalData) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 cypherpunk-loading-container backdrop-blur-sm">
        <div className="bg-[#2a2a2a]/90 backdrop-blur-md cypherpunk-border rounded-lg p-6 w-11/12 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#ff00aa] cypherpunk-loading-text">Congratulations!</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="cypherpunk-button cypherpunk-button-red"
            >
              <X className="w-6 h-6 cypherpunk-icon-glow" />
            </Button>
          </div>
          <p className="text-lg text-[#00ffaa] mb-2">
            The raffle <span className="font-semibold">{modalData.raffleName}</span> has ended!
          </p>
          <p className="text-lg text-[#00ffaa] mb-2">
            Winner: <span className="font-semibold">{modalData.winner.substring(0, 6)}...</span>
          </p>
          <p className="text-lg text-[#00ffaa] mb-4">
            Prize: <span className="font-semibold">{modalData.prize}</span>
          </p>
          <Button
            onClick={() => setIsModalOpen(false)}
            className="w-full cypherpunk-button cypherpunk-button-red font-semibold py-2 rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container">
        <div className="text-center z-10">
          <div className="cypherpunk-spinner mx-auto mb-4"></div>
          <img src="/loading.gif" alt="Loading" className="w-128 h-128 mx-auto mb-4" />
          <p className="cypherpunk-loading-text text-[#00ffaa] font-orbitron">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-black text-white w-full max-w-full overflow-x-hidden">
      <Toaster richColors position="top-right" />
      <audio ref={audioRef} preload="auto" />
      <WinnerModal />

      {/* Header */}
      <div className="flex flex-col items-center p-4">
        <h1 className="flex items-center justify-center text-4xl md:text-6xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
          CRYPTO UFOS RAFFLES <Ticket className="ml-2 w-8 h-8 md:w-10 md:h-10 text-violet-500 cypherpunk-icon-glow" />
        </h1>
      </div>

      {/* Wallet Data Section */}
      {(connected && publicKey) && (
        <div className="mb-6 glow-hover" role="region" aria-label="Connected Wallet Information">
          <Card className="relative cypherpunk-border bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl shadow-xl p-4 md:p-6 backdrop-blur-md overflow-hidden w-full max-w-screen-xl mx-auto z-[10]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff00aa]/20 to-[#00ffaa]/20 opacity-40 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-extrabold text-[#ff00aa] flex items-center gap-2 md:gap-3 tracking-tight">
                <img
                  src={userData.pfp || "/default-pfp.png"}
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
              <div className="flex flex-col items-center justify-center min-h-[200px] w-full" aria-busy="true">
                <img
                  src="/loading.gif"
                  alt="Loading wallet data"
                  className="w-40 h-40 mb-4"
                />
                <p className="text-sm cypherpunk-loading-text font-orbitron text-center text-[#00ffaa]">
                  Beaming up wallet data... Please hold
                </p>
                <div className="cypherpunk-loading-progress mt-4 w-full max-w-xs">
                  <div className="cypherpunk-loading-progress-bar w-1/2"></div>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-[#ef4444]" role="alert">
                <p>Failed to load wallet data. Please try again.</p>
                <Button
                  onClick={fetchUserData}
                  className="mt-2 cypherpunk-button cypherpunk-button-blue"
                >
                  Retry
                </Button>
              </div>
            ) : userData.wallet ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 animate-centimove">
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
                  <div className="p-2 md:p-3 bg-[#ff00aa]/20 rounded-full">
                    <img src={GAME_ASSETS.ufoLogo} alt="UFO" className="w-5 h-5 md:w-6 md:h-6 cypherpunk-icon-glow" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#00ffaa] uppercase tracking-wide">Name</p>
                    <p className="text-sm md:text-lg font-semibold text-white truncate max-w-full" title={userData.name}>
                      {userData.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
                  <div className="p-2 md:p-3 bg-[#00ffaa]/20 rounded-full">
                    <Ticket className="h-5 w-5 md:h-6 md:w-6 text-[#00ffaa] cypherpunk-icon-glow" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-[#00ffaa] uppercase tracking-wide">Raffles Entered</p>
                    <p className="text-sm md:text-lg font-semibold text-white">
                      {Object.keys(userData.raffleTickets || {}).length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
                  <div className="p-2 md:p-3 bg-[#ff00ff]/20 rounded-full">
                    <img src={GAME_ASSETS.coin} alt="UFOS" className="w-5 h-5 md:w-6 md:h-6 cypherpunk-icon-glow" />
                  </div>
                  <div>
                    <p className="text-xs text-[#00ffaa] uppercase tracking-wide">$UFOS</p>
                    <p className="text-sm md:text-lg font-semibold text-white">
                      {userData.ufos.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#2a2a2a]/60 rounded-xl hover:bg-[#3a3a3a]/60 transition-all duration-300 glow-hover">
                  <div className="p-2 md:p-3 bg-[#9333ea]/20 rounded-full">
                    <img src={GAME_ASSETS.ufoLogo} alt="UFO" className="w-5 h-5 md:w-6 md:h-6 cypherpunk-icon-glow" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-[#00ffaa] uppercase tracking-wide">ETH Address</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={ethAddressInput}
                        onChange={(e) => setEthAddressInput(e.target.value)}
                        placeholder="Enter ETH Address (0x...)"
                        className="bg-[#2a2a2a]/50 cypherpunk-border text-white text-xs p-2 rounded-lg"
                      />
                      <Button
                        onClick={saveEthAddress}
                        className="cypherpunk-button cypherpunk-button-green text-xs font-semibold py-1 px-2 rounded-lg"
                      >
                        Save
                      </Button>
                    </div>
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

      {/* Wallet Button */}
      <div className="flex justify-center mb-4">
        <WalletMultiButton
          className="cypherpunk-button cypherpunk-button-purple text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
          disabled={loadingWallet}
        />
      </div>

      {/* Main Content */}
      <main className="p-4 w-full max-w-screen-xl mx-auto overflow-x-hidden">
        {/* Filter and Sort Dropdown */}
        <div className="mb-4 text-center">
          <select
            value={`${filterStatus}-${sortBy}`}
            onChange={(e) => {
              const [status, sort] = e.target.value.split("-");
              setFilterStatus(status);
              setSortBy(sort);
            }}
            className="w-full md:w-auto text-center bg-[#2a2a2a]/50 cypherpunk-border text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffaa] transition-all duration-300"
          >
            <option value="all-">All Raffles</option>
            <option value="active-">Active Raffles</option>
            <option value="active-timeRemainingAsc">Active - Time (Low to High)</option>
            <option value="active-timeRemainingDesc">Active - Time (High to Low)</option>
            <option value="active-ticketPriceAsc">Active - Price (Low to High)</option>
            <option value="active-ticketPriceDesc">Active - Price (High to Low)</option>
            <option value="ended-">Ended Raffles</option>
            <option value="ended-timeRemainingAsc">Ended - Time (Low to High)</option>
            <option value="ended-timeRemainingDesc">Ended - Time (High to Low)</option>
            <option value="ended-ticketPriceAsc">Ended - Price (Low to High)</option>
            <option value="ended-ticketPriceDesc">Ended - Price (High to Low)</option>
          </select>
        </div>

        <Card className="bg-[#2a2a2a]/80 backdrop-blur-md cypherpunk-border rounded-lg w-full max-w-2xl mx-auto mt-0">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-[#ff00aa] cypherpunk-loading-text mb-4">Join Raffles</h2>
            <p className="text-xs text-[#00ffaa] mb-4">
              Purchase tickets with $UFOS to enter raffles and win exciting prizes!
            </p>
            {filteredRaffles.length === 0 ? (
              <p className="text-[#00ffaa]">No raffles available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {filteredRaffles.map((raffle) => (
                  <div key={raffle.id} className="flex flex-col items-center">
                    {raffle.image && (
                      <img
                        src={raffle.image}
                        alt={raffle.name}
                        className="w-20 h-20 rounded cypherpunk-border glow-hover cursor-pointer"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                    )}
                    <p className="text-xs text-center text-[#00ffaa] mt-2 line-clamp-2">{raffle.name}</p>
                    <p className="text-xs text-[#00ffaa]">
                      <span className="font-semibold">Prize:</span> {raffle.prize}
                    </p>
                    <p className="text-xs text-[#00ffaa]">
                      <span className="font-semibold">Price:</span> {raffle.ticketPrice.toLocaleString("en-US")} $UFOS
                    </p>
                    <p className="text-xs text-[#00ffaa]">
                      <span className="font-semibold">Ends:</span>{" "}
                      <span className={raffle.endTime < new Date() ? "text-red-400" : ""}>
                        {formatTimeRemaining(raffle.endTime)}
                      </span>
                    </p>
                    <p className="text-xs text-[#00ffaa]">
                      <span className="font-semibold">Your Tickets:</span> {userData.raffleTickets?.[raffle.id] || 0}
                    </p>
                    <p className="fire-effect text-xs text-[#00ffaa]">
                      <span className="font-semibold">Total Tickets:</span>{" "}
                      {raffle.entries.reduce((sum, entry) => sum + entry.ticketCount, 0)}
                    </p>
                    {raffle.winner && (
                      <p className="text-xs text-[#00ffaa]">
                        <span className="font-semibold">Winner:</span> {raffle.winner.substring(0, 6)}...
                      </p>
                    )}
                    {raffle.isActive && raffle.endTime > new Date() && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Input
                          type="number"
                          min="1"
                          value={ticketAmount[raffle.id] || ""}
                          onChange={(e) =>
                            setTicketAmount({ ...ticketAmount, [raffle.id]: Number(e.target.value) })
                          }
                          placeholder="Tickets"
                          className="w-20 bg-[#2a2a2a]/50 cypherpunk-border text-white text-xs p-1 rounded-lg"
                        />
                        <Button
                          onClick={() => buyTickets(raffle, ticketAmount[raffle.id] || 1)}
                          disabled={!ticketAmount[raffle.id] || ticketAmount[raffle.id] <= 0}
                          className="cypherpunk-button cypherpunk-button-yellow text-xs font-semibold py-1 px-2 rounded-lg"
                        >
                          Buy
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

export default function RafflePage() {
  return (
    <ConnectionProvider endpoint={NETWORK}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <RafflePageInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}