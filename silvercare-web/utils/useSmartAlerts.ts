"use client";

import { useEffect, useState } from "react";
import { addStorageChangedListener } from "./storageEvents";

export type SmartAlert = {
  id: string;
  type: "warning" | "info";
  message: string;
};

function isToday(date: string) {
  return (
    date === new Date().toISOString().split("T")[0]
  );
}

export function useSmartAlerts() {
  const [alerts, setAlerts] = useState<
    SmartAlert[]
  >([]);

  useEffect(() => {
    function loadAlerts() {
      if (typeof window === "undefined") {
        return;
      }

      const nextAlerts: SmartAlert[] = [];

      const elders = JSON.parse(
        localStorage.getItem("elders") ?? "[]"
      );

      elders.forEach(
        (elder: {
          id: number;
          name: string;
        }) => {
          const records = JSON.parse(
            localStorage.getItem(
              `health-records-${elder.id}`
            ) ?? "[]"
          );

          const todayRecords = records.filter(
            (record: {
              date: string;
            }) => isToday(record.date)
          );

          if (todayRecords.length === 0) {
            nextAlerts.push({
              id: `health-${elder.id}`,
              type: "warning",
              message: `${elder.name} 今日尚未完成健康量測`,
            });
          }
        }
      );

      setAlerts(nextAlerts);
    }

    loadAlerts();

    const removeListener =
      addStorageChangedListener(loadAlerts);

    window.addEventListener(
      "storage",
      loadAlerts
    );

    return () => {
      removeListener();

      window.removeEventListener(
        "storage",
        loadAlerts
      );
    };
  }, []);

  return alerts;
}