export function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.BFF_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL is required. Use `pnpm dev:mock:all` for mock API, or set API_BASE_URL to the Spring Boot API.",
    );
  }

  return apiBaseUrl;
}

export function isMockApi() {
  return process.env.NEXT_PUBLIC_API_MODE === "mock";
}
