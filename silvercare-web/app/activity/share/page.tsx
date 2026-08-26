"use client";

import { useEffect, useState } from "react";

import { colors } from "../../../styles/theme";
import { radius } from "../../../styles/radius";
import { shadow } from "../../../styles/shadow";

import { supabase } from "../../../utils/supabase";

type Activity = {
  id: number;
  date: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  note: string;
};

export default function ActivitySharePage() {
  const [activity, setActivity] =
    useState<Activity | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const id = params.get("id");

        if (!id) {
          setErrorMessage(
            "找不到活動編號"
          );
          return;
        }

        const { data, error } =
          await supabase
            .from("activities")
            .select(
              `
                id,
                date,
                title,
                type,
                start_time,
                end_time,
                location,
                capacity,
                note
              `
            )
            .eq("id", id)
            .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setErrorMessage(
            "找不到這個活動"
          );
          return;
        }

        setActivity({
          id: Number(data.id),
          date: data.date,
          title: data.title,
          type: data.type ?? "",
          startTime:
            data.start_time ?? "",
          endTime:
            data.end_time ?? "",
          location:
            data.location ?? "",
          capacity:
            Number(data.capacity ?? 0),
          note: data.note ?? "",
        });
      } catch (error) {
        console.error(
          "讀取公開活動失敗：",
          error
        );

        setErrorMessage(
          "目前無法取得活動資料，請稍後再試。"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadActivity();
  }, []);

  const formatDate = (
    date: string
  ) => {
    if (!date) return "-";

    const parts =
      date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            colors.background,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          padding: 24,
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            color:
              colors.primary,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          活動資料載入中...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            colors.background,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          padding: 24,
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "#fff",
            borderRadius:
              radius.lg,
            boxShadow:
              shadow.md,
            padding: 32,
            textAlign: "center",
            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            📅
          </div>

          <h1
            style={{
              margin: 0,
              color:
                colors.primary,
              fontSize: 24,
            }}
          >
            活動不存在
          </h1>

          <p
            style={{
              marginTop: 12,
              color: "#6B7280",
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </p>
        </div>
      </main>
    );
  }

  if (!activity) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          colors.background,
        padding: "40px 20px",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {/* Logo / 標題 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color:
                colors.primary,
              letterSpacing: 1,
            }}
          >
            SilverCare
          </div>

          <div
            style={{
              marginTop: 6,
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            活動通知
          </div>
        </div>

        {/* 活動卡片 */}
        <div
          style={{
            background: "#fff",
            borderRadius:
              radius.lg,
            boxShadow:
              shadow.md,
            overflow: "hidden",
          }}
        >
          {/* 標題區 */}
          <div
            style={{
              background:
                colors.primary,
              color: "#fff",
              padding:
                "28px 24px",
            }}
          >
            <div
              style={{
                fontSize: 14,
                opacity: 0.85,
                marginBottom: 8,
              }}
            >
              {activity.type ||
                "一般活動"}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.3,
              }}
            >
              {activity.title}
            </h1>
          </div>

          {/* 活動資訊 */}
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection:
                "column",
              gap: 18,
            }}
          >
            <InfoRow
              label="活動日期"
              value={formatDate(
                activity.date
              )}
            />

            <InfoRow
              label="活動時間"
              value={`${activity.startTime || "-"} ~ ${activity.endTime || "-"}`}
            />

            <InfoRow
              label="活動地點"
              value={
                activity.location ||
                "-"
              }
            />

            <InfoRow
              label="活動人數"
              value={`${activity.capacity} 人`}
            />

            {activity.note && (
              <div
                style={{
                  borderTop:
                    "1px solid #E5E7EB",
                  paddingTop: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                    marginBottom: 8,
                  }}
                >
                  活動備註
                </div>

                <div
                  style={{
                    color: "#374151",
                    lineHeight: 1.7,
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {activity.note}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#9CA3AF",
            fontSize: 13,
          }}
        >
          SilverCare 智慧據點管理平台
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems:
          "flex-start",
      }}
    >
      <div
        style={{
          width: 90,
          flexShrink: 0,
          color: "#9CA3AF",
          fontSize: 13,
          paddingTop: 2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#374151",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.5,
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}