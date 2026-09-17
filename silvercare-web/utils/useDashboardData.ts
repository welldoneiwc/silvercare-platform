"use client";

import { useEffect, useState } from "react";
import {
  addStorageChangedListener,
} from "./storageEvents";
import { supabase } from "./supabase";

export type DashboardData = {
  elderCount: number;
  todayCourseCount: number;
  todayHealthCount: number;
  todayAttendanceCount: number;
};

function isToday(date: string) {
  return (
    date ===
    new Date().toISOString().split("T")[0]
  );
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      `讀取 LocalStorage 失敗：${key}`,
      error
    );

    return [];
  }
}

export function useDashboardData() {
  const [data, setData] =
    useState<DashboardData>({
      elderCount: 0,
      todayCourseCount: 0,
      todayHealthCount: 0,
      todayAttendanceCount: 0,
    });

  useEffect(() => {
  console.log("useDashboardData 已啟動");

  let cancelled = false;

    async function loadData() {
      if (typeof window === "undefined") {
        return;
      }

      let elderCount = 0;

      try {
        const {
          data: elderData,
          error: elderError,
        } = await supabase
          .from("elders")
          .select("id")
          .order("id", {
            ascending: true,
          });

        if (elderError) {
          console.error(
            "讀取 Supabase 長者資料失敗：",
            elderError
          );
        } else {
          elderCount =
            Array.isArray(elderData)
              ? elderData.length
              : 0;

          console.log(
            "Dashboard elderCount =",
            elderCount
          );
        }
      } catch (error) {
        console.error(
          "讀取 Supabase 長者資料失敗：",
          error
        );
      }

      const courses = readArray<{
        date: string;
      }>(
        "silvercare-courses"
      );

      const attendance =
        readArray<{
          date: string;
        }>(
          "attendance-records"
        );

      const localElders =
        readArray<{
          id: number;
        }>(
          "silvercare-elders"
        );

      let todayHealthCount = 0;

      localElders.forEach(
        (elder) => {
          const records =
            readArray<{
              date: string;
            }>(
              `health-records-${elder.id}`
            );

          todayHealthCount +=
            records.filter(
              (record) =>
                isToday(record.date)
            ).length;
        }
      );

      if (cancelled) {
        return;
      }

      setData({
        elderCount,

        todayCourseCount:
          courses.filter(
            (course) =>
              isToday(course.date)
          ).length,

        todayHealthCount,

        todayAttendanceCount:
          attendance.filter(
            (record) =>
              isToday(record.date)
          ).length,
      });
    }

    void loadData();

    const removeListener =
      addStorageChangedListener(
        () => {
          void loadData();
        }
      );

    const handleStorage =
      () => {
        void loadData();
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (event) => {
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "SIGNED_OUT"
          ) {
            void loadData();
          }
        }
      );

    return () => {
      cancelled = true;

      removeListener();

      window.removeEventListener(
        "storage",
        handleStorage
      );

      authListener.subscription.unsubscribe();
    };
  }, []);

  return data;
}