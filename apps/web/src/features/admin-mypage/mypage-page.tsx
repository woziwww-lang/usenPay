import type { MyPageSection } from "@/shared/config/routes";
import { MyPageClient } from "./mypage-client";

type Props = {
  activeSection: MyPageSection;
};

export function MyPage({ activeSection }: Props) {
  return <MyPageClient activeSection={activeSection} />;
}
