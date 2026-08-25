"use client";

import { useEffect, useState } from "react";

import { colors } from "../../styles/theme";
import { radius } from "../../styles/radius";
import { shadow } from "../../styles/shadow";

export type Activity = {
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

const STORAGE_KEY = "silvercare-activities";

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setActivities([]);
      } else {
        const parsed = JSON.parse(saved);

        setActivities(
          Array.isArray(parsed) ? parsed : []
        );
      }
    } catch (error) {
      console.error("讀取活動資料失敗：", error);
      setActivities([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  const sortedActivities = [...activities].sort(
    (a, b) => {
      const dateCompare =
        a.date.localeCompare(b.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.startTime.localeCompare(
        b.startTime
      );
    }
  );

  if (!loaded) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.primary,
        }}
      >
        活動資料載入中...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "28px 20px 50px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: colors.primary,
            color: "#fff",
            borderRadius: radius.lg,
            padding: "24px 22px",
            marginBottom: 22,
            boxShadow: shadow.md,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            SilverCare
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            📢 活動公告
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              opacity: 0.9,
            }}
          >
            歡迎查看據點最新活動資訊
          </div>
        </div>

        {/* 活動列表 */}
        {sortedActivities.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: radius.lg,
              padding: 40,
              textAlign: "center",
              color: "#6B7280",
              boxShadow: shadow.sm,
            }}
          >
            目前沒有活動公告
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {sortedActivities.map(
              (activity) => (
                <div
                  key={activity.id}
                  style={{
                    background: "#fff",
                    borderRadius: radius.lg,
                    padding: 20,
                    boxShadow: shadow.sm,
                    border:
                      "1px solid #E5E7EB",
                  }}
                >
                  {/* 第一排 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 200,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: colors.primary,
                        }}
                      >
                        {activity.title}
                      </div>

                      {activity.type && (
                        <div
                          style={{
                            display:
                              "inline-block",
                            marginTop: 8,
                            padding:
                              "4px 10px",
                            borderRadius: 999,
                            background:
                              "#EAF5F1",
                            color:
                              colors.primary,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {activity.type}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      📅{" "}
                      {formatDate(
                        activity.date
                      )}
                    </div>
                  </div>

                  {/* 資訊列 */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 18,
                    }}
                  >
                    <div
                      style={infoStyle}
                    >
                      🕐{" "}
                      {activity.startTime ||
                        "-"}{" "}
                      ~{" "}
                      {activity.endTime ||
                        "-"}
                    </div>

                    <div
                      style={infoStyle}
                    >
                      📍{" "}
                      {activity.location ||
                        "地點未設定"}
                    </div>

                    <div
                      style={infoStyle}
                    >
                      👥{" "}
                      {activity.capacity ||
                        0}
                      {" 人"}
                    </div>
                  </div>

                  {/* 備註 */}
                  {activity.note && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop:
                          "1px solid #E5E7EB",
                        color: "#4B5563",
                        fontSize: 14,
                        lineHeight: 1.7,
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >
                      <strong>
                        活動說明：
                      </strong>
                      <br />
                      {activity.note}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const infoStyle: React.CSSProperties = {
  background: "#F7FAFC",
  borderRadius: 10,
  padding: "9px 12px",
  color: "#374151",
  fontSize: 14,
};