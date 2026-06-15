# AgentPay Skill for Pharos Skill Engine

AgentPay is a secure, on-chain session budget management skill designed for autonomous AI agents operating on the Pharos network.

---

## ⚡ Problem / Solution (Why, Who, How)

### The Problem
AI agents performing web3 operations (like calling paid APIs or interacting with DeFi protocols) need to make crypto transactions. However, giving an agent unrestricted access to a hot wallet private key is extremely risky. If the agent's logic loops or gets compromised, it can drain all funds in the wallet.

### Why AgentPay?
AgentPay solves this by providing a smart-contract-based budget controller. The owner sets a strict spending limit (budget) for the agent's wallet address. The agent can only execute payments within that budget. Once the budget is exhausted, the contract automatically blocks any further transfers.

### Who is it for?
- **AI Agent Developers** who want to delegate token spend capability to their agents safely.
- **API Providers** who monetize endpoints using the Pharos network and accept agent payments.
- **dApp Integrators** who want to limit smart contract interaction risks.

### How it works
1. **Deploy**: The owner deploys the `AgentPay` contract on Pharos Atlantic testnet, configuring the target USDC contract.
2. **Authorize**: The owner authorizes an agent address and sets its maximum USDC spending budget (e.g., 5 USDC).
3. **Execute**: The agent executes payments by calling `pay(token, payTo, amount)`. The contract verifies the budget limit, transfers USDC, and updates the agent's spent balance.
4. **Read State**: Anyone can query the spent, budget, or remaining budget of any agent using free view calls.

---

## 📂 Project Layout

Adhering to the official **Pharos Skill Engine** package specification:

```
agentpay-skill/
├── SKILL.md                         ← Skill entry point & Capability Index
├── assets/
│   ├── networks.json                ← Atlantic Testnet parameters
│   └── agentpay/
│       └── AgentPay.sol             ← Built-in AgentPay template contract
├── references/
│   └── agentpay.md                  ← Exact cast/forge command reference
├── src/
│   └── agentpay/
│       └── AgentPay.sol             ← Smart contract source code
└── script/
    └── DeployAgentPay.s.sol         ← Deployment script
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- **Foundry**: Ensure `cast` and `forge` are installed:
  ```bash
  which cast
  which forge
  ```
  If not installed, run:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  source ~/.zshenv && foundryup
  ```

### 2. Configure Environment
Set the environment variables:
```bash
export RPC=https://atlantic.dplabs-internal.com
export PRIVATE_KEY=0xYourPrivateKey
export DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
```

### 3. Compile Contracts
Compile using Forge:
```bash
forge build
```

### 4. Deploy to Pharos Testnet
```bash
forge script script/DeployAgentPay.s.sol:DeployAgentPay \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### 5. Demo Usage (Agent Flow End-to-End)
Show a concrete example of setting budgets, executing payments, and querying state using `cast`:

```bash
# Set a 5 USDC budget for an agent
cast send 0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE \
  "setBudget(address,uint256)" 0xAGENT_ADDRESS 5000000 \
  --private-key $PRIVATE_KEY --rpc-url $RPC

# Agent pays 0.01 USDC for API access
cast send 0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE \
  "pay(address,address,uint256)" $USDC $RECIPIENT 10000 \
  --private-key $AGENT_KEY --rpc-url $RPC

# Check remaining budget
cast call 0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE \
  "getRemainingBudget(address)(uint256)" 0xAGENT_ADDRESS \
  --rpc-url $RPC
```

Refer to [SKILL.md](file:///Users/ritesh/examples/agentpay-skill/SKILL.md) and [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md) for full capability details and exact command invocation examples.


---

## 🌐 Deployed Demo Contract

- **Contract Address**: `0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE`
- **Network**: Pharos Atlantic Testnet (Chain ID: 688689)
- **USDC Token**: `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8`
- **Explorer**: [https://atlantic.pharosscan.xyz/address/0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE](https://atlantic.pharosscan.xyz/address/0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE)
- **Verified Contract**: [https://atlantic.pharosscan.xyz/address/0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE](https://atlantic.pharosscan.xyz/address/0xEfDdb2C5788E426d0AE18a62B74a84A8c86972dE)


