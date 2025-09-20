// components/StandardToastModal.tsx
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

interface ToastState {
  isOpen: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description: string | ToastContent[];
  duration?: number;
}

interface ToastContent {
  key: string;
  amount: number;
  text?: string;
}

interface StandardToastModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description: string | ToastContent[];
  duration?: number;
}

// lib/constants.ts
export interface Resource {
  name: string;
  key: ResourceKey;
  image: string;
}

export type ResourceKey =
  | "ice"
  | "co2"
  | "water"
  | "halite"
  | "emptyPowerCell"
  | "fullPowerCell"
  | "brokenPowerCell"
  | "crystalOre"
  | "rareEarths"
  | "purifiedWater"
  | "plasmaFluid"
  | "quantumCells"
  | "energyCores"
  | "biofiber"
  | "sporeEssence"
  | "alloyIngots"
  | "nanosteel"
  | "catalysts"
  | "polymers"
  | "spareParts"
  | "circuitBoards"
  | "tradeContracts"
  | "marketTokens"
  | "processedGems"
  | "exoticCrystals"
  | "hydrogenFuel"
  | "fusionFluid"
  | "plasmaCores"
  | "antimatterCells"
  | "bioPolymers"
  | "nanoOrganics"
  | "superAlloys"
  | "metaMaterials"
  | "nanoCatalysts"
  | "quantumChemicals"
  | "advancedComponents"
  | "roboticModules"
  | "cryptoCredits"
  | "galacticBonds"
  | "solarPanel"
  | "ionThruster"
  | "lifeSupportModule"
  | "quantumDrive"
  | "ufos"
  | "nanoAssembler"
  | "bioCircuit"
  | "crystalMatrix"
  | "hydroCore"
  | "tradeBeacon"
  | "gravitonShield"
  | "neuralInterface"
  | "antimatterWarhead"
  | "holoProjector"
  | "bioReactorCore";

export const resources: Resource[] = [
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
  { name: "Solar Panel", key: "solarPanel", image: "/solar_panel.png" },
  { name: "Ion Thruster", key: "ionThruster", image: "/ion_thruster.png" },
  { name: "Life Support Module", key: "lifeSupportModule", image: "/life_support_module.png" },
  { name: "Quantum Drive", key: "quantumDrive", image: "/quantum_drive.png" },
  { name: "Nano Assembler", key: "nanoAssembler", image: "/nano_assembler.png" },
  { name: "Bio Circuit", key: "bioCircuit", image: "/bio_circuit.png" },
  { name: "Crystal Matrix", key: "crystalMatrix", image: "/crystal_matrix.png" },
  { name: "Hydro Core", key: "hydroCore", image: "/hydro_core.png" },
  { name: "Trade Beacon", key: "tradeBeacon", image: "/trade_beacon.png" },
  { name: "Graviton Shield", key: "gravitonShield", image: "/graviton_shield.png" },
  { name: "Neural Interface", key: "neuralInterface", image: "/neural_interface.png" },
  { name: "Antimatter Warhead", key: "antimatterWarhead", image: "/antimatter_warhead.png" },
  { name: "Holo-Projector", key: "holoProjector", image: "/holo_projector.png" },
  { name: "Bio-Reactor Core", key: "bioReactorCore", image: "/bio_reactor_core.png" },
];

const GAME_ASSETS = {
  background: "/Background.png",
  landMap: "/Landgg.png",
  batteryEmpty: "/Battery_Empty.png",
  batteryFull: "/Battery_Full.png",
  batteryBroken: "/Battery_Broken.png",
  batteryCharging: "/charging1.png",
  ice: "/Ice3.png",
  co2: "/co2.png",
  rocket: "/rocket.png",
  water: "/water.png",
  mineral: "/Mineral.png",
  coin: "/Coin_Anim.gif",
  powerCellCharger: "/PowerCellCharger.png",
  market: "/Marketgg.png",
  cad: "/cad.png",
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
  solflareIcon: "https://avatars.githubusercontent.com/u/89903469?s=200&v=4", // Add this line
  crystalMine: "crystal_mine.png",
  crystalRefinery: "crystal_refinery.png",
  advancedFilter: "advanced_filter.png",
  plasmaReactor: "plasma_extractor.png",
  quantumFoundry: "quantum_foundry.png",
  coreReactor: "core_reactor.png",
  biopolymerGreenhouse: "biopolymer_greenhouse.png",
  myceliumExtractor: "mycelium_extractor.png",
  smeltingForge: "smelting_forge.png",
  nanoForge: "nano_forge.png",
  chemicalSynthesizer: "chemical_synthesizer.png",
  polymerizationPlant: "polymerization_plant.png",
  assemblyWorkshop: "assembly_workshop.png",
  electronicsFabricator: "electronics_fabricator.png",
  commerceHub: "commerce_hub.png",
  tokenMinter: "token_minter.png",
  // ... other building assets
  crystalOre: "/crystal_ore.png",
  rareEarths: "/rare_earths.png",
  processedGems: "/processed_gems.png", // Geologist
  exoticCrystals: "/exotic_crystals.png", // Geologist
  purifiedWater: "/purified_water.png",
  plasmaFluid: "/plasma_fluid.png",
  hydrogenFuel: "/hydrogen_fuel.png", // HydroEngineer
  fusionFluid: "/fusion_fluid.png", // HydroEngineer
  quantumCells: "/quantum_cells.png",
  energyCores: "/energy_cores.png",
  plasmaCores: "/plasma_cores.png", // PowerTechnician
  antimatterCells: "/antimatter_cells.png", // PowerTechnician
  biofiber: "/biofiber.png",
  sporeEssence: "/spore_essence.png",
  bioPolymers: "/bio_polymers.png", // Botanist
  nanoOrganics: "/nano_organics.png", // Botanist
  alloyIngots: "/alloy_ingots.png",
  nanosteel: "/nanosteel.png",
  superAlloys: "/super_alloys.png", // Metallurgist
  metaMaterials: "/meta_materials.png", // Metallurgist
  catalysts: "/catalysts.png",
  polymers: "/polymers.png",
  nanoCatalysts: "/nano_catalysts.png", // Chemist
  quantumChemicals: "/quantum_chemicals.png", // Chemist
  spareParts: "/spare_parts.png",
  circuitBoards: "/circuit_boards.png",
  advancedComponents: "/advanced_components.png", // Mechanic
  roboticModules: "/robotic_modules.png", // Mechanic
  tradeContracts: "/trade_contracts.png",
  marketTokens: "/market_tokens.png",
  cryptoCredits: "/crypto_credits.png", // Trader
  galacticBonds: "/galactic_bonds.png", // Trader
  gemProcessor: "/gem_processor.png", // Geologist
  crystalSynthesizer: "/crystal_synthesizer.png", // Geologist
  hydrogenExtractor: "/hydrogen_extractor.png", // HydroEngineer
  fusionPlant: "/fusion_plant.png", // HydroEngineer
  plasmaCoreFabricator: "/plasma_core_fabricator.png", // PowerTechnician
  antimatterGenerator: "/antimatter_generator.png", // PowerTechnician
  bioPolymerSynthesizer: "/bio_polymer_synthesizer.png", // Botanist
  nanoOrganicLab: "/nano_organic_lab.png", // Botanist
  superAlloyForge: "/super_alloy_forge.png", // Metallurgist
  metaMaterialSynthesizer: "/meta_material_synthesizer.png", // Metallurgist
  nanoCatalystLab: "/nano_catalyst_lab.png", // Chemist
  quantumChemSynthesizer: "/quantum_chem_synthesizer.png", // Chemist
  componentFabricator: "/component_fabricator.png", // Mechanic
  roboticsAssembler: "/robotics_assembler.png", // Mechanic
  cryptoExchange: "/crypto_exchange.png", // Trader
  bondIssuer: "/bond_issuer.png", // Trader
  interstellarFabricator: "/interstellar_fabricator.png",
  solarPanel: "/solar_panel.png",
  ionThruster: "/ion_thruster.png",
  lifeSupportModule: "/life_support_module.png",
  quantumDrive: "/quantum_drive.png",
  nanoAssembler: "/nano_assembler.png",
  bioCircuit: "/bio_circuit.png",
  crystalMatrix: "/crystal_matrix.png",
  hydroCore: "/hydro_core.png",
  tradeBeacon: "/trade_beacon.png",
  gravitonShield: "/graviton_shield.png",
  neuralInterface: "/neural_interface.png",
  antimatterWarhead: "/antimatter_warhead.png",
  holoProjector: "/holo_projector.png",
  bioReactorCore: "/bio_reactor_core.png",
}

const typeStyles = {
  success: {
    icon: <CheckCircle className="w-6 h-6 text-green-500" />,
    titleColor: "text-green-400",
    borderColor: "border-green-500",
  },
  error: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    titleColor: "text-red-400",
    borderColor: "border-red-500",
  },
  info: {
    icon: <Info className="w-6 h-6 text-blue-500" />,
    titleColor: "text-blue-400",
    borderColor: "border-blue-500",
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    titleColor: "text-yellow-300",
    borderColor: "border-yellow-500",
  },
};

export function StandardToastModal({
  isOpen,
  onClose,
  type,
  title,
  description,
  duration = 3000,
}: StandardToastModalProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const { icon, titleColor, borderColor } = typeStyles[type];

  const renderDescription = () => {
    if (Array.isArray(description)) {
      return (
        <div className="flex flex-col gap-1">
          <span>Resources:</span>
          <div className="flex flex-wrap gap-2">
            {description.map(({ key, amount, text }, index) => {
              if (key === "text" && text) {
                return (
                  <p key={`text-${index}`} className="text-sm text-gray-300">
                    {text}
                  </p>
                );
              }
              const resource = resources.find((r: Resource) => r.key === key);
              const imageSrc = key === "ufos" ? GAME_ASSETS.coin : resource?.image || "/placeholder.svg";
              return (
                <div key={key} className="flex items-center gap-1">
                  <img
                    src={imageSrc}
                    alt={resource?.name || key}
                    className="w-5 h-5"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    loading="lazy"
                  />
                  <span>{amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return typeof description === "string" ? <p className="text-sm text-gray-300">{description}</p> : description;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
      <Card className={`w-[90vw] max-w-[400px] bg-gray-800 ${borderColor} text-white shadow-lg`}>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className={`text-lg font-bold ${titleColor}`}>{title}</h2>
          </div>
          {renderDescription()}
          <div className="flex justify-end">
            <Button
              variant="default" // Changed from "outline" to "default" for solid background
              size="sm"
              onClick={onClose}
              className="text-xs bg-black text-white border-black hover:bg-gray-900 hover:border-gray-900"
              aria-label="Close toast modal"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}