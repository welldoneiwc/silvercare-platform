import SupervisorSiteDetail from "../../../components/SupervisorSiteDetail";

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

  return (
    <SupervisorSiteDetail
      locationId={locationId}
    />
  );
}