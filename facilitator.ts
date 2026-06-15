import express from "express";
import { x402Facilitator } from "@x402/core/facilitator";
import { registerExactEvmScheme } from "@x402/evm/exact/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import { pharosAtlanticTestnet } from "./pharosChain.js";

// Load environment variables
config();

const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey) {
  console.error("Please set EVM_PRIVATE_KEY environment variable");
  process.exit(1);
}

if (!privateKey.startsWith("0x")) {
  console.error("Private key must start with 0x");
  process.exit(1);
}

// Create viem account and combined client
const account = privateKeyToAccount(privateKey as `0x${string}`);
const client = createWalletClient({
  account,
  chain: pharosAtlanticTestnet,
  transport: http(),
}).extend(publicActions);

// Convert to facilitator signer
const signer = toFacilitatorEvmSigner({
  address: account.address,
  readContract: (args) => client.readContract(args),
  verifyTypedData: (args) => client.verifyTypedData(args as any),
  writeContract: (args) => client.writeContract(args as any),
  sendTransaction: (args) => client.sendTransaction(args),
  waitForTransactionReceipt: (args) => client.waitForTransactionReceipt(args),
  getCode: (args) => client.getCode(args),
});

// Initialize x402 facilitator
const facilitator = new x402Facilitator();

// Register the EVM exact scheme
registerExactEvmScheme(facilitator, {
  signer,
  networks: "eip155:688689",
});

// Create Express app
const app = express();
app.use(express.json());

// 1. GET /supported
app.get("/supported", (req, res) => {
  try {
    const supported = facilitator.getSupported();
    res.json(supported);
  } catch (error: any) {
    console.error("Error in /supported:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /verify
app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const result = await facilitator.verify(paymentPayload, paymentRequirements);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /verify:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /settle
app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const result = await facilitator.settle(paymentPayload, paymentRequirements);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /settle:", error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.FACILITATOR_PORT || 3000;
app.listen(port, () => {
  console.log(`Facilitator running on http://localhost:${port}`);
});
