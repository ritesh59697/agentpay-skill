# AgentPay Operation Instructions

> Network Configuration: RPC url is read from assets/networks.json.
> Private Key: Pass explicitly via `--private-key $PRIVATE_KEY`.

---

## Deploy Contract

### Overview
Deploys the `AgentPay` contract to the Pharos network with a configurable USDC token address.

### Command Template
```bash
forge script script/DeployAgentPay.s.sol:DeployAgentPay \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| USDC_ADDRESS | address | No | Configures USDC address. Defaults to testnet USDC: `0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8`. |

### Output Parsing
The command broadcasts the deployment transaction and prints logs showing:
```
AgentPay deployed to: <contract_address>
```

### Error Handling
| Error Signature | Cause | Suggested Action |
|----------------|-------|----|
| `insufficient funds` | Deployer balance has no PHRS for gas | Fund deployer address with testnet gas. |

---

## Verify Contract

### Overview
Verifies the deployed contract on the Pharos Atlantic testnet explorer.

### Command Template
```bash
forge verify-contract <contract_address> src/agentpay/AgentPay.sol:AgentPay \
  --chain-id 688689 \
  --verifier-url https://api.socialscan.io/pharos-atlantic-testnet/v1/explorer/command_api/contract \
  --verifier blockscout \
  --constructor-args $(cast abi-encode "constructor(address)" <usdc_address>)
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed contract to verify. |
| usdc_address | address | Yes | Constructor parameter used during deployment. |

### Output Parsing
Returns compilation/upload verification logs or errors.

### Error Handling
| Error Signature | Cause | Suggested Action |
|----------------|-------|----|
| `psycopg2` / explorer errors | Running verification immediately | Wait 10 seconds (indexer delay) and retry. |

---

## Set Agent Budget

### Overview
Sets the maximum spending limit (budget) in USDC for an agent address. Only callable by the contract owner.

### Command Template
```bash
cast send <contract_address> "setBudget(address,uint256)" <agent_address> <max_spend> \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| agent_address | address | Yes | Address of the agent receiving the budget. |
| max_spend | uint256 | Yes | Maximum USDC allowed to spend (in 6 decimals, e.g. `1000000` = 1 USDC). |

### Output Parsing
Returns transaction hash and receipt. Emits `BudgetSet` event.

### Error Handling
| Error Signature | Cause | Suggested Action |
|----------------|-------|----|
| `Not owner` | Caller is not owner | Set budget using the deployer/owner private key. |

---

## Execute Payment

### Overview
Executes a USDC payment from the contract to a receiver. Only callable by an agent with remaining budget.

### Command Template
```bash
cast send <contract_address> "pay(address,address,uint256)" <usdc_address> <pay_to> <amount> \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| usdc_address | address | Yes | Configured USDC address. Must match constructor USDC address. |
| pay_to | address | Yes | Recipient address of the USDC. |
| amount | uint256 | Yes | Amount of USDC to pay (in 6 decimals). |

### Output Parsing
Returns transaction receipt. Emits `Paid` event.

### Error Handling
| Error Signature | Cause | Suggested Action |
|----------------|-------|----|
| `Only USDC supported` | Provided token does not match constructor USDC | Pass correct USDC token address. |
| `Budget exceeded` | Amount exceeds remaining session budget limit | Request the owner to increase budget via `setBudget`. |
| `Insufficient contract balance` | Contract has less USDC than amount | Fund the AgentPay contract address with USDC. |

---

## Check Agent Spent

### Overview
Queries the total spent amount in USDC by an agent.

### Command Template
```bash
cast call <contract_address> "getSpent(address)(uint256)" <agent_address> \
  --rpc-url $RPC
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| agent_address | address | Yes | Address of the agent. |

### Output Parsing
Returns the spent amount as raw uint256 (6 decimals).

---

## Check Agent Budget

### Overview
Queries the total budget allocated to an agent.

### Command Template
```bash
cast call <contract_address> "getBudget(address)(uint256)" <agent_address> \
  --rpc-url $RPC
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| agent_address | address | Yes | Address of the agent. |

### Output Parsing
Returns the max budget amount as raw uint256 (6 decimals).

---

## Check Remaining Budget

### Overview
Queries the remaining spend limit (budget - spent) for an agent.

### Command Template
```bash
cast call <contract_address> "getRemainingBudget(address)(uint256)" <agent_address> \
  --rpc-url $RPC
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| agent_address | address | Yes | Address of the agent. |

### Output Parsing
Returns the remaining budget as raw uint256 (6 decimals).

---

## Recover Tokens

### Overview
Allows the owner to withdraw any token from the contract in case of emergencies.

### Command Template
```bash
cast send <contract_address> "recoverTokens(address,uint256)" <token_address> <amount> \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contract_address | address | Yes | Address of the deployed AgentPay contract. |
| token_address | address | Yes | Address of the token to withdraw. |
| amount | uint256 | Yes | Amount of tokens to withdraw. |

### Output Parsing
Returns transaction hash and receipt.
