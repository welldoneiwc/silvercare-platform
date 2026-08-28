"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../utils/supabase";
import { colors } from "../styles/theme";

const FINANCE_CHARGES_STORAGE_KEY =
  "silvercare-finance-charges";

const FINANCE_PAYERS_STORAGE_KEY =
  "silvercare-finance-payers";

const FINANCE_PAYMENTS_STORAGE_KEY =
  "silvercare-finance-payments";

const COURSE_STORAGE_KEY =
  "silvercare-courses";

const REGISTRATION_STORAGE_KEY =
  "silvercare-course-registrations";

const ELDER_STORAGE_KEY =
  "silvercare-elders";

type DatabaseRow = Record<string, unknown>;

type CourseOption = {
  id: string | number;
  title: string;
};

type RegistrationRecord = {
  id?: string;
  courseId?: string | number;
  elderId?: string | number;
  name?: string;
  elderName?: string;
  phone?: string;
  elderPhone?: string;
};

type ElderOption = {
  id: string | number;
  name: string;
  phone: string;
};

export type FinanceCharge = {
  id: string;
  month: string;
  name: string;
  courseId: string;
  amount: number;
  note: string;
  createdAt: string;
};

export type FinancePayer = {
  id: string;
  chargeId: string;
  elderId?: string;
  name: string;
  phone: string;
  source: "registration" | "manual";
  createdAt: string;
};

export type FinancePayment = {
  id: string;
  chargeId: string;
  payerId: string;
  amount: number;
  paidAt: string;
  note: string;
  createdAt: string;
};

const getCurrentMonth = () =>
  new Date()
    .toISOString()
    .slice(0, 7);

const createEmptyChargeForm = () => ({
  month: getCurrentMonth(),
  courseId: "",
  amount: 0,
  note: "",
});

const createEmptyPaymentForm = () => ({
  payerId: "",
  amount: 0,
  paidAt: new Date()
    .toISOString()
    .slice(0, 10),
  note: "",
});

const createId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const formatCurrency = (
  amount: number
) =>
  `NT$ ${amount.toLocaleString(
    "zh-TW"
  )}`;

const normalizeString = (
  value: unknown
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};

const normalizeNumber = (
  value: unknown
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const todayString = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

const readLocalArray = <T,>(
  key: string
): T[] => {
  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? (parsed as T[])
      : [];
  } catch {
    return [];
  }
};

const mapCourse = (
  row: DatabaseRow
): CourseOption => ({
  id:
    row.id === null ||
    row.id === undefined
      ? ""
      : (row.id as string | number),
  title:
    normalizeString(
      row.title
    ) ||
    normalizeString(
      row.name
    ),
});

const mapCharge = (
  row: DatabaseRow
): FinanceCharge => ({
  id: normalizeString(row.id),
  month: normalizeString(
    row.month
  ),
  name: normalizeString(
    row.name
  ),
  courseId: normalizeString(
    row.course_id
  ),
  amount: normalizeNumber(
    row.amount
  ),
  note: normalizeString(
    row.note
  ),
  createdAt:
    normalizeString(
      row.created_at
    ) ||
    new Date().toISOString(),
});

const mapPayer = (
  row: DatabaseRow
): FinancePayer => ({
  id: normalizeString(row.id),
  chargeId: normalizeString(
    row.charge_id
  ),
  elderId:
    row.elder_id === null ||
    row.elder_id === undefined ||
    row.elder_id === ""
      ? undefined
      : normalizeString(
          row.elder_id
        ),
  name: normalizeString(
    row.name
  ),
  phone: normalizeString(
    row.phone
  ),
  source:
    row.source === "manual"
      ? "manual"
      : "registration",
  createdAt:
    normalizeString(
      row.created_at
    ) ||
    new Date().toISOString(),
});

const mapPayment = (
  row: DatabaseRow
): FinancePayment => ({
  id: normalizeString(row.id),
  chargeId: normalizeString(
    row.charge_id
  ),
  payerId: normalizeString(
    row.payer_id
  ),
  amount: normalizeNumber(
    row.amount
  ),
  paidAt: normalizeString(
    row.paid_at
  ),
  note: normalizeString(
    row.note
  ),
  createdAt:
    normalizeString(
      row.created_at
    ) ||
    new Date().toISOString(),
});

export default function FinanceSection() {
  const [charges, setCharges] =
    useState<FinanceCharge[]>([]);

  const [payers, setPayers] =
    useState<FinancePayer[]>([]);

  const [payments, setPayments] =
    useState<FinancePayment[]>([]);

  const [courses, setCourses] =
    useState<CourseOption[]>([]);

  const [registrations, setRegistrations] =
    useState<RegistrationRecord[]>([]);

  const [elders, setElders] =
    useState<ElderOption[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [editingChargeId, setEditingChargeId] =
    useState<string | null>(null);

  const [selectedChargeId, setSelectedChargeId] =
    useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [showManualPayerForm, setShowManualPayerForm] =
    useState(false);

  const [showAddCourse, setShowAddCourse] =
    useState(false);

  const [newCourseTitle, setNewCourseTitle] =
    useState("");

  const [chargeMonth, setChargeMonth] =
    useState(
      createEmptyChargeForm().month
    );

  const [chargeCourseId, setChargeCourseId] =
    useState("");

  const [chargeAmount, setChargeAmount] =
    useState(0);

  const [chargeNote, setChargeNote] =
    useState("");

  const [paymentPayerId, setPaymentPayerId] =
    useState("");

  const [paymentAmount, setPaymentAmount] =
    useState(0);

  const [paymentDate, setPaymentDate] =
    useState(
      createEmptyPaymentForm().paidAt
    );

  const [paymentNote, setPaymentNote] =
    useState("");

  const [manualName, setManualName] =
    useState("");

  const [manualPhone, setManualPhone] =
    useState("");

  const [manualElderId, setManualElderId] =
    useState("");

  const [manualNote, setManualNote] =
    useState("");

  const savingChargeRef =
    useRef(false);

  const deletingChargeRef =
    useRef<string | null>(null);

  const loadingRef =
    useRef(false);

  const selectedCharge =
    useMemo(
      () =>
        charges.find(
          (charge) =>
            charge.id ===
            selectedChargeId
        ) || null,
      [charges, selectedChargeId]
    );

  const selectedChargePayers =
    useMemo(
      () =>
        selectedChargeId
          ? payers.filter(
              (payer) =>
                payer.chargeId ===
                selectedChargeId
            )
          : [],
      [payers, selectedChargeId]
    );

  const selectedChargePayments =
    useMemo(
      () =>
        selectedChargeId
          ? payments.filter(
              (payment) =>
                payment.chargeId ===
                selectedChargeId
            )
          : [],
      [payments, selectedChargeId]
    );

  const getCourseName = (
    courseId: string
  ) => {
    const course =
      courses.find(
        (item) =>
          normalizeString(
            item.id
          ) ===
          normalizeString(
            courseId
          )
      );

    return (
      course?.title ||
      "未指定課程"
    );
  };

  const getChargeDisplayName = (
    charge: FinanceCharge
  ) =>
    getCourseName(
      charge.courseId
    ) !== "未指定課程"
      ? getCourseName(
          charge.courseId
        )
      : charge.name ||
        "未指定課程";

  const getPayerName = (
    payerId: string
  ) =>
    payers.find(
      (payer) =>
        payer.id === payerId
    )?.name || "未知繳費者";

  const getPayerPaidAmount = (
    payerId: string,
    chargeId: string
  ) =>
    payments
      .filter(
        (payment) =>
          payment.payerId ===
            payerId &&
          payment.chargeId ===
            chargeId
      )
      .reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

  const getPayerOutstandingAmount = (
    payerId: string,
    chargeId: string
  ) => {
    const charge =
      charges.find(
        (item) =>
          item.id === chargeId
      );

    if (!charge) {
      return 0;
    }

    return Math.max(
      charge.amount -
        getPayerPaidAmount(
          payerId,
          chargeId
        ),
      0
    );
  };

  const getChargeBilledAmount = (
    chargeId: string
  ) => {
    const charge =
      charges.find(
        (item) =>
          item.id === chargeId
      );

    if (!charge) {
      return 0;
    }

    const count =
      payers.filter(
        (payer) =>
          payer.chargeId ===
          chargeId
      ).length;

    return (
      charge.amount * count
    );
  };

  const getChargePaidAmount = (
    chargeId: string
  ) =>
    payments
      .filter(
        (payment) =>
          payment.chargeId ===
          chargeId
      )
      .reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

  const getChargeOutstandingAmount = (
    chargeId: string
  ) =>
    Math.max(
      getChargeBilledAmount(
        chargeId
      ) -
        getChargePaidAmount(
          chargeId
        ),
      0
    );

  const totalBilled =
    charges.reduce(
      (sum, charge) =>
        sum +
        getChargeBilledAmount(
          charge.id
        ),
      0
    );

  const totalPaid =
    charges.reduce(
      (sum, charge) =>
        sum +
        getChargePaidAmount(
          charge.id
        ),
      0
    );

  const totalOutstanding =
    Math.max(
      totalBilled -
        totalPaid,
      0
    );

  const outstandingPayers =
    payers.filter(
      (payer) =>
        getPayerOutstandingAmount(
          payer.id,
          payer.chargeId
        ) > 0
    );

  const resetChargeForm = () => {
    const empty =
      createEmptyChargeForm();

    setChargeMonth(
      empty.month
    );
    setChargeCourseId(
      empty.courseId
    );
    setChargeAmount(
      empty.amount
    );
    setChargeNote(
      empty.note
    );
    setEditingChargeId(
      null
    );
  };

  const resetPaymentForm = () => {
    const empty =
      createEmptyPaymentForm();

    setPaymentPayerId(
      empty.payerId
    );
    setPaymentAmount(
      empty.amount
    );
    setPaymentDate(
      empty.paidAt
    );
    setPaymentNote(
      empty.note
    );
  };

  const resetManualPayerForm = () => {
    setManualName("");
    setManualPhone("");
    setManualElderId("");
    setManualNote("");
  };

  const saveLocalFinanceBackup = (
    nextCharges: FinanceCharge[],
    nextPayers: FinancePayer[],
    nextPayments: FinancePayment[]
  ) => {
    try {
      localStorage.setItem(
        FINANCE_CHARGES_STORAGE_KEY,
        JSON.stringify(
          nextCharges
        )
      );

      localStorage.setItem(
        FINANCE_PAYERS_STORAGE_KEY,
        JSON.stringify(
          nextPayers
        )
      );

      localStorage.setItem(
        FINANCE_PAYMENTS_STORAGE_KEY,
        JSON.stringify(
          nextPayments
        )
      );
    } catch (error) {
      console.error(
        "更新財務 LocalStorage 備份失敗：",
        error
      );
    }
  };

  const loadFinanceData =
    async () => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      try {
        const [
          chargesResult,
          payersResult,
          paymentsResult,
          coursesResult,
          eldersResult,
        ] = await Promise.all([
          supabase
            .from("finance_charges")
            .select("*")
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),

          supabase
            .from("finance_payers")
            .select("*")
            .order(
              "created_at",
              {
                ascending: true,
              }
            ),

          supabase
            .from("finance_payments")
            .select("*")
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),

          supabase
            .from("courses")
            .select("*")
            .order(
              "date",
              {
                ascending: true,
              }
            )
            .order(
              "start_time",
              {
                ascending: true,
              }
            ),

          supabase
            .from("elders")
            .select("*")
            .order(
              "id",
              {
                ascending: true,
              }
            ),
        ]);

        if (chargesResult.error) {
          throw chargesResult.error;
        }

        if (payersResult.error) {
          throw payersResult.error;
        }

        if (paymentsResult.error) {
          throw paymentsResult.error;
        }

        if (coursesResult.error) {
          console.error(
            "讀取課程雲端資料失敗：",
            coursesResult.error
          );
        }

        if (eldersResult.error) {
          console.error(
            "讀取長者雲端資料失敗：",
            eldersResult.error
          );
        }

        const cloudCharges =
          (
            chargesResult.data ||
            []
          ).map(
            (row) =>
              mapCharge(
                row as DatabaseRow
              )
          );

        const cloudPayers =
          (
            payersResult.data ||
            []
          ).map(
            (row) =>
              mapPayer(
                row as DatabaseRow
              )
          );

        const cloudPayments =
          (
            paymentsResult.data ||
            []
          ).map(
            (row) =>
              mapPayment(
                row as DatabaseRow
              )
          );

        let cloudCourses =
          (
            coursesResult.data ||
            []
          ).map(
            (row) =>
              mapCourse(
                row as DatabaseRow
              )
          );

        let cloudElders =
          (
            eldersResult.data ||
            []
          ).map(
            (row) => ({
              id:
                row.id as
                  | string
                  | number,
              name:
                normalizeString(
                  row.name
                ),
              phone:
                normalizeString(
                  row.phone
                ),
            })
          );

        if (
          cloudCourses.length ===
          0
        ) {
          cloudCourses =
            readLocalArray<
              CourseOption
            >(
              COURSE_STORAGE_KEY
            );
        }

        if (
          cloudElders.length ===
          0
        ) {
          cloudElders =
            readLocalArray<
              ElderOption
            >(
              ELDER_STORAGE_KEY
            );
        }

        setCharges(
          cloudCharges
        );

        setPayers(
          cloudPayers
        );

        setPayments(
          cloudPayments
        );

        setCourses(
          cloudCourses
        );

        setElders(
          cloudElders
        );

        setRegistrations(
          readLocalArray<RegistrationRecord>(
            REGISTRATION_STORAGE_KEY
          )
        );

        saveLocalFinanceBackup(
          cloudCharges,
          cloudPayers,
          cloudPayments
        );

        try {
          localStorage.setItem(
            COURSE_STORAGE_KEY,
            JSON.stringify(
              cloudCourses
            )
          );
        } catch {
          // ignore
        }
      } catch (error) {
        console.error(
          "讀取財務資料失敗：",
          error
        );

        setCharges(
          readLocalArray<FinanceCharge>(
            FINANCE_CHARGES_STORAGE_KEY
          )
        );

        setPayers(
          readLocalArray<FinancePayer>(
            FINANCE_PAYERS_STORAGE_KEY
          )
        );

        setPayments(
          readLocalArray<FinancePayment>(
            FINANCE_PAYMENTS_STORAGE_KEY
          )
        );

        setCourses(
          readLocalArray<CourseOption>(
            COURSE_STORAGE_KEY
          )
        );

        setElders(
          readLocalArray<ElderOption>(
            ELDER_STORAGE_KEY
          )
        );

        setRegistrations(
          readLocalArray<RegistrationRecord>(
            REGISTRATION_STORAGE_KEY
          )
        );

        alert(
          "讀取雲端財務資料失敗。\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      } finally {
        setLoaded(true);
        loadingRef.current = false;
      }
    };

  useEffect(() => {
    void loadFinanceData();
  }, []);

  useEffect(() => {
    const reloadReferenceData =
      async () => {
        try {
          const [
            coursesResult,
            eldersResult,
          ] = await Promise.all([
            supabase
              .from("courses")
              .select("*")
              .order(
                "date",
                {
                  ascending: true,
                }
              )
              .order(
                "start_time",
                {
                  ascending: true,
                }
              ),

            supabase
              .from("elders")
              .select("*")
              .order(
                "id",
                {
                  ascending: true,
                }
              ),
          ]);

          if (
            !coursesResult.error &&
            coursesResult.data
          ) {
            const nextCourses =
              coursesResult.data.map(
                (row) =>
                  mapCourse(
                    row as DatabaseRow
                  )
              );

            setCourses(
              nextCourses
            );

            try {
              localStorage.setItem(
                COURSE_STORAGE_KEY,
                JSON.stringify(
                  nextCourses
                )
              );
            } catch {
              // ignore
            }
          }

          if (
            !eldersResult.error &&
            eldersResult.data
          ) {
            setElders(
              eldersResult.data.map(
                (row) => ({
                  id:
                    row.id as
                      | string
                      | number,
                  name:
                    normalizeString(
                      row.name
                    ),
                  phone:
                    normalizeString(
                      row.phone
                    ),
                })
              )
            );
          }

          setRegistrations(
            readLocalArray<RegistrationRecord>(
              REGISTRATION_STORAGE_KEY
            )
          );
        } catch (error) {
          console.error(
            "重新載入課程／長者資料失敗：",
            error
          );
        }
      };

    const handleStorage =
      () => {
        void reloadReferenceData();
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const handleAddCourse =
    async () => {
      const title =
        newCourseTitle.trim();

      if (!title) {
        alert(
          "請輸入新課程名稱。"
        );
        return;
      }

      try {
        const newCourseId =
          Date.now();

        const {
          error,
        } = await supabase
          .from("courses")
          .insert({
            id: newCourseId,
            date: todayString(),
            title,
            teacher: "",
            start_time: "",
            end_time: "",
            capacity: 0,
            classroom: "",
            note: "",
          });

        if (error) {
          console.error(
            "新增課程失敗：",
            error
          );

          alert(
            "新增課程失敗：\n\n" +
              error.message
          );

          return;
        }

        const newCourse: CourseOption =
          {
            id: newCourseId,
            title,
          };

        const nextCourses = [
          ...courses.filter(
            (course) =>
              normalizeString(
                course.id
              ) !==
              normalizeString(
                newCourse.id
              )
          ),
          newCourse,
        ];

        setCourses(
          nextCourses
        );

        localStorage.setItem(
          COURSE_STORAGE_KEY,
          JSON.stringify(
            nextCourses
          )
        );

        setChargeCourseId(
          normalizeString(
            newCourse.id
          )
        );

        setNewCourseTitle("");

        setShowAddCourse(
          false
        );

        alert(
          `課程「${newCourse.title}」新增成功！`
        );
      } catch (error) {
        console.error(
          "新增課程發生錯誤：",
          error
        );

        alert(
          "新增課程失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  const handleSaveCharge =
    async () => {
      if (
        savingChargeRef.current
      ) {
        return;
      }

      if (!chargeMonth) {
        alert(
          "請選擇收費月份。"
        );
        return;
      }

      if (!chargeCourseId) {
        alert(
          "請選擇對應課程。"
        );
        return;
      }

      if (chargeAmount <= 0) {
        alert(
          "收費金額必須大於 0。"
        );
        return;
      }

      savingChargeRef.current =
        true;

      try {
        const courseName =
          getCourseName(
            chargeCourseId
          );

        const chargeName =
          courseName !==
          "未指定課程"
            ? courseName
            : "收費";

        if (
          editingChargeId
        ) {
          const {
            error,
          } = await supabase
            .from(
              "finance_charges"
            )
            .update({
              month:
                chargeMonth,
              name:
                chargeName,
              course_id:
                chargeCourseId,
              amount:
                chargeAmount,
              note:
                chargeNote.trim(),
            })
            .eq(
              "id",
              editingChargeId
            );

          if (error) {
            console.error(
              "更新收費項目失敗：",
              error
            );

            alert(
              "課程收費更新失敗：\n\n" +
                error.message
            );

            return;
          }

          const updatedCharges =
            charges.map(
              (charge) =>
                charge.id ===
                editingChargeId
                  ? {
                      ...charge,
                      month:
                        chargeMonth,
                      name:
                        chargeName,
                      courseId:
                        chargeCourseId,
                      amount:
                        chargeAmount,
                      note:
                        chargeNote.trim(),
                    }
                  : charge
            );

          setCharges(
            updatedCharges
          );

          saveLocalFinanceBackup(
            updatedCharges,
            payers,
            payments
          );

          setSelectedChargeId(
            editingChargeId
          );

          resetChargeForm();

          alert(
            "收費資料更新成功！"
          );

          return;
        }

        const newChargeId =
          createId();

        const newCharge:
          FinanceCharge = {
          id: newChargeId,
          month:
            chargeMonth,
          name:
            chargeName,
          courseId:
            chargeCourseId,
          amount:
            chargeAmount,
          note:
            chargeNote.trim(),
          createdAt:
            new Date().toISOString(),
        };

        const {
          error,
        } = await supabase
          .from(
            "finance_charges"
          )
          .insert({
            id:
              newCharge.id,
            month:
              newCharge.month,
            name:
              newCharge.name,
            course_id:
              newCharge.courseId,
            amount:
              newCharge.amount,
            note:
              newCharge.note,
            created_at:
              newCharge.createdAt,
          });

        if (error) {
          console.error(
            "新增收費項目失敗：",
            error
          );

          alert(
            "新增收費項目失敗：\n\n" +
              error.message
          );

          return;
        }

        const nextCharges = [
          newCharge,
          ...charges,
        ];

        setCharges(
          nextCharges
        );

        saveLocalFinanceBackup(
          nextCharges,
          payers,
          payments
        );

        setSelectedChargeId(
          newCharge.id
        );

        resetChargeForm();

        alert(
          "收費項目新增成功！"
        );
      } catch (error) {
        console.error(
          "儲存收費項目發生錯誤：",
          error
        );

        alert(
          "儲存收費項目失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      } finally {
        savingChargeRef.current =
          false;
      }
    };

  const handleEditCharge = (
    charge: FinanceCharge
  ) => {
    setEditingChargeId(
      charge.id
    );

    setChargeMonth(
      charge.month
    );

    setChargeCourseId(
      charge.courseId ||
        ""
    );

    setChargeAmount(
      normalizeNumber(
        charge.amount
      )
    );

    setChargeNote(
      charge.note || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

   const handleDeleteCharge =
  async (
    chargeId: string
  ) => {
    if (
      deletingChargeRef.current ===
      chargeId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "確定要刪除這筆收費項目嗎？\n\n刪除後，這筆收費的繳費名單與繳款紀錄也會一起刪除。"
      );

    if (!confirmed) {
      return;
    }

    deletingChargeRef.current =
      chargeId;

    try {
      /*
       * ========================================
       * ① 刪除繳款紀錄
       * ========================================
       */
      const {
        error: paymentDeleteError,
      } = await supabase
        .from("finance_payments")
        .delete()
        .eq(
          "charge_id",
          chargeId
        );

      if (paymentDeleteError) {
        throw paymentDeleteError;
      }

      /*
       * ========================================
       * ② 刪除繳費名單
       * ========================================
       */
      const {
        error: payerDeleteError,
      } = await supabase
        .from("finance_payers")
        .delete()
        .eq(
          "charge_id",
          chargeId
        );

      if (payerDeleteError) {
        throw payerDeleteError;
      }

      /*
       * ========================================
       * ③ 真正刪除收費項目
       *
       * 用 select 確認 Database 實際刪掉資料
       * ========================================
       */
      const {
        data: deletedCharge,
        error: chargeDeleteError,
      } = await supabase
        .from("finance_charges")
        .delete()
        .eq(
          "id",
          chargeId
        )
        .select("id")
        .maybeSingle();

      console.log(
        "🗑️ 收費項目 DELETE 回應：",
        {
          chargeId,
          deletedCharge,
          chargeDeleteError,
        }
      );

      if (chargeDeleteError) {
        throw chargeDeleteError;
      }

      /*
       * 沒有回傳刪除資料
       * 通常代表 RLS / DELETE 權限沒有允許
       */
      if (!deletedCharge) {
        throw new Error(
          "Database 沒有刪除這筆收費項目。\n\n請檢查 Supabase finance_charges 的 DELETE 權限（RLS Policy）。"
        );
      }

      /*
       * ========================================
       * ④ 再查一次確認 Database 真的不存在
       * ========================================
       */
      const {
        data: verifyCharge,
        error: verifyError,
      } = await supabase
        .from("finance_charges")
        .select("id")
        .eq(
          "id",
          chargeId
        )
        .maybeSingle();

      if (verifyError) {
        throw verifyError;
      }

      if (verifyCharge) {
        throw new Error(
          "Database 仍然存在這筆收費項目，刪除沒有真正完成。"
        );
      }

      /*
       * ========================================
       * ⑤ 更新畫面
       * ========================================
       */
      const nextCharges =
        charges.filter(
          (charge) =>
            charge.id !==
            chargeId
        );

      const nextPayers =
        payers.filter(
          (payer) =>
            payer.chargeId !==
            chargeId
        );

      const nextPayments =
        payments.filter(
          (payment) =>
            payment.chargeId !==
            chargeId
        );

      setCharges(
        nextCharges
      );

      setPayers(
        nextPayers
      );

      setPayments(
        nextPayments
      );

      /*
       * 更新本機備份
       */
      saveLocalFinanceBackup(
        nextCharges,
        nextPayers,
        nextPayments
      );

      /*
       * 關閉目前選取的收費項目
       */
      if (
        selectedChargeId ===
        chargeId
      ) {
        setSelectedChargeId(
          null
        );

        setShowPaymentForm(
          false
        );

        setShowManualPayerForm(
          false
        );
      }

      /*
       * 如果正在編輯這筆，也一起關閉
       */
      if (
        editingChargeId ===
        chargeId
      ) {
        resetChargeForm();
      }

      alert(
        "收費項目已成功刪除！"
      );

      /*
       * 最後重新從 Supabase 載入
       * 確保 F5 後不會又回來
       */
      await loadFinanceData();
    } catch (error) {
      console.error(
        "🔴 刪除收費項目失敗：",
        error
      );

      alert(
        "刪除收費項目失敗：\n\n" +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      deletingChargeRef.current =
        null;
    }
  };

  const handleGeneratePayerList =
    async (
      charge: FinanceCharge
    ) => {
      const courseRegistrations =
        registrations.filter(
          (registration) =>
            normalizeString(
              registration.courseId
            ) ===
            normalizeString(
              charge.courseId
            )
        );

      if (
        courseRegistrations.length ===
        0
      ) {
        alert(
          "目前沒有找到這門課程的報名資料。"
        );

        return;
      }

      const existingPayers =
        payers.filter(
          (payer) =>
            payer.chargeId ===
            charge.id
        );

      const newPayers:
        FinancePayer[] = [];

      courseRegistrations.forEach(
        (registration) => {
          const elderId =
            normalizeString(
              registration.elderId
            );

          const name =
            normalizeString(
              registration.name
            ) ||
            normalizeString(
              registration.elderName
            );

          const phone =
            normalizeString(
              registration.phone
            ) ||
            normalizeString(
              registration.elderPhone
            );

          if (!name) {
            return;
          }

          const duplicate =
            existingPayers.some(
              (payer) => {
                if (
                  elderId &&
                  payer.elderId
                ) {
                  return (
                    payer.elderId ===
                    elderId
                  );
                }

                return (
                  payer.name ===
                    name &&
                  payer.phone ===
                    phone
                );
              }
            ) ||
            newPayers.some(
              (payer) => {
                if (
                  elderId &&
                  payer.elderId
                ) {
                  return (
                    payer.elderId ===
                    elderId
                  );
                }

                return (
                  payer.name ===
                    name &&
                  payer.phone ===
                    phone
                );
              }
            );

          if (duplicate) {
            return;
          }

          newPayers.push({
            id: createId(),
            chargeId:
              charge.id,
            elderId:
              elderId ||
              undefined,
            name,
            phone,
            source:
              "registration",
            createdAt:
              new Date().toISOString(),
          });
        }
      );

      if (
        newPayers.length ===
        0
      ) {
        setSelectedChargeId(
          charge.id
        );

        alert(
          "這門課程的報名者都已經在繳費名單中。"
        );

        return;
      }

      try {
        const rows =
          newPayers.map(
            (payer) => ({
              id:
                payer.id,
              charge_id:
                payer.chargeId,
              elder_id:
                payer.elderId ||
                null,
              name:
                payer.name,
              phone:
                payer.phone,
              source:
                payer.source,
              created_at:
                payer.createdAt,
            })
          );

        const {
          error,
        } = await supabase
          .from(
            "finance_payers"
          )
          .insert(rows);

        if (error) {
          throw error;
        }

        const nextPayers = [
          ...payers,
          ...newPayers,
        ];

        setPayers(
          nextPayers
        );

        saveLocalFinanceBackup(
          charges,
          nextPayers,
          payments
        );

        setSelectedChargeId(
          charge.id
        );

        alert(
          `已加入 ${newPayers.length} 位繳費者。`
        );
      } catch (error) {
        console.error(
          "產生繳費名單失敗：",
          error
        );

        alert(
          "產生繳費名單失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  const handleAddManualPayer =
    async () => {
      if (!selectedCharge) {
        alert(
          "請先選擇收費項目。"
        );

        return;
      }

      if (!manualName.trim()) {
        alert(
          "請輸入繳費者姓名。"
        );

        return;
      }

      const selectedElder =
        elders.find(
          (elder) =>
            normalizeString(
              elder.id
            ) ===
            manualElderId
        );

      const payerName =
        selectedElder?.name ||
        manualName.trim();

      const payerPhone =
        selectedElder?.phone ||
        manualPhone.trim();

      const duplicate =
        payers.some(
          (payer) => {
            if (
              manualElderId &&
              payer.elderId
            ) {
              return (
                payer.chargeId ===
                  selectedCharge.id &&
                payer.elderId ===
                  manualElderId
              );
            }

            return (
              payer.chargeId ===
                selectedCharge.id &&
              payer.name ===
                payerName &&
              payer.phone ===
                payerPhone
            );
          }
        );

      if (duplicate) {
        alert(
          "這位繳費者已經在名單中。"
        );

        return;
      }

      const newPayer:
        FinancePayer = {
        id: createId(),
        chargeId:
          selectedCharge.id,
        elderId:
          manualElderId ||
          undefined,
        name:
          payerName,
        phone:
          payerPhone,
        source:
          "manual",
        createdAt:
          new Date().toISOString(),
      };

      try {
        const {
          error,
        } = await supabase
          .from(
            "finance_payers"
          )
          .insert({
            id:
              newPayer.id,
            charge_id:
              newPayer.chargeId,
            elder_id:
              newPayer.elderId ||
              null,
            name:
              newPayer.name,
            phone:
              newPayer.phone,
            source:
              newPayer.source,
            created_at:
              newPayer.createdAt,
          });

        if (error) {
          throw error;
        }

        const nextPayers = [
          ...payers,
          newPayer,
        ];

        setPayers(
          nextPayers
        );

        saveLocalFinanceBackup(
          charges,
          nextPayers,
          payments
        );

        resetManualPayerForm();

        setShowManualPayerForm(
          false
        );
      } catch (error) {
        console.error(
          "新增繳費者失敗：",
          error
        );

        alert(
          "新增繳費者失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  const handleAddPayment =
    async () => {
      if (!selectedCharge) {
        alert(
          "請先選擇收費項目。"
        );

        return;
      }

      if (!paymentPayerId) {
        alert(
          "請選擇繳費者。"
        );

        return;
      }

      if (paymentAmount <= 0) {
        alert(
          "繳款金額必須大於 0。"
        );

        return;
      }

      if (!paymentDate) {
        alert(
          "請選擇繳款日期。"
        );

        return;
      }

      const outstanding =
        getPayerOutstandingAmount(
          paymentPayerId,
          selectedCharge.id
        );

      if (outstanding <= 0) {
        alert(
          "這位繳費者已經繳清。"
        );

        return;
      }

      if (
        paymentAmount >
        outstanding
      ) {
        alert(
          `本次最多可繳 ${formatCurrency(
            outstanding
          )}。`
        );

        return;
      }

      const newPayment:
        FinancePayment = {
        id: createId(),
        chargeId:
          selectedCharge.id,
        payerId:
          paymentPayerId,
        amount:
          paymentAmount,
        paidAt:
          paymentDate,
        note:
          paymentNote.trim(),
        createdAt:
          new Date().toISOString(),
      };

      try {
        const {
          error,
        } = await supabase
          .from(
            "finance_payments"
          )
          .insert({
            id:
              newPayment.id,
            charge_id:
              newPayment.chargeId,
            payer_id:
              newPayment.payerId,
            amount:
              newPayment.amount,
            paid_at:
              newPayment.paidAt,
            note:
              newPayment.note,
            created_at:
              newPayment.createdAt,
          });

        if (error) {
          throw error;
        }

        const nextPayments = [
          newPayment,
          ...payments,
        ];

        setPayments(
          nextPayments
        );

        saveLocalFinanceBackup(
          charges,
          payers,
          nextPayments
        );

        resetPaymentForm();

        setShowPaymentForm(
          false
        );
      } catch (error) {
        console.error(
          "新增繳款失敗：",
          error
        );

        alert(
          "新增繳款失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  const handleDeletePayment =
    async (
      paymentId: string
    ) => {
      const confirmed =
        window.confirm(
          "確定要刪除這筆繳款紀錄嗎？"
        );

      if (!confirmed) {
        return;
      }

      try {
        const {
          error,
        } = await supabase
          .from(
            "finance_payments"
          )
          .delete()
          .eq(
            "id",
            paymentId
          );

        if (error) {
          throw error;
        }

        const nextPayments =
          payments.filter(
            (payment) =>
              payment.id !==
              paymentId
          );

        setPayments(
          nextPayments
        );

        saveLocalFinanceBackup(
          charges,
          payers,
          nextPayments
        );
      } catch (error) {
        console.error(
          "刪除繳款紀錄失敗：",
          error
        );

        alert(
          "刪除繳款紀錄失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  if (!loaded) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: "center",
          color: "#6B7280",
        }}
      >
        財務資料載入中...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: colors.primary,
            fontSize: 28,
          }}
        >
          財務管理
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: "#6B7280",
          }}
        >
          管理課程收費、繳費名單、繳款紀錄與欠款追蹤。
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={summaryCardStyle}
        >
          <div
            style={summaryLabelStyle}
          >
            應收總額
          </div>

          <div
            style={summaryValueStyle}
          >
            {formatCurrency(
              totalBilled
            )}
          </div>
        </div>

        <div
          style={summaryCardStyle}
        >
          <div
            style={summaryLabelStyle}
          >
            已收款
          </div>

          <div
            style={summaryValueStyle}
          >
            {formatCurrency(
              totalPaid
            )}
          </div>
        </div>

        <div
          style={summaryCardStyle}
        >
          <div
            style={summaryLabelStyle}
          >
            尚欠款
          </div>

          <div
            style={{
              ...summaryValueStyle,
              color:
                totalOutstanding >
                0
                  ? "#B45309"
                  : colors.primary,
            }}
          >
            {formatCurrency(
              totalOutstanding
            )}
          </div>
        </div>
      </div>

      <div
        style={sectionCardStyle}
      >
        <h3
          style={{
            marginTop: 0,
            color: colors.primary,
          }}
        >
          {editingChargeId
            ? "編輯課程收費"
            : "新增課程收費"}
        </h3>

        <p
          style={{
            marginTop: -8,
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          選擇對應課程即可；其他收費說明請寫在備註。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          <div>
            <label
              style={labelStyle}
            >
              收費月份
            </label>

            <input
              type="month"
              value={
                chargeMonth || ""
              }
              onChange={(event) =>
                setChargeMonth(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              對應課程
            </label>

            <select
              value={
                chargeCourseId ||
                ""
              }
              onChange={(event) =>
                setChargeCourseId(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                請選擇課程
              </option>

              {courses.map(
                (course) => (
                  <option
                    key={String(
                      course.id
                    )}
                    value={String(
                      course.id
                    )}
                  >
                    {course.title}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                setShowAddCourse(
                  (current) =>
                    !current
                )
              }
              style={{
                marginTop: 10,
                border: "none",
                background:
                  "transparent",
                color:
                  colors.primary,
                cursor:
                  "pointer",
                fontWeight: 700,
                padding: 0,
              }}
            >
              {showAddCourse
                ? "取消新增課程"
                : "＋新增課程"}
            </button>

            {showAddCourse && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  background:
                    "#F9FAFB",
                  borderRadius: 10,
                  border:
                    "1px solid #E5E7EB",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  新課程名稱
                </label>

                <input
                  type="text"
                  value={
                    newCourseTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setNewCourseTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder="請輸入課程名稱"
                  style={
                    inputStyle
                  }
                />

                <button
                  type="button"
                  onClick={
                    handleAddCourse
                  }
                  style={{
                    ...primaryButtonStyle,
                    marginTop: 10,
                  }}
                >
                  儲存新課程
                </button>
              </div>
            )}
          </div>

          <div>
            <label
              style={labelStyle}
            >
              每人收費金額
            </label>

            <input
              type="number"
              min="0"
              value={
                chargeAmount
              }
              onChange={(event) =>
                setChargeAmount(
                  Math.max(
                    Number(
                      event.target
                        .value
                    ) || 0,
                    0
                  )
                )
              }
              style={inputStyle}
            />
          </div>

          <div
            style={{
              gridColumn:
                "1 / -1",
            }}
          >
            <label
              style={labelStyle}
            >
              備註
            </label>

            <textarea
              value={
                chargeNote || ""
              }
              onChange={(event) =>
                setChargeNote(
                  event.target
                    .value
                )
              }
              rows={3}
              placeholder="例如：材料費、餐費、交通費、部分補助等"
              style={{
                ...inputStyle,
                resize:
                  "vertical",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={
              handleSaveCharge
            }
            style={
              primaryButtonStyle
            }
          >
            {editingChargeId
              ? "儲存修改"
              : "新增收費項目"}
          </button>

          {editingChargeId && (
            <button
              type="button"
              onClick={
                resetChargeForm
              }
              style={
                secondaryButtonStyle
              }
            >
              取消編輯
            </button>
          )}
        </div>
      </div>

      <div
        style={sectionCardStyle}
      >
        <h3
          style={{
            marginTop: 0,
            color: colors.primary,
          }}
        >
          收費項目
        </h3>

        {charges.length ===
        0 ? (
          <div
            style={emptyStyle}
          >
            目前尚無收費項目
          </div>
        ) : (
          <div
  className="finance-charge-table-wrap"
  style={{
    overflowX: "auto",
    width: "100%",
  }}
>
           <table
  className="finance-charge-table"
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
              <thead>
                <tr>
                  <th style={thStyle}>
                    月份
                  </th>

                  <th style={thStyle}>
                    對應課程
                  </th>

                  <th style={thStyle}>
                    每人收費
                  </th>

                  <th style={thStyle}>
                    繳費人數
                  </th>

                  <th style={thStyle}>
                    應收
                  </th>

                  <th style={thStyle}>
                    已繳
                  </th>

                  <th style={thStyle}>
                    尚欠
                  </th>

                  <th style={thStyle}>
                    操作
                  </th>
                </tr>
              </thead>

              <tbody>
                {charges.map(
                  (charge) => {
                    const payerCount =
                      payers.filter(
                        (payer) =>
                          payer.chargeId ===
                          charge.id
                      ).length;

                    const outstanding =
                      getChargeOutstandingAmount(
                        charge.id
                      );

                    const isSelected =
                      selectedChargeId ===
                      charge.id;

                    return (
                      <tr
                        key={
                          charge.id
                        }
                      >
                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            charge.month
                          }
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                          }}
                        >
                          {getChargeDisplayName(
                            charge
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {formatCurrency(
                            charge.amount
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            payerCount
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {formatCurrency(
                            getChargeBilledAmount(
                              charge.id
                            )
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {formatCurrency(
                            getChargePaidAmount(
                              charge.id
                            )
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            color:
                              outstanding >
                              0
                                ? "#B45309"
                                : colors.primary,
                          }}
                        >
                          {formatCurrency(
                            outstanding
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap: 8,
                              flexWrap:
                                "wrap",
                            }}
                          >
                           <button
  type="button"
  title="繳費名單"
  aria-label="繳費名單"
  onClick={() => {
    setSelectedChargeId(charge.id);
    setShowPaymentForm(false);
    setShowManualPayerForm(false);
  }}
  style={{
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    background: "#fff",
    color: colors.primary,
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M16 11c2.8 0 5 1.8 5 4.5" />
    <path d="M16 5.5a3 3 0 0 1 0 5" />
  </svg>
</button>

                         
                           <button
  type="button"
  title="產生名單"
  aria-label="產生名單"
  onClick={() =>
    handleGeneratePayerList(charge)
  }
  style={{
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    background: "#fff",
    color: colors.primary,
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
</button>

<button
  type="button"
  title="編輯"
  aria-label="編輯"
  onClick={() =>
    handleEditCharge(charge)
  }
  style={{
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
</button>

<button
  type="button"
  title="刪除"
  aria-label="刪除"
  onClick={() =>
    void handleDeleteCharge(charge.id)
  }
  style={{
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    borderRadius: "8px",
    background: "#DC2626",
    color: "#fff",
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCharge && (
        <div
          style={sectionCardStyle}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 16,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 6,
                  color:
                    colors.primary,
                }}
              >
                👥{" "}
                {getChargeDisplayName(
                  selectedCharge
                )}{" "}
                — 繳費名單
              </h3>

              <div
                style={{
                  color:
                    "#6B7280",
                  fontSize: 14,
                }}
              >
                {
                  selectedCharge.month
                }{" "}
                ／{" "}
                {getCourseName(
                  selectedCharge.courseId
                )}{" "}
                ／ 每人{" "}
                {formatCurrency(
                  selectedCharge.amount
                )}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                flexWrap:
                  "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(
                    !showPaymentForm
                  );

                  setShowManualPayerForm(
                    false
                  );
                }}
                style={
                  primaryButtonStyle
                }
              >
                💳 登記繳款
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowManualPayerForm(
                    !showManualPayerForm
                  );

                  setShowPaymentForm(
                    false
                  );
                }}
                style={
                  secondaryButtonStyle
                }
              >
                ➕ 新增繳費者
              </button>
            </div>
          </div>

          {showManualPayerForm && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background:
                  "#F9FAFB",
                borderRadius: 12,
                border:
                  "1px solid #E5E7EB",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  color:
                    colors.primary,
                }}
              >
                新增繳費者
              </h4>

              <p
                style={{
                  marginTop: 0,
                  color:
                    "#6B7280",
                  fontSize: 13,
                }}
              >
                可選擇既有長者；如果不是長者管理中的人，也可以直接輸入資料。
              </p>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    從長者管理選擇
                  </label>

                  <select
                    value={
                      manualElderId ||
                      ""
                    }
                    onChange={(
                      event
                    ) => {
                      const id =
                        event.target
                          .value;

                      setManualElderId(
                        id
                      );

                      const elder =
                        elders.find(
                          (
                            item
                          ) =>
                            normalizeString(
                              item.id
                            ) ===
                            id
                        );

                      if (elder) {
                        setManualName(
                          elder.name ||
                            ""
                        );

                        setManualPhone(
                          elder.phone ||
                            ""
                        );
                      }
                    }}
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      非既有長者／自行輸入
                    </option>

                    {elders.map(
                      (
                        elder
                      ) => (
                        <option
                          key={String(
                            elder.id
                          )}
                          value={String(
                            elder.id
                          )}
                        >
                          {
                            elder.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    繳費者姓名
                  </label>

                  <input
                    type="text"
                    value={
                      manualName ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setManualName(
                        event.target
                          .value
                      )
                    }
                    placeholder="請輸入姓名"
                    style={
                      inputStyle
                    }
                  />
                </div>

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    電話
                  </label>

                  <input
                    type="text"
                    value={
                      manualPhone ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setManualPhone(
                        event.target
                          .value
                      )
                    }
                    placeholder="請輸入電話"
                    style={
                      inputStyle
                    }
                  />
                </div>

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    備註
                  </label>

                  <input
                    type="text"
                    value={
                      manualNote ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setManualNote(
                        event.target
                          .value
                      )
                    }
                    placeholder="例如：非系統長者"
                    style={
                      inputStyle
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleAddManualPayer
                  }
                  style={
                    primaryButtonStyle
                  }
                >
                  加入繳費名單
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetManualPayerForm();

                    setShowManualPayerForm(
                      false
                    );
                  }}
                  style={
                    secondaryButtonStyle
                  }
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {showPaymentForm && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background:
                  "#F9FAFB",
                borderRadius: 12,
                border:
                  "1px solid #E5E7EB",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  color:
                    colors.primary,
                }}
              >
                💳 登記繳款
              </h4>

              {selectedChargePayers.length ===
              0 ? (
                <div
                  style={{
                    padding: 16,
                    background:
                      "#FEF3C7",
                    borderRadius: 8,
                    color:
                      "#92400E",
                    fontSize: 14,
                  }}
                >
                  目前還沒有繳費名單。
                  請先按「產生名單」，或手動新增繳費者。
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        繳費者
                      </label>

                      <select
                        value={
                          paymentPayerId ||
                          ""
                        }
                        onChange={(
                          event
                        ) => {
                          const payerId =
                            event
                              .target
                              .value;

                          setPaymentPayerId(
                            payerId
                          );

                          const outstanding =
                            getPayerOutstandingAmount(
                              payerId,
                              selectedCharge.id
                            );

                          setPaymentAmount(
                            outstanding
                          );
                        }}
                        style={
                          inputStyle
                        }
                      >
                        <option value="">
                          請選擇繳費者
                        </option>

                        {selectedChargePayers.map(
                          (
                            payer
                          ) => {
                            const outstanding =
                              getPayerOutstandingAmount(
                                payer.id,
                                selectedCharge.id
                              );

                            return (
                              <option
                                key={
                                  payer.id
                                }
                                value={
                                  payer.id
                                }
                              >
                                {
                                  payer.name
                                }{" "}
                                — 尚欠{" "}
                                {formatCurrency(
                                  outstanding
                                )}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        本次繳款金額
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          paymentAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setPaymentAmount(
                            Math.max(
                              Number(
                                event
                                  .target
                                  .value
                              ) || 0,
                              0
                            )
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        繳款日期
                      </label>

                      <input
                        type="date"
                        value={
                          paymentDate ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          setPaymentDate(
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        備註
                      </label>

                      <input
                        type="text"
                        value={
                          paymentNote ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          setPaymentNote(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="例如：現金、轉帳、部分繳款"
                        style={
                          inputStyle
                        }
                      />
                    </div>
                  </div>

                  {paymentPayerId && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 14,
                        background:
                          "#EFF6FF",
                        borderRadius: 8,
                        color:
                          "#1E40AF",
                        fontSize: 14,
                      }}
                    >
                      本人本次最多可繳：
                      <strong>
                        {" "}
                        {formatCurrency(
                          getPayerOutstandingAmount(
                            paymentPayerId,
                            selectedCharge.id
                          )
                        )}
                      </strong>
                    </div>
                  )}

                  <div
                    style={{
                      display:
                        "flex",
                      gap: 10,
                      marginTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void handleAddPayment()
                      }
                      style={
                        primaryButtonStyle
                      }
                    >
                      儲存繳款
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetPaymentForm();

                        setShowPaymentForm(
                          false
                        );
                      }}
                      style={
                        secondaryButtonStyle
                      }
                    >
                      取消
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
            }}
          >
            {selectedChargePayers.length ===
            0 ? (
              <div
                style={
                  emptyStyle
                }
              >
                尚無繳費者。
                <br />
                請先按「產生名單」，系統會從該課程的報名資料加入長者。
              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        繳費者
                      </th>

                      <th style={thStyle}>
                        電話
                      </th>

                      <th style={thStyle}>
                        來源
                      </th>

                      <th style={thStyle}>
                        應收
                      </th>

                      <th style={thStyle}>
                        已繳
                      </th>

                      <th style={thStyle}>
                        尚欠
                      </th>

                      <th style={thStyle}>
                        狀態
                      </th>

                      <th style={thStyle}>
                        操作
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedChargePayers.map(
                      (
                        payer
                      ) => {
                        const paid =
                          getPayerPaidAmount(
                            payer.id,
                            selectedCharge.id
                          );

                        const outstanding =
                          getPayerOutstandingAmount(
                            payer.id,
                            selectedCharge.id
                          );

                        const payerPayments =
                          selectedChargePayments.filter(
                            (
                              payment
                            ) =>
                              payment.payerId ===
                              payer.id
                          );

                        const fullyPaid =
                          outstanding ===
                          0;

                        return (
                          <tr
                            key={
                              payer.id
                            }
                          >
                            <td
                              style={{
                                ...tdStyle,
                                fontWeight: 700,
                              }}
                            >
                              {
                                payer.name
                              }
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {payer.phone ||
                                "-"}
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  padding:
                                    "4px 8px",
                                  borderRadius:
                                    999,
                                  background:
                                    payer.source ===
                                    "registration"
                                      ? "#DBEAFE"
                                      : "#F3F4F6",
                                  color:
                                    payer.source ===
                                    "registration"
                                      ? "#1D4ED8"
                                      : "#4B5563",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {payer.source ===
                                "registration"
                                  ? "課程報名"
                                  : "手動新增"}
                              </span>
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {formatCurrency(
                                selectedCharge.amount
                              )}
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {formatCurrency(
                                paid
                              )}
                            </td>

                            <td
                              style={{
                                ...tdStyle,
                                fontWeight: 700,
                                color:
                                  outstanding >
                                  0
                                    ? "#B45309"
                                    : colors.primary,
                              }}
                            >
                              {formatCurrency(
                                outstanding
                              )}
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  padding:
                                    "5px 10px",
                                  borderRadius:
                                    999,
                                  background:
                                    fullyPaid
                                      ? "#DCFCE7"
                                      : "#FEF3C7",
                                  color:
                                    fullyPaid
                                      ? "#166534"
                                      : "#92400E",
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {fullyPaid
                                  ? "已繳清"
                                  : "部分／待繳"}
                              </span>
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 8,
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                {!fullyPaid && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentPayerId(
                                        payer.id
                                      );

                                      setPaymentAmount(
                                        outstanding
                                      );

                                      setShowPaymentForm(
                                        true
                                      );

                                      setShowManualPayerForm(
                                        false
                                      );
                                    }}
                                    style={
                                      smallButtonStyle
                                    }
                                  >
                                    繳款
                                  </button>
                                )}

                                {payerPayments.length >
                                  0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      alert(
                                        payerPayments
                                          .map(
                                            (
                                              payment
                                            ) =>
                                              `${payment.paidAt}｜${formatCurrency(
                                                payment.amount
                                              )}${
                                                payment.note
                                                  ? `｜${payment.note}`
                                                  : ""
                                              }`
                                          )
                                          .join(
                                            "\n"
                                          )
                                      )
                                    }
                                    style={
                                      smallButtonStyle
                                    }
                                  >
                                    繳款紀錄
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedChargePayments.length >
            0 && (
            <div
              style={{
                marginTop: 24,
              }}
            >
              <h4
                style={{
                  color:
                    colors.primary,
                  marginBottom: 12,
                }}
              >
                💳 最近繳款紀錄
              </h4>

              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        繳款日期
                      </th>

                      <th style={thStyle}>
                        繳費者
                      </th>

                      <th style={thStyle}>
                        本次繳款
                      </th>

                      <th style={thStyle}>
                        備註
                      </th>

                      <th style={thStyle}>
                        操作
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedChargePayments.map(
                      (
                        payment
                      ) => (
                        <tr
                          key={
                            payment.id
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              payment.paidAt
                            }
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 600,
                            }}
                          >
                            {getPayerName(
                              payment.payerId
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 700,
                            }}
                          >
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment.note ||
                              "-"}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeletePayment(
                                  payment.id
                                )
                              }
                              style={{
                                ...smallButtonStyle,
                                color:
                                  "#B91C1C",
                              }}
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={sectionCardStyle}
      >
        <h3
          style={{
            marginTop: 0,
            color: colors.primary,
          }}
        >
          欠款長者追蹤
        </h3>

        <p
          style={{
            marginTop: -8,
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          這裡只顯示目前仍有欠款的繳費者。
        </p>

        {outstandingPayers.length ===
        0 ? (
          <div
            style={{
              padding: 30,
              textAlign:
                "center",
              color:
                colors.primary,
              background:
                "#F0FDF4",
              borderRadius: 10,
            }}
          >
            🎉 目前沒有欠款長者。
          </div>
        ) : (
          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    長者／繳費者
                  </th>

                  <th style={thStyle}>
                    對應課程
                  </th>

                  <th style={thStyle}>
                    應收
                  </th>

                  <th style={thStyle}>
                    已繳
                  </th>

                  <th style={thStyle}>
                    尚欠
                  </th>

                  <th style={thStyle}>
                    操作
                  </th>
                </tr>
              </thead>

              <tbody>
                {outstandingPayers.map(
                  (
                    payer
                  ) => {
                    const charge =
                      charges.find(
                        (
                          item
                        ) =>
                          item.id ===
                          payer.chargeId
                      );

                    if (!charge) {
                      return null;
                    }

                    const paid =
                      getPayerPaidAmount(
                        payer.id,
                        charge.id
                      );

                    const outstanding =
                      getPayerOutstandingAmount(
                        payer.id,
                        charge.id
                      );

                    return (
                      <tr
                        key={`${payer.chargeId}-${payer.id}`}
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                          }}
                        >
                          {
                            payer.name
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {getChargeDisplayName(
                            charge
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {formatCurrency(
                            charge.amount
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {formatCurrency(
                            paid
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            color:
                              "#B45309",
                          }}
                        >
                          {formatCurrency(
                            outstanding
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                         <button
  type="button"
  title="查看名單"
  aria-label="查看名單"
  onClick={() => {
    setSelectedChargeId(charge.id);
    setShowPaymentForm(false);
  }}
  style={{
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    background: "#fff",
    color: colors.primary,
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
</button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const sectionCardStyle:
  React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.06)",
};

const summaryCardStyle:
  React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: 20,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.06)",
};

const summaryLabelStyle:
  React.CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
};

const summaryValueStyle:
  React.CSSProperties = {
  marginTop: 8,
  fontSize: 24,
  fontWeight: 700,
  color: colors.primary,
};

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 15,
  background: "#fff",
};

const primaryButtonStyle:
  React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "11px 18px",
  background: colors.primary,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle:
  React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  padding: "11px 18px",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 600,
};

const smallButtonStyle:
  React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: 6,
  padding: "6px 10px",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const selectedButtonStyle:
  React.CSSProperties = {
  border:
    `1px solid ${colors.primary}`,
  borderRadius: 6,
  padding: "6px 10px",
  background: colors.primary,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const thStyle:
  React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom:
    "2px solid #E5E7EB",
  fontSize: 14,
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle:
  React.CSSProperties = {
  padding: "12px 10px",
  borderBottom:
    "1px solid #E5E7EB",
  fontSize: 14,
  color: "#4B5563",
  verticalAlign:
    "middle",
};

const emptyStyle:
  React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#6B7280",
};