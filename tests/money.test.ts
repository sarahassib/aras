import { describe, expect, it } from "vitest";
import {
  applyPercentOff,
  clampQuantity,
  discountPercent,
  formatMAD,
  parseAmountToMinor,
} from "@/lib/money";

describe("formatMAD", () => {
  it("formats whole dirhams without decimals", () => {
    expect(formatMAD(79900)).toBe("799 DH");
    expect(formatMAD(0)).toBe("0 DH");
  });

  it("keeps cents when the amount has them", () => {
    expect(formatMAD(79910)).toBe("799.10 DH");
    expect(formatMAD(71910)).toBe("719.10 DH");
  });

  it("groups thousands", () => {
    expect(formatMAD(104800)).toBe("1,048 DH");
  });
});

describe("applyPercentOff", () => {
  it("returns the price after the discount", () => {
    expect(applyPercentOff(79900, 10)).toBe(71910);
    expect(applyPercentOff(10000, 25)).toBe(7500);
  });

  it("never goes negative and clamps at 100%", () => {
    expect(applyPercentOff(79900, 100)).toBe(0);
    expect(applyPercentOff(79900, 150)).toBe(0);
    expect(applyPercentOff(79900, 0)).toBe(79900);
  });
});

describe("parseAmountToMinor", () => {
  it("parses plain and grouped amounts", () => {
    expect(parseAmountToMinor("799")).toBe(79900);
    expect(parseAmountToMinor("1,048")).toBe(104800);
    expect(parseAmountToMinor("21.50")).toBe(2150);
  });

  it("ignores currency labels", () => {
    expect(parseAmountToMinor("500 DH")).toBe(50000);
  });

  it("rejects invalid values", () => {
    expect(() => parseAmountToMinor("abc")).toThrow();
    expect(() => parseAmountToMinor("-5")).toThrow();
  });
});

describe("clampQuantity", () => {
  it("clamps to 1..99", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-3)).toBe(1);
    expect(clampQuantity(1000)).toBe(99);
    expect(clampQuantity(4.7)).toBe(4);
  });
});

describe("discountPercent", () => {
  it("computes the rounded percentage between two prices", () => {
    expect(discountPercent(79900, 99900)).toBe(20);
    expect(discountPercent(10000, 10000)).toBe(0);
  });
});
