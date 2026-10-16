
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

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error(
      "Subscription status API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "目前無法確認登入與據點權限。",
      },
      { status: 500 }
    );
  }
}
