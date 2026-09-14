"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../utils/supabase";
import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

type ElderRow = {
  id: number;
  location_id: number | null;
};

type SiteInfo = {
  location_id: number;
  siteName: string;
  elderCount: number;
};

type SupervisorOverviewProps = {
  onSelectSite?: (locationId: number) => void;
};

export default function SupervisorOverview({
  onSelectSite,
}: SupervisorOverviewProps) {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErrorMessage("目前尚未登入，無法載入據點資料。");
        return;
      }

      const {
        data: roleData,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select("role, location_id")
        .eq("user_id", userData.user.id)
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error("讀取使用者角色失敗：", roleError);
        setErrorMessage("無法確認目前使用者權限。");
        return;
      }

      if (roleData?.role !== "supervisor") {
        setErrorMessage("此頁面僅提供 Supervisor 使用。");
        return;
      }

      const {
        data: eldersData,
        error: eldersError,
      } = await supabase
        .from("elders")
        .select("id, location_id");

      if (eldersError) {
        console.error("讀取長者資料失敗：", eldersError);
        setErrorMessage("無法載入據點長者資料。");
        return;
      }

      const elderRows: ElderRow[] =
        (eldersData ?? []) as ElderRow[];

      const countMap = new Map<number, number>();

      elderRows.forEach((elder: ElderRow) => {
        if (
          elder.location_id === null ||
          elder.location_id === undefined
        ) {
          return;
        }

        const locationId = Number(elder.location_id);

        if (!Number.isFinite(locationId)) {
          return;
        }

        countMap.set(
          locationId,
          (countMap.get(locationId) ?? 0) + 1
        );
      });

      const knownSiteNames: Record<number, string> = {
        1: "公理堂據點",
        2: "測試據點2",
      };

      const siteList: SiteInfo[] = Array.from(
        countMap.entries()
      )
        .map(([locationId, elderCount]) => ({
          location_id: locationId,
          siteName:
            knownSiteNames[locationId] ??
            `據點 ${locationId}`,
          elderCount,
        }))
        .sort(
          (a, b) =>
            a.location_id - b.location_id
        );

      setSites(siteList);
    } catch (error) {
      console.error(
        "SupervisorOverview 載入失敗：",
        error
      );

      setErrorMessage(
        "載入據點資料時發生錯誤。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSite = (
    locationId: number
  ) => {
    if (onSelectSite) {
      onSelectSite(locationId);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        padding: "24px",
        boxSizing: "border-box",
        background: colors.background,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.4,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            據點總覽
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#667579",
            }}
          >
            Supervisor 可查看所有據點，各據點資料獨立顯示。
          </p>
        </div>

        {loading && (
          <div
            style={{
              padding: "40px 24px",
              background: "#FFFFFF",
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              textAlign: "center",
              color: "#667579",
            }}
          >
            正在載入據點資料...
          </div>
        )}

        {!loading && errorMessage && (
          <div
            style={{
              padding: "20px 24px",
              background: "#FFFFFF",
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              color: "#B42318",
              fontSize: "15px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          sites.length === 0 && (
            <div
              style={{
                padding: "40px 24px",
                background: "#FFFFFF",
                borderRadius: radius.lg,
                boxShadow: shadow.sm,
                textAlign: "center",
                color: "#667579",
              }}
            >
              目前沒有找到任何據點資料。
            </div>
          )}

        {!loading &&
          !errorMessage &&
          sites.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {sites.map(
                (site: SiteInfo) => (
                  <button
                    key={site.location_id}
                    type="button"
                    onClick={() =>
                      handleSelectSite(
                        site.location_id
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "24px",
                      border:
                        "1px solid #DDE5E7",
                      borderRadius: radius.lg,
                      background: "#FFFFFF",
                      boxShadow: shadow.sm,
                      textAlign: "left",
                      cursor: onSelectSite
                        ? "pointer"
                        : "default",
                      transition:
                        "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(event) => {
                      if (!onSelectSite) {
                        return;
                      }

                      event.currentTarget.style.transform =
                        "translateY(-2px)";

                      event.currentTarget.style.boxShadow =
                        shadow.md;
                    }}
                    onMouseLeave={(event) => {
                      if (!onSelectSite) {
                        return;
                      }

                      event.currentTarget.style.transform =
                        "translateY(0)";

                      event.currentTarget.style.boxShadow =
                        shadow.sm;
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#7A898D",
                            marginBottom: "6px",
                          }}
                        >
                          LOCATION ID
                        </div>

                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color:
                              colors.primary,
                          }}
                        >
                          {site.siteName}
                        </div>
                      </div>

                      {onSelectSite && (
                        <div
                          style={{
                            fontSize: "14px",
                            color:
                              colors.primary,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          查看
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderRadius:
                            radius.md,
                          background:
                            "#F4F7F8",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color:
                              "#667579",
                            marginBottom:
                              "6px",
                          }}
                        >
                          長者人數
                        </div>

                        <div
                          style={{
                            fontSize: "30px",
                            lineHeight: 1.2,
                            fontWeight: 700,
                            color:
                              colors.primary,
                          }}
                        >
                          {site.elderCount}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop:
                          "1px solid #E8EEEF",
                        fontSize: "12px",
                        color:
                          "#7A898D",
                      }}
                    >
                      location_id：
                      {site.location_id}
                    </div>
                  </button>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}