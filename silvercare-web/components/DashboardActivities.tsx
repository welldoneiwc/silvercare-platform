"use client";

import {
  useEffect,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

import { supabase } from "../utils/supabase";

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

function formatDate(date: string) {
  if (!date) return "-";

  const parts = date.split("-");

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

export default function DashboardActivities() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { data, error } = await supabase
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
          .order("date", {
            ascending: true,
          })
          .order("start_time", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        const mappedActivities: Activity[] =
          (data ?? []).map((item) => ({
            id: Number(item.id),
            date: item.date,
            title: item.title,
            type: item.type ?? "",
            startTime:
              item.start_time ?? "",
            endTime:
              item.end_time ?? "",
            location:
              item.location ?? "",
            capacity:
              Number(item.capacity ?? 0),
            note: item.note ?? "",
          }));

        setActivities(mappedActivities);
      } catch (error) {
        console.error(
          "讀取近期活動失敗：",
          error
        );

        setActivities([]);
      }
    };

    void loadActivities();
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

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.startTime.localeCompare(
          b.startTime
        );
      })
      .slice(0, 5);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: radius.lg,
        boxShadow: shadow.md,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: colors.primary,
              fontSize: 22,
            }}
          >
            📢 近期活動
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            最近的活動公告
          </div>
        </div>
      </div>

      {upcomingActivities.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: colors.textLight,
            background: "#F9FAFB",
            borderRadius: radius.md,
          }}
        >
          目前沒有近期活動
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {upcomingActivities.map(
            (activity) => (
              <div
                key={activity.id}
                style={{
                  padding:
                    "16px 18px",
                  border:
                    "1px solid #E5E7EB",
                  borderRadius:
                    radius.md,
                  background:
                    "#FAFAFA",
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
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color:
                          colors.primary,
                      }}
                    >
                      {activity.title}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          "flex",
                        flexWrap:
                          "wrap",
                        gap: 8,
                        color:
                          "#4B5563",
                        fontSize: 14,
                      }}
                    >
                      <span>
                        📅{" "}
                        {formatDate(
                          activity.date
                        )}
                      </span>

                      <span>
                        🕐{" "}
                        {activity.startTime}
                        {" ~ "}
                        {activity.endTime}
                      </span>

                      <span>
                        📍{" "}
                        {activity.location ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "5px 10px",
                      borderRadius:
                        999,
                      background:
                        "#EEF2FF",
                      color:
                        "#4338CA",
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {activity.type ||
                      "活動"}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}