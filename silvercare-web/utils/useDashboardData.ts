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

      const elders = JSON.parse(
  localStorage.getItem("silvercare-elders") ?? "[]"
);

      const courses = JSON.parse(
        localStorage.getItem("courses") ?? "[]"
      );

      const attendance = JSON.parse(
        localStorage.getItem("attendance") ??
          "[]"
      );

      let todayHealthCount = 0;

      elders.forEach(
        (elder: { id: number }) => {
          const records = JSON.parse(
            localStorage.getItem(
              `health-records-${elder.id}`
            ) ?? "[]"
          );

          todayHealthCount += records.filter(
            (record: {
              date: string;
            }) => isToday(record.date)
          ).length;
        }
      );

      setData({
        elderCount: elders.length,
        todayCourseCount:
          courses.filter(
            (course: {
              date: string;
            }) => isToday(course.date)
          ).length,
        todayHealthCount,
        todayAttendanceCount:
          attendance.filter(
            (record: {
              date: string;
            }) => isToday(record.date)
          ).length,
      });
    }

    loadData();

    const removeListener =
      addStorageChangedListener(loadData);

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