"use client";

import {
  useEffect,
  useState,
} from "react";

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

const STORAGE_KEY =
  "silvercare-activities";

function formatDate(date: string) {
  if (!date) return "-";

  const parts =
    date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

export default function ActivityPublicPage() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  useEffect(() => {
    function loadActivities() {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        setActivities([]);
        return;
      }

      try {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setActivities(parsed);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error(
          "讀取活動公告失敗：",
          error
        );

        setActivities([]);
      }
    }

    loadActivities();

    window.addEventListener(
      "storage",
      loadActivities
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadActivities
      );
    };
  }, []);

  const today = getToday();

  const upcomingActivities =
    activities
      .filter(
        (activity) =>
          activity.date >= today
      )
      .sort((a, b) => {
        const dateCompare =
          a.date.localeCompare(
            b.date
          );

        if (
          dateCompare !== 0
        ) {
          return dateCompare;
        }

        return a.startTime.localeCompare(
          b.startTime
        );
      });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "#F4F7F8",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 8,
            }}
          >
            📢
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              color: "#163A43",
            }}
          >
            活動公告
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              fontSize: 18,
              color: "#6B7280",
            }}
          >
            歡迎參加據點近期活動
          </p>
        </div>

        {upcomingActivities.length ===
        0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 50,
              textAlign: "center",
              fontSize: 20,
              color: "#6B7280",
            }}
          >
            目前沒有近期活動
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 18,
            }}
          >
            {upcomingActivities.map(
              (activity) => (
                <div
                  key={
                    activity.id
                  }
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: 24,
                    boxShadow:
                      "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 26,
                          color:
                            "#163A43",
                        }}
                      >
                        {
                          activity.title
                        }
                      </h2>

                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 18,
                          lineHeight: 1.8,
                          color:
                            "#374151",
                        }}
                      >
                        <div>
                          {" "}
                          {formatDate(
                            activity.date
                          )}
                        </div>

                        <div>
                          {" "}
                          {
                            activity.startTime
                          }
                          {" ～ "}
                          {
                            activity.endTime
                          }
                        </div>

                        <div>
                          📍{" "}
                          {
                            activity.location ||
                            "-"
                          }
                        </div>

                        <div>
                          {" "}
                          {
                            activity.capacity
                          }
                          {" 人"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding:
                          "8px 14px",
                        borderRadius:
                          999,
                        background:
                          "#E8F3F5",
                        color:
                          "#163A43",
                        fontSize: 16,
                        fontWeight: 600,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {
                        activity.type ||
                        "活動"
                      }
                    </div>
                  </div>

                  {activity.note && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 16,
                        borderRadius: 12,
                        background:
                          "#F9FAFB",
                        fontSize: 17,
                        lineHeight: 1.7,
                        color:
                          "#4B5563",
                      }}
                    >
                      <strong>
                        活動說明
                      </strong>

                      <div
                        style={{
                          marginTop: 6,
                        }}
                      >
                        {
                          activity.note
                        }
                      </div>
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