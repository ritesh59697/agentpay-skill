import { x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import fs from "fs";
import { ExactEvmScheme } from "@x402/evm";
import { agentPay } from "./agentPay.js";

// Load environment variables
config();

const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey) {
  console.error("Please set EVM_PRIVATE_KEY in .env");
  process.exit(1);
}

// Reset ledger.json for the test
if (fs.existsSync("ledger.json")) {
  fs.unlinkSync("ledger.json");
}

// Create signer
const signer = privateKeyToAccount(privateKey as `0x${string}`);

// Create client
const client = new x402Client();
client.register(
  "eip155:688689",
  new ExactEvmScheme(signer, {
    rpcUrl: "https://atlantic.dplabs-internal.com",
  })
);

async function runTests() {
  const url = "http://localhost:4021/data";

  console.log("\n--- TEST 1: First Request (Should Pay & Log to Ledger) ---");
  try {
    const res = await agentPay(client, url, 0.05);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error: any) {
    console.error("Test 1 Failed:", error.message);
  }

  console.log("\n--- TEST 2: Identical Request (Should Hit Idempotency Cache) ---");
  try {
    const res = await agentPay(client, url, 0.05);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error: any) {
    console.error("Test 2 Failed:", error.message);
  }

  console.log("\n--- TEST 3: Request with Low maxSpend Budget (Should Be Rejected) ---");
  try {
    console.log("Running with maxSpend = 0.005 USDC...");
    await agentPay(client, url, 0.005);
    console.error("Error: Test 3 should have failed but succeeded!");
  } catch (error: any) {
    console.log("Success: Request correctly rejected due to budget limits!");
    console.log("Error details:", error.message);
  }
}

runTests().catch(console.error);
