import { defineChain } from "viem";

export const pharosAtlanticTestnet = defineChain({
  id: 688689,
  name: "Pharos Atlantic Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Pharos",
    symbol: "PHAROS",
  },
  rpcUrls: {
    default: {
      http: ["https://atlantic.dplabs-internal.com"],
    },
    public: {
      http: ["https://atlantic.dplabs-internal.com"],
    },
  },
});
