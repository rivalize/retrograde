import { describe, expect, it } from "vitest";
import {
  createSolanaProviderDescriptors,
  createYellowstoneConfig,
} from "../src/providers.js";

describe("Solana provider configuration", () => {
  it("orders providers as Helius, Chainstack, then public RPC", () => {
    const descriptors = createSolanaProviderDescriptors({
      HELIUS_API_KEY: "helius-key",
      CHAINSTACK_SOLANA_URL: "https://chainstack.example/solana",
    });

    expect(descriptors).toEqual([
      {
        name: "helius",
        url: "https://mainnet.helius-rpc.com/?api-key=helius-key",
      },
      {
        name: "chainstack",
        url: "https://chainstack.example/solana",
      },
      {
        name: "public",
        url: "https://api.mainnet-beta.solana.com",
      },
    ]);
  });

  it("creates Yellowstone config only when endpoint and token exist", () => {
    expect(
      createYellowstoneConfig({
        HELIUS_API_KEY: "helius-key",
        HELIUS_GEYSER_URL: "https://grpc.helius.example",
      }),
    ).toEqual({
      endpoint: "https://grpc.helius.example",
      token: "helius-key",
    });

    expect(
      createYellowstoneConfig({ HELIUS_API_KEY: "helius-key" }),
    ).toBeUndefined();
  });
});
