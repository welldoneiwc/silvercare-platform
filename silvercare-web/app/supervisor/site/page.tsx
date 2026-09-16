"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { supabase } from "../../../utils/supabase";
import { colors } from "../../../styles/theme";
import { radius } from "../../../styles/radius";
import { shadow } from "../../../styles/shadow";

type Elder = {
  id: number;
  name: string | null;
  gender: string | null;
  birthday: string | null;
  phone: string | null;
  elder_type: string | null;
  living_status: string | null;
  contact_method: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;
  location_id: number | null;
};

export default function SupervisorSitePage() {
  const searchParams = useSearchParams();
  const locationIdParam = searchParams.get("locationId");

  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const locationId = Number(locationIdParam);

  useEffect(() => {
    const loadElders = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        if (
          !locationIdParam ||
          !Number.isFinite(locationId)
        ) {
          setErrorMessage("無效的據點 ID。");
          return;
        }

        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !userData.user) {
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
          .select("role")
          .eq("user_id", userData.user.id)
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

        if (roleData?.role !== "supervisor") {
          setErrorMessage(
            "此頁面僅提供 Supervisor 使用。"
          );
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("elders")
          .select(
            `
              id,
              name,
              gender,
              birthday,
              phone,
              elder_type,
              living_status,
              contact_method,
              emergency_contact_name,
              emergency_contact_relation,
              emergency_contact_phone,
              location_id
            `
          )
          .eq("location_id", locationId)
          .order("id", {
            ascending: true,
          });

        if (error) {
          console.error(
            "讀取據點長者資料失敗：",
            error
          );

          setErrorMessage(
            "無法載入此據點的長者資料。"
          );
          return;
        }

        setElders((data ?? []) as Elder[]);
      } catch (error) {
        console.error(
          "SupervisorSitePage 載入失敗：",
          error
        );

        setErrorMessage(
          "載入據點資料時發生錯誤。"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadElders();
  }, [locationIdParam, locationId]);

  const siteName =
    locationId === 1
      ? "公理堂據點"
      : locationId === 2
        ? "測試據點2"
        : `據點 ${locationId}`;

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
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              marginBottom: "16px",
              color: colors.primary,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← 返回據點總覽
          </button>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.4,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            {siteName}
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#667579",
            }}
          >
            Location ID：{locationId}
          </p>
        </div>

        {loading && (
          <div
            style={{
              padding: "30px 24px",
              background: "#FFFFFF",
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              color: "#667579",
            }}
          >
            正在載入長者資料...
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
            }}
          >
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage && (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  padding: "18px 24px",
                  background: "#FFFFFF",
                  border: "1px solid #DDE5E7",
                  borderRadius: radius.lg,
                  boxShadow: shadow.sm,
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#7A898D",
                    marginBottom: "4px",
                  }}
                >
                  長者人數
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: colors.primary,
                  }}
                >
                  {elders.length} 人
                </div>
              </div>

              {elders.length === 0 ? (
                <div
                  style={{
                    padding: "30px 24px",
                    background: "#FFFFFF",
                    borderRadius: radius.lg,
                    boxShadow: shadow.sm,
                    color: "#667579",
                  }}
                >
                  此據點目前沒有長者資料。
                </div>
              ) : (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #DDE5E7",
                    borderRadius: radius.lg,
                    boxShadow: shadow.sm,
                    overflow: "hidden",
                  }}
                >
                  {elders.map(
                    (elder, index) => (
                      <div
                        key={elder.id}
                        style={{
                          padding: "20px 24px",
                          borderBottom:
                            index ===
                            elders.length - 1
                              ? "none"
                              : "1px solid #E5EAEC",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "space-between",
                            gap: "20px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "16px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                minWidth: "40px",
                                borderRadius:
                                  radius.md,
                                background:
                                  "#F4F7F8",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontSize: "14px",
                                fontWeight: 700,
                                color:
                                  colors.primary,
                              }}
                            >
                              {index + 1}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: 700,
                                  color:
                                    colors.primary,
                                  marginBottom:
                                    "4px",
                                }}
                              >
                                {elder.name ||
                                  "未設定姓名"}
                              </div>

                              <div
                                style={{
                                  fontSize: "13px",
                                  color:
                                    "#667579",
                                }}
                              >
                                {elder.gender ||
                                  "未設定性別"}
                                {elder.birthday
                                  ? ` ｜ ${elder.birthday}`
                                  : ""}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#667579",
                                marginBottom:
                                  "4px",
                              }}
                            >
                              電話
                            </div>

                            <div
                              style={{
                                fontSize: "14px",
                                color:
                                  colors.primary,
                              }}
                            >
                              {elder.phone ||
                                "未填寫"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}