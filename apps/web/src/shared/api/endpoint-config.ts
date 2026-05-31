export type ApiMode = "bff" | "mock" | "spring";

export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE;

  if (mode === "mock" || mode === "spring") {
    return mode;
  }

  return "bff";
}

export function getDataSourceLabel() {
  switch (getApiMode()) {
    case "mock":
      return "Mock API";
    case "spring":
      return "Spring API";
    default:
      return "BFF";
  }
}
