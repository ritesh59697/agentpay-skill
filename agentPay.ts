import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { decodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.join(__dirname, "ledger.json");

export interface LedgerEntry {
  tx_hash: string;
  amount: number; // USDC decimal value (e.g. 0.01)
  endpoint: string;
  timestamp: string;
}

// Read ledger entries from ledger.json
export function readLedger(): LedgerEntry[] {
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
  } catch (error) {
    console.error("Error reading ledger.json, resetting ledger:", error);
    return [];
  }
}

// Write ledger entries to ledger.json
export function writeLedger(entries: LedgerEntry[]) {
  fs.writeFileSync(ledgerPath, JSON.stringify(entries, null, 2), "utf-8");
}

// Sum all spent amounts in USDC
export function sumLedgerAmounts(): number {
  const ledger = readLedger();
  return ledger.reduce((sum, entry) => sum + entry.amount, 0);
}

// Log a successful payment to the ledger
export function logToLedger(tx_hash: string, amount: number, endpoint: string) {
  const ledger = readLedger();
  if (ledger.some((e) => e.tx_hash === tx_hash)) {
    return;
  }
  ledger.push({
    tx_hash,
    amount,
    endpoint,
    timestamp: new Date().toISOString(),
  });
  writeLedger(ledger);
}

// Check if an identical request was made in the last 60 seconds
export function checkIdempotency(endpoint: string, amount: number): string | null {
  const ledger = readLedger();
  const now = new Date();
  for (const entry of ledger) {
    if (entry.endpoint === endpoint && entry.amount === amount) {
      const entryTime = new Date(entry.timestamp);
      const diffSeconds = (now.getTime() - entryTime.getTime()) / 1000;
      if (diffSeconds >= 0 && diffSeconds <= 60) {
        return entry.tx_hash;
      }
    }
  }
  return null;
}

/**
 * Custom fetch wrapper with budget limit checking and request idempotency.
 */
export async function agentPay(
  client: x402Client,
  url: string,
  maxSpend: number,
  init?: RequestInit
): Promise<Response> {
  const wrappedFetch = async (
    input: RequestInfo | URL,
    fetchInit?: RequestInit
  ): Promise<Response> => {
    const requestUrl =
      typeof input === "string" ? input : (input as any).url || input.toString();

    // Determine if the current fetch is sending the payment signature
    let isPayment = false;
    if (fetchInit && fetchInit.headers) {
      const headers = fetchInit.headers;
      if (headers instanceof Headers) {
        isPayment = headers.has("PAYMENT-SIGNATURE") || headers.has("X-PAYMENT");
      } else if (Array.isArray(headers)) {
        isPayment = headers.some(
          ([k]) =>
            k.toUpperCase() === "PAYMENT-SIGNATURE" || k.toUpperCase() === "X-PAYMENT"
        );
      } else {
        const keys = Object.keys(headers).map((k) => k.toUpperCase());
        isPayment = keys.includes("PAYMENT-SIGNATURE") || keys.includes("X-PAYMENT");
      }
    }

    // Call baseline fetch
    const response = await fetch(input, fetchInit);
    console.log("[AgentPay Debug] response status:", response.status, "isPayment:", isPayment);
    console.log("[AgentPay Debug] response headers:", [...response.headers.entries()]);

    if (response.status === 402) {
      // Payment required - verify budget constraints and idempotency
      const paymentRequiredHeader =
        response.headers.get("PAYMENT-REQUIRED") ||
        response.headers.get("payment-required");
      if (paymentRequiredHeader) {
        const paymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);
        const requirements = paymentRequired.accepts[0];
        if (requirements) {
          const amount = parseFloat(requirements.amount || "0") / 1e6; // USDC has 6 decimals

          // Check Idempotency
          const cachedTx = checkIdempotency(requestUrl, amount);
          if (cachedTx) {
            console.log(
              `[AgentPay] Idempotency hit for ${requestUrl} (${amount} USDC). Returning cached tx_hash: ${cachedTx}`
            );

            // Reconstruct a mock successful response matching protocol
            const paymentResponse = {
              success: true,
              transaction: cachedTx,
              network: requirements.network,
              amount: requirements.amount,
              payer: "0x0000000000000000000000000000000000000000",
            };

            const headers = new Headers();
            headers.set(
              "PAYMENT-RESPONSE",
              encodePaymentResponseHeader(paymentResponse)
            );
            headers.set("Content-Type", "application/json");

            return new Response(
              JSON.stringify({
                message: "Hello, paid user!",
                data: {
                  timestamp: Date.now(),
                  random: Math.random(),
                  network: "pharos-testnet",
                  chainId: 688689,
                  note: "Response served from local idempotency cache",
                },
                payment: {
                  price: `${amount} USDC`,
                  network: requirements.network,
                  tx_hash: cachedTx,
                },
              }),
              {
                status: 200,
                headers,
              }
            );
          }

          // Check Budget limit
          const totalSpent = sumLedgerAmounts();
          if (totalSpent + amount > maxSpend) {
            console.log(
              `[AgentPay] Budget limit exceeded! Trying to spend ${amount} USDC, total spent would be ${
                totalSpent + amount
              } USDC, maxSpend is ${maxSpend} USDC`
            );
            throw new Error(
              `BudgetExceeded: Payment of ${amount} USDC would exceed the maximum spend budget of ${maxSpend} USDC (currently spent: ${totalSpent} USDC)`
            );
          }
        }
      }
    } else if (response.status === 200 && isPayment) {
      // Successful payment completion on-chain - log to ledger
      const paymentResponseHeader =
        response.headers.get("PAYMENT-RESPONSE") ||
        response.headers.get("payment-response");
      if (paymentResponseHeader) {
        const paymentResponse = decodePaymentResponseHeader(paymentResponseHeader);
        if (paymentResponse.success) {
          const tx_hash = paymentResponse.transaction;
          const amount = parseFloat(paymentResponse.amount || "0") / 1e6;
          console.log(
            `[AgentPay] Payment successful. Logging to ledger: ${tx_hash} | ${amount} USDC | ${requestUrl}`
          );
          logToLedger(tx_hash, amount, requestUrl);
        }
      }
    }

    return response;
  };

  const fetchWithPayment = wrapFetchWithPayment(wrappedFetch, client);
  return fetchWithPayment(url, init);
}
