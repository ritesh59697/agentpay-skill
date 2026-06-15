import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { config } from "dotenv";

// Load environment variables
config();

// Securely get configuration - read from environment variables
const payToAddress = process.env.PAY_TO_ADDRESS as `0x${string}`;
if (!payToAddress) {
  console.error("Please set PAY_TO_ADDRESS environment variable");
  process.exit(1);
}

if (!payToAddress.startsWith("0x") || payToAddress.length !== 42) {
  console.error("Invalid receiving address format");
  process.exit(1);
}

const facilitatorUrl = process.env.FACILITATOR_URL;
const port = process.env.PORT || 4021;
const usdcAddress = process.env.USDC_ADDRESS;
const usdcName = process.env.USDC_NAME || "USDC";

if (!facilitatorUrl || !usdcAddress) {
  console.error("Please set FACILITATOR_URL and USDC_ADDRESS");
  process.exit(1);
}

// Create Facilitator client
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

// Initialize x402 resource server
const resourceServer = new x402ResourceServer(facilitatorClient);

// Create EVM scheme instance
const evmScheme = new ExactEvmScheme();

// Register custom USDC configuration for Pharos network
evmScheme.registerMoneyParser(async (amount, network) => {
  if (network === "eip155:688689") {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return {
      amount: Math.round(numericAmount * 1e6).toString(), // USDC 6 decimals
      asset: usdcAddress,
      extra: {
        token: usdcName,
        name: usdcName,
        version: "2",
        assetTransferMethod: "permit2",
      },
    };
  }
  return null; // Use next parser
});

// Register EVM scheme
resourceServer.register("eip155:688689", evmScheme);

resourceServer.onVerifyFailure(async (ctx) => {
  console.error("Payment Verification Failed:", ctx.error);
});

resourceServer.onSettleFailure(async (ctx) => {
  console.error("Payment Settlement Failed:", ctx.error);
});

// Create Express application
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure payment middleware
app.use(
  paymentMiddleware(
    {
      "GET /data": {
        accepts: {
          scheme: "exact",
          price: "0.01", // Priced at $0.01 USDC
          network: "eip155:688689",
          payTo: payToAddress,
        },
        description: "Protected data endpoint",
        mimeType: "application/json",
      },
    },
    resourceServer
  )
);

// Health check endpoint (free)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    network: "pharos-testnet",
    chainId: 688689,
    usdcAddress: usdcAddress,
    payToAddress: payToAddress,
  });
});

// Protected data endpoint
app.get("/data", (req, res) => {
  res.json({
    message: "Hello, paid user!",
    data: {
      timestamp: Date.now(),
      random: Math.random(),
      network: "pharos-testnet",
      chainId: 688689,
    },
    payment: {
      price: "0.01 USDC",
      network: "eip155:688689",
    },
  });
});

// Get server configuration
app.get("/config", (req, res) => {
  res.json({
    network: {
      name: "pharos-testnet",
      chainId: 688689,
      rpcUrl: "https://atlantic.dplabs-internal.com",
      usdcAddress: usdcAddress,
      facilitatorUrl: facilitatorUrl,
    },
    endpoints: [
      { path: "/health", price: "Free", description: "Health check" },
      { path: "/data", price: "0.01 USDC", description: "Random data" },
    ],
    payToAddress: payToAddress,
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handling
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
