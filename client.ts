import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import fs from "fs";
import { ExactEvmScheme } from "@x402/evm";

// Load environment variables
config();

// Securely get private key - read from environment variable or file
const privateKey =
  process.env.EVM_PRIVATE_KEY ||
  (fs.existsSync(".private_key")
    ? fs.readFileSync(".private_key", "utf-8").trim()
    : null);

if (!privateKey) {
  console.error("Please set EVM_PRIVATE_KEY or create .private_key file");
  process.exit(1);
}

if (!privateKey.startsWith("0x")) {
  console.error("Private key must start with 0x");
  process.exit(1);
}

// Create signer
const signer = privateKeyToAccount(privateKey as `0x${string}`);

// Create x402 client
const client = new x402Client();

// Register EVM scheme
client.register("eip155:688689", new ExactEvmScheme(signer, {
  rpcUrl: "https://atlantic.dplabs-internal.com",
}));

// Create fetch with payment
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Usage example
async function main() {
  const serverUrl = process.argv[2];

  if (!serverUrl) {
    console.error("Please provide server URL");
    process.exit(1);
  }

  console.log(`Making paid request to: ${serverUrl}`);
  const response = await fetchWithPayment(serverUrl);
  console.log("Response status:", response.status);
  console.log("Response headers:", [...response.headers.entries()]);
  const text = await response.text();
  console.log("Response text:", text);
  try {
    const data = JSON.parse(text);
    console.log("Response data:", data);
  } catch {
    console.log("Response is not JSON");
  }
}

// Run main function
main().catch(console.error);
