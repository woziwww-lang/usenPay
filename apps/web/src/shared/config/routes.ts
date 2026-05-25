export const routes = {
  dashboard: "/",
  dashboardAlias: "/dashboard",
  mypage: "/mypage",
  mypageSection: (section: MyPageSection) => `/mypage/${section}`,
} as const;

export const mypageSections = [
  "security",
  "language",
  "currency",
  "discounts",
  "reviews",
  "notifications",
  "payments",
] as const;

export type MyPageSection = (typeof mypageSections)[number];

export function isMyPageSection(value: string): value is MyPageSection {
  return mypageSections.includes(value as MyPageSection);
}
