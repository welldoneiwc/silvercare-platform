"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { colors } from "../../styles/theme";
import { radius } from "../../styles/radius";
import { shadow } from "../../styles/shadow";

import { supabase } from "../../utils/supabase";

const LAST_LOGIN_EMAIL_KEY =
  "silvercare-last-login-email";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /**
   * 讀取目前登入狀態
   * 如果已經登入，直接回管理端首頁。
   *
   * 同時讀取這台裝置上次使用的 Email。
   */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const savedEmail =
          localStorage.getItem(
            LAST_LOGIN_EMAIL_KEY
          );

        if (
          savedEmail &&
          mounted
        ) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.error(
          "讀取上次登入 Email 失敗：",
          error
        );
      }

      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "檢查登入狀態失敗：",
            error
          );

          if (mounted) {
            setCheckingSession(false);
          }

          return;
        }

        if (
          data.session &&
          mounted
        ) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error(
          "檢查登入狀態發生錯誤：",
          error
        );
      }

      if (mounted) {
        setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    const trimmedEmail =
      email.trim();

    if (!trimmedEmail) {
      setErrorMessage(
        "請輸入 Email。"
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "請輸入密碼。"
      );
      return;
    }

    setLoading(true);

    try {
      const {
        error,
      } = await supabase.auth.signInWithPassword(
        {
          email: trimmedEmail,
          password,
        }
      );

      if (error) {
        console.error(
          "登入失敗：",
          error
        );

        setErrorMessage(
          "Email 或密碼錯誤，請確認後再試。"
        );

        return;
      }

      /*
       * 只記住 Email。
       *
       * 不儲存密碼。
       */
      try {
        localStorage.setItem(
          LAST_LOGIN_EMAIL_KEY,
          trimmedEmail
        );
      } catch (error) {
        console.error(
          "儲存登入 Email 失敗：",
          error
        );
      }

      setPassword("");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "登入發生錯誤：",
        error
      );

      setErrorMessage(
        "登入發生錯誤，請稍後再試。"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            colors.background,
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          padding: 24,
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "#fff",
            borderRadius:
              radius.lg,
            boxShadow:
              shadow.md,
            padding: 32,
            boxSizing:
              "border-box",
            textAlign:
              "center",
            color:
              "#6B7280",
          }}
        >
          正在確認登入狀態...
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          colors.background,
        display: "flex",
        justifyContent:
          "center",
        alignItems: "center",
        padding: 24,
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius:
            radius.lg,
          boxShadow:
            shadow.md,
          padding: 32,
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <h1
            style={{
              margin: 0,
              color:
                colors.primary,
              fontSize: 30,
            }}
          >
            SilverCare
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color:
                "#6B7280",
              lineHeight: 1.7,
            }}
          >
            智慧據點管理平台
            <br />
            管理者登入
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              background:
                "#FEF2F2",
              borderRadius:
                radius.md,
              color:
                "#B91C1C",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            style={{
              marginBottom: 18,
            }}
          >
            <label
              htmlFor="email"
              style={labelStyle}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="請輸入登入 Email"
              autoComplete="email"
              disabled={loading}
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <label
              htmlFor="password"
              style={labelStyle}
            >
              密碼
            </label>

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="請輸入密碼"
                autoComplete="current-password"
                disabled={loading}
                style={{
                  ...inputStyle,
                  paddingRight: 50,
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "隱藏密碼"
                    : "顯示密碼"
                }
                title={
                  showPassword
                    ? "隱藏密碼"
                    : "顯示密碼"
                }
                style={{
                  position:
                    "absolute",
                  top: "50%",
                  right: 7,
                  transform:
                    "translateY(-50%)",
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "#6B7280",
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                  padding: 0,
                  borderRadius:
                    radius.sm,
                  fontFamily:
                    "Arial, 'Noto Sans TC', 'Noto Sans', sans-serif",
                }}
              >
                {showPassword
                  ? "◉"
                  : "◎"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background:
                colors.primary,
              color: "#fff",
              border: "none",
              borderRadius:
                radius.md,
              padding:
                "13px 20px",
              fontSize: 16,
              fontWeight: 700,
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading ? 0.6 : 1,
            }}
          >
            {loading
              ? "登入中..."
              : "登入"}
          </button>
        </form>

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop:
              "1px solid #E5E7EB",
            textAlign: "center",
            color:
              "#9CA3AF",
            fontSize: 12,
          }}
        >
          SilverCare
          智慧據點管理平台
        </div>
      </div>
    </main>
  );
}

const labelStyle:
  React.CSSProperties = {
    display: "block",
    marginBottom: 7,
    fontWeight: 600,
    color: "#374151",
  };

const inputStyle:
  React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border:
      "1px solid #D1D5DB",
    borderRadius:
      radius.md,
    boxSizing:
      "border-box",
    fontSize: 16,
    outline: "none",
    background: "#fff",
  };
