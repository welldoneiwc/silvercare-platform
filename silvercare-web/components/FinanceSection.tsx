"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { colors } from "../styles/theme";
import { supabase } from "../utils/supabase";

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

const getCurrentMonth = () => {
  return new Date()
    .toISOString()
    .slice(0, 7);
};

const createEmptyChargeForm = () => ({
  month: getCurrentMonth(),
  name: "",
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

const createId = () => {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const formatCurrency = (
  amount: number
) => {
  return `NT$ ${amount.toLocaleString(
    "zh-TW"
  )}`;
};

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
  row: any
): FinanceCharge => {
  return {
    id: normalizeString(row.id),
    month: normalizeString(row.month),
    name: normalizeString(row.name),
    courseId: normalizeString(
      row.course_id
    ),
    amount: normalizeNumber(
      row.amount
    ),
    note: normalizeString(row.note),
    createdAt:
      normalizeString(
        row.created_at
      ) ||
      new Date().toISOString(),
  };
};

const mapPayerFromDatabase = (
  row: any
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
    name: normalizeString(row.name),
    phone: normalizeString(row.phone),
    source,
    createdAt:
      normalizeString(
        row.created_at
      ) ||
      new Date().toISOString(),
  };
};

const mapPaymentFromDatabase = (
  row: any
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
    note: normalizeString(row.note),
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

  const [chargeName, setChargeName] =
    useState("");

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
              mapChargeFromDatabase
            );

          const cloudPayers =
            (payersResult.data || []).map(
              mapPayerFromDatabase
            );

          const cloudPayments =
            (paymentsResult.data || []).map(
              mapPaymentFromDatabase
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

          localStorage.setItem(
            FINANCE_CHARGES_STORAGE_KEY,
            JSON.stringify(
              cloudCharges
            )
          );

          localStorage.setItem(
            FINANCE_PAYERS_STORAGE_KEY,
            JSON.stringify(
              cloudPayers
            )
          );

          localStorage.setItem(
            FINANCE_PAYMENTS_STORAGE_KEY,
            JSON.stringify(
              cloudPayments
            )
          );
        } catch (error) {
          console.error(
            "讀取 Supabase 財務資料失敗：",
            error
          );

          /*
           * Supabase 讀取失敗時，
           * 暫時使用既有 LocalStorage，
           * 避免目前畫面直接消失。
           *
           * 注意：
           * 這裡只是 fallback，
           * 不會把 LocalStorage 自動寫回 Supabase。
           */
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
              const parsed =
                JSON.parse(
                  savedCharges
                );

              if (
                Array.isArray(
                  parsed
                )
              ) {
                setCharges(parsed);
              }
            }

            if (savedPayers) {
              const parsed =
                JSON.parse(
                  savedPayers
                );

              if (
                Array.isArray(
                  parsed
                )
              ) {
                setPayers(parsed);
              }
            }

            if (savedPayments) {
              const parsed =
                JSON.parse(
                  savedPayments
                );

              if (
                Array.isArray(
                  parsed
                )
              ) {
                setPayments(parsed);
              }
            }
          } catch (
            fallbackError
          ) {
            console.error(
              "讀取財務 LocalStorage fallback 失敗：",
              fallbackError
            );
          }
        } finally {
          setLoaded(true);
        }
      };

    loadFinanceData();
  }, []);

  useEffect(() => {
    try {
      const savedCourses =
        localStorage.getItem(
          COURSE_STORAGE_KEY
        );

      const savedRegistrations =
        localStorage.getItem(
          REGISTRATION_STORAGE_KEY
        );

      const savedElders =
        localStorage.getItem(
          ELDER_STORAGE_KEY
        );

      if (savedCourses) {
        const parsed =
          JSON.parse(savedCourses);

        if (Array.isArray(parsed)) {
          setCourses(
            parsed.map(
              (course) => ({
                id: course.id,
                title:
                  normalizeString(
                    course.title
                  ) ||
                  normalizeString(
                    course.name
                  ) ||
                  "未命名課程",
              })
            )
          );
        }
      }

      if (savedRegistrations) {
        const parsed =
          JSON.parse(
            savedRegistrations
          );

        if (Array.isArray(parsed)) {
          setRegistrations(
            parsed
          );
        }
      }

      if (savedElders) {
        const parsed =
          JSON.parse(savedElders);

        if (Array.isArray(parsed)) {
          setElders(
            parsed.map(
              (elder) => ({
                id: elder.id,
                name:
                  normalizeString(
                    elder.name
                  ),
                phone:
                  normalizeString(
                    elder.phone
                  ),
              })
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "讀取財務參考資料失敗：",
        error
      );
    }
  }, []);

  useEffect(() => {
    const reloadReferenceData = () => {
      try {
        const savedCourses =
          localStorage.getItem(
            COURSE_STORAGE_KEY
          );

        const savedRegistrations =
          localStorage.getItem(
            REGISTRATION_STORAGE_KEY
          );

        const savedElders =
          localStorage.getItem(
            ELDER_STORAGE_KEY
          );

        if (savedCourses) {
          const parsed =
            JSON.parse(savedCourses);

          if (Array.isArray(parsed)) {
            setCourses(
              parsed.map(
                (course) => ({
                  id: course.id,
                  title:
                    normalizeString(
                      course.title
                    ) ||
                    normalizeString(
                      course.name
                    ) ||
                    "未命名課程",
                })
              )
            );
          }
        }

        if (savedRegistrations) {
          const parsed =
            JSON.parse(
              savedRegistrations
            );

          if (Array.isArray(parsed)) {
            setRegistrations(
              parsed
            );
          }
        }

        if (savedElders) {
          const parsed =
            JSON.parse(savedElders);

          if (Array.isArray(parsed)) {
            setElders(
              parsed.map(
                (elder) => ({
                  id: elder.id,
                  name:
                    normalizeString(
                      elder.name
                    ),
                  phone:
                    normalizeString(
                      elder.phone
                    ),
                })
              )
            );
          }
        }
      } catch (error) {
        console.error(
          "更新財務參考資料失敗：",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      reloadReferenceData
    );

    return () => {
      window.removeEventListener(
        "storage",
        reloadReferenceData
      );
    };
  }, []);

  const selectedCharge =
    useMemo(() => {
      return (
        charges.find(
          (charge) =>
            charge.id ===
            selectedChargeId
        ) || null
      );
    }, [
      charges,
      selectedChargeId,
    ]);

  const selectedChargePayers =
    useMemo(() => {
      if (!selectedChargeId) {
        return [];
      }

      return payers.filter(
        (payer) =>
          payer.chargeId ===
          selectedChargeId
      );
    }, [
      payers,
      selectedChargeId,
    ]);

  const selectedChargePayments =
    useMemo(() => {
      if (!selectedChargeId) {
        return [];
      }

      return payments.filter(
        (payment) =>
          payment.chargeId ===
          selectedChargeId
      );
    }, [
      payments,
      selectedChargeId,
    ]);

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
          sum + payment.amount,
        0
      );
  };

  const getPayerOutstandingAmount = (
    payerId: string,
    chargeId: string
  ) => {
    const charge = charges.find(
      (item) =>
        item.id === chargeId
    );

    if (!charge) {
      return 0;
    }

    const paid =
      getPayerPaidAmount(
        payerId,
        chargeId
      );

    return Math.max(
      charge.amount - paid,
      0
    );
  };

  const getChargeBilledAmount = (
    chargeId: string
  ) => {
    const charge = charges.find(
      (item) =>
        item.id === chargeId
    );

    if (!charge) {
      return 0;
    }

    const chargePayerCount =
      payers.filter(
        (payer) =>
          payer.chargeId ===
          chargeId
      ).length;

    return (
      charge.amount *
      chargePayerCount
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
          sum + payment.amount,
        0
      );
  };

  const getChargeOutstandingAmount = (
    chargeId: string
  ) => {
    return Math.max(
      getChargeBilledAmount(
        chargeId
      ) -
        getChargePaidAmount(
          chargeId
        ),
      0
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
    setChargeName(
      empty.name
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

  const handleAddCourse = () => {
    const title =
      newCourseTitle.trim();

    if (!title) {
      alert(
        "請輸入課程名稱。"
      );
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          COURSE_STORAGE_KEY
        );

      const existingCourses =
        saved
          ? (JSON.parse(
              saved
            ) as CourseOption[])
          : [];

      const newCourseId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const newCourse: CourseOption =
        {
          id: newCourseId,
          title,
        };

      const updatedCourses = [
        ...existingCourses,
        newCourse,
      ];

      localStorage.setItem(
        COURSE_STORAGE_KEY,
        JSON.stringify(
          updatedCourses
        )
      );

      setCourses(
        updatedCourses
      );

      setChargeCourseId(
        newCourseId
      );

      setNewCourseTitle("");
      setShowAddCourse(false);
    } catch (error) {
      console.error(
        "新增課程失敗：",
        error
      );

      alert(
        "新增課程失敗，請稍後再試。"
      );
    }
  };

  const handleSaveCharge =
    async () => {
      if (!loaded) {
        alert(
          "財務資料尚未載入完成，請稍候再試。"
        );
        return;
      }

      if (!chargeMonth) {
        alert(
          "請選擇收費月份。"
        );
        return;
      }

      if (!chargeName.trim()) {
        alert(
          "請輸入收費項目名稱。"
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
        chargeAmount <= 0
      ) {
        alert(
          "收費金額必須大於 0。"
        );
        return;
      }

      try {
        if (editingChargeId) {
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
                chargeName.trim(),
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
            )
            .select()
            .single();

          if (error) {
            throw error;
          }

          const updatedCharge =
            mapChargeFromDatabase(
              data
            );

          setCharges(
            (current) =>
              current.map(
                (charge) =>
                  charge.id ===
                  editingChargeId
                    ? updatedCharge
                    : charge
              )
          );

          resetChargeForm();

          alert(
            "收費項目已儲存。"
          );
          return;
        }

        const newCharge: FinanceCharge =
          {
            id: createId(),
            month:
              chargeMonth,
            name:
              chargeName.trim(),
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
          data,
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
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const insertedCharge =
          mapChargeFromDatabase(
            data
          );

        setCharges(
          (current) => [
            insertedCharge,
            ...current,
          ]
        );

        setSelectedChargeId(
          insertedCharge.id
        );

        resetChargeForm();

        alert(
          "收費項目已建立並同步到雲端。"
        );
    } catch (error) {
  console.error(
    "儲存收費項目失敗：",
    error
  );

  if (error && typeof error === "object") {
    console.error(
      "Supabase error details:",
      JSON.stringify(
        error,
        null,
        2
      )
    );
  }

  alert(
    "儲存收費項目失敗，請稍後再試。"
  );
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
    setChargeName(
      charge.name || ""
    );
    setChargeCourseId(
      charge.courseId || ""
    );
    setChargeAmount(
      normalizeNumber(
        charge.amount
      )
    );
    setChargeNote(
      charge.note || ""
    );
  };

  const handleDeleteCharge =
    async (
      chargeId: string
    ) => {
      const confirmed =
        window.confirm(
          "刪除收費項目後，這個項目的繳費名單與繳款紀錄也會一起刪除。確定要刪除嗎？"
        );

      if (!confirmed) {
        return;
      }

      try {
        const {
          error:
            paymentsDeleteError,
        } = await supabase
          .from(
            "finance_payments"
          )
          .delete()
          .eq(
            "charge_id",
            chargeId
          );

        if (paymentsDeleteError) {
          throw paymentsDeleteError;
        }

        const {
          error:
            payersDeleteError,
        } = await supabase
          .from(
            "finance_payers"
          )
          .delete()
          .eq(
            "charge_id",
            chargeId
          );

        if (payersDeleteError) {
          throw payersDeleteError;
        }

        const {
          error:
            chargeDeleteError,
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

        setCharges(
          (current) =>
            current.filter(
              (charge) =>
                charge.id !==
                chargeId
            )
        );

        setPayers(
          (current) =>
            current.filter(
              (payer) =>
                payer.chargeId !==
                chargeId
            )
        );

        setPayments(
          (current) =>
            current.filter(
              (payment) =>
                payment.chargeId !==
                chargeId
            )
        );

        if (
          selectedChargeId ===
          chargeId
        ) {
          setSelectedChargeId(
            null
          );
        }

        if (
          editingChargeId ===
          chargeId
        ) {
          resetChargeForm();
        }

        alert(
          "收費項目、繳費名單與繳款紀錄已刪除。"
        );
      } catch (error) {
        console.error(
          "刪除收費項目失敗：",
          error
        );

        alert(
          "刪除收費項目失敗，請稍後再試。"
        );
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
          "這門課目前沒有報名資料，因此不會建立繳費名單。"
        );
        return;
      }

      const existingPayers =
        payers.filter(
          (payer) =>
            payer.chargeId ===
            charge.id
        );

      const newPayers: FinancePayer[] =
        [];

      courseRegistrations.forEach(
        (registration) => {
          const registrationElderId =
            normalizeString(
              registration.elderId
            );

          const registrationName =
            normalizeString(
              registration.name
            ) ||
            normalizeString(
              registration.elderName
            );

          const registrationPhone =
            normalizeString(
              registration.phone
            ) ||
            normalizeString(
              registration.elderPhone
            );

          if (
            !registrationName
          ) {
            return;
          }

          const alreadyExists =
            existingPayers.some(
              (payer) => {
                if (
                  registrationElderId &&
                  payer.elderId
                ) {
                  return (
                    payer.elderId ===
                    registrationElderId
                  );
                }

                return (
                  payer.name ===
                    registrationName &&
                  payer.phone ===
                    registrationPhone
                );
              }
            ) ||
            newPayers.some(
              (payer) => {
                if (
                  registrationElderId &&
                  payer.elderId
                ) {
                  return (
                    payer.elderId ===
                    registrationElderId
                  );
                }

                return (
                  payer.name ===
                    registrationName &&
                  payer.phone ===
                    registrationPhone
                );
              }
            );

          if (
            alreadyExists
          ) {
            return;
          }

          newPayers.push({
            id: createId(),
            chargeId:
              charge.id,
            elderId:
              registrationElderId ||
              undefined,
            name:
              registrationName,
            phone:
              registrationPhone,
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
        alert(
          "這個收費項目的繳費名單已經建立完成，沒有新的報名者需要加入。"
        );
        setSelectedChargeId(
          charge.id
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
          data,
          error,
        } = await supabase
          .from(
            "finance_payers"
          )
          .insert(rows)
          .select();

        if (error) {
          throw error;
        }

        const insertedPayers =
          (data || []).map(
            mapPayerFromDatabase
          );

        setPayers(
          (current) => [
            ...current,
            ...insertedPayers,
          ]
        );

        setSelectedChargeId(
          charge.id
        );

        alert(
          `已加入 ${insertedPayers.length} 位報名長者到繳費名單，並同步到雲端。`
        );
      } catch (error) {
        console.error(
          "產生繳費名單失敗：",
          error
        );

        alert(
          "產生繳費名單失敗，請稍後再試。"
        );
      }
    };

  const handleAddManualPayer =
    async () => {
      if (
        !selectedCharge
      ) {
        alert(
          "請先選擇收費項目。"
        );
        return;
      }

      if (
        !manualName.trim()
      ) {
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
          "這位繳費者已經在此收費項目的名單中。"
        );
        return;
      }

      const newPayer: FinancePayer =
        {
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
          data,
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
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const insertedPayer =
          mapPayerFromDatabase(
            data
          );

        setPayers(
          (current) => [
            ...current,
            insertedPayer,
          ]
        );

        resetManualPayerForm();

        setShowManualPayerForm(
          false
        );

        alert(
          "繳費者已加入並同步到雲端。"
        );
      } catch (error) {
        console.error(
          "新增繳費者失敗：",
          error
        );

        alert(
          "新增繳費者失敗，請稍後再試。"
        );
      }
    };

  const handleAddPayment =
    async () => {
      if (
        !selectedCharge
      ) {
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
        paymentAmount <= 0
      ) {
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

      if (
        outstanding <= 0
      ) {
        alert(
          "這位繳費者目前沒有尚欠金額。"
        );
        return;
      }

      if (
        paymentAmount >
        outstanding
      ) {
        alert(
          `本次最多只能繳 ${formatCurrency(
            outstanding
          )}。`
        );
        return;
      }

      const newPayment: FinancePayment =
        {
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
          data,
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
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const insertedPayment =
          mapPaymentFromDatabase(
            data
          );

        setPayments(
          (current) => [
            insertedPayment,
            ...current,
          ]
        );

        resetPaymentForm();

        setShowPaymentForm(
          false
        );

        alert(
          "繳款已儲存並同步到雲端。"
        );
      } catch (error) {
        console.error(
          "新增繳款失敗：",
          error
        );

        alert(
          "新增繳款失敗，請稍後再試。"
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

        setPayments(
          (current) =>
            current.filter(
              (payment) =>
                payment.id !==
                paymentId
            )
        );

        alert(
          "繳款紀錄已刪除。"
        );
      } catch (error) {
        console.error(
          "刪除繳款紀錄失敗：",
          error
        );

        alert(
          "刪除繳款紀錄失敗，請稍後再試。"
        );
      }
    };

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

  const getPayerName = (
    payerId: string
  ) => {
    const payer =
      payers.find(
        (item) =>
          item.id === payerId
      );

    return (
      payer?.name ||
      "未知繳費者"
    );
  };

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "-";
    }

    return value;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* ==================== */}
      {/* Header */}
      {/* ==================== */}

      <div>
        <h2
          style={{
            margin: 0,
            color: colors.primary,
            fontSize: 28,
          }}
        >
          財務管理／收費
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: "#6B7280",
          }}
        >
          建立收費項目，依課程報名名單產生繳費名單，並追蹤每位長者的繳款與欠款。
        </p>
      </div>

      {/* ==================== */}
      {/* Summary */}
      {/* ==================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
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
            總應收
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
            已收
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
            待收
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

      {/* ==================== */}
      {/* Create Charge */}
      {/* ==================== */}

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
            ? "編輯收費項目"
            : "建立收費項目"}
        </h3>

        <p
          style={{
            marginTop: -8,
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          先建立收費項目，再從指定課程的報名資料產生實際繳費名單。
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, 1fr)",
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
                  event.target
                    .value
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              收費項目名稱
            </label>

            <input
              type="text"
              value={
                chargeName || ""
              }
              onChange={(event) =>
                setChargeName(
                  event.target
                    .value
                )
              }
              placeholder="例如：8 月課程月費"
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
                chargeCourseId || ""
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
                cursor: "pointer",
                fontWeight: 700,
                padding: 0,
              }}
            >
              {showAddCourse
                ? "✕ 取消新增課程"
                : "＋ 新增課程"}
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
                  placeholder="請輸入新課程名稱"
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
              每人應收金額
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
              placeholder="例如：8 月據點課程月費"
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
              : "建立收費項目"}
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

      {/* ==================== */}
      {/* Charge List */}
      {/* ==================== */}

      <div
        style={sectionCardStyle}
      >
        <h3
          style={{
            marginTop: 0,
            color: colors.primary,
          }}
        >
          📋 收費項目
        </h3>

        {charges.length ===
        0 ? (
          <div
            style={emptyStyle}
          >
            目前尚無收費項目。
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
                  <th
                    style={thStyle}
                  >
                    月份
                  </th>

                  <th
                    style={thStyle}
                  >
                    收費項目
                  </th>

                  <th
                    style={thStyle}
                  >
                    對應課程
                  </th>

                  <th
                    style={thStyle}
                  >
                    每人金額
                  </th>

                  <th
                    style={thStyle}
                  >
                    繳費人數
                  </th>

                  <th
                    style={thStyle}
                  >
                    應收
                  </th>

                  <th
                    style={thStyle}
                  >
                    已收
                  </th>

                  <th
                    style={thStyle}
                  >
                    待收
                  </th>

                  <th
                    style={thStyle}
                  >
                    操作
                  </th>
                </tr>
              </thead>

              <tbody>
                {charges.map(
                  (charge) => {
                    const chargePayerCount =
                      payers.filter(
                        (payer) =>
                          payer.chargeId ===
                          charge.id
                      ).length;

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
                          {
                            charge.name
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {getCourseName(
                            charge.courseId
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
                            chargePayerCount
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
                              getChargeOutstandingAmount(
                                charge.id
                              ) >
                              0
                                ? "#B45309"
                                : colors.primary,
                          }}
                        >
                          {formatCurrency(
                            getChargeOutstandingAmount(
                              charge.id
                            )
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
                              title="查看名單"
                              aria-label="查看名單"
                              onClick={() => {
                                setSelectedChargeId(
                                  charge.id
                                );
                                setShowPaymentForm(
                                  false
                                );
                              }}
                              style={{
                                width: 38,
                                height: 38,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                padding: 0,
                                border:
                                  "1px solid #D1D5DB",
                                borderRadius:
                                  "8px",
                                background:
                                  "#fff",
                                color:
                                  colors.primary,
                                cursor:
                                  "pointer",
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
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="2.5"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              title="產生名單"
                              aria-label="產生名單"
                              onClick={() =>
                                handleGeneratePayerList(
                                  charge
                                )
                              }
                              style={{
                                width: 38,
                                height: 38,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                padding: 0,
                                border:
                                  "1px solid #D1D5DB",
                                borderRadius:
                                  "8px",
                                background:
                                  "#fff",
                                color:
                                  colors.primary,
                                cursor:
                                  "pointer",
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
                                handleEditCharge(
                                  charge
                                )
                              }
                              style={{
                                width: 38,
                                height: 38,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                padding: 0,
                                border:
                                  "1px solid #D1D5DB",
                                borderRadius:
                                  "8px",
                                background:
                                  "#fff",
                                color:
                                  "#374151",
                                cursor:
                                  "pointer",
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
                                handleDeleteCharge(
                                  charge.id
                                )
                              }
                              style={{
                                width: 38,
                                height: 38,
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                padding: 0,
                                border:
                                  "none",
                                borderRadius:
                                  "8px",
                                background:
                                  "#DC2626",
                                color:
                                  "#fff",
                                cursor:
                                  "pointer",
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

      {/* ==================== */}
      {/* Selected Charge */}
      {/* ==================== */}

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
                {
                  selectedCharge.name
                }{" "}
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

          {/* ==================== */}
          {/* Manual Payer */}
          {/* ==================== */}

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
                    "repeat(2, 1fr)",
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

          {/* ==================== */}
          {/* Payment Form */}
          {/* ==================== */}

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
                        "repeat(2, 1fr)",
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
                              ) ||
                                0,
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

                  {paymentPayerId &&
                    selectedCharge && (
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
                      onClick={
                        handleAddPayment
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

          {/* ==================== */}
          {/* Payer Table */}
          {/* ==================== */}

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
                        電話
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        來源
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
                        狀態
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
                                              `${formatDate(
                                                payment.paidAt
                                              )}｜${formatCurrency(
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

          {/* ==================== */}
          {/* Payment History */}
          {/* ==================== */}

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
                      <th
                        style={
                          thStyle
                        }
                      >
                        繳款日期
                      </th>

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
                        本次繳款
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
                                handleDeletePayment(
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

      {/* ==================== */}
      {/* Outstanding List */}
      {/* ==================== */}

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
                    收費項目
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
                        key={
                          `${payer.chargeId}-${payer.id}`
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
                          {
                            charge.name
                          }
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