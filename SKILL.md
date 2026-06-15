---
name: agentpay-skill
description: AgentPay capability package for Pharos Atlantic Testnet. Enables setting and checking agent session budgets, executing payments, and managing on-chain AgentPay sessions.
license: MIT
metadata:
  author: ritesh
  version: "1.0.0"
---

# AgentPay Skill Engine

The AgentPay skill provides on-chain payment and session-budget management capability for AI agents on the Pharos network.

## Prerequisites

- **Foundry CLI Tools**: Must have `cast` and `forge` installed and available in the command execution path.
- **Wallet configuration**: Private key must be provided via the `$PRIVATE_KEY` environment variable.
- **USDC Token**: The agent wallet must be funded with USDC (and native PHRS for gas) on the Pharos Atlantic Testnet.

## Network Configuration

All network parameters are defined in [networks.json](file:///Users/ritesh/examples/agentpay-skill/assets/networks.json).

- **Chain Name**: Pharos Atlantic Testnet
- **Chain ID**: 688689
- **RPC URL**: `https://atlantic.dplabs-internal.com`
- **USDC Address**: `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8`

---

## Capability Index

| User Need | Capability | Detailed Instructions |
|-----------|------------|----------------------|
| Deploy AgentPay contract / Setup AgentPay / [synonyms] | forge script + built-in AgentPay template | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#deploy-contract) |
| Verify AgentPay contract on Pharos explorer / [synonyms] | forge verify-contract | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#verify-contract) |
| Set session budget for agent / Limit agent spending / Approve agent budget | cast send setBudget() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#set-agent-budget) |
| Execute payment / Pay for API access / Pay receiver | cast send pay() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#execute-payment) |
| Get spent amount for agent / Check total agent spending / [synonyms] | cast call getSpent() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#check-agent-spent) |
| Check budget of agent / View agent budget limit | cast call getBudget() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#check-agent-budget) |
| Check remaining budget / Check remaining spend limit | cast call getRemainingBudget() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#check-remaining-budget) |
| Recover tokens from contract / Emergency recover | cast send recoverTokens() | → [references/agentpay.md](file:///Users/ritesh/examples/agentpay-skill/references/agentpay.md#recover-tokens) |

---

## Write Operation Pre-checks

Every transaction operation (deploy, setBudget, pay, recoverTokens) must fulfill the following checks before being executed:
1. **Private Key Presence**: Validate that `$PRIVATE_KEY` env var is populated and begins with `0x`.
2. **Address & Balance Check**: Verify the deployer address using `cast wallet address` and check that its native PHRS balance is sufficient for gas.
3. **Network Check**: Verify that `RPC` points to `https://atlantic.dplabs-internal.com`.

## Security Reminders

- **No Hardcoding**: Never write or commit raw private keys in scripts or config files. Use the `$PRIVATE_KEY` environment variable.
- **Pass explicitly**: Always append `--private-key $PRIVATE_KEY` to all `cast send` or `forge script` transactions.
