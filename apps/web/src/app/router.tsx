import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { MyPage } from "@/features/admin-mypage/mypage-page";
import { DashboardPage } from "@/features/merchant-dashboard/dashboard-page";
import { getDefaultMyPageSection, isMyPageSection } from "@/shared/config/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/mypage",
    element: <MyPage activeSection={getDefaultMyPageSection()} />,
  },
  {
    path: "/mypage/:section",
    element: <MyPageRoute />,
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
]);

function MyPageRoute() {
  const { section } = useParams();

  if (!isMyPageSection(section)) {
    return <Navigate replace to="/mypage" />;
  }

  return <MyPage activeSection={section} />;
}
