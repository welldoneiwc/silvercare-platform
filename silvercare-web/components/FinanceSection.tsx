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
  phone?: string;
};

export type FinanceCharge = {
  id: string;
  month: string;
  /*
   * 保留 name 欄位是為了相容既有 Database 資料。
   * UI 不再讓使用者輸入「收費項目」；
   * 實際顯示以「對應課程」為主，收費細節放在備註。
   */
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

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
};

const mapChargeFromDatabase = (
  row: DatabaseRow
): FinanceCharge => {
  return {
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
  };
};

const mapPayerFromDatabase = (
  row: DatabaseRow
): FinancePayer => {
  const source =
    row.source === "manual"
      ? "manual"
      : "registration";

  return {
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
    source,
    createdAt:
      normalizeString(
        row.created_at
      ) ||
      new Date().toISOString(),
  };
};

const mapPaymentFromDatabase = (
  row: DatabaseRow
): FinancePayment => {
  return {
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
  };
};

export default function FinanceSection() {
  const [charges, setCharges] =
    useState<FinanceCharge[]>([]);

  const savingChargeRef =
    useRef(false);

  const deletingChargeRef =
    useRef<string | null>(null);

  const [payers, setPayers] =
    useState<FinancePayer[]>([]);

  const [payments, setPayments] =
    useState<FinancePayment[]>([]);

  const [courses, setCourses] =
    useState<CourseOption[]>([]);

  const [showAddCourse, setShowAddCourse] =
    useState(false);

  const [newCourseTitle, setNewCourseTitle] =
    useState("");

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

  useEffect(() => {
    const loadFinanceData =
      async () => {
        try {
          const [
            chargesResult,
            payersResult,
            paymentsResult,
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

          const cloudCharges =
            (chargesResult.data || []).map(
              (row) =>
                mapChargeFromDatabase(
                  row as DatabaseRow
                )
            );

          const cloudPayers =
            (payersResult.data || []).map(
              (row) =>
                mapPayerFromDatabase(
                  row as DatabaseRow
                )
            );

          const cloudPayments =
            (paymentsResult.data || []).map(
              (row) =>
                mapPaymentFromDatabase(
                  row as DatabaseRow
                )
            );

          setCharges(
            cloudCharges
          );

          setPayers(
            cloudPayers
          );

          setPayments(
            cloudPayments
          );

          saveLocalFinanceBackup(
            cloudCharges,
            cloudPayers,
            cloudPayments
          );
        } catch (error) {
          console.error(
            "載入財務資料失敗：",
            error
          );

          try {
            const savedCharges =
              localStorage.getItem(
                FINANCE_CHARGES_STORAGE_KEY
              );

            const savedPayers =
              localStorage.getItem(
                FINANCE_PAYERS_STORAGE_KEY
              );

            const savedPayments =
              localStorage.getItem(
                FINANCE_PAYMENTS_STORAGE_KEY
              );

            if (savedCharges) {
              setCharges(
                JSON.parse(
                  savedCharges
                )
              );
            }

            if (savedPayers) {
              setPayers(
                JSON.parse(
                  savedPayers
                )
              );
            }

            if (savedPayments) {
              setPayments(
                JSON.parse(
                  savedPayments
                )
              );
            }
          } catch (localError) {
            console.error(
              "讀取財務 LocalStorage 備份失敗：",
              localError
            );
          }
        } finally {
          setLoaded(true);
        }
      };

    loadFinanceData();
  }, []);

  useEffect(() => {
    const loadCourses =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from("courses")
            .select(
              "id,title"
            )
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
            );

          if (error) {
            throw error;
          }

          const cloudCourses =
            (data || []).map(
              (course) => ({
                id: course.id,
                title:
                  course.title || "",
              })
            );

          setCourses(
            cloudCourses
          );

          localStorage.setItem(
            COURSE_STORAGE_KEY,
            JSON.stringify(
              cloudCourses
            )
          );
        } catch (error) {
          console.error(
            "讀取課程資料失敗：",
            error
          );

          try {
            const saved =
              localStorage.getItem(
                COURSE_STORAGE_KEY
              );

            if (saved) {
              const parsed =
                JSON.parse(saved);

              if (
                Array.isArray(parsed)
              ) {
                setCourses(
                  parsed
                );
              }
            }
          } catch (localError) {
            console.error(
              "讀取課程 LocalStorage 失敗：",
              localError
            );
          }
        }
      };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadRegistrations =
      () => {
        try {
          const saved =
            localStorage.getItem(
              REGISTRATION_STORAGE_KEY
            );

          if (!saved) {
            setRegistrations([]);
            return;
          }

          const parsed =
            JSON.parse(saved);

          if (
            Array.isArray(parsed)
          ) {
            setRegistrations(
              parsed
            );
          }
        } catch (error) {
          console.error(
            "讀取報名資料失敗：",
            error
          );

          setRegistrations([]);
        }
      };

    loadRegistrations();
  }, []);

  useEffect(() => {
    const loadElders =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from("elders")
            .select(
              "id,name,phone"
            )
            .order(
              "name",
              {
                ascending: true,
              }
            );

          if (error) {
            throw error;
          }

          const cloudElders =
            (data || []).map(
              (elder) => ({
                id: elder.id,
                name:
                  elder.name || "",
                phone:
                  elder.phone || "",
              })
            );

          setElders(
            cloudElders
          );

          localStorage.setItem(
            ELDER_STORAGE_KEY,
            JSON.stringify(
              cloudElders
            )
          );
        } catch (error) {
          console.error(
            "讀取長者資料失敗：",
            error
          );

          try {
            const saved =
              localStorage.getItem(
                ELDER_STORAGE_KEY
              );

            if (saved) {
              const parsed =
                JSON.parse(saved);

              if (
                Array.isArray(parsed)
              ) {
                setElders(
                  parsed
                );
              }
            }
          } catch (localError) {
            console.error(
              "讀取長者 LocalStorage 失敗：",
              localError
            );
          }
        }
      };

    loadElders();
  }, []);

  function saveLocalFinanceBackup(
    nextCharges: FinanceCharge[],
    nextPayers: FinancePayer[],
    nextPayments: FinancePayment[]
  ) {
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
        "儲存財務 LocalStorage 備份失敗：",
        error
      );
    }
  }

  const getCourseName = (
    courseId: string
  ) => {
    const course =
      courses.find(
        (item) =>
          String(item.id) ===
          String(courseId)
      );

    return (
      course?.title ||
      "未指定課程"
    );
  };

  const getChargeDisplayName = (
    charge: FinanceCharge
  ) => {
    const courseName =
      getCourseName(
        charge.courseId
      );

    if (
      courseName &&
      courseName !==
        "未指定課程"
    ) {
      return courseName;
    }

    if (charge.name) {
      return charge.name;
    }

    return "未指定課程";
  };

  const getChargeBilledAmount = (
    chargeId: string
  ) => {
    const charge =
      charges.find(
        (item) =>
          item.id ===
          chargeId
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
      count * charge.amount
    );
  };

  const getChargePaidAmount = (
    chargeId: string
  ) => {
    return payments
      .filter(
        (payment) =>
          payment.chargeId ===
          chargeId
      )
      .reduce(
        (sum, payment) =>
          sum +
          normalizeNumber(
            payment.amount
          ),
        0
      );
  };

  const getChargeOutstandingAmount = (
    chargeId: string
  ) => {
    return Math.max(
      0,
      getChargeBilledAmount(
        chargeId
      ) -
        getChargePaidAmount(
          chargeId
        )
    );
  };

  const getPayerPaidAmount = (
    payerId: string,
    chargeId: string
  ) => {
    return payments
      .filter(
        (payment) =>
          payment.payerId ===
            payerId &&
          payment.chargeId ===
            chargeId
      )
      .reduce(
        (sum, payment) =>
          sum +
          normalizeNumber(
            payment.amount
          ),
        0
      );
  };

  const getPayerOutstandingAmount = (
    payerId: string,
    chargeId: string
  ) => {
    const charge =
      charges.find(
        (item) =>
          item.id ===
          chargeId
      );

    if (!charge) {
      return 0;
    }

    return Math.max(
      0,
      charge.amount -
        getPayerPaidAmount(
          payerId,
          chargeId
        )
    );
  };

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
    payments.reduce(
      (sum, payment) =>
        sum +
        normalizeNumber(
          payment.amount
        ),
      0
    );

  const totalOutstanding =
    Math.max(
      0,
      totalBilled -
        totalPaid
    );

  const outstandingPayers =
    useMemo(() => {
      return payers.filter(
        (payer) =>
          getPayerOutstandingAmount(
            payer.id,
            payer.chargeId
          ) > 0
      );
    }, [
      payers,
      payments,
      charges,
    ]);

  const selectedCharge =
    selectedChargeId
      ? charges.find(
          (charge) =>
            charge.id ===
            selectedChargeId
        ) || null
      : null;

  const resetChargeForm =
    () => {
      const empty =
        createEmptyChargeForm();

      setEditingChargeId(
        null
      );

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
      charge.courseId
    );

    setChargeAmount(
      charge.amount
    );

    setChargeNote(
      charge.note
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      if (
        !Number.isFinite(
          chargeAmount
        ) ||
        chargeAmount <= 0
      ) {
        alert(
          "請輸入正確的每人收費金額。"
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

        if (
          editingChargeId
        ) {
          const {
            data: existingCharge,
            error: findError,
          } = await supabase
            .from(
              "finance_charges"
            )
            .select(
              "id"
            )
            .eq(
              "id",
              editingChargeId
            )
            .maybeSingle();

          if (findError) {
            throw findError;
          }

          if (!existingCharge) {
            throw new Error(
              "找不到要修改的收費項目。"
            );
          }

          const {
            data,
            error,
          } = await supabase
            .from(
              "finance_charges"
            )
            .update({
              month:
                chargeMonth,
              name:
                courseName,
              course_id:
                chargeCourseId,
              amount:
                chargeAmount,
              note:
                chargeNote,
            })
            .eq(
              "id",
              editingChargeId
            )
            .select("*")
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (!data) {
            throw new Error(
              "收費項目沒有真正更新，請檢查 Supabase UPDATE 權限。"
            );
          }

          const updatedCharge =
            mapChargeFromDatabase(
              data as DatabaseRow
            );

          const nextCharges =
            charges.map(
              (charge) =>
                charge.id ===
                editingChargeId
                  ? updatedCharge
                  : charge
            );

          setCharges(
            nextCharges
          );

          saveLocalFinanceBackup(
            nextCharges,
            payers,
            payments
          );

          if (
            selectedChargeId ===
            editingChargeId
          ) {
            setSelectedChargeId(
              updatedCharge.id
            );
          }

          resetChargeForm();

          alert(
            "收費項目修改成功！"
          );

          return;
        }

        const newId =
          createId();

        const {
          data,
          error,
        } = await supabase
          .from(
            "finance_charges"
          )
          .insert({
            id: newId,
            month:
              chargeMonth,
            name:
              courseName,
            course_id:
              chargeCourseId,
            amount:
              chargeAmount,
            note:
              chargeNote,
          })
          .select("*")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "新增收費項目沒有回傳資料。"
          );
        }

        const insertedCharge =
          mapChargeFromDatabase(
            data as DatabaseRow
          );

        const nextCharges = [
          insertedCharge,
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

        resetChargeForm();

        alert(
          "收費項目新增成功！"
        );
      } catch (error) {
        console.error(
          "儲存收費項目失敗：",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        alert(
          "儲存收費項目失敗：\n\n" +
            message
        );
      } finally {
        savingChargeRef.current =
          false;
      }
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
        const {
          error: paymentDeleteError,
        } = await supabase
          .from(
            "finance_payments"
          )
          .delete()
          .eq(
            "charge_id",
            chargeId
          );

        if (paymentDeleteError) {
          throw paymentDeleteError;
        }

        const {
          error: payerDeleteError,
        } = await supabase
          .from(
            "finance_payers"
          )
          .delete()
          .eq(
            "charge_id",
            chargeId
          );

        if (payerDeleteError) {
          throw payerDeleteError;
        }

        const {
          error: chargeDeleteError,
        } = await supabase
          .from(
            "finance_charges"
          )
          .delete()
          .eq(
            "id",
            chargeId
          );

        if (chargeDeleteError) {
          throw chargeDeleteError;
        }

        const {
          data: remainingCharge,
          error: verifyError,
        } = await supabase
          .from(
            "finance_charges"
          )
          .select(
            "id"
          )
          .eq(
            "id",
            chargeId
          )
          .maybeSingle();

        if (verifyError) {
          throw verifyError;
        }

        if (remainingCharge) {
          throw new Error(
            "Database 沒有真正刪除這筆收費項目，請檢查 Supabase DELETE 權限。"
          );
        }

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

        saveLocalFinanceBackup(
          nextCharges,
          nextPayers,
          nextPayments
        );

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

        if (
          editingChargeId ===
          chargeId
        ) {
          resetChargeForm();
        }

        alert(
          "收費項目已刪除。"
        );
      } catch (error) {
        console.error(
          "刪除收費項目失敗：",
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
      try {
        const existingPayerKeys =
          new Set(
            payers
              .filter(
                (payer) =>
                  payer.chargeId ===
                  charge.id
              )
              .map(
                (payer) =>
                  payer.elderId
                    ? `elder:${payer.elderId}`
                    : `manual:${payer.name}:${payer.phone}`
              )
          );

        const courseRegistrations =
          registrations.filter(
            (registration) =>
              String(
                registration.courseId
              ) ===
              String(
                charge.courseId
              )
          );

        const newPayers =
          courseRegistrations
            .map(
              (
                registration
              ) => {
                const elderId =
                  registration.elderId !==
                    undefined &&
                  registration.elderId !==
                    null
                    ? String(
                        registration.elderId
                      )
                    : "";

                const name =
                  registration.elderName ||
                  registration.name ||
                  "";

                const phone =
                  registration.elderPhone ||
                  registration.phone ||
                  "";

                const key =
                  elderId
                    ? `elder:${elderId}`
                    : `manual:${name}:${phone}`;

                return {
                  registration,
                  elderId,
                  name,
                  phone,
                  key,
                };
              }
            )
            .filter(
              (item) =>
                item.name &&
                !existingPayerKeys.has(
                  item.key
                )
            );

        if (
          newPayers.length ===
          0
        ) {
          alert(
            "這門課程的報名者都已經在繳費名單中。"
          );
          return;
        }

        const rows =
          newPayers.map(
            (item) => ({
              id: createId(),
              charge_id:
                charge.id,
              elder_id:
                item.elderId ||
                null,
              name:
                item.name,
              phone:
                item.phone,
              source:
                "registration",
              created_at:
                new Date().toISOString(),
            })
          );

        const {
          data,
          error,
        } = await supabase
          .from(
            "finance_payers"
          )
          .insert(rows)
          .select("*");

        if (error) {
          throw error;
        }

        const insertedPayers =
          (data || []).map(
            (row) =>
              mapPayerFromDatabase(
                row as DatabaseRow
              )
          );

        const nextPayers = [
          ...payers,
          ...insertedPayers,
        ];

        setPayers(
          nextPayers
        );

        saveLocalFinanceBackup(
          charges,
          nextPayers,
          payments
        );

        alert(
          `已新增 ${insertedPayers.length} 位繳費者。`
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

      try {
        const duplicate =
          payers.find(
            (payer) =>
              payer.chargeId ===
                selectedCharge.id &&
              payer.name.trim() ===
                manualName.trim() &&
              payer.phone.trim() ===
                manualPhone.trim()
          );

        if (duplicate) {
          alert(
            "這位繳費者已經存在於繳費名單中。"
          );
          return;
        }

        const newPayerId =
          createId();

        const {
          data,
          error,
        } = await supabase
          .from(
            "finance_payers"
          )
          .insert({
            id: newPayerId,
            charge_id:
              selectedCharge.id,
            elder_id:
              manualElderId ||
              null,
            name:
              manualName.trim(),
            phone:
              manualPhone.trim(),
            source:
              "manual",
          })
          .select("*")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "新增繳費者沒有回傳資料。"
          );
        }

        const newPayer =
          mapPayerFromDatabase(
            data as DatabaseRow
          );

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

        setManualName("");
        setManualPhone("");
        setManualElderId("");
        setManualNote("");

        setShowManualPayerForm(
          false
        );

        alert(
          "已加入繳費名單。"
        );
     } catch (error) {
  console.error(
    "新增繳費者失敗：",
    error
  );

  const supabaseError =
    error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

  alert(
    "新增繳費者失敗：\n\n" +
      `錯誤代碼：${
        supabaseError.code || "無"
      }\n` +
      `訊息：${
        supabaseError.message || "未知錯誤"
      }\n` +
      `詳細：${
        supabaseError.details || "無"
      }\n` +
      `提示：${
        supabaseError.hint || "無"
      }`
  );
}
    };

  const handleDeletePayer =
    async (
      payerId: string
    ) => {
      const confirmed =
        window.confirm(
          "確定要刪除這位繳費者嗎？\n\n相關繳款紀錄也會一起刪除。"
        );

      if (!confirmed) {
        return;
      }

      try {
        const {
          error: paymentError,
        } = await supabase
          .from(
            "finance_payments"
          )
          .delete()
          .eq(
            "payer_id",
            payerId
          );

        if (paymentError) {
          throw paymentError;
        }

        const {
          error: payerError,
        } = await supabase
          .from(
            "finance_payers"
          )
          .delete()
          .eq(
            "id",
            payerId
          );

        if (payerError) {
          throw payerError;
        }

        const nextPayers =
          payers.filter(
            (payer) =>
              payer.id !==
              payerId
          );

        const nextPayments =
          payments.filter(
            (payment) =>
              payment.payerId !==
              payerId
          );

        setPayers(
          nextPayers
        );

        setPayments(
          nextPayments
        );

        saveLocalFinanceBackup(
          charges,
          nextPayers,
          nextPayments
        );

        alert(
          "繳費者已刪除。"
        );
      } catch (error) {
        console.error(
          "刪除繳費者失敗：",
          error
        );

        alert(
          "刪除繳費者失敗：\n\n" +
            (error instanceof Error
              ? error.message
              : String(error))
        );
      }
    };

  const handleSavePayment =
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

      if (
        !Number.isFinite(
          paymentAmount
        ) ||
        paymentAmount <= 0
      ) {
        alert(
          "請輸入正確的繳款金額。"
        );
        return;
      }

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "finance_payments"
          )
          .insert({
            id: createId(),
            charge_id:
              selectedCharge.id,
            payer_id:
              paymentPayerId,
            amount:
              paymentAmount,
            paid_at:
              paymentDate,
            note:
              paymentNote,
          })
          .select("*")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "新增繳款紀錄沒有回傳資料。"
          );
        }

        const newPayment =
          mapPaymentFromDatabase(
            data as DatabaseRow
          );

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

        setPaymentPayerId("");
        setPaymentAmount(0);
        setPaymentDate(
          createEmptyPaymentForm().paidAt
        );
        setPaymentNote("");

        setShowPaymentForm(
          false
        );

        alert(
          "繳款紀錄已新增。"
        );
      } catch (error) {
        console.error(
          "新增繳款紀錄失敗：",
          error
        );

        alert(
          "新增繳款紀錄失敗：\n\n" +
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
          textAlign:
            "center",
          color:
            "#6B7280",
        }}
      >
        財務資料載入中...
      </div>
    );
  }

  return (
    <div
      className="finance-section-root"
      style={{
        display: "flex",
        flexDirection:
          "column",
        gap: 24,
      }}
    >
      <style jsx>
        {responsiveFinanceStyles}
      </style>

      <div>
        <h2
          style={{
            margin: 0,
            color:
              colors.primary,
            fontSize: 28,
          }}
        >
          財務管理
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color:
              "#6B7280",
          }}
        >
          管理課程收費、繳費名單、繳款紀錄與欠款追蹤。
        </p>
      </div>

      <div
        className="finance-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={
            summaryCardStyle
          }
        >
          <div
            style={
              summaryLabelStyle
            }
          >
            應收總額
          </div>

          <div
            style={
              summaryValueStyle
            }
          >
            {formatCurrency(
              totalBilled
            )}
          </div>
        </div>

        <div
          style={
            summaryCardStyle
          }
        >
          <div
            style={
              summaryLabelStyle
            }
          >
            已收款
          </div>

          <div
            style={
              summaryValueStyle
            }
          >
            {formatCurrency(
              totalPaid
            )}
          </div>
        </div>

        <div
          style={
            summaryCardStyle
          }
        >
          <div
            style={
              summaryLabelStyle
            }
          >
            尚欠總額
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
        style={
          sectionCardStyle
        }
      >
        <h3
          style={{
            marginTop: 0,
            color:
              colors.primary,
          }}
        >
          {editingChargeId
            ? "編輯收費項目"
            : "建立收費項目"}
        </h3>

        <div
          className="finance-charge-form-grid"
          style={{
            display: "grid",
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
              收費月份
            </label>

            <input
              type="month"
              value={
                chargeMonth
              }
              onChange={(event) =>
                setChargeMonth(
                  event.target
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
              對應課程
            </label>

            <select
              value={
                chargeCourseId
              }
              onChange={(event) =>
                setChargeCourseId(
                  event.target
                    .value
                )
              }
              style={
                inputStyle
              }
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
          </div>

          <div>
            <label
              style={
                labelStyle
              }
            >
              每人收費
            </label>

            <input
              type="number"
              min="0"
              value={
                chargeAmount
              }
              onChange={(event) =>
                setChargeAmount(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              style={
                inputStyle
              }
            />
          </div>

          <div
            style={{
              gridColumn:
                "1 / -1",
            }}
          >
            <label
              style={
                labelStyle
              }
            >
              備註
            </label>

            <textarea
              value={
                chargeNote
              }
              onChange={(event) =>
                setChargeNote(
                  event.target
                    .value
                )
              }
              rows={3}
              placeholder="例如：材料費、午餐費、交通費等"
              style={{
                ...inputStyle,
                resize:
                  "vertical",
              }}
            />
          </div>
        </div>

       <div
  className="finance-charge-actions"
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  }}
>
         <button
  type="button"
  onClick={
    handleSaveCharge
  }
style={{
  ...primaryButtonStyle,
  whiteSpace: "nowrap",
  fontSize: 16,
  padding: "10px 14px",
}}
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
        style={
          sectionCardStyle
        }
      >
        <h3
          style={{
            marginTop: 0,
            color:
              colors.primary,
          }}
        >
          收費項目
        </h3>

        {charges.length ===
        0 ? (
          <div
            style={
              emptyStyle
            }
          >
            目前尚無收費項目
          </div>
        ) : (
          <div
            className="finance-charge-table-wrap"
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              className="finance-charge-table"
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={
                      thStyle
                    }
                  >
                    月份
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    對應課程
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    每人收費
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    繳費人數
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    應收
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    已繳
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    尚欠
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
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
                            className="finance-charge-actions"
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
                                setSelectedChargeId(
                                  charge.id
                                );

                                setShowPaymentForm(
                                  false
                                );

                                setShowManualPayerForm(
                                  false
                                );
                              }}
                              style={{
                                ...(isSelected
                                  ? selectedButtonStyle
                                  : smallButtonStyle),
                                width: 40,
                                height: 40,
                                padding: 0,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <svg
                                width="19"
                                height="19"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <circle
                                  cx="9"
                                  cy="8"
                                  r="3"
                                />
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
                                void handleGeneratePayerList(
                                  charge
                                )
                              }
                              style={{
                                ...smallButtonStyle,
                                width: 40,
                                height: 40,
                                padding: 0,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <svg
                                width="19"
                                height="19"
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
                                handleEditCharge(
                                  charge
                                )
                              }
                              style={{
                                ...smallButtonStyle,
                                width: 40,
                                height: 40,
                                padding: 0,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <svg
                                width="19"
                                height="19"
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
                                void handleDeleteCharge(
                                  charge.id
                                )
                              }
                              style={{
                                ...smallButtonStyle,
                                width: 40,
                                height: 40,
                                padding: 0,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                border:
                                  "none",
                                background:
                                  "#DC2626",
                                color:
                                  "#fff",
                              }}
                            >
                              <svg
                                width="19"
                                height="19"
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
          style={
            sectionCardStyle
          }
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

              <div
                className="finance-form-grid"
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                }}
              >
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    選擇長者
                  </label>

                  <select
                    value={
                      manualElderId
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value;

                      setManualElderId(
                        value
                      );

                      const elder =
                        elders.find(
                          (
                            item
                          ) =>
                            String(
                              item.id
                            ) ===
                            value
                        );

                      if (elder) {
                        setManualName(
                          elder.name
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
                      不指定長者
                    </option>

                    {elders.map(
                      (elder) => (
                        <option
                          key={String(
                            elder.id
                          )}
                          value={String(
                            elder.id
                          )}
                        >
                          {elder.name}
                          {elder.phone
                            ? `｜${elder.phone}`
                            : ""}
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
                    姓名
                  </label>

                  <input
                    value={
                      manualName
                    }
                    onChange={(
                      event
                    ) =>
                      setManualName(
                        event.target
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
                    電話
                  </label>

                  <input
                    value={
                      manualPhone
                    }
                    onChange={(
                      event
                    ) =>
                      setManualPhone(
                        event.target
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
                    value={
                      manualNote
                    }
                    onChange={(
                      event
                    ) =>
                      setManualNote(
                        event.target
                          .value
                      )
                    }
                    style={
                      inputStyle
                    }
                  />
                </div>
              </div>

              <div
                style={{
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
                登記繳款
              </h4>

              <div
                className="finance-form-grid"
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 14,
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
                      paymentPayerId
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentPayerId(
                        event.target
                          .value
                      )
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      請選擇繳費者
                    </option>

                    {payers
                      .filter(
                        (payer) =>
                          payer.chargeId ===
                          selectedCharge.id
                      )
                      .map(
                        (payer) => (
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
                            }
                            {payer.phone
                              ? `｜${payer.phone}`
                              : ""}
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
                    繳款金額
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
                        Number(
                          event.target
                            .value
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
                      paymentDate
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentDate(
                        event.target
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
                    value={
                      paymentNote
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentNote(
                        event.target
                          .value
                      )
                    }
                    style={
                      inputStyle
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleSavePayment
                  }
                  style={
                    primaryButtonStyle
                  }
                >
                  儲存繳款
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 24,
            }}
          >
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              {payers.filter(
                (payer) =>
                  payer.chargeId ===
                  selectedCharge.id
              ).length ===
              0 ? (
                <div
                  style={{
                    padding: 30,
                    textAlign:
                      "center",
                    color:
                      "#6B7280",
                    background:
                      "#F9FAFB",
                    borderRadius:
                      12,
                  }}
                >
                  目前還沒有繳費名單。請先按「產生名單」，或手動新增繳費者。
                </div>
              ) : (
                <table
                  className="finance-payer-table"
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          thStyle
                        }
                      >
                        長者／繳費者
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        電話
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        應收
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        已繳
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        尚欠
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        操作
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {payers
                      .filter(
                        (payer) =>
                          payer.chargeId ===
                          selectedCharge.id
                      )
                      .map(
                        (payer) => {
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

                          return (
                            <tr
                              key={
                                payer.id
                              }
                            >
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight:
                                    700,
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
                                {
                                  payer.phone
                                }
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
                                  fontWeight:
                                    700,
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
                                  {outstanding >
                                    0 && (
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
                                      追蹤繳款
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeletePayer(
                                        payer.id
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
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
            }}
          >
            <h4
              style={{
                marginTop: 0,
                color:
                  colors.primary,
              }}
            >
              繳款紀錄
            </h4>

            {payments.filter(
              (payment) =>
                payment.chargeId ===
                selectedCharge.id
            ).length ===
            0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign:
                    "center",
                  color:
                    "#6B7280",
                  background:
                    "#F9FAFB",
                  borderRadius:
                    12,
                }}
              >
                目前尚無繳款紀錄。
              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  className="finance-payment-table"
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          thStyle
                        }
                      >
                        繳費者
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        金額
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        日期
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        備註
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        操作
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments
                      .filter(
                        (payment) =>
                          payment.chargeId ===
                          selectedCharge.id
                      )
                      .map(
                        (payment) => {
                          const payer =
                            payers.find(
                              (
                                item
                              ) =>
                                item.id ===
                                payment.payerId
                            );

                          return (
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
                                  payer?.name
                                }
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
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
                                {
                                  payment.paidAt
                                }
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                {
                                  payment.note ||
                                  "-"
                                }
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
                          );
                        }
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={
          sectionCardStyle
        }
      >
        <h3
          style={{
            marginTop: 0,
            color:
              colors.primary,
          }}
        >
          欠款長者追蹤
        </h3>

        <p
          style={{
            marginTop: -8,
            color:
              "#6B7280",
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
  className="finance-charge-table"
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
              <thead>
                <tr>
                  <th
                    style={
                      thStyle
                    }
                  >
                    長者／繳費者
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    對應課程
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    應收
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    已繳
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    尚欠
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
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
                            fontWeight:
                              700,
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
                            fontWeight:
                              700,
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
                            onClick={() => {
                              setSelectedChargeId(
                                charge.id
                              );

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

                              window.scrollTo(
                                {
                                  top: 0,
                                  behavior:
                                    "smooth",
                                }
                              );
                            }}
                            style={
                              smallButtonStyle
                            }
                          >
                            追蹤繳款
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

const responsiveFinanceStyles = `
  @media (max-width: 700px) {
    .finance-section-root {
      gap: 16px !important;
      width: 100%;
      box-sizing: border-box;
    }

    .finance-section-root > div:first-child h2 {
      font-size: 24px !important;
    }

    .finance-section-root > div:first-child p {
      font-size: 14px;
      line-height: 1.6;
    }

    .finance-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .finance-summary-grid > div {
      padding: 14px !important;
      min-width: 0;
    }

    .finance-summary-grid > div:last-child {
      grid-column: 1 / -1;
    }

    .finance-summary-grid > div > div:last-child {
      font-size: 18px !important;
      white-space: nowrap;
    }

    .finance-section-root > div {
      box-sizing: border-box;
      max-width: 100%;
    }

    .finance-section-root > div[style*="padding: 24px"] {
      padding: 16px !important;
    }

    .finance-charge-form-grid,
    .finance-form-grid {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }

    .finance-charge-form-grid > div[style*="gridColumn"] {
      grid-column: auto !important;
    }

    /*
     * ========================================
     * 手機版收費項目
     * ========================================
     */

    .finance-charge-table-wrap {
      width: 100% !important;
      overflow: visible !important;
    }

    .finance-charge-table {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      border-collapse: separate !important;
    }

    .finance-charge-table thead {
      display: none !important;
    }

    .finance-charge-table tbody {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      width: 100% !important;
    }

    .finance-charge-table tbody tr {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 16px !important;
      margin: 0 !important;
      border: 1px solid #E5E7EB !important;
      border-radius: 14px !important;
      background: #fff !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    .finance-charge-table tbody td {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      padding: 10px 0 !important;
      border-bottom: 1px solid #F3F4F6 !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
    }

    .finance-charge-table tbody td:nth-child(1)::before {
      content: "月份";
    }

    .finance-charge-table tbody td:nth-child(2)::before {
      content: "對應課程";
    }

    .finance-charge-table tbody td:nth-child(3)::before {
      content: "每人收費";
    }

    .finance-charge-table tbody td:nth-child(4)::before {
      content: "繳費人數";
    }

    .finance-charge-table tbody td:nth-child(5)::before {
      content: "應收";
    }

    .finance-charge-table tbody td:nth-child(6)::before {
      content: "已繳";
    }

    .finance-charge-table tbody td:nth-child(7)::before {
      content: "尚欠";
    }

    .finance-charge-table tbody td:nth-child(-n+7)::before {
      flex: 0 0 auto !important;
      margin-right: 12px !important;
      color: #6B7280 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
    }

    .finance-charge-table tbody td:nth-child(1),
    .finance-charge-table tbody td:nth-child(2),
    .finance-charge-table tbody td:nth-child(3),
    .finance-charge-table tbody td:nth-child(4),
    .finance-charge-table tbody td:nth-child(5),
    .finance-charge-table tbody td:nth-child(6) {
      border-bottom: 1px solid #F3F4F6 !important;
    }

    .finance-charge-table tbody td:nth-child(2) {
      font-weight: 700 !important;
      color: #1F2937 !important;
    }

    .finance-charge-table tbody td:nth-child(7) {
      font-weight: 700 !important;
      border-bottom: none !important;
    }

    /*
     * ========================================
     * 手機版四個操作 Icon
     * ========================================
     */

    .finance-charge-table tbody td:nth-child(8) {
      display: block !important;
      width: 100% !important;
      padding: 14px 0 0 !important;
      margin-top: 4px !important;
      border-bottom: none !important;
    }

  /* ========================================
 * 手機版收費操作按鈕
 * ======================================== */

/* 建立／編輯收費項目的按鈕列 */
.finance-section-root > div > .finance-charge-actions {
  display: flex !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

/* 新增收費項目／儲存修改 */
.finance-section-root
  > div
  > .finance-charge-actions
  > button {
  width: auto !important;
  max-width: 100% !important;
  min-width: 0 !important;
  height: 42px !important;
  padding: 0 16px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
  font-size: 16px !important;
  flex: 0 0 auto !important;
}

/* 收費列表裡的四個 Icon 按鈕維持 40×40 */
.finance-charge-table
  .finance-charge-actions {
  display: flex !important;
  width: 100% !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.finance-charge-table
  .finance-charge-actions
  > button {
  width: 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
  height: 42px !important;
  padding: 0 !important;
  flex: 0 0 40px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  border-radius: 9px !important;
  touch-action: manipulation !important;
}

.finance-section-root button {
  touch-action: manipulation;
  white-space: nowrap;
}

   .finance-section-root button {
  touch-action: manipulation;
  white-space: nowrap;
}

    /*
     * ========================================
     * 其他財務表格
     * ========================================
     */

    .finance-payer-table,
    .finance-payment-table,
    .finance-outstanding-table {
      font-size: 13px !important;
    }

    .finance-payer-table th,
    .finance-payer-table td,
    .finance-payment-table th,
    .finance-payment-table td,
    .finance-outstanding-table th,
    .finance-outstanding-table td {
      padding: 9px 7px !important;
    }

    .finance-section-root textarea,
    .finance-section-root input,
    .finance-section-root select {
      max-width: 100%;
      box-sizing: border-box;
    }
  }

  @media (max-width: 420px) {
    .finance-summary-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 8px !important;
    }

    .finance-summary-grid > div {
      padding: 12px !important;
    }

    .finance-summary-grid > div > div:last-child {
      font-size: 16px !important;
    }

    .finance-charge-table tbody tr {
      padding: 14px !important;
      border-radius: 12px !important;
    }

    .finance-charge-table tbody td {
      font-size: 13px !important;
      padding: 9px 0 !important;
    }

    .finance-charge-table tbody td:nth-child(-n+7)::before {
      font-size: 11px !important;
    }

    .finance-charge-actions {
      gap: 6px !important;
    }

    .finance-charge-actions button {
      height: 40px !important;
    }
  }
`;

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
  fontWeight: 800,
  color: colors.primary,
};

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border:
    "1px solid #D1D5DB",
  borderRadius: 8,
  padding: "10px 12px",
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
  background:
    colors.primary,
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