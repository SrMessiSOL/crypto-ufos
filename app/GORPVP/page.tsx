"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
  setDoc,
  doc,
  getDocs,
  increment,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { Toaster, toast } from "sonner";
import axios from "axios";
import bs58 from "bs58";
import {
  useWallet,
  useConnection,
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CloverWalletAdapter,
  AlphaWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Swords, Info, ChevronDown, ChevronUp } from "lucide-react";
import "./BettingGame.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@solana/wallet-adapter-react-ui/styles.css";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Solana setup
const endpoint = "https://rpc.gorbagana.wtf";
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // Optionally include legacy adapters if needed
  // new CloverWalletAdapter(),
  // new AlphaWalletAdapter(),
];
const SERVER_WALLET = new PublicKey(
  "BTwMeqRYsnME4jpLFWgCePmBQzPYpciCb19o4gw1BaHG"
);
const ROUND_DURATION = 1200;
const MAX_RETRIES = 1;
const TRANSACTION_RETRIES = 1;
const PRICE_PRECISION = 5;
const BETTING_CUTOFF_SECONDS = 90;
const COINGECKO_TOKEN_ID = "gorbagana";
const CONNECTION_TIMEOUT = 10000;
const MODAL_DEBOUNCE_MS = 100;

// TypeScript interfaces
interface Round {
  id: string;
  roundId: number;
  startPrice: number;
  endPrice?: number | null | undefined;
  startTime: string;
  endTime?: string;
  totalPool: number;
  draw?: boolean;
  distributed?: boolean;
}

interface Bet {
  walletAddress: string;
  amount: number;
  prediction: boolean;
  roundId: string; // New
  timestamp: string; // New
  transactionSignature: string; // New
  userId?: string; // New, optional if distinct from walletAddress
}

interface BetNotification {
  id: string;
  walletAddress: string;
  amount: number;
  prediction: boolean;
  color: string;
}

// Utility function to format ISO timestamps
const formatTimestamp = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Date";
  }
};

// Utility function to generate a random color
const getRandomColor = () => {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Cyan
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEEAD", // Yellow
    "#D4A5A5", // Pink
    "#9B59B6", // Purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Bet Notification Modal Component
interface BetNotificationModalProps {
  walletAddress: string;
  amount: number;
  prediction: boolean;
  color: string;
}

const BetNotificationModal: React.FC<BetNotificationModalProps> = ({
  walletAddress,
  amount,
  prediction,
  color,
}) => {
  const truncatedWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  return (
    <div
      className="bet-notification-modal"
      style={{ backgroundColor: color }}
      role="alert"
      aria-live="polite"
    >
      <p className="bet-notification-text">
        <span className="bet-notification-wallet">{truncatedWallet}</span> bet{" "}
        <span className="bet-notification-amount">{amount.toFixed(2)} $GOR</span> on{" "}
        <span className="bet-notification-prediction">{prediction ? "Up" : "Down"}</span>
      </p>
    </div>
  );
};

// Rules Modal Component
const RulesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}> = ({ isOpen, onClose, setStatus }) => {
  useEffect(() => {
    if (isOpen) {
    }
  }, [isOpen, setStatus]);

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="rules-modal-title">How to Play $GOR PVP</h2>
        <div className="rules-modal-content">
          <p>Welcome to $GOR PVP, a thrilling price prediction game on the Solana blockchain!</p>
          <h3>Game Rules:</h3>
          <ul>
            <li><strong>Objective</strong>: Predict whether the $GOR price will go <strong>Up</strong> or <strong>Down</strong> by the end of a 5-minute round.</li>
            <li><strong>Round Duration</strong>: Each round lasts 5 minutes (300 seconds).</li>
            <li><strong>Betting</strong>:
              <ul>
                <li>Bet between 0.01 and 0.1 $GOR per bet, with a maximum of 100 $GOR total per wallet per round.</li>
                <li>Choose "Up" (price will increase) or "Down" (price will decrease).</li>
              </ul>
            </li>
            <li><strong>Payouts</strong>:
              <ul>
                <li>If the $GOR price increases, "Up" bets win; if it decreases, "Down" bets win.</li>
                <li>If the price stays the same (draw), all bets are refunded.</li>
                <li>If all bets are on the same prediction, all bets are refunded.</li>
                <li>Winners get their original bet back plus a share of the losing pool, minus a 2.5% fee.</li>
                <li>Unmatched bets (if Up and Down pools are unequal) are partially refunded.</li>
              </ul>
            </li>
            <li><strong>Price Source</strong>: $GOR price is sourced from CoinGecko at the start and end of each round.</li>
            <li><strong>Wallet</strong>: Connect a Solana wallet (e.g., Phantom, Solflare) to place bets and receive payouts.</li>
          </ul>
          <p>Good luck, and may your predictions be profitable!</p>
        </div>
        <button className="rules-modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const BettingGame: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected, wallet, disconnect, connecting } =
    useWallet();
  const { setVisible, visible } = useWalletModal();
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_DURATION);
  const [amount, setAmount] = useState<string>("");
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string>("");
  const [retryPriceFetch, setRetryPriceFetch] = useState(0);
  const [isBettingLoading, setIsBettingLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const [lastRoundId, setLastRoundId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isPreRound, setIsPreRound] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [expandedRounds, setExpandedRounds] = useState<{ [key: string]: boolean }>({});
  const [roundBets, setRoundBets] = useState<{
    [key: string]: { upCount: number; downCount: number; upTotal: number; downTotal: number };
  }>({});
  const [currentRoundBets, setCurrentRoundBets] = useState<{
    upTotal: number;
    downTotal: number;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [recentBets, setRecentBets] = useState<BetNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<BetNotification | null>(null);
  const PAGE_SIZE = 10;

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!connected || !publicKey) {
      setWalletBalance(null);
      return;
    }
    try {
      const balance = await connection.getBalance(publicKey);
      const balanceInGor = balance / 1e9;
      setWalletBalance(balanceInGor);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(null);
    }
  };

  // Attempt to connect wallet with timeout and backoff
  const attemptWalletConnection = async (adapter: any, attempt: number = 1) => {
    setIsConnecting(true);
    setConnectionAttempts(attempt);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out")), CONNECTION_TIMEOUT)
    );

    try {
      await Promise.race([adapter.connect(), timeoutPromise]);
      setIsConnecting(false);
      setConnectionAttempts(0);
      setVisible(false);
    } catch (error: any) {
      console.error(`Connection to ${adapter.name} failed (attempt ${attempt}):`, error);
      let errorMessage = error.message || "Unknown error";
      if (errorMessage.includes("timed out")) {
        errorMessage = `${adapter.name} connection timed out.`;
      } else if (errorMessage.includes("not installed")) {
        errorMessage = `${adapter.name} extension not installed. Please install it.`;
      } else if (errorMessage.includes("locked")) {
        errorMessage = `${adapter.name} wallet is locked. Please unlock it.`;
      }
      setIsConnecting(false);

      if (attempt < 3) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(`Retrying connection to ${adapter.name}, attempt ${attempt + 1} after ${backoff}ms`);
        setTimeout(() => attemptWalletConnection(adapter, attempt + 1), backoff);
      } else {
        setConnectionAttempts(0);
        setVisible(false);
      }
    }
  };

  // Fetch bets for a specific round
  const fetchBetsForRound = async (roundId: string) => {
    try {
      const betsRef = collection(db, "rounds", roundId, "bets");
      const betsSnapshot = await getDocs(betsRef);
      const bets = betsSnapshot.docs.map((doc) => doc.data() as Bet);
      const upBets = bets.filter((bet) => bet.prediction);
      const downBets = bets.filter((bet) => !bet.prediction);
      const upCount = upBets.length;
      const downCount = downBets.length;
      const upTotal = upBets.reduce((sum, bet) => sum + bet.amount, 0);
      const downTotal = downBets.reduce((sum, bet) => sum + bet.amount, 0);
      setRoundBets((prev) => ({
        ...prev,
        [roundId]: { upCount, downCount, upTotal, downTotal },
      }));
    } catch (error) {
      console.error(`Error fetching bets for round ${roundId}:`, error);
    }
  };

  // Fetch bets for current round in real-time and queue notifications
  useEffect(() => {
    if (!currentRound) {
      setCurrentRoundBets(null);
      setRecentBets([]);
      setCurrentNotification(null);
      return;
    }
    const betsRef = collection(db, "rounds", currentRound.id, "bets");
    let previousBets: string[] = [];
    const unsubscribe = onSnapshot(
      betsRef,
      (snapshot) => {
        const bets = snapshot.docs.map((doc) => doc.data() as Bet);
        const upBets = bets.filter((bet) => bet.prediction);
        const downBets = bets.filter((bet) => !bet.prediction);
        const upTotal = upBets.reduce((sum, bet) => sum + bet.amount, 0);
        const downTotal = downBets.reduce((sum, bet) => sum + bet.amount, 0);
        setCurrentRoundBets({ upTotal, downTotal });

        // Detect new bets and add to queue
        const currentBetIds = snapshot.docs.map((doc) => doc.id);
        const newBets = snapshot.docChanges().filter((change) => change.type === "added");
        newBets.forEach((change) => {
          const bet = change.doc.data() as Bet;
          const betId = change.doc.id;
          if (!previousBets.includes(betId)) {
            const newNotification: BetNotification = {
              id: betId,
              walletAddress: bet.walletAddress,
              amount: bet.amount,
              prediction: bet.prediction,
              color: getRandomColor(),
            };
            setRecentBets((prev) => [...prev, newNotification]);
          }
        });
        previousBets = currentBetIds;
      },
      (error) => {
        console.error(`Error listening to bets for round ${currentRound.id}:`, error);
        setCurrentRoundBets({ upTotal: 0, downTotal: 0 });
      }
    );

    return () => unsubscribe();
  }, [currentRound]);

  // Process notification queue
  useEffect(() => {
    if (!recentBets.length || currentNotification) return;

    const timer = setInterval(() => {
      if (!currentNotification && recentBets.length) {
        setCurrentNotification(recentBets[0]);
        setRecentBets((prev) => prev.slice(1));
        setTimeout(() => {
          setCurrentNotification(null);
        }, 300); // Display for 1 second
      }
    }, 300);

    return () => clearInterval(timer);
  }, [recentBets, currentNotification]);

  // Toggle round expansion
  const toggleRoundDetails = (roundId: string) => {
    setExpandedRounds((prev) => {
      const isExpanded = !prev[roundId];
      if (isExpanded && !roundBets[roundId]) {
        fetchBetsForRound(roundId);
      }
      return { ...prev, [roundId]: isExpanded };
    });
  };

  // Fetch balance when wallet connects or changes
  useEffect(() => {
    fetchWalletBalance();
  }, [publicKey, connected]);

  // Add keyboard accessibility for RulesModal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRulesModalOpen(false);
      }
    };
    if (isRulesModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRulesModalOpen]);

  // Customize wallet modal styles with debouncing
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

  // Fetch token price from CoinGecko
  const fetchSolPrice = async (): Promise<number> => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_TOKEN_ID}&vs_currencies=usd`
      );
      const tokenPrice = Number(response.data[COINGECKO_TOKEN_ID].usd.toFixed(PRICE_PRECISION));
      if (tokenPrice <= 0) {
        throw new Error("Invalid price received from CoinGecko");
      }
      return tokenPrice;
    } catch (error) {
      console.error("CoinGecko fetch failed:", error);
      throw new Error(`Failed to fetch ${COINGECKO_TOKEN_ID} price: ${(error as Error).message}`);
    }
  };

  // Initialize new round
  const fetchPriceAndInitializeRound = async () => {
    const roundsRef = collection(db, "rounds");
    try {
      const snapshot = await getDocs(roundsRef);
      if (snapshot.empty || !snapshot.docs.some((doc) => doc.data().endPrice == null)) {
        setStatus("Initializing new round...");
        setIsLoading(true);
        try {
          const solPrice = await fetchSolPrice();
          const latestRound = snapshot.docs
            .map((doc) => doc.data() as Round)
            .sort((a, b) => b.roundId - a.roundId)[0];
          const newRoundId = latestRound ? latestRound.roundId + 1 : 1;
          const newRound: Round = {
            id: newRoundId.toString(),
            roundId: newRoundId,
            startPrice: solPrice,
            endPrice: null,
            startTime: Timestamp.now().toDate().toISOString(),
            totalPool: 0,
            distributed: false,
          };
          await setDoc(doc(roundsRef, newRoundId.toString()), newRound);
          setStatus("New round initialized");
        } catch (error) {
          console.error("Error initializing new round:", error);
          setStatus("Failed to initialize round. Click Retry to try again.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error querying Firestore:", error);
      setStatus("Error accessing Firestore. Please try again.");
    }
  };

  const loadMoreRounds = async () => {
    if (!hasMore) return;
    setIsLoading(true);
    try {
      const roundsRef = collection(db, "rounds");
      const snapshot = await getDocs(roundsRef);
      const rounds: Round[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Round))
        .filter((round) => round.endPrice != null && round.roundId < lastRoundId!)
        .sort((a, b) => b.roundId - a.roundId)
        .slice(0, PAGE_SIZE);
      setPastRounds((prev) => [...prev, ...rounds]);
      if (rounds.length > 0) {
        setLastRoundId(rounds[rounds.length - 1].roundId);
        setHasMore(rounds.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      await fetchWalletBalance();
    } catch (error) {
      console.error("Error loading more rounds:", error);
      setStatus("Failed to load more rounds");
    } finally {
      setIsLoading(false);
    }
  };

  // Firestore listener
  useEffect(() => {
    const roundsQuery = collection(db, "rounds");
    let debounceTimeout: NodeJS.Timeout;
    const unsubscribe = onSnapshot(
      roundsQuery,
      (snapshot) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          const rounds: Round[] = snapshot.docs
            .map((doc: QueryDocumentSnapshot<DocumentData>) => {
              const data = doc.data();
              return { id: doc.id, ...data } as Round;
            })
            .filter((round) => {
              const isValid =
                round.roundId !== undefined &&
                typeof round.startPrice === "number" &&
                typeof round.startTime === "string";
              return isValid;
            });

          const current = rounds.filter((round) => round.endPrice == null).sort((a, b) => b.roundId - a.roundId)[0];
          setCurrentRound((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(current)) {
              if (current) {
                const startTime = new Date(current.startTime);
                const now = new Date();
                const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                const remainingSeconds = ROUND_DURATION - elapsedSeconds;
                setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
                setIsPreRound(elapsedSeconds < 0);
                setStatus(elapsedSeconds < 0 ? `Round #${current.roundId} starts in ${Math.abs(elapsedSeconds)} seconds` : "");
              }
              return current || null;
            }
            return prev;
          });

          const past = rounds
            .filter((round) => round.endPrice != null)
            .sort((a, b) => b.roundId - a.roundId)
            .slice(0, PAGE_SIZE);
          setPastRounds(past);

          if (past.length > 0) {
            setLastRoundId(past[past.length - 1].roundId);
            setHasMore(past.length === PAGE_SIZE);
          } else {
            setHasMore(false);
          }

          if (!current && rounds.length === 0) {
            setStatus("Waiting for rounds to start...");
            fetchPriceAndInitializeRound();
          }
        }, 100);
      },
      (error) => {
        console.error("Firestore error:", error);
        setStatus("Error loading rounds");
      }
    );

    return () => {
      clearTimeout(debounceTimeout);
      unsubscribe();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentRound) {
        const startTime = new Date(currentRound.startTime);
        if (isNaN(startTime.getTime())) {
          console.error("Invalid startTime:", currentRound.startTime);
          setStatus("Error: Invalid round start time");
          setTimeLeft(ROUND_DURATION);
          setIsPreRound(false);
          return;
        }
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        let remainingSeconds = ROUND_DURATION - elapsedSeconds;

        if (elapsedSeconds < 0) {
          setIsPreRound(true);
          setTimeLeft(ROUND_DURATION);
          setStatus(`Round #${currentRound.roundId} starts in ${Math.abs(elapsedSeconds)} seconds`);
        } else {
          setIsPreRound(false);
          if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            setStatus("Round ended, initializing new round...");
            fetchPriceAndInitializeRound();
          } else if (remainingSeconds > ROUND_DURATION) {
            console.warn("Remaining seconds exceeds ROUND_DURATION, resetting:", remainingSeconds);
            remainingSeconds = ROUND_DURATION;
          }
          setTimeLeft(remainingSeconds);
        }
      } else {
        setTimeLeft(ROUND_DURATION);
        setIsPreRound(false);
        setStatus("Waiting for rounds to start...");
        fetchPriceAndInitializeRound();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  // Initial round check
  useEffect(() => {
    fetchPriceAndInitializeRound();
  }, [retryPriceFetch]);

  // Place bet
  const placeBet = async () => {
    const messageCache: { [key: string]: number } = {};
    const MESSAGE_TIMEOUT = 5000;

    const showMessage = (message: string, isError: boolean = false) => {
      const now = Date.now();
      Object.keys(messageCache).forEach((key) => {
        if (now - messageCache[key] > MESSAGE_TIMEOUT) {
          delete messageCache[key];
        }
      });
      if (!messageCache[message]) {
        messageCache[message] = now;
        setStatus(message);
        if (isError) {
          console.error(message);
        } else {
        }
      }
    };

    if (!connected || !publicKey) {
      showMessage("Please connect your wallet", true);
      return;
    }
    if (!amount || isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      showMessage("Enter a valid amount", true);
      return;
    }
    if (prediction === null) {
      showMessage("Select Up or Down", true);
      return;
    }
    if (!currentRound || timeLeft <= 0) {
      showMessage("No active round available", true);
      return;
    }
    if (timeLeft <= BETTING_CUTOFF_SECONDS) {
      return;
    }

    const betAmount = Number.parseFloat(amount);
    const MIN_BET = 0.01;
    const MAX_BET_PER_WALLET = 100;

    if (betAmount < MIN_BET) {
      showMessage(`Bet amount must be at least ${MIN_BET} $GOR`, true);
      return;
    }

    try {
      const betsRef = collection(db, "rounds", currentRound.id, "bets");
      const betsSnapshot = await getDocs(betsRef);
      const walletBets = betsSnapshot.docs
        .map((doc) => doc.data() as Bet)
        .filter((bet) => bet.walletAddress === publicKey.toString());
      const totalWalletBets = walletBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (totalWalletBets + betAmount > MAX_BET_PER_WALLET) {
        showMessage(
          `Total bets cannot exceed ${MAX_BET_PER_WALLET} $GOR. You have bet ${totalWalletBets} $GOR.`,
          true
        );
        return;
      }
    } catch (error) {
      console.error("Error checking wallet bets:", error);
      showMessage("Error validating bet amount", true);
      return;
    }

    setIsBettingLoading(true);

    try {
      if (!signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      let signature: string | undefined;
      let attempts = 0;
      const BLOCKHASH_VALIDITY_BUFFER = 20;
      const MAX_BLOCKHASH_AGE_MS = 30000;

      while (attempts < TRANSACTION_RETRIES) {
        attempts++;
        try {
          const blockhashFetchTime = Date.now();
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

          const currentBlockHeight = await connection.getBlockHeight("finalized");
          if (currentBlockHeight >= lastValidBlockHeight - BLOCKHASH_VALIDITY_BUFFER) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          if (Date.now() - blockhashFetchTime > MAX_BLOCKHASH_AGE_MS) {
            continue;
          }

          const instruction = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: SERVER_WALLET,
            lamports: Math.floor(betAmount * 1e9),
          });

          const messageV0 = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions: [instruction],
          }).compileToV0Message();

          const transaction = new VersionedTransaction(messageV0);

          const signedTransaction = await signTransaction(transaction);

          if (Date.now() - blockhashFetchTime > MAX_BLOCKHASH_AGE_MS) {
            continue;
          }

          signature = await connection.sendTransaction(signedTransaction, {
            skipPreflight: false,
            maxRetries: 3,
          });

          let confirmationAttempts = 0;
          const maxConfirmationAttempts = 30;
          while (confirmationAttempts < maxConfirmationAttempts) {
            const status = await connection.getSignatureStatus(signature);
            if (status.value?.confirmationStatus === "finalized") {
              break;
            }
            if (status.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            confirmationAttempts++;
          }

          if (confirmationAttempts >= maxConfirmationAttempts) {
            throw new Error("Transaction confirmation timed out");
          }

          break;
        } catch (error: any) {
          console.error(`Transaction attempt ${attempts} failed:`, error);
          const errorMessage = error.message || "Unknown error";

          if (
            errorMessage.includes("Blockhash not found") ||
            errorMessage.includes("block height exceeded") ||
            errorMessage.includes("Transaction expired")
          ) {
            showMessage(`Retrying transaction (attempt ${attempts + 1}/${TRANSACTION_RETRIES})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          throw error;
        }
      }

      if (!signature) {
      throw new Error(`Failed to send transaction after ${TRANSACTION_RETRIES} retries`);
    }

    // Create the bet object with all required fields
    const bet: Bet = {
      walletAddress: publicKey.toString(),
      amount: betAmount,
      prediction,
      roundId: currentRound.id, // Add roundId
      timestamp: Timestamp.now().toDate().toISOString(), // Add timestamp
      transactionSignature: signature, // Add transaction signature
      userId: publicKey.toString(), // Use walletAddress as userId, or replace with actual userId if available
    };

    const roundRef = doc(db, "rounds", currentRound.id);
    const betsRef = collection(roundRef, "bets");
    const betRef = doc(betsRef);

    showMessage("Recording bet in database...");
    await runTransaction(db, async (transaction) => {
      transaction.set(betRef, bet);
      transaction.update(roundRef, {
        totalPool: increment(betAmount),
      });
    });

    showMessage("Bet placed successfully!");
    setAmount("");
    setPrediction(null);
    await fetchWalletBalance();
  } catch (error: any) {
    console.error("Bet failed:", error);
    let errorMessage = error.message || "Unknown error";
    if (error.logs) {
      errorMessage += ` (Logs: ${JSON.stringify(error.logs)})`;
    }
    showMessage("Bet failed. Try again.", true);
  } finally {
    setIsBettingLoading(false);
  }
};

  return (
    <div className="cyberpunk-container">
      {currentNotification && (
        <BetNotificationModal
          walletAddress={currentNotification.walletAddress}
          amount={currentNotification.amount}
          prediction={currentNotification.prediction}
          color={currentNotification.color}
        />
      )}
      <Toaster richColors position="top-right" />
      <header className="cyberpunk-header">
        <h1 className="flex items-center cyberpunk-title justify-center bg-gradient-to-r text-12xl font-bold from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent font-orbitron animate-pulse">
          <Swords className="ml-2 w-18 h-18 text-violet-500 cypherpunk-icon-glow" />
          $GOR PVP
          <Swords className="ml-2 w-18 h-18 text-violet-500 cypherpunk-icon-glow" />
        </h1>
        <h2 className="flex items-center cyberpunk-title2 justify-center bg-gradient-to-r text-4xl font-bold from-green-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-orbitron animate-pulse">
          Make your Bet
        </h2>
      </header>

      <div className="cyberpunk-wallet-controls">
        {connected && publicKey ? (
          <div className="cyberpunk-wallet-connected">
            <span className="cyberpunk-data-item">
              Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
            <button
              className="cyberpunk-button cyberpunk-button-disconnect"
              onClick={async () => {
                try {
                  await disconnect();
                  setIsConnecting(false);
                } catch (error) {
                  console.error("Disconnect failed:", error);
                }
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="cyberpunk-wallet-connect">
            <button
              className="cyberpunk-button cyberpunk-button-wallet"
              onClick={() => {
                setVisible(true);
                setIsConnecting(true);
              }}
              disabled={isConnecting || connecting}
              aria-label="Choose a wallet"
            >
              {isConnecting || connecting ? "Connecting..." : "Choose a Wallet"}
            </button>
            {isConnecting && (
              <span className="cyberpunk-loading-spinner">🔄</span>
            )}
          </div>
        )}
        <button
          className="cyberpunk-button cyberpunk-button-rules"
          onClick={() => setIsRulesModalOpen(true)}
        >
          <Info className="w-5 h-5 mr-2" />
          Rules
        </button>
        {connected && publicKey && (
          <p className="cyberpunk-data-item">
            Wallet Balance: {walletBalance !== null ? `${walletBalance.toFixed(4)} $GOR` : "Loading..."}
          </p>
        )}
      </div>

      <section className="round-info-section">
        {currentRound ? (
          <div className="round-info-grid-container">
            <div className="round-info-grid-header">
              <h3 className="round-info-grid-title" aria-label={`Round ${currentRound.roundId}`}>
                Round #{currentRound.roundId}
              </h3>
              <p className="round-info-grid-time" aria-label={`Time left: ${Math.floor(timeLeft / 60)} minutes ${(timeLeft % 60).toString().padStart(2, "0")} seconds`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </p>
            </div>
            <div className="round-info-grid">
              <div className="round-info-grid-item">
                <span className="round-info-grid-label">Start Price</span>
                <span className="round-info-grid-value">${currentRound.startPrice.toFixed(PRICE_PRECISION)}</span>
              </div>
              <div className="round-info-grid-item">
                <span className="round-info-grid-label">Total Pool</span>
                <span className="round-info-grid-value">{currentRound.totalPool.toFixed(2)} $GOR</span>
              </div>
              <div className="round-info-grid-item">
                <span className="round-info-grid-label">Started</span>
                <span className="round-info-grid-value">{formatTimestamp(currentRound.startTime)}</span>
              </div>
              {currentRoundBets ? (
                <>
                  <div className="round-info-grid-item">
                    <span className="round-info-grid-label">Up Total Bets</span>
                    <span className="round-info-grid-value">{currentRoundBets.upTotal.toFixed(2)} $GOR</span>
                  </div>
                  <div className="round-info-grid-item">
                    <span className="round-info-grid-label">Down Total Bets</span>
                    <span className="round-info-grid-value">{currentRoundBets.downTotal.toFixed(2)} $GOR</span>
                  </div>
                </>
              ) : (
                <div className="round-info-grid-item">
                  <span className="round-info-grid-label">Bet Totals</span>
                  <span className="round-info-grid-value">Loading...</span>
                </div>
              )}
              {currentRound.endPrice != null && (
                <div className="round-info-grid-item">
                  <span className="round-info-grid-label">End Price</span>
                  <span className="round-info-grid-value">${currentRound.endPrice.toFixed(PRICE_PRECISION)}</span>
                </div>
              )}
              {currentRound.endTime && (
                <div className="round-info-grid-item">
                  <span className="round-info-grid-label">Ended</span>
                  <span className="round-info-grid-value">{formatTimestamp(currentRound.endTime)}</span>
                </div>
              )}
              {currentRound.draw != null && (
                <div className="round-info-grid-item">
                  <span className="round-info-grid-label">Outcome</span>
                  <span className="round-info-grid-value">
                    {currentRound.draw ? "Draw" : currentRound.endPrice! > currentRound.startPrice ? "Up" : "Down"}
                  </span>
                </div>
              )}
              {currentRound.distributed != null && (
                <div className="round-info-grid-item">
                  <span className="round-info-grid-label">Status</span>
                  <span className="round-info-grid-value">
                    {currentRound.distributed ? (currentRound.draw ? "Refunded" : "Distributed") : "Pending"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="round-info-error-container">
            <p className="round-info-error-text">{status || "Initializing neural network..."}</p>
            {status.includes("Failed") && (
              <button
                onClick={() => setRetryPriceFetch((prev) => prev + 1)}
                disabled={isLoading}
                className="round-info-retry-button"
              >
                Retry Sync
              </button>
            )}
          </div>
        )}
      </section>

      {connected && currentRound && (
        <section className="cyberpunk-betting-interface">
          {timeLeft > BETTING_CUTOFF_SECONDS || isPreRound ? (
            isBettingLoading ? (
              <p className="cyberpunk-status">Processing bet...</p>
            ) : (
              <>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter $GOR (0.01-0.1)"
                  step="0.01"
                  min="0.01"
                  max="0.1"
                  disabled={isBettingLoading}
                  className="cyberpunk-input"
                />
                <div className="cyberpunk-prediction-controls">
                  <button
                    onClick={() => setPrediction(true)}
                    className={`cyberpunk-button cyberpunk-button-up ${prediction === true ? "selected" : ""}`}
                    disabled={isBettingLoading}
                  >
                    Bet Up
                  </button>
                  <button
                    onClick={() => setPrediction(false)}
                    className={`cyberpunk-button cyberpunk-button-down ${prediction === false ? "selected" : ""}`}
                    disabled={isBettingLoading}
                  >
                    Bet Down
                  </button>
                </div>
                <button
                  onClick={placeBet}
                  disabled={isBettingLoading || !amount || prediction === null}
                  className="cyberpunk-button cyberpunk-button-place-bet"
                >
                  Deploy Bet
                </button>
              </>
            )
          ) : timeLeft > 0 ? (
            <p className="cyberpunk-error-text">Betting closed: less than 90 seconds remain</p>
          ) : null}
        </section>
      )}

      {status && <p className="cyberpunk-status">{status}</p>}

      <section className="cyberpunk-past-rounds">
        <h2 className="cyberpunk-subtitle">Transaction History</h2>
        {pastRounds.length > 0 ? (
          <div className="cyberpunk-rounds-container">
            <ul className="cyberpunk-rounds-list">
              {pastRounds.map((round) => (
                <li key={round.id} className="cyberpunk-round-item">
                  <span className="cyberpunk-round-id">Round #{round.roundId}</span>
                  <span className="cyberpunk-round-price">
                    ${round.startPrice.toFixed(PRICE_PRECISION)} → $
                    {round.endPrice != null ? round.endPrice.toFixed(PRICE_PRECISION) : "N/A"}
                  </span>
                  <span className="cyberpunk-round-outcome">
                    (
                    {round.draw
                      ? "Draw"
                      : round.endPrice != null
                      ? round.endPrice > round.startPrice
                        ? "Up"
                        : round.endPrice < round.startPrice
                        ? "Down"
                        : "Draw"
                      : "Pending"}
                    )
                  </span>
                  <span className="cyberpunk-round-pool">Pool: {round.totalPool.toFixed(2)} $GOR</span>
                  <span className="cyberpunk-round-status">
                    {round.distributed ? (round.draw ? "Refunded" : "Distributed") : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                onClick={loadMoreRounds}
                disabled={isLoading}
                className="cyberpunk-button cyberpunk-button-load-more"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        ) : (
          <p className="cyberpunk-no-data">No transactions recorded.</p>
        )}
      </section>

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        setStatus={setStatus}
      />

      <Analytics />
      <SpeedInsights />
    </div>
  );
};

// Wrap BettingGame with providers
const WrappedBettingGame = () => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <BettingGame />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};


export default WrappedBettingGame;
