import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey, Keypair } from "@solana/web3.js"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { dasApi, type DasApiInterface } from "@metaplex-foundation/digital-asset-standard-api"
import { mplBubblegum } from "@metaplex-foundation/mpl-bubblegum"
import {
  transfer as bubblegumTransfer,
  findLeafAssetIdPda,
  getAssetWithProof,
} from "@metaplex-foundation/mpl-bubblegum"
import { publicKey as umiPublicKey, type Umi, createSignerFromKeypair, keypairIdentity } from "@metaplex-foundation/umi"
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import bs58 from "bs58"

// Solana configuration
const SOLANA_RPC_ENDPOINT =
  process.env.SOLANA_RPC_ENDPOINT || "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db"
const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
const GAME_SERVER_PRIVATE_KEY = process.env.GAME_SERVER_PRIVATE_KEY
const GAME_SERVER_WALLET = GAME_SERVER_PRIVATE_KEY ? Keypair.fromSecretKey(bs58.decode(GAME_SERVER_PRIVATE_KEY)) : null
const SOLANA_RPC = "https://mainnet.helius-rpc.com/?api-key=3d0ad7ca-7869-4a97-9d3e-a57131ae89db"

interface QuestClaimRequest {
  wallet: string
  nftMint: string
  transactionSignature: string
}

interface QuestClaimResponse {
  success: boolean
  transactionSignature: string
  error?: string
}

export async function POST(req: NextRequest) {
  if (!GAME_SERVER_WALLET) {
    return NextResponse.json({ success: false, error: "Server wallet not configured" }, { status: 500 })
  }

  let body
  try {
    const rawBody = await req.text()
    console.log("Raw request body:", rawBody)

    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Empty request body" }, { status: 400 })
    }

    try {
      body = JSON.parse(rawBody)
      console.log("Parsed body:", body)
    } catch (parseError: any) {
      console.error("JSON parsing failed:", parseError.message, "Raw body:", rawBody)
      return NextResponse.json({ success: false, error: `Invalid JSON format: ${parseError.message}` }, { status: 400 })
    }

    const { wallet, nftMint, transactionSignature } = body

    if (!wallet || !nftMint || !transactionSignature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    let walletPublicKey, mintPublicKey
    try {
      walletPublicKey = new PublicKey(wallet)
      mintPublicKey = new PublicKey(nftMint)
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: `Invalid wallet or NFT mint address: ${e.message}` },
        { status: 400 },
      )
    }

    console.log("🎮 Game server:", GAME_SERVER_WALLET.publicKey.toBase58())
    console.log("👤 Target wallet:", wallet)
    console.log("🖼️  NFT mint:", nftMint)

    // Initialize Umi properly with RPC endpoint AND mplBubblegum plugin
    const umi = createUmi(SOLANA_RPC).use(dasApi()).use(mplBubblegum()) as Umi & { rpc: DasApiInterface }

    // Create proper Umi keypair and signer from the game server wallet
    const gameServerUmiKeypair = fromWeb3JsKeypair(GAME_SERVER_WALLET)
    const gameServerSigner = createSignerFromKeypair(umi, gameServerUmiKeypair)

    // Set the signer as the identity
    umi.use(keypairIdentity(gameServerUmiKeypair))

    // Check NFT ownership
    const checkNFTOwnership = async (): Promise<any> => {
      const MAX_OWNERSHIP_RETRIES = 3
      let ownershipAttempt = 0

      while (ownershipAttempt < MAX_OWNERSHIP_RETRIES) {
        try {
          const response = await fetch(SOLANA_RPC_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "my-id",
              method: "getAsset",
              params: { id: nftMint },
            }),
          })

          const data = await response.json()
          console.log("[checkNFTOwnership] API Response:", data)

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${data.error?.message || "Unknown error"}`)
          }

          const rpcAsset = data.result
          if (!rpcAsset) {
            throw new Error(`Asset not found on blockchain for mint: ${nftMint}`)
          }

          console.log("NFT current owner:", rpcAsset.ownership.owner)
          console.log("Expected owner (game server):", GAME_SERVER_WALLET.publicKey.toBase58())

          // Check if NFT is owned by game server
          if (rpcAsset.ownership.owner !== GAME_SERVER_WALLET.publicKey.toBase58()) {
            throw new Error(
              `NFT is not owned by game server. Expected ${GAME_SERVER_WALLET.publicKey.toBase58()} but got ${rpcAsset.ownership.owner}`,
            )
          }

          if (
            !rpcAsset.compression?.compressed ||
            !rpcAsset.compression.tree ||
            typeof rpcAsset.compression.leaf_id !== "number"
          ) {
            throw new Error("Invalid compression data for NFT")
          }

          return rpcAsset
        } catch (error) {
          console.warn(`[checkNFTOwnership] Attempt ${ownershipAttempt + 1} failed:`, error)
          ownershipAttempt++
          if (ownershipAttempt >= MAX_OWNERSHIP_RETRIES) {
            throw error
          }
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    const rpcAsset = await checkNFTOwnership()
    const leafNonce = rpcAsset.compression.leaf_id
    const merkleTree = umiPublicKey(rpcAsset.compression.tree)

    console.log("🌳 Merkle tree:", rpcAsset.compression.tree)
    console.log("🍃 Leaf ID:", leafNonce)

    // Get asset with proof
    const [assetId] = await findLeafAssetIdPda(umi, { merkleTree, leafIndex: leafNonce })
    const assetWithProof = await getAssetWithProof(umi, assetId)

    if (!assetWithProof.proof || assetWithProof.proof.length === 0) {
      throw new Error("Invalid Merkle proof returned")
    }

    console.log("✅ Asset proof length:", assetWithProof.proof.length)

    // Check balance
    const balance = await connection.getBalance(GAME_SERVER_WALLET.publicKey)
    const minimumBalance = 10000 // 0.00001 SOL
    if (balance < minimumBalance) {
      throw new Error(`Insufficient SOL balance for game server. Need at least ${minimumBalance / 1_000_000_000} SOL.`)
    }

    console.log("💰 Game server balance:", balance / 1_000_000_000, "SOL")

    // Build transfer transaction
    const transferTxBuilder = bubblegumTransfer(umi, {
      ...assetWithProof,
      leafOwner: gameServerSigner.publicKey, // Current owner (game server)
      newLeafOwner: umiPublicKey(wallet), // New owner (user)
    })

    // Retry logic for blockhash issues
    const MAX_RETRIES = 3
    let attempt = 0

    while (attempt < MAX_RETRIES) {
      try {
        console.log(`🔄 Transaction attempt ${attempt + 1}/${MAX_RETRIES}`)

        // Get fresh blockhash for each attempt
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
        console.log("🔗 Fresh blockhash:", blockhash.slice(0, 8) + "...")

        // Build and send transaction using Umi's built-in methods
        const result = await transferTxBuilder
          .setBlockhash({ blockhash, lastValidBlockHeight })
          .setFeePayer(gameServerSigner)
          .sendAndConfirm(umi, {
            confirm: { commitment: "confirmed" },
            send: {
              skipPreflight: false,
              maxRetries: 3,
            },
          })

        console.log("✅ Transaction signature:", result.signature)

        return NextResponse.json(
          {
            success: true,
            transactionSignature: result.signature,
          },
          { status: 200 },
        )
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message)

        attempt++

        // Check if it's a blockhash-related error and we should retry
        if (
          (error.message.includes("Blockhash not found") ||
            error.message.includes("block height exceeded") ||
            error.message.includes("Transaction simulation failed") ||
            error.message.includes("blockhash")) &&
          attempt < MAX_RETRIES
        ) {
          console.log(`⏳ Retrying in ${attempt * 1000}ms... (${attempt}/${MAX_RETRIES})`)
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
          continue
        }

        // If it's the last attempt or a non-retryable error, throw
        if (attempt >= MAX_RETRIES) {
          throw new Error(`Transaction failed after ${MAX_RETRIES} attempts: ${error.message}`)
        }

        throw error
      }
    }
  } catch (error: any) {
    console.error("❌ [claim-quest] Final error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
