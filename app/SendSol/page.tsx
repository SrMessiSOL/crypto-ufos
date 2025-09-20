"use client";

import React, { useState, useCallback } from "react";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import { useWallet, useConnection, ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Toaster, toast } from "sonner";
import "./SendSOL.css"; // Optional: Add custom styles

// Solana setup
const endpoint = "https://rpc.gorbagana.wtf";
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

const SendSOL: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [recipientAddresses, setRecipientAddresses] = useState<string>("");
  const [amountPerWallet, setAmountPerWallet] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setWalletBalance(null);
      return;
    }
    try {
      const balance = await connection.getBalance(publicKey);
      setWalletBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      toast.error("Failed to fetch wallet balance");
      setWalletBalance(null);
    }
  }, [connection, connected, publicKey]);

  // Fetch balance when wallet connects or changes
  React.useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // Parse and validate recipient addresses
  const parseRecipientAddresses = (): PublicKey[] => {
    const addresses = recipientAddresses
      .split(/[\n,]+/) // Split by comma or newline
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
    
    const validAddresses: PublicKey[] = [];
    for (const addr of addresses) {
      try {
        const pubKey = new PublicKey(addr);
        validAddresses.push(pubKey);
      } catch {
        toast.error(`Invalid address: ${addr}`);
      }
    }
    return validAddresses;
  };

  // Handle SOL airdrop
  const sendSOLAirdrop = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Please connect your wallet");
      return;
    }

    const recipientPubKeys = parseRecipientAddresses();
    if (recipientPubKeys.length === 0) {
      toast.error("Please enter at least one valid recipient wallet address");
      return;
    }

    if (!amountPerWallet || isNaN(Number(amountPerWallet)) || Number(amountPerWallet) <= 0) {
      toast.error("Please enter a valid SOL amount per wallet");
      return;
    }

    const solAmountPerWallet = Number(amountPerWallet);
    const totalSolNeeded = solAmountPerWallet * recipientPubKeys.length;
    const lamportsPerWallet = Math.floor(solAmountPerWallet * 1e9); // Convert SOL to lamports

    // Check balance
    if (walletBalance !== null && totalSolNeeded > walletBalance) {
      toast.error(`Insufficient SOL balance. Need ${totalSolNeeded.toFixed(4)} SOL`);
      return;
    }

    setIsLoading(true);
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

      // Create instructions for all recipients
      const instructions = recipientPubKeys.map((recipientPubKey) =>
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: lamportsPerWallet,
        })
      );

      // Create transaction message
      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      // Create versioned transaction
      const transaction = new VersionedTransaction(messageV0);

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Confirm transaction using updated method
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, "confirmed");

      toast.success(`Successfully sent ${solAmountPerWallet} SOL to ${recipientPubKeys.length} wallets`);
      setRecipientAddresses("");
      setAmountPerWallet("");
      await fetchWalletBalance(); // Refresh balance
    } catch (error: any) {
      console.error("Airdrop failed:", error);
      toast.error(`Failed to send SOL: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="send-sol-container">
      <Toaster richColors position="top-right" />
      <header className="send-sol-header">
        <h1 className="send-sol-title">SOL Airdrop</h1>
      </header>

      <div className="send-sol-wallet-controls">
        <WalletMultiButton className="send-sol-button-wallet" />
        {connected && (
          <p className="send-sol-data-item">
            Wallet Balance: {walletBalance !== null ? `${walletBalance.toFixed(4)} SOL` : "Loading..."}
          </p>
        )}
      </div>

      {connected && (
        <section className="send-sol-form">
          <textarea
            value={recipientAddresses}
            onChange={(e) => setRecipientAddresses(e.target.value)}
            placeholder="Recipient Wallet Addresses (one per line or comma-separated)"
            disabled={isLoading}
            className="send-sol-textarea"
            rows={5}
          />
          <input
            type="number"
            value={amountPerWallet}
            onChange={(e) => setAmountPerWallet(e.target.value)}
            placeholder="Amount per wallet in SOL"
            step="0.001"
            min="0.001"
            disabled={isLoading}
            className="send-sol-input"
          />
          <button
            onClick={sendSOLAirdrop}
            disabled={isLoading || !recipientAddresses || !amountPerWallet}
            className="send-sol-button"
          >
            {isLoading ? "Sending..." : "Send Airdrop"}
          </button>
        </section>
      )}
    </div>
  );
};

// Wrap SendSOL with providers
const WrappedSendSOL = () => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <SendSOL />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WrappedSendSOL;