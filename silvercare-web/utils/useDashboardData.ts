"use client";

import { useEffect, useState } from "react";
import {
  addStorageChangedListener,
} from "./storageEvents";

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
    function loadData() {
      if (typeof window === "undefined") {
        return;
      }

      const elders = readArray<{
        id: number;
      }>(
        "silvercare-elders"
      );

      const courses = readArray<{
        date: string;
      }>(
        "silvercare-courses"
      );

      /*
       * 簽到資料的正確 Storage Key
       *
       * AttendanceSection.tsx
       * 使用的是：
       * "attendance-records"
       */
      const attendance =
        readArray<{
          date: string;
        }>(
          "attendance-records"
        );

      let todayHealthCount = 0;

      elders.forEach(
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

      setData({
        elderCount:
          elders.length,

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

    loadData();

    /*
     * SilverCare 自訂同步事件
     *
     * 同一個分頁內的 LocalStorage
     * 修改，也可以即時更新 Dashboard。
     */
    const removeListener =
      addStorageChangedListener(
        loadData
      );

    /*
     * 保留瀏覽器原生 storage event，
     * 支援其他分頁／視窗同步。
     */
    window.addEventListener(
      "storage",
      loadData
    );

    return () => {
      removeListener();

      window.removeEventListener(
        "storage",
        loadData
      );
    };
  }, []);

  return data;
}