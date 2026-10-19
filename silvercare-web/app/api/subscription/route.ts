
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "請先登入。",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "登入驗證資訊無效。",
        },
        { status: 401 }
      );
    }

    const supabase =
      createSupabaseServerClient(accessToken);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "登入已失效，請重新登入。",
        },
        { status: 401 }
      );
    }

    const {
      data: roles,
      error: rolesError,
    } = await supabase
      .from("user_roles")
      .select("role, location_id")
      .eq("user_id", userData.user.id);

    if (rolesError) {
      console.error(
        "Subscription role lookup failed:",
        rolesError
      );

      return NextResponse.json(
        {
          success: false,
          error: "目前無法確認帳號權限。",
        },
        { status: 500 }
      );
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "此帳號尚未設定據點權限。",
        },
        { status: 403 }
      );
    }

    const isSupervisor = roles.some(
      (item) => item.role === "supervisor"
    );

    const allowedLocationIds = [
      ...new Set(
        roles
          .filter((item) => item.location_id !== null)
          .map((item) => item.location_id)
      ),
    ];

    if (!isSupervisor && allowedLocationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "此帳號尚未設定據點權限。",
        },
        { status: 403 }
      );
    }

    const {
      data: plans,
      error: plansError,
    } = await supabase
      .from("subscription_plans")
      .select(
        "id, plan_code, plan_name, plan_type, billing_interval, price, credits_per_unit"
      )
      .eq("is_active", true);

    if (plansError) {
      console.error(
        "Subscription plan lookup failed:",
        plansError
      );

      return NextResponse.json(
        {
          success: false,
          error: "目前無法讀取訂閱方案。",
        },
        { status: 500 }
      );
    }

    let subscriptions:
      {
        id: number;
        location_id: number;
        plan_id: number;
        quantity: number;
        status: string;
        current_period_start: string | null;
        current_period_end: string | null;
      }[] = [];

    if (isSupervisor || allowedLocationIds.length > 0) {
      let subscriptionQuery = supabase
        .from("location_subscriptions")
        .select(
          "id, location_id, plan_id, quantity, status, current_period_start, current_period_end"
        )
        .eq("status", "active");

      if (!isSupervisor) {
        subscriptionQuery = subscriptionQuery.in(
          "location_id",
          allowedLocationIds
        );
      }

      const {
        data: subscriptionData,
        error: subscriptionsError,
      } = await subscriptionQuery;

      if (subscriptionsError) {
        console.error(
          "Subscription lookup failed:",
          subscriptionsError
        );

        return NextResponse.json(
          {
            success: false,
            error: "目前無法讀取據點訂閱資料。",
          },
          { status: 500 }
        );
      }

      subscriptions = subscriptionData ?? [];
    }

    const now = new Date();

    const activeSubscriptions = subscriptions.filter(
      (subscription) => {
        const startsAt = subscription.current_period_start
          ? new Date(subscription.current_period_start)
          : null;

        const endsAt = subscription.current_period_end
          ? new Date(subscription.current_period_end)
          : null;

        return (
          (!startsAt || startsAt <= now) &&
          (!endsAt || endsAt > now)
        );
      }
    );

    const planById = new Map(
      (plans ?? []).map((plan) => [plan.id, plan])
    );

    const enrichedSubscriptions =
      activeSubscriptions.map((subscription) => ({
        ...subscription,
        plan: planById.get(subscription.plan_id) ?? null,
      }));

    const locationIds = [
      ...new Set(
        enrichedSubscriptions.map(
          (subscription) => subscription.location_id
        )
      ),
    ];

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    let usageRows: {
      location_id: number;
      credits_used: number;
    }[] = [];

    if (locationIds.length > 0) {
      const {
        data: usage,
        error: usageError,
      } = await supabase
        .from("subscription_usage")
        .select("location_id, credits_used")
        .in("location_id", locationIds)
        .eq("status", "success")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", nextMonthStart.toISOString());

      if (usageError) {
        console.error(
          "Subscription usage lookup failed:",
          usageError
        );

        return NextResponse.json(
          {
            success: false,
            error: "目前無法讀取 AI/OCR 使用紀錄。",
          },
          { status: 500 }
        );
      }

      usageRows = usage ?? [];
    }

    const locationSummaries = locationIds.map(
      (locationId) => {
        const siteSubscriptions =
          enrichedSubscriptions.filter(
            (subscription) =>
              subscription.location_id === locationId
          );

        const hasBasicSubscription =
          siteSubscriptions.some(
            (subscription) =>
              subscription.plan?.plan_type === "basic"
          );

        const ocrSubscriptions =
          siteSubscriptions.filter(
            (subscription) =>
              subscription.plan?.plan_type === "ai_ocr"
          );

        const ocrCreditsLimit =
          ocrSubscriptions.reduce(
            (total, subscription) =>
              total +
              Number(
                subscription.plan?.credits_per_unit ?? 0
              ) *
                Number(subscription.quantity ?? 1),
            0
          );

        const ocrCreditsUsed =
          usageRows
            .filter(
              (usage) =>
                usage.location_id === locationId
            )
            .reduce(
              (total, usage) =>
                total + Number(usage.credits_used ?? 0),
              0
            );

        return {
          location_id: locationId,
          hasBasicSubscription,
          hasAiOcrSubscription:
            ocrSubscriptions.length > 0,
          ocrCreditsLimit,
          ocrCreditsUsed,
          ocrCreditsRemaining: Math.max(
            0,
            ocrCreditsLimit - ocrCreditsUsed
          ),
          subscriptions: siteSubscriptions,
        };
      }
    );

    return NextResponse.json({
      success: true,
      roles,
      plans: plans ?? [],
      locations: locationSummaries,
      usagePeriod: {
        start: monthStart.toISOString(),
        end: nextMonthStart.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Subscription status API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "目前無法讀取訂閱狀態，請稍後再試。",
      },
      { status: 500 }
    );
  }
}
