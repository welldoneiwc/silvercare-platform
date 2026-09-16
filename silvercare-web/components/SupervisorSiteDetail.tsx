"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../utils/supabase";
import { colors } from "../styles/theme";
import { radius } from "../styles/radius";
import { shadow } from "../styles/shadow";

type SiteInfo = {
  location_id: number;
  siteName: string;
  elderCount: number;
};

type RecordRow = Record<string, unknown>;

type SiteRecords = {
  elders: RecordRow[];
  courses: RecordRow[];
  activities: RecordRow[];
  courseRegistrations: RecordRow[];
  financeCharges: RecordRow[];
  financePayers: RecordRow[];
  financePayments: RecordRow[];
};

type SupervisorSiteDetailProps = {
  site: SiteInfo;
  onBack: () => void;
};

type SectionKey =
  | "elders"
  | "courses"
  | "activities"
  | "courseRegistrations"
  | "financeCharges"
  | "financePayers"
  | "financePayments";

type SectionInfo = {
  key: SectionKey;
  title: string;
};

const sections: SectionInfo[] = [
  {
    key: "elders",
    title: "長者紀錄",
  },
  {
    key: "courses",
    title: "課程紀錄",
  },
  {
    key: "activities",
    title: "活動紀錄",
  },
  {
    key: "courseRegistrations",
    title: "課程報名紀錄",
  },
  {
    key: "financeCharges",
    title: "財務收費紀錄",
  },
  {
    key: "financePayers",
    title: "財務付款人紀錄",
  },
  {
    key: "financePayments",
    title: "財務付款紀錄",
  },
];

const MAX_DISPLAY_COLUMNS = 8;

function formatValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value);
}

function getDisplayColumns(
  rows: RecordRow[]
): string[] {
  const columnSet =
    new Set<string>();

  rows.forEach(
    (row: RecordRow) => {
      Object.keys(row).forEach(
        (key) => {
          columnSet.add(key);
        }
      );
    }
  );

  const preferredOrder = [
    "id",
    "name",
    "title",
    "date",
    "gender",
    "birthday",
    "phone",
    "teacher",
    "start_time",
    "end_time",
    "capacity",
    "location_id",
    "status",
    "registration_status",
    "waitlist_position",
    "amount",
    "paid_amount",
    "payment_status",
    "created_at",
  ];

  const columns =
    Array.from(columnSet);

  const ordered =
    preferredOrder.filter(
      (key) =>
        columnSet.has(key)
    );

  const remaining =
    columns.filter(
      (key) =>
        !ordered.includes(key)
    );

  return [
    ...ordered,
    ...remaining,
  ].slice(
    0,
    MAX_DISPLAY_COLUMNS
  );
}

function RecordTable({
  rows,
}: {
  rows: RecordRow[];
}) {
  const columns =
    useMemo(
      () =>
        getDisplayColumns(rows),
      [rows]
    );

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding:
            "24px 20px",
          color:
            "#7A898D",
          fontSize: 14,
        }}
      >
        此據點目前沒有資料。
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX:
          "auto",
        width: "100%",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
          fontSize: 13,
          minWidth: 700,
        }}
      >
        <thead>
          <tr>
            {columns.map(
              (column) => (
                <th
                  key={column}
                  style={{
                    padding:
                      "11px 12px",
                    textAlign:
                      "left",
                    background:
                      "#F4F7F8",
                    borderBottom:
                      "1px solid #DDE5E7",
                    color:
                      "#52656A",
                    fontWeight:
                      700,
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {column}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (
              row,
              rowIndex
            ) => (
              <tr
                key={`${String(
                  row.id ??
                    rowIndex
                )}-${rowIndex}`}
              >
                {columns.map(
                  (column) => (
                    <td
                      key={column}
                      style={{
                        padding:
                          "11px 12px",
                        borderBottom:
                          "1px solid #E8EEEF",
                        color:
                          "#37474B",
                        verticalAlign:
                          "top",
                        maxWidth:
                          320,
                        whiteSpace:
                          "pre-wrap",
                        wordBreak:
                          "break-word",
                      }}
                    >
                      {formatValue(
                        row[column]
                      )}
                    </td>
                  )
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SupervisorSiteDetail({
  site,
  onBack,
}: SupervisorSiteDetailProps) {
  const [
    records,
    setRecords,
  ] = useState<SiteRecords>({
    elders: [],
    courses: [],
    activities: [],
    courseRegistrations: [],
    financeCharges: [],
    financePayers: [],
    financePayments: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SectionKey>(
      "elders"
    );

  useEffect(() => {
    void loadSiteRecords();
  }, [site.location_id]);

  const loadSiteRecords =
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          setErrorMessage(
            "目前尚未登入，無法查看據點資料。"
          );
          return;
        }

        const {
          data: roleData,
          error: roleError,
        } =
          await supabase
            .from("user_roles")
            .select("role")
            .eq(
              "user_id",
              userData.user.id
            )
            .limit(1)
            .maybeSingle();

        if (roleError) {
          throw roleError;
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

        const locationId =
          site.location_id;

        const [
          eldersResult,
          coursesResult,
          activitiesResult,
          registrationsResult,
          chargesResult,
          payersResult,
          paymentsResult,
        ] =
          await Promise.all([
            supabase
              .from("elders")
              .select("*")
              .eq(
                "location_id",
                locationId
              ),

            supabase
              .from("courses")
              .select("*")
              .eq(
                "location_id",
                locationId
              )
              .order(
                "date",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from("activities")
              .select("*")
              .eq(
                "location_id",
                locationId
              )
              .order(
                "date",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "course_registrations"
              )
              .select("*")
              .eq(
                "location_id",
                locationId
              ),

            supabase
              .from(
                "finance_charges"
              )
              .select("*")
              .eq(
                "location_id",
                locationId
              ),

            supabase
              .from(
                "finance_payers"
              )
              .select("*")
              .eq(
                "location_id",
                locationId
              ),

            supabase
              .from(
                "finance_payments"
              )
              .select("*")
              .eq(
                "location_id",
                locationId
              ),
          ]);

        const results = [
          eldersResult,
          coursesResult,
          activitiesResult,
          registrationsResult,
          chargesResult,
          payersResult,
          paymentsResult,
        ];

        const failedResult =
          results.find(
            (result) =>
              result.error
          );

        if (
          failedResult?.error
        ) {
          throw failedResult.error;
        }

        setRecords({
          elders:
            (eldersResult.data ??
              []) as RecordRow[],

          courses:
            (coursesResult.data ??
              []) as RecordRow[],

          activities:
            (activitiesResult.data ??
              []) as RecordRow[],

          courseRegistrations:
            (registrationsResult.data ??
              []) as RecordRow[],

          financeCharges:
            (chargesResult.data ??
              []) as RecordRow[],

          financePayers:
            (payersResult.data ??
              []) as RecordRow[],

          financePayments:
            (paymentsResult.data ??
              []) as RecordRow[],
        });
      } catch (error) {
        console.error(
          "載入個別據點資料失敗：",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "載入據點資料時發生錯誤。"
        );
      } finally {
        setLoading(false);
      }
    };

  const activeRows =
    records[activeSection];

  const totalRecords =
    Object.values(records).reduce(
      (total, rows) =>
        total + rows.length,
      0
    );

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
        <button
          type="button"
          onClick={onBack}
          style={{
            appearance:
              "none",
            border:
              "1px solid #163A43",
            borderRadius: 8,
            background:
              "#FFFFFF",
            color:
              "#163A43",
            padding:
              "9px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor:
              "pointer",
            marginBottom: 20,
          }}
        >
          返回據點總覽
        </button>

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
            padding:
              "24px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color:
                "#7A898D",
              marginBottom: 6,
            }}
          >
            個別據點
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.4,
              fontWeight: 700,
              color:
                colors.primary,
            }}
          >
            {site.siteName}
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color:
                "#7A898D",
            }}
          >
            location_id：
            {site.location_id}
          </div>

          <div
            style={{
              display:
                "flex",
              flexWrap:
                "wrap",
              gap: 12,
              marginTop: 20,
            }}
          >
            <div
              style={{
                minWidth: 150,
                padding:
                  "14px 16px",
                borderRadius:
                  radius.md,
                background:
                  "#F4F7F8",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color:
                    "#667579",
                }}
              >
                長者
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 24,
                  fontWeight: 700,
                  color:
                    colors.primary,
                }}
              >
                {site.elderCount}
                人
              </div>
            </div>

            <div
              style={{
                minWidth: 150,
                padding:
                  "14px 16px",
                borderRadius:
                  radius.md,
                background:
                  "#F4F7F8",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color:
                    "#667579",
                }}
              >
                已載入紀錄
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 24,
                  fontWeight: 700,
                  color:
                    colors.primary,
                }}
              >
                {totalRecords}
              </div>
            </div>
          </div>
        </div>

        {loading && (
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
              padding:
                "30px 24px",
              color:
                "#667579",
            }}
          >
            正在載入{" "}
            {site.siteName}
            的完整紀錄...
          </div>
        )}

        {!loading &&
          errorMessage && (
            <div
              style={{
                background:
                  "#FFFFFF",
                border:
                  "1px solid #F0D0CC",
                borderRadius:
                  radius.lg,
                boxShadow:
                  shadow.sm,
                padding:
                  "20px 24px",
                color:
                  "#B42318",
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
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {sections.map(
                  (
                    section
                  ) => {
                    const count =
                      records[
                        section.key
                      ].length;

                    const active =
                      activeSection ===
                      section.key;

                    return (
                      <button
                        key={
                          section.key
                        }
                        type="button"
                        onClick={() =>
                          setActiveSection(
                            section.key
                          )
                        }
                        style={{
                          appearance:
                            "none",
                          border:
                            active
                              ? "1px solid #163A43"
                              : "1px solid #DDE5E7",
                          borderRadius:
                            8,
                          background:
                            active
                              ? "#163A43"
                              : "#FFFFFF",
                          color:
                            active
                              ? "#FFFFFF"
                              : "#163A43",
                          padding:
                            "10px 14px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor:
                            "pointer",
                        }}
                      >
                        {
                          section.title
                        }{" "}
                        ({count})
                      </button>
                    );
                  }
                )}
              </div>

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
                <div
                  style={{
                    padding:
                      "18px 20px",
                    borderBottom:
                      "1px solid #DDE5E7",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color:
                        colors.primary,
                    }}
                  >
                    {
                      sections.find(
                        (
                          section
                        ) =>
                          section.key ===
                          activeSection
                      )?.title
                    }
                  </h2>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color:
                        "#7A898D",
                    }}
                  >
                    共{" "}
                    {
                      activeRows.length
                    }{" "}
                    筆
                  </div>
                </div>

                <RecordTable
                  rows={
                    activeRows
                  }
                />
              </div>
            </>
          )}
      </div>
    </div>
  );
}