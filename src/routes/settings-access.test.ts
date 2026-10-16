import { webcrypto } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { matchesSettingsCode } from "@/lib/settings-access";

vi.stubGlobal("crypto", webcrypto);

describe("Settings privacy code", () => {
  it("accepts the requested code with its leading zero", async () => {
    expect(await matchesSettingsCode("0316")).toBe(true);
  });
  it("rejects an incorrect four-digit code", async () => {
    expect(await matchesSettingsCode("0317")).toBe(false);
  });
  it("does not drop the leading zero", async () => {
    expect(await matchesSettingsCode("316")).toBe(false);
  });
});