"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { colors } from "../../styles/theme";
import { radius } from "../../styles/radius";
import { shadow } from "../../styles/shadow";

import { supabase } from "../../utils/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="請輸入密碼"
              autoComplete="current-password"
              disabled={loading}
              style={inputStyle}
            />
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