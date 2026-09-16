"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

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
  const [sites, setSites] =
    useState<SiteInfo[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErrorMessage(
          "目前尚未登入，無法載入據點資料。"
        );
        return;
      }

      const {
        data: roleData,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select(
          "role, location_id"
        )
        .eq(
          "user_id",
          userData.user.id
        )
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error(
          "讀取使用者角色失敗：",
          roleError
        );

        setErrorMessage(
          "無法確認目前使用者權限。"
        );

        return;
      }

      if (
        roleData?.role !==
        "supervisor"
      ) {
        setErrorMessage(
          "此頁面僅提供 Supervisor 使用。"
        );

        return;
      }

      const [
        eldersResult,
        locationsResult,
      ] = await Promise.all([
        supabase
          .from("elders")
          .select(
            "id, location_id"
          ),

        supabase
          .from("locations")
          .select(
            "id, name"
          )
          .order(
            "id",
            {
              ascending: true,
            }
          ),
      ]);

      if (eldersResult.error) {
        console.error(
          "讀取長者資料失敗：",
          eldersResult.error
        );

        setErrorMessage(
          "無法載入據點長者資料。"
        );

        return;
      }

      if (locationsResult.error) {
        console.error(
          "讀取據點資料失敗：",
          locationsResult.error
        );

        setErrorMessage(
          "無法載入據點資料。"
        );

        return;
      }

      const elderRows: ElderRow[] =
        (eldersResult.data ??
          []) as ElderRow[];

      const countMap =
        new Map<
          number,
          number
        >();

      elderRows.forEach(
        (
          elder: ElderRow
        ) => {
          if (
            elder.location_id ===
              null ||
            elder.location_id ===
              undefined
          ) {
            return;
          }

          const locationId =
            Number(
              elder.location_id
            );

          if (
            !Number.isFinite(
              locationId
            )
          ) {
            return;
          }

          countMap.set(
            locationId,
            (countMap.get(
              locationId
            ) ?? 0) + 1
          );
        }
      );

      const siteList: SiteInfo[] =
        (
          locationsResult.data ??
          []
        )
          .map(
            (location) => {
              const locationId =
                Number(
                  location.id
                );

              return {
                location_id:
                  locationId,

                siteName:
                  location.name ??
                  `據點 ${locationId}`,

                elderCount:
                  countMap.get(
                    locationId
                  ) ?? 0,
              };
            }
          )
          .filter(
            (site) =>
              Number.isFinite(
                site.location_id
              )
          )
          .sort(
            (a, b) =>
              a.location_id -
              b.location_id
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
      onSelectSite(
        locationId
      );
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        padding: "24px",
        boxSizing: "border-box",
        background:
          colors.background,
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
            marginBottom:
              "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize:
                "28px",
              lineHeight:
                1.4,
              fontWeight:
                700,
              color:
                colors.primary,
            }}
          >
            據點總覽
          </h1>

          <p
            style={{
              margin:
                "8px 0 0",
              fontSize:
                "15px",
              lineHeight:
                1.6,
              color:
                "#667579",
            }}
          >
            Supervisor 可查看所有據點，各據點資料獨立顯示。
          </p>
        </div>

        {loading && (
          <div
            style={{
              padding:
                "30px 24px",
              background:
                "#FFFFFF",
              borderRadius:
                radius.lg,
              boxShadow:
                shadow.sm,
              color:
                "#667579",
            }}
          >
            正在載入據點資料...
          </div>
        )}

        {!loading &&
          errorMessage && (
            <div
              style={{
                padding:
                  "20px 24px",
                background:
                  "#FFFFFF",
                borderRadius:
                  radius.lg,
                boxShadow:
                  shadow.sm,
                color:
                  "#B42318",
              }}
            >
              {
                errorMessage
              }
            </div>
          )}

        {!loading &&
          !errorMessage &&
          sites.length ===
            0 && (
            <div
              style={{
                padding:
                  "30px 24px",
                background:
                  "#FFFFFF",
                borderRadius:
                  radius.lg,
                boxShadow:
                  shadow.sm,
                color:
                  "#667579",
              }}
            >
              目前沒有找到任何據點資料。
            </div>
          )}

        {!loading &&
          !errorMessage &&
          sites.length >
            0 && (
            <div
              style={{
                background:
                  "#FFFFFF",
                border:
                  "1px solid #DDE5E7",
                borderRadius:
                  radius.lg,
                boxShadow:
                  shadow.sm,
                overflow:
                  "hidden",
              }}
            >
              {sites.map(
                (
                  site,
                  index
                ) => (
                  <div
                    key={
                      site.location_id
                    }
                    style={{
                      borderBottom:
                        index ===
                        sites.length -
                          1
                          ? "none"
                          : "1px solid #E5EAEC",
                    }}
                  >
                    <Link
                      href={`/supervisor/site?locationId=${site.location_id}`}
                      onClick={() =>
                        handleSelectSite(
                          site.location_id
                        )
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap:
                          "20px",
                        width:
                          "100%",
                        padding:
                          "20px 24px",
                        boxSizing:
                          "border-box",
                        textDecoration:
                          "none",
                        color:
                          "inherit",
                        background:
                          "#FFFFFF",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "18px",
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width:
                              "42px",
                            height:
                              "42px",
                            minWidth:
                              "42px",
                            borderRadius:
                              radius.md,
                            background:
                              "#F4F7F8",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize:
                              "15px",
                            fontWeight:
                              700,
                            color:
                              colors.primary,
                          }}
                        >
                          {index +
                            1}
                        </div>

                        <div
                          style={{
                            minWidth:
                              0,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#7A898D",
                              marginBottom:
                                "4px",
                            }}
                          >
                            LOCATION ID：
                            {
                              site.location_id
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                "19px",
                              lineHeight:
                                1.4,
                              fontWeight:
                                700,
                              color:
                                colors.primary,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              site.siteName
                            }
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "24px",
                          flexShrink:
                            0,
                        }}
                      >
                        <div
                          style={{
                            textAlign:
                              "right",
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#7A898D",
                              marginBottom:
                                "3px",
                            }}
                          >
                            長者人數
                          </div>

                          <div
                            style={{
                              fontSize:
                                "22px",
                              lineHeight:
                                1.2,
                              fontWeight:
                                700,
                              color:
                                colors.primary,
                            }}
                          >
                            {
                              site.elderCount
                            }
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize:
                              "14px",
                            fontWeight:
                              600,
                            color:
                              colors.primary,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          查看據點 →
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}