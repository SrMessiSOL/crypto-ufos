"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Info } from "lucide-react";

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

// Resources
const resources: { name: string; key: keyof UserData; image: string }[] = [
  { name: "Empty Cells", key: "emptyPowerCell", image: "/Battery_Empty.png" },
  { name: "Full Cells", key: "fullPowerCell", image: "/Battery_Full.png" },
  { name: "Broken Cells", key: "brokenPowerCell", image: "/Battery_Broken.png" },
  { name: "Ice", key: "ice", image: "/Ice3.png" },
  { name: "Water", key: "water", image: "/water.png" },
  { name: "Minerals", key: "halite", image: "/Mineral.png" },
  { name: "CO2", key: "co2", image: "/co2.png" },
  { name: "Crystal Ore", key: "crystalOre", image: "/crystal_ore.png" },
  { name: "Rare Earths", key: "rareEarths", image: "/rare_earths.png" },
  { name: "Purified Water", key: "purifiedWater", image: "/purified_water.png" },
  { name: "Plasma Fluid", key: "plasmaFluid", image: "/plasma_fluid.png" },
  { name: "Quantum Cells", key: "quantumCells", image: "/quantum_cells.png" },
  { name: "Energy Cores", key: "energyCores", image: "/energy_cores.png" },
  { name: "Biofiber", key: "biofiber", image: "/biofiber.png" },
  { name: "Spore Essence", key: "sporeEssence", image: "/spore_essence.png" },
  { name: "Alloy Ingots", key: "alloyIngots", image: "/alloy_ingots.png" },
  { name: "Nanosteel", key: "nanosteel", image: "/nanosteel.png" },
  { name: "Catalysts", key: "catalysts", image: "/catalysts.png" },
  { name: "Polymers", key: "polymers", image: "/polymers.png" },
  { name: "Spare Parts", key: "spareParts", image: "/spare_parts.png" },
  { name: "Circuit Boards", key: "circuitBoards", image: "/circuit_boards.png" },
  { name: "Trade Contracts", key: "tradeContracts", image: "/trade_contracts.png" },
  { name: "Market Tokens", key: "marketTokens", image: "/market_tokens.png" },
  { name: "Processed Gems", key: "processedGems", image: "/processed_gems.png" },
  { name: "Exotic Crystals", key: "exoticCrystals", image: "/exotic_crystals.png" },
  { name: "Hydrogen Fuel", key: "hydrogenFuel", image: "/hydrogen_fuel.png" },
  { name: "Fusion Fluid", key: "fusionFluid", image: "/fusion_fluid.png" },
  { name: "Plasma Cores", key: "plasmaCores", image: "/plasma_cores.png" },
  { name: "Antimatter Cells", key: "antimatterCells", image: "/antimatter_cells.png" },
  { name: "Bio Polymers", key: "bioPolymers", image: "/bio_polymers.png" },
  { name: "Nano Organics", key: "nanoOrganics", image: "/nano_organics.png" },
  { name: "Super Alloys", key: "superAlloys", image: "/super_alloys.png" },
  { name: "Meta Materials", key: "metaMaterials", image: "/meta_materials.png" },
  { name: "Nano Catalysts", key: "nanoCatalysts", image: "/nano_catalysts.png" },
  { name: "Quantum Chemicals", key: "quantumChemicals", image: "/quantum_chemicals.png" },
  { name: "Advanced Components", key: "advancedComponents", image: "/advanced_components.png" },
  { name: "Robotic Modules", key: "roboticModules", image: "/robotic_modules.png" },
  { name: "Crypto Credits", key: "cryptoCredits", image: "/crypto_credits.png" },
  { name: "Galactic Bonds", key: "galacticBonds", image: "/galactic_bonds.png" },
];

// Interfaces
interface MarketOrderLog {
  logId: string;
  orderId: string;
  wallet: string;
  action: "match" | "buyNow" | "cancel";
  resource: keyof UserData;
  type: "buy" | "sell";
  amount: number;
  pricePerUnit: number;
  totalUfos: number;
  buyerWallet: string;
  sellerWallet: string;
  buyerBefore: { ufos: number; resource: number };
  buyerAfter: { ufos: number; resource: number };
  sellerBefore: { ufos: number; resource: number };
  sellerAfter: { ufos: number; resource: number };
  timestamp: Timestamp;
  status: "active" | "completed" | "cancelled";
}

interface UserData {
  wallet: string;
  ufos: number;
  emptyPowerCell: number;
  fullPowerCell: number;
  brokenPowerCell: number;
  ice: number;
  co2: number;
  water: number;
  halite: number;
  crystalOre: number;
  rareEarths: number;
  purifiedWater: number;
  plasmaFluid: number;
  quantumCells: number;
  energyCores: number;
  biofiber: number;
  sporeEssence: number;
  alloyIngots: number;
  nanosteel: number;
  catalysts: number;
  polymers: number;
  spareParts: number;
  circuitBoards: number;
  tradeContracts: number;
  marketTokens: number;
  processedGems: number;
  exoticCrystals: number;
  hydrogenFuel: number;
  fusionFluid: number;
  plasmaCores: number;
  antimatterCells: number;
  bioPolymers: number;
  nanoOrganics: number;
  superAlloys: number;
  metaMaterials: number;
  nanoCatalysts: number;
  quantumChemicals: number;
  advancedComponents: number;
  roboticModules: number;
  cryptoCredits: number;
  galacticBonds: number;
}

export default function MarketLogsPage() {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [logs, setLogs] = useState<MarketOrderLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletFilter, setWalletFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [totalUfosTraded, setTotalUfosTraded] = useState<number>(0);
  const router = useRouter();

  // Initialize Firebase
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      setFirebaseApp(app);
      setFirestore(db);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      toast.error("Failed to connect to database");
      setIsLoading(false);
    }
  }, []);

  // Fetch logs with filters and sort direction
  const fetchLogs = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(firestore, "MarketOrderLogs"),
        orderBy("timestamp", sortDirection)
      );

      // Apply wallet filter to buyerWallet or sellerWallet
      if (walletFilter) {
        q = query(
          q,
          where("buyerWallet", "==", walletFilter),
          where("sellerWallet", "==", walletFilter)
        );
      }

      // Apply date range filter
      if (startDate) {
        const startTimestamp = Timestamp.fromDate(startDate);
        q = query(q, where("timestamp", ">=", startTimestamp));
      }
      if (endDate) {
        const endTimestamp = Timestamp.fromDate(endDate);
        q = query(q, where("timestamp", "<=", endTimestamp));
      }

      const querySnapshot = await getDocs(q);
      const fetchedLogs: MarketOrderLog[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          logId: data.logId,
          orderId: data.orderId,
          wallet: data.wallet,
          action: data.action,
          resource: data.resource,
          type: data.type,
          amount: Number(data.amount) || 0,
          pricePerUnit: Number(data.pricePerUnit) || 0,
          totalUfos: Number(data.totalUfos) || 0,
          buyerWallet: data.buyerWallet || "",
          sellerWallet: data.sellerWallet || "",
          buyerBefore: data.buyerBefore || { ufos: 0, resource: 0 },
          buyerAfter: data.buyerAfter || { ufos: 0, resource: 0 },
          sellerBefore: data.sellerBefore || { ufos: 0, resource: 0 },
          sellerAfter: data.sellerAfter || { ufos: 0, resource: 0 },
          timestamp: data.timestamp,
          status: data.status || "unknown",
        };
      });

      // Debug: Log the fetched logs to inspect totalUfos values
      console.log("Fetched Logs:", fetchedLogs);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load market logs");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total UFOS traded for completed transactions
  const calculateTotalUfosTraded = (logs: MarketOrderLog[]) => {
    const total = logs
      .filter((log) => log.status === "completed") // Only include completed transactions
      .reduce((sum, log) => {
        const ufos = Number(log.totalUfos) || 0;
        console.log(`Log ${log.logId}: totalUfos = ${ufos}, Status = ${log.status}`); // Debug
        return sum + ufos;
      }, 0);
    console.log("Total UFOS Traded:", total); // Debug
    setTotalUfosTraded(total);
  };

  // Fetch logs when filters, sort direction, or firestore change
  useEffect(() => {
    if (firestore) {
      fetchLogs();
    }
  }, [firestore, walletFilter, startDate, endDate, sortDirection]);

  // Calculate total UFOS traded when logs change
  useEffect(() => {
    calculateTotalUfosTraded(logs);
  }, [logs]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Reset filters
  const resetFilters = () => {
    setWalletFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setSortDirection("desc");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white font-sans">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-t-transparent border-purple-500 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-lg">Loading Market Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
          100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        }
        .glow { animation: glow 2s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tooltip {
          transition: opacity 0.3s ease;
        }
      `}</style>
      <Toaster richColors position="top-right" />
      <Button
        onClick={() => router.push("/market")}
        className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg glow"
        aria-label="Return to marketplace"
      >
        Back to Marketplace
      </Button>
      <Card className="max-w-6xl mx-auto bg-black/95 border border-gray-800 rounded-xl shadow-2xl fade-in">
        <CardContent className="p-8">
          <h1 className="text-4xl font-bold text-white mb-6">Market Transaction Logs</h1>
          <div className="mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg glow">
            <h3 className="text-xl font-medium text-green-300">
              Total UFOS Traded: {isLoading ? "Calculating..." : `${totalUfosTraded.toLocaleString()} UFOS`}
            </h3>
          </div>
          <div className="mb-8 flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-200 mb-1" htmlFor="wallet-filter">
                Filter by Wallet
              </label>
              <Input
                id="wallet-filter"
                type="text"
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                placeholder="Enter wallet address"
                className="w-full bg-gray-800 text-white border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 glow"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-200 mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-gray-800 text-white border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 glow"
                  >
                    {startDate ? format(startDate, "PPP") : "Pick a start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-200 mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-gray-800 text-white border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 glow"
                  >
                    {endDate ? format(endDate, "PPP") : "Pick an end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end gap-4">
              <Button
                onClick={toggleSortDirection}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg px-6 py-3 glow"
                aria-label="Toggle sort direction"
              >
                {sortDirection === "desc" ? (
                  <>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Newer to Older
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Older to Newer
                  </>
                )}
              </Button>
              <Button
                onClick={resetFilters}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-3 glow"
                aria-label="Reset filters"
              >
                Reset Filters
              </Button>
            </div>
          </div>
          <div className="fade-in">
            <h3 className="text-xl font-medium text-green-300 mb-4">Transaction Logs</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-800">
                    <th className="py-3 px-4 text-gray-200">Timestamp</th>
                    <th className="py-3 px-4 text-gray-200">Action</th>
                    <th className="py-3 px-4 text-gray-200">Resource</th>
                    <th className="py-3 px-4 text-gray-200">Type</th>
                    <th className="py-3 px-4 text-gray-200">Amount</th>
                    <th className="py-3 px-4 text-gray-200">Price/Unit</th>
                    <th className="py-3 px-4 text-gray-200">Total UFOS</th>
                    <th className="py-3 px-4 text-gray-200">Buyer Wallet</th>
                    <th className="py-3 px-4 text-gray-200">Seller Wallet</th>
                    <th className="py-3 px-4 text-gray-200">Balances</th>
                    <th className="py-3 px-4 text-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-4 px-4 text-center text-gray-400">
                        No logs found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => {
                      const resource = resources.find((r) => r.key === log.resource);
                      const resourceName = resource?.name || log.resource;
                      return (
                        <tr
                          key={log.logId}
                          className={`border-b border-gray-800 transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-gray-900/20" : "bg-gray-900/40"
                          } hover:bg-gray-700/50`}
                        >
                          <td className="py-3 px-4 text-white">
                            {log.timestamp.toDate().toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-white capitalize">{log.action}</td>
                          <td className="py-3 px-4 text-white flex items-center gap-2">
                            {resource && (
                              <img
                                src={resource.image}
                                alt={resource.name}
                                className="w-5 h-5 object-contain"
                              />
                            )}
                            {resourceName}
                          </td>
                          <td className="py-3 px-4 text-white capitalize">{log.type}</td>
                          <td className="py-3 px-4 text-white">{log.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-white">{log.pricePerUnit} UFOS</td>
                          <td className="py-3 px-4 text-white">{log.totalUfos.toLocaleString()} UFOS</td>
                          <td className="py-3 px-4 text-white">
                            {log.buyerWallet ? `${log.buyerWallet.slice(0, 4)}...${log.buyerWallet.slice(-4)}` : "-"}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {log.sellerWallet ? `${log.sellerWallet.slice(0, 4)}...${log.sellerWallet.slice(-4)}` : "-"}
                          </td>
                          <td className="py-3 px-4 text-white">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="text-blue-400 hover:text-blue-300 p-0"
                                  aria-label="View balance details"
                                >
                                  <Info className="w-5 h-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="bg-gray-800 border-gray-700 text-white p-4 max-w-xs">
                                <div className="space-y-4">
                                  {log.buyerWallet && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-200">Buyer Balances</h4>
                                      <p className="text-xs">
                                        <strong>Before:</strong> {log.buyerBefore.ufos.toLocaleString()} UFOS,{" "}
                                        {log.buyerBefore.resource.toLocaleString()} {resourceName}
                                      </p>
                                      <p className="text-xs">
                                        <strong>After:</strong> {log.buyerAfter.ufos.toLocaleString()} UFOS,{" "}
                                        {log.buyerAfter.resource.toLocaleString()} {resourceName}
                                      </p>
                                    </div>
                                  )}
                                  {log.sellerWallet && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-200">Seller Balances</h4>
                                      <p className="text-xs">
                                        <strong>Before:</strong> {log.sellerBefore.ufos.toLocaleString()} UFOS,{" "}
                                        {log.sellerBefore.resource.toLocaleString()} {resourceName}
                                      </p>
                                      <p className="text-xs">
                                        <strong>After:</strong> {log.sellerAfter.ufos.toLocaleString()} UFOS,{" "}
                                        {log.sellerAfter.resource.toLocaleString()} {resourceName}
                                      </p>
                                    </div>
                                  )}
                                  {!(log.buyerWallet || log.sellerWallet) && (
                                    <p className="text-xs text-gray-400">No balance data available</p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="py-3 px-4 text-white capitalize">{log.status}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}