import { MyPageClient } from "@/features/admin-mypage";
import { isMyPageSection } from "@/shared/config/routes";

type Props = {
  params: Promise<{ section: string }>;
};

export default async function MyPageSectionPage({ params }: Props) {
  const { section } = await params;
  return <MyPageClient activeSection={isMyPageSection(section) ? section : "security"} />;
}
