"use client";

import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { Play, Pause, Volume2, Vote } from "lucide-react";
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



// Game asset paths
const GAME_ASSETS = {
  background: "/Background.png",
  landMap: "/Landgg.png",
  batteryEmpty: "/Battery_Empty.png",
  batteryFull: "/Battery_Full.png",
  batteryBroken: "/Battery_Broken.png",
  batteryCharging: "/charging1.png",
  ice: "/Ice3.png",
  water: "/water.png",
  mineral: "/Mineral.png",
  coin: "/Coin_Anim.gif",
  powerCellCharger: "/PowerCellCharger.png",
  market: "/Marketgg.png",
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
};

// Constants for NFT fetching
const API_URL = "https://mainnet.helius-rpc.com/";
const COLLECTION_ADDRESS = "";
const SOLANA_RPC = "https://mainnet.helius-rpc.com/";

// Constants for proposal duration
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const MIN_NFTS_TO_CREATE_PROPOSAL = 30;
const PROPOSAL_CREATION_COST = 25000; // Cost in $UFOS to create a proposal
const VOTE_COST_PER_NFT = 0; // Cost in $UFOS per NFT vote

// Wallet adapters
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

// Interfaces
interface HeliusAsset {
  id: string;
  burnt: boolean;
  ownership: {
    owner: string;
  };
  content?: {
    json_uri?: string;
  };
  uri?: string;
}

interface HeliusResponse {
  jsonrpc: string;
  result: {
    items: HeliusAsset[];
    total: number;
  };
  id: string;
}

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
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  active: boolean;
  yesVotes: number;
  noVotes: number;
  createdAt: Timestamp;
  endAt: Timestamp;
  outcome?: "accepted" | "rejected";
}

const DAOPageInner: React.FC = () => {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [votedNFTsByProposal, setVotedNFTsByProposal] = useState<{ [proposalId: string]: string[] }>({});
  const [selectedNFTs, setSelectedNFTs] = useState<{ [proposalId: string]: string[] }>({});
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDescription, setNewProposalDescription] = useState("");
  const [userData, setUserData] = useState<UserData>({ wallet: "", name: "Guest", pfp: "/default-pfp.png" });
  const isDataLoading = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalNFTSupply, setTotalNFTSupply] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"active" | "approved">("active");
  const [votingInProgress, setVotingInProgress] = useState<{ [proposalId: string]: boolean }>({});
  const [showMusicControls, setShowMusicControls] = useState(true);
  const marqueeRef = useRef<HTMLSpanElement>(null);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
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
  // Modal styling
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

  // Fetch total NFT supply for a compressed collection, excluding burned NFTs
  const fetchTotalNFTSupply = async () => {
    try {
      let page = 1;
      let totalSupply = 0;
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

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: HeliusResponse = await response.json();
        const items = result.result.items || [];
        const activeItems = items.filter((item) => item.burnt !== true);
        totalSupply += activeItems.length;

        if (items.length < 1000 || result.result.total < 1000) {
          hasMorePages = false;
        } else {
          page++;
        }
      }

      setTotalNFTSupply(totalSupply);
    } catch (error) {
      console.error("Error fetching total NFT supply:", error);
      toast.error("Failed to fetch total NFT supply");
      setTotalNFTSupply(0);
    }
  };

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
      fetchTotalNFTSupply();
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      toast.error("Failed to connect to database", {
        description: "Using local data instead.",
        duration: 3000,
      });
      setIsLoading(false);
    }
  }, []);

  // Fetch NFTs and user data when wallet connects
  useEffect(() => {
    if (connected && publicKey && !isDataLoading.current) {
      isDataLoading.current = true;
      setIsLoading(true);
      fetchNFTs(publicKey.toString()).then((nftList) => {
        fetchProposals();
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
            const userQuery = query(collection(firestore, "users"), where("wallet", "==", publicKey.toString()));
            getDocs(userQuery).then((userSnapshot) => {
              if (userSnapshot.empty) {
                setDoc(doc(collection(firestore, "users")), {
                  wallet: publicKey.toString(),
                  nfts: nftList.map((nft: NFT) => nft.mint),
                });
              }
            });
          });
        }
        toast.success("Wallet Connected", {
          description: "You can now participate in DAO voting.",
          duration: 3000,
        });
      }).catch((error) => {
        console.error("Error in wallet connection:", error);
        toast.error("Failed to load wallet data");
      }).finally(() => {
        setIsLoading(false);
        isDataLoading.current = false;
      });
    } else {
      setUserNFTs([]);
      setProposals([]);
      setVotedNFTsByProposal({});
      setSelectedNFTs({});
      setUserData({ wallet: "", name: "Guest", pfp: "/default-pfp.png" });
      isDataLoading.current = false;
    }
  }, [connected, publicKey, firestore]);

  // Fetch NFTs
  async function fetchNFTs(publicKey: string): Promise<NFT[]> {
    try {
      let page: number | null = 1;
      const ownedNFTs: NFT[] = [];

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
        if (result.result && result.result.items) {
          const ownedAssets = result.result.items.filter(
            (item: HeliusAsset) => item.ownership.owner === publicKey &&
            (item.burnt === false || item.burnt === undefined)
          );
          const metadataPromises = ownedAssets.map(async (asset: HeliusAsset) => {
            const metadataURI = asset.content?.json_uri || asset.uri || "";
            const metadata = await fetchNFTMetadata(metadataURI);
            return {
              mint: asset.id,
              name: metadata?.name || "Unknown NFT",
              image: metadata?.image || "/placeholder.svg",
            };
          });

          const nftsWithMetadata = await Promise.all(metadataPromises);
          ownedNFTs.push(...nftsWithMetadata);
        }

        page = result.result.total !== 1000 ? null : page + 1;
      }

      setUserNFTs(ownedNFTs);
      return ownedNFTs;
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast.error("Failed to fetch NFTs");
      return [];
    }
  }

  // Fetch NFT metadata
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

  // Fetch proposals and their vote counts
  const fetchProposals = async () => {
    if (!firestore) return;

    try {
      const proposalsSnapshot = await getDocs(collection(firestore, "proposals"));
      const proposalsList = [];
      for (const doc of proposalsSnapshot.docs) {
        const data = doc.data();
        const votesSnapshot = await getDocs(collection(firestore, `proposals/${doc.id}/votes`));
        const yesVotes = votesSnapshot.docs.filter((vote) => vote.data().voteYes).length;
        const noVotes = votesSnapshot.docs.length - yesVotes;
        const totalVotes = yesVotes + noVotes;

        const now = new Date();
        const endAtDate = data.endAt.toDate();
        let isActive = data.active && now < endAtDate;
        let outcome = data.outcome;

        if (now >= endAtDate && data.active) {
          isActive = false;
          const minVotesRequired = Math.floor(totalNFTSupply / 3);
          const majorityVotes = Math.floor(totalVotes / 2) + 1;

          if (totalNFTSupply <= 0) {
            outcome = "rejected";
          } else if (totalVotes < minVotesRequired) {
            outcome = "rejected";
          } else if (yesVotes >= majorityVotes) {
            outcome = "accepted";
          } else {
            outcome = "rejected";
          }

          await updateDoc(doc.ref, { active: false, outcome });
        }

        proposalsList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          active: isActive,
          yesVotes,
          noVotes,
          createdAt: data.createdAt,
          endAt: data.endAt,
          outcome,
        });
      }
      setProposals(proposalsList);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to fetch proposals");
    }
  };

  // Set up real-time listeners for votes
  useEffect(() => {
    if (!firestore || proposals.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    proposals.forEach((proposal) => {
      const votesQuery = query(collection(firestore, `proposals/${proposal.id}/votes`));
      const unsubscribe = onSnapshot(
        votesQuery,
        (snapshot) => {
          const votedNFTs = snapshot.docs.map((doc) => doc.data().nftMint);
          setVotedNFTsByProposal((prev) => ({
            ...prev,
            [proposal.id]: votedNFTs,
          }));
          const yesVotes = snapshot.docs.filter((doc) => doc.data().voteYes).length;
          const noVotes = snapshot.docs.length - yesVotes;
          setProposals((prevProposals) =>
            prevProposals.map((p) =>
              p.id === proposal.id ? { ...p, yesVotes, noVotes } : p
            )
          );
        },
        (error) => {
          console.error("Error in votes listener:", error);
          toast.error("Failed to listen for vote updates");
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [firestore, proposals]);

  // Check if an NFT has already voted
  const hasNFTVoted = async (proposalId: string, nftMint: string): Promise<boolean> => {
    if (!firestore) return false;

    try {
      const votesQuery = query(
        collection(firestore, `proposals/${proposalId}/votes`),
        where("nftMint", "==", nftMint)
      );
      const votesSnapshot = await getDocs(votesQuery);
      return !votesSnapshot.empty;
    } catch (error) {
      console.error("Error checking if NFT has voted:", error);
      return false;
    }
  };

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
          toast.error("Playback Failed", {
            description: "Could not play audio. Check console.",
            duration: 3000,
          });
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
          toast.error("Playback Failed", {
            description: "Could not play the new track.",
            duration: 3000,
          });
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

  const createProposal = async (title: string, description: string) => {
    if (!firestore || !connected || !publicKey) {
      toast.error("Wallet Not Connected");
      return;
    }

    if (userNFTs.length < MIN_NFTS_TO_CREATE_PROPOSAL) {
      toast.error(`You need at least ${MIN_NFTS_TO_CREATE_PROPOSAL} NFTs to create a proposal`);
      return;
    }

    const currentUfos = userData.ufos || 0;
    if (currentUfos < PROPOSAL_CREATION_COST) {
      toast.error(`Insufficient $UFOS. You need ${PROPOSAL_CREATION_COST} $UFOS to create a proposal`);
      return;
    }

    try {
      const newUfosBalance = currentUfos - PROPOSAL_CREATION_COST;
      await updateUserUfos(publicKey.toString(), newUfosBalance);

      const now = new Date();
      const endAt = new Date(now.getTime() + ONE_WEEK_IN_SECONDS * 1000);
      await addDoc(collection(firestore, "proposals"), {
        title,
        description,
        active: true,
        createdAt: Timestamp.fromDate(now),
        endAt: Timestamp.fromDate(endAt),
      });

      toast.success(`Proposal Created (-${PROPOSAL_CREATION_COST} $UFOS)`);
      fetchProposals();
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    }
  };

  const toggleNFTSelection = (proposalId: string, nftMint: string) => {
    setSelectedNFTs((prev) => {
      const selectedForProposal = prev[proposalId] || [];
      if (selectedForProposal.includes(nftMint)) {
        return {
          ...prev,
          [proposalId]: selectedForProposal.filter((mint) => mint !== nftMint),
        };
      } else {
        return {
          ...prev,
          [proposalId]: [...selectedForProposal, nftMint],
        };
      }
    });
  };

  const selectAllNFTs = (proposalId: string, select: boolean) => {
    setSelectedNFTs((prev) => {
      if (select) {
        const availableNFTs = userNFTs
          .filter((nft) => !(votedNFTsByProposal[proposalId] || []).includes(nft.mint))
          .map((nft) => nft.mint);
        return {
          ...prev,
          [proposalId]: availableNFTs,
        };
      } else {
        return {
          ...prev,
          [proposalId]: [],
        };
      }
    });
  };

  const submitVote = async (proposalId: string, voteYes: boolean) => {
    if (!firestore || !connected || !publicKey) {
      toast.error("Wallet Not Connected");
      return;
    }

    const selected = selectedNFTs[proposalId] || [];
    if (selected.length === 0) {
      toast.error("Please select at least one NFT to vote");
      return;
    }

    const totalVoteCost = selected.length * VOTE_COST_PER_NFT;
    const currentUfos = userData.ufos || 0;
    if (currentUfos < totalVoteCost) {
      toast.error(`Insufficient $UFOS. You need ${totalVoteCost} $UFOS to vote with ${selected.length} NFT(s)`);
      return;
    }

    setVotingInProgress((prev) => ({ ...prev, [proposalId]: true }));

    try {
      for (const nftMint of selected) {
        const hasVoted = await hasNFTVoted(proposalId, nftMint);
        if (hasVoted) {
          toast.error(`NFT ${nftMint.slice(0, 4)}... has already voted on this proposal`);
          return;
        }
      }

      const newUfosBalance = currentUfos - totalVoteCost;
      await updateUserUfos(publicKey.toString(), newUfosBalance);

      for (const nftMint of selected) {
        await addDoc(collection(firestore, `proposals/${proposalId}/votes`), {
          userWallet: publicKey.toString(),
          nftMint,
          voteYes,
        });
      }

      toast.success(`Voted ${voteYes ? "Yes" : "No"} with ${selected.length} NFT(s) (-${totalVoteCost} $UFOS)`);
      setSelectedNFTs((prev) => ({
        ...prev,
        [proposalId]: [],
      }));
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote");
    } finally {
      setVotingInProgress((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen cypherpunk-loading-container">
        <div className="text-center z-10">
          <div className="cypherpunk-spinner items-center text-center justify-center mx-auto mb-4"></div>
          <img src="/loading.gif" alt="Loading" className="w-128 h-128 mx-auto mb-4" />
          <p className="cypherpunk-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  const activeProposals = proposals.filter((p) => p.active);
  const approvedProposals = proposals.filter((p) => !p.active && p.outcome === "accepted");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white w-full max-w-full overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900/80 to-black/80 z-10"></div>
      <div className="relative z-20 flex flex-col min-h-screen">
        <Toaster richColors position="top-right" />
        <audio ref={audioRef} preload="auto" />
        <div className="flex flex-col items-center mb-4">
          <h1 className="flex items-center bg-gradient-to-r text-6xl font-semibold from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
            CRYPTO UFOS DAO
            <Vote className="ml-2 w-18 h-18 text-violet-500 cypherpunk-icon-glow" aria-hidden="true" />
          </h1>
        </div>
                    <div className="cyberpunk-wallet-controls">
              <WalletMultiButton className="w-full max-w-xs text-center items-center justify-center cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg" />
              </div>
        {/* Desktop Sidebar */}
        <div className="bg-gray-800/80 p-4 cypherpunk-border w-full max-w-full">
          <Card className="h-full rounded-none border-none bg-transparent">
            <CardContent className="p-6 flex flex-col items-center gap-6 text-white h-full">
              {userData.pfp && (
                <img
                  src={userData.pfp}
                  alt={userData.name || "Player"}
                  className="w-16 h-16 rounded-full border-2 border-golden-yellow/50 shadow-md shadow-golden-yellow/20"
                  onError={(e) => (e.currentTarget.src = "/default-pfp.png")}
                />
              )}
              <h2 className="text-xl font-bold text-green-500 text-center font-orbitron">{userData.name}</h2>
              <div className="flex items-center gap-2">
                <img src={GAME_ASSETS.ufoLogo} alt="UFO" className="w-8 h-8" />
                <h2 className="text-lg font-semibold text-blue-500 font-orbitron">
                  NFTs: <span className="text-blue-500">{userNFTs.length}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <img src={GAME_ASSETS.coin} alt="UFOS" className="w-8 h-8" />
                <h2 className="text-lg font-semibold text-yellow-500 font-orbitron">
                  $UFOS: <span className="text-yellow-500">{userData.ufos?.toLocaleString() || 0}</span>
                </h2>
              </div>
              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full max-w-xs cypherpunk-button cypherpunk-button-blue font-semibold py-2 rounded-lg"
              >
                Back to Main Page
              </Button>
            </CardContent>
          </Card>
          
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-8 max-w-4xl mx-auto">
          {/* Title and Wallet Buttons */}
          {/* DAO Content */}
          {connected && (
            <div className="flex flex-col items-center space-y-6">
              {/* Create New Proposal Card */}
              <Card className="bg-gray-800/90 backdrop-blur-md cypherpunk-border rounded-xl shadow-xl shadow-sky-blue/20 w-full max-w-2xl mx-auto mb-8">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold text-orange-500 mb-4 cypherpunk-glitch-text" data-text="Create New Proposal">
                    Create New Proposal
                  </h2>
                  <p className="text-sm text-gray-300 mb-4 font-orbitron">
                    Total NFT Supply: {totalNFTSupply.toLocaleString()} | Min Votes Required: {Math.floor(totalNFTSupply / 3).toLocaleString()}
                  </p>
                  <div className="space-y-4">
                    <Input
                      placeholder="Proposal Title"
                      value={newProposalTitle}
                      onChange={(e) => setNewProposalTitle(e.target.value)}
                      className="w-full bg-gray-900/50 border-sky-blue/50 text-white text-sm h-12 rounded-lg font-orbitron"
                    />
                    <Input
                      placeholder="Proposal Description"
                      value={newProposalDescription}
                      onChange={(e) => setNewProposalDescription(e.target.value)}
                      className="w-full bg-gray-900/50 border-sky-blue/50 text-white text-sm h-12 rounded-lg font-orbitron"
                    />
                    {userNFTs.length >= MIN_NFTS_TO_CREATE_PROPOSAL ? (
                      <Button
                        onClick={() => {
                          createProposal(newProposalTitle, newProposalDescription);
                          setNewProposalTitle("");
                          setNewProposalDescription("");
                        }}
                        disabled={!newProposalTitle || !newProposalDescription || (userData.ufos || 0) < PROPOSAL_CREATION_COST}
                        className="w-full cypherpunk-button cypherpunk-button-yellow text-white font-semibold py-3 rounded-lg font-orbitron"
                      >
                        Create Proposal ({PROPOSAL_CREATION_COST.toLocaleString()} $UFOS)
                      </Button>
                    ) : (
                      <p className="bg-gray-600 text-gray-400 font-semibold py-3 px-4 rounded-lg text-center cursor-not-allowed text-sm font-orbitron">
                        Need {MIN_NFTS_TO_CREATE_PROPOSAL} NFTs to Create
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-6 w-full max-w-2xl mx-auto">
                <Button
                  onClick={() => setActiveTab("active")}
                  className={`cypherpunk-button cypherpunk-button-blue text-white font-semibold py-2 px-3 md:px-4 rounded-lg font-orbitron flex-1 ${
                    activeTab === "active" ? "bg-blue-500" : "bg-gray-700/80 hover:bg-gray-600"
                  }`}
                >
                  Active ({activeProposals.length})
                </Button>
                <Button
                  onClick={() => setActiveTab("approved")}
                  className={`cypherpunk-button cypherpunk-button-green text-white font-semibold py-2 px-3 md:px-4 rounded-lg font-orbitron flex-1 ${
                    activeTab === "approved" ? "bg-green-500" : "bg-gray-700/80 hover:bg-gray-600"
                  }`}
                >
                  Approved ({approvedProposals.length})
                </Button>
              </div>

              {/* Proposals List */}
              <div className="space-y-6 w-full max-w-2xl mx-auto">
                {activeTab === "active" ? (
                  activeProposals.length === 0 ? (
                    <p className="text-gray-300 text-center font-orbitron">No active proposals available.</p>
                  ) : (
                    activeProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        totalNFTSupply={totalNFTSupply}
                        userNFTs={userNFTs}
                        selectedNFTs={selectedNFTs}
                        votedNFTsByProposal={votedNFTsByProposal}
                        toggleNFTSelection={toggleNFTSelection}
                        selectAllNFTs={selectAllNFTs}
                        submitVote={submitVote}
                        userData={userData}
                        isVoting={votingInProgress[proposal.id] || false}
                      />
                    ))
                  )
                ) : (
                  approvedProposals.length === 0 ? (
                    <p className="text-gray-300 text-center font-orbitron">No approved proposals yet.</p>
                  ) : (
                    approvedProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        totalNFTSupply={totalNFTSupply}
                        userNFTs={userNFTs}
                        selectedNFTs={selectedNFTs}
                        votedNFTsByProposal={votedNFTsByProposal}
                        toggleNFTSelection={toggleNFTSelection}
                        selectAllNFTs={selectAllNFTs}
                        submitVote={submitVote}
                        userData={userData}
                        isVoting={votingInProgress[proposal.id] || false}
                      />
                    ))
                  )
                )}
              </div>
            </div>
          )}
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
    </div>
  );
};

function ProposalCard({
  proposal,
  totalNFTSupply,
  userNFTs,
  selectedNFTs,
  votedNFTsByProposal,
  toggleNFTSelection,
  selectAllNFTs,
  submitVote,
  userData,
  isVoting,
}: {
  proposal: Proposal;
  totalNFTSupply: number;
  userNFTs: NFT[];
  selectedNFTs: { [proposalId: string]: string[] };
  votedNFTsByProposal: { [proposalId: string]: string[] };
  toggleNFTSelection: (proposalId: string, nftMint: string) => void;
  selectAllNFTs: (proposalId: string, select: boolean) => void;
  submitVote: (proposalId: string, voteYes: boolean) => Promise<void>;
  userData: UserData;
  isVoting: boolean;
}) {
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const minVotesRequired = Math.floor(totalNFTSupply / 3);
  const majorityVotes = Math.floor(totalVotes / 2) + 1;

  const getTimeRemaining = (endAt: Timestamp): string => {
    const now = new Date();
    const endDate = endAt.toDate();
    const diffInSeconds = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));
    const days = Math.floor(diffInSeconds / (24 * 60 * 60));
    const hours = Math.floor((diffInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
    const seconds = diffInSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const availableNFTsCount = userNFTs.filter(
    (nft) => !(votedNFTsByProposal[proposal.id] || []).includes(nft.mint)
  ).length;
  const selectedCount = (selectedNFTs[proposal.id] || []).length;
  const allSelected = selectedCount === availableNFTsCount && availableNFTsCount > 0;

  return (
    <Card className="bg-gray-800/90 backdrop-blur-md cypherpunk-border rounded-xl shadow-xl shadow-sky-blue/20 w-full relative">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-xl font-semibold text-yellow-500 mb-2 cypherpunk-glitch-text" data-text={proposal.title}>
          {proposal.title}
        </h3>
        <p className="text-sm text-gray-300 mb-4 font-orbitron">{proposal.description}</p>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm mb-4 font-orbitron">
          <div className="mb-2 md:mb-0">
            <p className="text-green-400">Yes: {proposal.yesVotes}</p>
            <p className="text-red-400">No: {proposal.noVotes}</p>
            <p className="text-gray-300">
              Total Votes: {totalVotes} / {minVotesRequired} required
            </p>
          </div>
          {proposal.active ? (
            <p className="text-white">Time: {getTimeRemaining(proposal.endAt)}</p>
          ) : (
            <p className="text-yellow-500">
              Ended: {proposal.outcome === "accepted" ? "Accepted" : "Rejected"}
            </p>
          )}
        </div>

        {proposal.active && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-medium text-white font-orbitron">Select NFTs to Vote</h4>
              <Button
                onClick={() => selectAllNFTs(proposal.id, !allSelected)}
                disabled={isVoting || availableNFTsCount === 0}
                className="cypherpunk-button cypherpunk-button-blue text-white text-sm py-2 px-4 rounded-lg font-orbitron"
              >
                {allSelected ? "Deselect All" : "Select All"} ({availableNFTsCount})
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {userNFTs.map((nft) => (
                <NFTVoteItem
                  key={nft.mint}
                  nft={nft}
                  proposalId={proposal.id}
                  isSelected={(selectedNFTs[proposal.id] || []).includes(nft.mint)}
                  hasVoted={(votedNFTsByProposal[proposal.id] || []).includes(nft.mint)}
                  onToggle={() => toggleNFTSelection(proposal.id, nft.mint)}
                />
              ))}
            </div>
            <div className="mt-4 flex gap-3 flex-wrap">
              <Button
                onClick={() => submitVote(proposal.id, true)}
                disabled={
                  isVoting ||
                  (selectedNFTs[proposal.id] || []).length === 0 ||
                  (userData.ufos || 0) < (selectedNFTs[proposal.id] || []).length * VOTE_COST_PER_NFT
                }
                className="cypherpunk-button cypherpunk-button-green text-white font-semibold py-3 px-6 rounded-lg font-orbitron flex-1 min-w-[120px]"
              >
                {isVoting ? "Voting..." : `Vote Yes (${(selectedNFTs[proposal.id] || []).length * VOTE_COST_PER_NFT} $UFOS)`}
              </Button>
              <Button
                onClick={() => submitVote(proposal.id, false)}
                disabled={
                  isVoting ||
                  (selectedNFTs[proposal.id] || []).length === 0 ||
                  (userData.ufos || 0) < (selectedNFTs[proposal.id] || []).length * VOTE_COST_PER_NFT
                }
                className="cypherpunk-button cypherpunk-button-red text-white font-semibold py-3 px-6 rounded-lg font-orbitron flex-1 min-w-[120px]"
              >
                {isVoting ? "Voting..." : `Vote No (${(selectedNFTs[proposal.id] || []).length * VOTE_COST_PER_NFT} $UFOS)`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {isVoting && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-blue"></div>
            <p className="text-white font-semibold font-orbitron">Voting...</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function NFTVoteItem({
  nft,
  proposalId,
  isSelected,
  hasVoted,
  onToggle,
}: {
  nft: NFT;
  proposalId: string;
  isSelected: boolean;
  hasVoted: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <img
          src={nft.image}
          alt={nft.name}
          className={`w-20 h-20 rounded border-2 border-golden-yellow/50 ${hasVoted ? "opacity-50" : ""}`}
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        {hasVoted && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded px-1 font-orbitron">
            Used
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mt-2 gap-2 w-full">
        <p className="text-xs text-gray-300 line-clamp-2 text-center flex-1 font-orbitron">{nft.name}</p>
        {!hasVoted && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-5 h-5 accent-blue-500"
          />
        )}
      </div>
    </div>
  );
}

export default function DAOPage() {
  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <DAOPageInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );

}
