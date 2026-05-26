import { describe, expect, it } from "vitest";
import { createProviderDescriptors } from "../src/providers.js";

describe("createProviderDescriptors", () => {
  it("orders Ethereum providers as Alchemy, Infura, then public RPC", () => {
    const descriptors = createProviderDescriptors("ethereum", {
      ALCHEMY_API_KEY: "alchemy-key",
      INFURA_API_KEY: "infura-key",
    });

    expect(descriptors.map((descriptor) => descriptor.name)).toEqual([
      "alchemy",
      "infura",
      "public",
    ]);
    expect(descriptors[0]?.url).toBe(
      "https://eth-mainnet.g.alchemy.com/v2/alchemy-key",
    );
    expect(descriptors[1]?.url).toBe("https://mainnet.infura.io/v3/infura-key");
  });

  it("uses Chainstack before public RPC for BNB when configured", () => {
    const descriptors = createProviderDescriptors("bnb", {
      CHAINSTACK_EVM_URL: "https://rpc.chainstack.example/{chain}/{chainId}",
    });

    expect(descriptors).toEqual([
      {
        name: "chainstack",
        url: "https://rpc.chainstack.example/bnb/56",
      },
      {
        name: "public",
        url: "https://bsc-rpc.publicnode.com",
      },
    ]);
  });
});
