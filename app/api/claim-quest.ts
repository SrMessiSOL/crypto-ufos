import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

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

// Initialize Firebase only if not already initialized
const firebaseApp = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const db = getFirestore(firebaseApp);

// Solana configuration
const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db';
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
const GAME_SERVER_PRIVATE_KEY = process.env.GAME_SERVER_PRIVATE_KEY;
const GAME_SERVER_WALLET = GAME_SERVER_PRIVATE_KEY ? Keypair.fromSecretKey(bs58.decode(GAME_SERVER_PRIVATE_KEY)) : null;
const COLLECTION_ADDRESS = '53UVubjHQpC4RmUnDGU1PV3f2bYFk6GcWb3SgtYFMHTb'; // Replace with your NFT collection mint address

// Resource types
type ResourceKey =
  | 'ice'
  | 'co2'
  | 'water'
  | 'halite'
  | 'emptyPowerCell'
  | 'fullPowerCell'
  | 'brokenPowerCell'
  | 'crystalOre'
  | 'rareEarths'
  | 'purifiedWater'
  | 'plasmaFluid'
  | 'quantumCells'
  | 'energyCores'
  | 'biofiber'
  | 'sporeEssence'
  | 'alloyIngots'
  | 'nanosteel'
  | 'catalysts'
  | 'polymers'
  | 'spareParts'
  | 'circuitBoards'
  | 'tradeContracts'
  | 'marketTokens'
  | 'processedGems'
  | 'exoticCrystals'
  | 'hydrogenFuel'
  | 'fusionFluid'
  | 'plasmaCores'
  | 'antimatterCells'
  | 'bioPolymers'
  | 'nanoOrganics'
  | 'superAlloys'
  | 'metaMaterials'
  | 'nanoCatalysts'
  | 'quantumChemicals'
  | 'advancedComponents'
  | 'roboticModules'
  | 'cryptoCredits'
  | 'galacticBonds'
  | 'solarPanel'
  | 'ionThruster'
  | 'lifeSupportModule'
  | 'quantumDrive'
  | 'nanoAssembler'
  | 'bioCircuit'
  | 'crystalMatrix'
  | 'hydroCore'
  | 'tradeBeacon'
  | 'gravitonShield'
  | 'neuralInterface'
  | 'antimatterWarhead'
  | 'holoProjector'
  | 'bioReactorCore';

interface QuestClaimRequest {
  wallet: string;
  nftMint: string; // Single NFT mint address
  transactionSignature: string; // Original transaction signature from quest start
}

interface QuestClaimResponse {
  success: boolean;
  reward: {
    ufos: number;
    exp: number;
    resources: Partial<Record<ResourceKey, number>>;
  };
  transactionSignature: string; // Signature of the NFT transfer transaction
}

interface ErrorResponse {
  success: false;
  error: string;
}

// Function to determine user tier based on NFT count
function determineUserTier(nftCount: number): number {
  if (nftCount >= 1000) return 32;
  if (nftCount >= 950) return 31;
  if (nftCount >= 900) return 30;
  if (nftCount >= 850) return 29;
  if (nftCount >= 800) return 28;
  if (nftCount >= 750) return 27;
  if (nftCount >= 700) return 26;
  if (nftCount >= 650) return 25;
  if (nftCount >= 600) return 24;
  if (nftCount >= 550) return 23;
  if (nftCount >= 500) return 22;
  if (nftCount >= 450) return 21;
  if (nftCount >= 400) return 20;
  if (nftCount >= 350) return 19;
  if (nftCount >= 300) return 18;
  if (nftCount >= 250) return 17;
  if (nftCount >= 200) return 16;
  if (nftCount >= 150) return 15;
  if (nftCount >= 140) return 14;
  if (nftCount >= 130) return 13;
  if (nftCount >= 120) return 12;
  if (nftCount >= 110) return 11;
  if (nftCount >= 100) return 10;
  if (nftCount >= 90) return 9;
  if (nftCount >= 80) return 8;
  if (nftCount >= 70) return 7;
  if (nftCount >= 60) return 6;
  if (nftCount >= 50) return 5;
  if (nftCount >= 40) return 4;
  if (nftCount >= 30) return 3;
  if (nftCount >= 20) return 2;
  if (nftCount >= 10) return 1;
  return 0;
}

// API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse<QuestClaimResponse | ErrorResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { wallet, nftMint, transactionSignature } = req.body as QuestClaimRequest;

  // Validate request body
  if (!wallet || !nftMint || !transactionSignature) {
    return res.status(400).json({ success: false, error: 'Invalid request: Missing wallet, nftMint, or transactionSignature' });
  }

  // Validate game server wallet
  if (!GAME_SERVER_WALLET) {
    console.error('[claim-quest] Game server private key not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    // Validate wallet and NFT mint addresses
    let playerPublicKey: PublicKey;
    let nftMintPublicKey: PublicKey;
    try {
      playerPublicKey = new PublicKey(wallet);
      nftMintPublicKey = new PublicKey(nftMint);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid wallet or NFT mint address' });
    }

    // Fetch quest from Firestore
    const questId = `${wallet}_${nftMint}`;
    const questDocRef = doc(db, 'QuestLogs', questId);
    const questDoc = await getDoc(questDocRef);

    if (!questDoc.exists()) {
      return res.status(404).json({ success: false, error: 'Quest not found' });
    }

    const questData = questDoc.data();
    if (questData.wallet !== wallet) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Wallet does not match quest owner' });
    }

    if (questData.status !== 'completed') {
      return res.status(400).json({ success: false, error: `Quest is not claimable: Current status is ${questData.status}` });
    }

    if (questData.nftId !== extractNFTId(nftMint)) {
      return res.status(400).json({ success: false, error: 'NFT mint does not match quest NFT ID' });
    }

    if (questData.transactionSignature !== transactionSignature) {
      return res.status(400).json({ success: false, error: 'Invalid transaction signature' });
    }

    // Verify quest duration (1 week = 604,800 seconds)
    const QUEST_DURATION_SECONDS = 604800;
    const questTimestamp = questData.startTimestamp?.toDate();
    if (!questTimestamp) {
      return res.status(400).json({ success: false, error: 'Invalid quest timestamp' });
    }

    const secondsElapsed = (new Date().getTime() - questTimestamp.getTime()) / 1000;
    if (secondsElapsed < QUEST_DURATION_SECONDS) {
      return res.status(400).json({
        success: false,
        error: `Quest not complete: ${(QUEST_DURATION_SECONDS - secondsElapsed) / 3600} hours remaining`,
      });
    }

    // Fetch user data to get profession and tier
    const userQuery = query(collection(db, 'UFOSperWallet'), where('Wallet', '==', wallet));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnapshot.docs[0].data();
    const userTier = determineUserTier(userData.NFTs || 0);

    // Validate NFT ownership (ensure NFT is in game server wallet)
    const gameServerTokenAccount = await getAssociatedTokenAddress(
      nftMintPublicKey,
      GAME_SERVER_WALLET.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const tokenAccountInfo = await connection.getTokenAccountBalance(gameServerTokenAccount);
    if (!tokenAccountInfo.value || tokenAccountInfo.value.uiAmount !== 1) {
      return res.status(400).json({ success: false, error: 'NFT not found in game server wallet' });
    }

    // Create transfer transaction
    const playerTokenAccount = await getAssociatedTokenAddress(
      nftMintPublicKey,
      playerPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    // Check if player's token account exists; if not, include instruction to create it
    const transaction = new Transaction();
    const playerTokenAccountInfo = await connection.getAccountInfo(playerTokenAccount);
    if (!playerTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          GAME_SERVER_WALLET.publicKey, // Payer
          playerTokenAccount, // ATA to create
          playerPublicKey, // Owner
          nftMintPublicKey, // Mint
          TOKEN_PROGRAM_ID
        )
      );
    }

    transaction.add(
      createTransferInstruction(
        gameServerTokenAccount, // Source
        playerTokenAccount, // Destination
        GAME_SERVER_WALLET.publicKey, // Owner
        1, // Amount (1 for NFT)
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Sign and send transaction
    transaction.feePayer = GAME_SERVER_WALLET.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signature = await sendAndConfirmTransaction(connection, transaction, [GAME_SERVER_WALLET]);

    // Update quest status to 'claimed'
    await updateDoc(questDocRef, { status: 'claimed' });

    // Update user resources and streak
    const ufosReward = 5000; // Fixed reward, adjust as needed
    const expReward = 1000; // Fixed EXP reward, adjust as needed
    const resources: Partial<Record<ResourceKey, number>> = {
      emptyPowerCell: 5,
      fullPowerCell: 2,
    };

    const activeProfession = userData.ActiveProfession || null;
    const professionBonus = activeProfession && userData.Professions?.[activeProfession]?.efficiencyBonus || 0;
    Object.keys(resources).forEach((key) => {
      resources[key as ResourceKey] = Math.floor(resources[key as ResourceKey]! * (1 + professionBonus));
    });

    // Update user data in Firestore
    const userDocRef = doc(db, 'UFOSperWallet', wallet);
    await updateDoc(userDocRef, {
      UFOS: (userData.UFOS || 0) + ufosReward,
      EmptyPowerCell: (userData.EmptyPowerCell || 0) + (resources.emptyPowerCell || 0),
      FullPowerCell: (userData.FullPowerCell || 0) + (resources.fullPowerCell || 0),
      NFTs: (userData.NFTs || 0) + 1, // Increment NFT count
      StreakCount: (userData.StreakCount || 0) + 1, // Increment streak
    });

    // Update NFT EXP in CryptoUFOs collection
    const nftId = extractNFTId(nftMint);
    const nftDocRef = doc(db, 'CryptoUFOs', nftId);
    const nftDoc = await getDoc(nftDocRef);
    if (nftDoc.exists()) {
      const nftData = nftDoc.data();
      await updateDoc(nftDocRef, {
        EXP: (nftData.EXP || 0) + expReward,
        LEVEL: calculateLevel(nftData.EXP || 0, expReward), // Implement calculateLevel as needed
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      reward: {
        ufos: ufosReward,
        exp: expReward,
        resources,
      },
      transactionSignature: signature,
    });
  } catch (error: any) {
    console.error('[claim-quest] Error:', error);
    return res.status(500).json({ success: false, error: `Server error: ${error.message}` });
  }
}

// Helper function to extract numerical NFT ID from mint address
function extractNFTId(mint: string): string {
  // Implement based on your mint address format
  // Example: Extract numerical ID from mint address or metadata
  return mint.split('_').pop() || mint;
}

// Helper function to calculate NFT level based on EXP
function calculateLevel(currentExp: number, additionalExp: number): number {
  const totalExp = currentExp + additionalExp;
  // Example: Level up every 1000 EXP
  return Math.floor(totalExp / 1000) + 1;
}

// Helper function to create associated token account instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  programId = TOKEN_PROGRAM_ID
) {
  return {
    programId,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    name: 'createAssociatedTokenAccount',
  };
}