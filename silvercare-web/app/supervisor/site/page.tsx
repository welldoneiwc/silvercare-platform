"use client";

import SupervisorSiteDetail from "../../../components/SupervisorSiteDetail";

type SiteInfo = {
  location_id: number;
  siteName: string;
  elderCount: number;
};

type PageProps = {
  searchParams: Promise<{
    locationId?: string;
  }>;
};

export default async function SupervisorSitePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const locationId = Number(
    params.locationId
  );

  if (
    !Number.isFinite(locationId) ||
    locationId <= 0
  ) {
    return (
      <div
        style={{
          padding: "40px",
          color: "#B42318",
        }}
      >
        無效的據點 ID。
      </div>
    );
  }

  const siteName =
    locationId === 1
      ? "公理堂據點"
      : locationId === 2
        ? "測試據點2"
        : `據點 ${locationId}`;

  const elderCount =
    locationId === 1
      ? 38
      : locationId === 2
        ? 1
        : 0;

  const site: SiteInfo = {
    location_id: locationId,
    siteName,
    elderCount,
  };

  return (
    <SupervisorSiteDetail
      site={site}
      onBack={() => {
        window.location.href = "/";
      }}
    />
  );
}