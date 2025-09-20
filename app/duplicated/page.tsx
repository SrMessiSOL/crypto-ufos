"use client";

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";

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

// Interface for wallet data
interface WalletData {
  id: string;
  Wallet: string;
  ufos?: number; // Add UFOS field
}

// Interface for grouped wallet data
interface WalletGroup {
  wallet: string;
  count: number;
  entries: WalletData[];
}

export default function WalletDataPage() {
  const [duplicateWallets, setDuplicateWallets] = useState<WalletGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate Solana-like wallet address (Base58, 32-44 characters)
  const isValidWallet = (wallet: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
  };

  // Fetch and check for duplicate wallets
  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Initializing Firebase...");
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);

      console.log("Fetching wallets...");
      const querySnapshot = await getDocs(collection(db, "UFOSperWallet"));

      if (querySnapshot.empty) {
        console.warn("No wallets found in UFOSperWallet collection");
        setError("No wallets found in the database.");
        setLoading(false);
        return;
      }

      // Store wallet data
      const walletData: WalletData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.Wallet || typeof data.Wallet !== "string" || data.Wallet.trim() === "") {
          console.warn(`Skipping document ${doc.id} with missing or invalid Wallet field`);
          return;
        }
        if (!isValidWallet(data.Wallet)) {
          console.warn(`Invalid wallet format in document ${doc.id}: ${data.Wallet}`);
          return;
        }
        walletData.push({
          id: doc.id,
          Wallet: data.Wallet.toLowerCase(), // Normalize to lowercase
          ufos: data.UFOS, // Include UFOS field
        });
      });

      if (walletData.length === 0) {
        setError("No valid wallet data found.");
        setLoading(false);
        return;
      }

      // Group wallets by Wallet field
      const walletMap: { [key: string]: WalletData[] } = {};
      walletData.forEach((data) => {
        const walletAddress = data.Wallet;
        if (!walletMap[walletAddress]) {
          walletMap[walletAddress] = [];
        }
        walletMap[walletAddress].push(data);
      });

      // Filter for wallets with more than one entry
      const groups: WalletGroup[] = Object.entries(walletMap)
        .filter(([_, entries]) => entries.length > 1) // Only include wallets with duplicates
        .map(([wallet, entries]) => ({
          wallet,
          count: entries.length,
          entries,
        }))
        .sort((a, b) => b.count - a.count || a.wallet.localeCompare(b.wallet)); // Sort by count, then wallet

      console.log(`Found ${groups.length} wallets with duplicates`);
      setDuplicateWallets(groups);
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      setError(`Failed to load data: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <Toaster richColors position="top-right" />

      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Duplicate Wallet Check</h1>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-yellow-400">Wallets with Multiple Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-center text-gray-300">
              <p>Loading wallet data...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400 mx-auto mt-4"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : duplicateWallets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No wallets with multiple entries found.
            </div>
          ) : (
            <div>
              {duplicateWallets.map((group) => (
                <div key={group.wallet} className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-yellow-400 font-bold">
                    Wallet: {group.wallet}
                  </p>
                  <p className="text-gray-300">Number of Entries: {group.count}</p>
                  <p className="text-gray-400">Entries:</p>
                  <ul className="list-disc pl-5">
                    {group.entries.map((entry) => (
                      <li key={entry.id} className="text-gray-300">
                        Document ID: {entry.id} | $UFOS: {(entry.ufos || 0).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}