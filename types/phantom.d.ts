// phantom.d.ts
import { VersionedTransaction } from "@solana/web3.js";

export interface PhantomProvider {
  publicKey: { toString(): string } | null;
  isPhantom: boolean;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  request: (request: { method: string; params?: any }) => Promise<any>;
  signAllTransactions?: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
  signAndSendTransaction: (
    transaction: VersionedTransaction,
    options?: {
      skipPreflight?: boolean;
      preflightCommitment?: string;
      maxRetries?: number;
    }
  ) => Promise<{ signature: string }>;
}

export interface SolflareProvider {
  publicKey: { toString(): string } | null;
  isSolflare: boolean;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  signAllTransactions?: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
  signAndSendTransaction: (
    transaction: VersionedTransaction,
    options?: {
      skipPreflight?: boolean;
      preflightCommitment?: string;
      maxRetries?: number;
    }
  ) => Promise<{ signature: string }>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: {
      solana?: PhantomProvider;
    };
    solflare?: SolflareProvider;
  }
}