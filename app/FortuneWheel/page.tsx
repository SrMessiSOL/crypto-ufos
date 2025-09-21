"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { Info, X } from "lucide-react";
import "./FortuneWheel.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Constants for NFT fetching
const API_URL = "https://mainnet.helius-rpc.com/";
const COLLECTION_ADDRESS = "";

// Interfaces
interface HeliusAsset {
  id: string;
  burnt: boolean;
  ownership: { owner: string };
  content?: { json_uri?: string };
}

interface HeliusResponse {
  jsonrpc: string;
  result: { items: HeliusAsset[]; total: number };
  id: string;
}

interface NFT {
  mint: string;
  owner: string;
  number: number | null;
}

interface WalletTicket {
  address: string;
  tickets: number;
}

export default function FortuneWheelPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerTickets, setWinnerTickets] = useState<number | null>(null); // New state for winner's ticket count
  const [isSpinning, setIsSpinning] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uniqueWallets, setUniqueWallets] = useState<WalletTicket[]>([]);
  const [hasSpun, setHasSpun] = useState(false);

  // Fetch all NFTs in the collection
async function fetchAllNFTs(): Promise<NFT[]> {
  console.log("Starting fetchAllNFTs for collection:", COLLECTION_ADDRESS);
  try {
    setIsLoading(true);
    let page: number | null = 1;
    const allNFTs: NFT[] = [];
    let burntCount = 0; // Total burnt NFTs across all assets
    let burntInRangeCount = 0; // Burnt NFTs in range #8060–#9999
    let nullNumberCount = 0; // NFTs with null numbers

    while (page) {
      console.log(`Fetching page ${page} of NFTs`);
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
        console.error(`HTTP error on page ${page}: Status ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result: HeliusResponse = await response.json();
      console.log(`Received ${result.result.items.length} items on page ${page}, total: ${result.result.total}`);
      const assets = result.result.items.filter((item) => {
        if (item.burnt === true) {
          burntCount++;
          // Check if burnt NFT is in range #8060–#9999
          const jsonUri = item.content?.json_uri || "";
          const numberMatch = jsonUri.match(/\/(\d+)\.json$/);
          const number = numberMatch ? parseInt(numberMatch[1], 10) : null;
          if (number !== null && number >= 8060 && number <= 9999) {
            burntInRangeCount++;
            console.log(`Burnt NFT in range: Mint=${item.id}, Number=${number}, json_uri=${jsonUri}`);
          }
          return false;
        }
        return true;
      });
      console.log(`Filtered ${assets.length} non-burnt assets on page ${page}, total burnt NFTs: ${burntCount}, burnt in range #8060–#9999: ${burntInRangeCount}`);

      const nfts = assets.map((asset, index) => {
        const jsonUri = asset.content?.json_uri || "";
        const numberMatch = jsonUri.match(/\/(\d+)\.json$/);
        const number = numberMatch ? parseInt(numberMatch[1], 10) : null;
        if (number === null && jsonUri) {
          console.log(`Null number for asset: Mint=${asset.id}, json_uri=${jsonUri}`);
          nullNumberCount++;
        }
        console.log(`Asset ${index + 1}/${assets.length}: Mint=${asset.id}, Owner=${asset.ownership.owner}, Number=${number}, json_uri=${jsonUri}`);

        return {
          mint: asset.id,
          owner: asset.ownership.owner,
          number,
        };
      });

      allNFTs.push(...nfts);
      console.log(`Added ${nfts.length} NFTs from page ${page}, total NFTs so far: ${allNFTs.length}`);
      page = result.result.total !== 1000 ? null : page + 1;
    }

    // Filter NFTs with numbers between 8060 and 9999 and sort by number
    const qualifying = allNFTs
      .filter((nft) => nft.number !== null && nft.number >= 8060 && nft.number <= 9999)
      .sort((a, b) => b.number! - a.number!); // Use non-null assertion
    console.log(`Filtered ${qualifying.length} qualifying NFTs (#8060–#9999):`, qualifying);
    console.log(`Total burnt NFTs: ${burntCount}`);
    console.log(`Burnt NFTs in range #8060–#9999: ${burntInRangeCount}`);
    console.log(`Total NFTs with null number: ${nullNumberCount}`);

    // Calculate unique wallets and ticket counts
    const walletMap: { [key: string]: number } = {};
    qualifying.forEach((nft) => {
      walletMap[nft.owner] = (walletMap[nft.owner] || 0) + 1;
    });
    const uniqueWalletsList = Object.entries(walletMap)
      .map(([address, tickets]) => ({
        address,
        tickets,
      }))
      .sort((a, b) => b.tickets - a.tickets);
    setUniqueWallets(uniqueWalletsList);
    console.log("Unique wallets with ticket counts:", uniqueWalletsList);

    setNfts(qualifying);
    return qualifying;
  } catch (error) {
    console.error("Error in fetchAllNFTs:", error);
    toast.error("Failed to fetch NFTs");
    return [];
  } finally {
    console.log("Finished fetchAllNFTs");
    setIsLoading(false);
  }
}

  // Format wallet address for display
  const formatWalletAddress = (address: string): string => {
    if (!address) return "";
    const formatted = `${address.slice(0, 4)}...${address.slice(-4)}`;
    console.log(`Formatted wallet address: ${address} -> ${formatted}`);
    return formatted;
  };

  // Calculate total tickets
  const totalTickets = uniqueWallets.reduce((sum, wallet) => sum + wallet.tickets, 0);

  // Handle picker animation
  const handleSpin = () => {
    if (nfts.length < 2) {
      console.log("Not enough participants to spin the picker:", nfts.length);
      toast.error("Not enough participants to spin the picker");
      return;
    }
    console.log("Initiating picker spin");
    setIsSpinning(true);
    setWinner(null);
    setWinnerTickets(null); // Reset winner tickets
    setCurrentIndex(0);
    setHasSpun(true);

    const totalWallets = nfts.length;
    const spinDuration = 5000; // 5 seconds
    const startTime = performance.now();
    let lastUpdate = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const speed = 1 / (1 - progress); // Accelerate then slow down

      if (currentTime - lastUpdate >= 50) { // Update every 50ms
        const newIndex = Math.floor(Math.random() * totalWallets);
        setCurrentIndex(newIndex);
        console.log(`Picker progress: ${progress.toFixed(2)}, Index: ${newIndex}, Wallet: ${formatWalletAddress(nfts[newIndex].owner)}`);
        lastUpdate = currentTime;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winnerIndex = Math.floor(Math.random() * totalWallets);
        const winnerAddress = nfts[winnerIndex].owner;
        const winnerFormatted = formatWalletAddress(winnerAddress);
        // Find the winner's ticket count
        const winnerWallet = uniqueWallets.find((wallet) => wallet.address === winnerAddress);
        const tickets = winnerWallet ? winnerWallet.tickets : 0;
        console.log(`Picker stopped, winner: ${winnerFormatted}, tickets: ${tickets}`);
        setWinner(winnerFormatted);
        setWinnerTickets(tickets); // Store winner's ticket count
        setIsModalOpen(true); // Open winner modal
        toast.success(`Winner: ${winnerFormatted}`, {
          description: "Congratulations to the event winner!",
        });
        if (pickerRef.current) {
          pickerRef.current.style.animation = "none"; // Stop animation
          pickerRef.current.textContent = winnerFormatted; // Display winner
        }
      }
    };

    if (pickerRef.current) {
      pickerRef.current.style.animation = "pickerSpin 0.1s linear infinite"; // Start animation
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        console.log("Cleaning up picker animation");
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Fetch NFTs on mount
  useEffect(() => {
    console.log("Mounting FortuneWheelPage, initiating fetchAllNFTs");
    fetchAllNFTs();
  }, []);

  if (isLoading) {
    return (
      <div className="fortune-wheel-page">
        <div className="spinner">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-blue-500">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fortune-wheel-page">
      <Toaster richColors position="top-right" />
      <main className="fortune-wheel-container">
        <h1 className="fortune-wheel-title">CryptoUFOs Sold Out Event Fortune Wheel</h1>
        <p className="fortune-wheel-subtitle">
          Spin to select a winner from wallets holding NFTs #8060–#9999
        </p>
        <Card className="fortune-wheel-card">
          <CardContent className="fortune-wheel-content">
            {nfts.length > 0 ? (
              <>
                <div
                  ref={pickerRef}
                  className={`fortune-wheel-picker ${isSpinning ? "spinning" : ""}`}
                  aria-label="Random picker for selecting event winner"
                >
                  {!isSpinning && !hasSpun
                    ? "Spin the Wheel to pick a winner"
                    : formatWalletAddress(nfts[currentIndex]?.owner || "")}
                </div>
                <div className="fortune-wheel-ticket-list">
                  <h3 className="fortune-wheel-ticket-title">Ticket Holders</h3>
                  <ul className="fortune-wheel-ticket-ul">
                    {uniqueWallets.map((wallet, index) => (
                      <li key={index} className="fortune-wheel-ticket-item">
                        {formatWalletAddress(wallet.address)}: {wallet.tickets} ticket(s)
                      </li>
                    ))}
                  </ul>
                  <p className="fortune-wheel-total-tickets">
                    Total Tickets: {totalTickets}
                  </p>
                </div>
                {winner && (
                  <p className="fortune-wheel-winner">
                    Winner: <span className="winner-address">{winner}</span>
                  </p>
                )}
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || nfts.length < 2}
                  className="fortune-wheel-spin-button"
                  aria-label={isSpinning ? "Picker is spinning" : "Spin the picker"}
                >
                  {isSpinning ? "Spinning..." : "Spin the Picker"}
                </Button>
              </>
            ) : (
              <p className="fortune-wheel-no-data">
                No qualifying NFTs found for the event.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Winner Modal */}
      {isModalOpen && (
        <div className="fortune-wheel-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="fortune-wheel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="fortune-wheel-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <h2 className="fortune-wheel-modal-title">Winner Congratulations!</h2>
            <p className="fortune-wheel-modal-text">
              The winner is: <span className="winner-address">{winner}</span>
            </p>
            <p className="fortune-wheel-modal-message">
              Congratulations on winning the CryptoUFOs Sold Out Event! Your prize will be awarded shortly.
              <br />
              Number of tickets: {winnerTickets}
            </p>
            <Button
              onClick={() => setIsModalOpen(false)}
              className="fortune-wheel-modal-button"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <Analytics />
      <SpeedInsights />
    </div>
  );

}
