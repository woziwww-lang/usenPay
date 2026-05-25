import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBaseUrl } from "./server-env";

describe("server env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires an explicit API base URL", () => {
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("BFF_BASE_URL", "");

    expect(() => getApiBaseUrl()).toThrow("API_BASE_URL is required");
  });
});
