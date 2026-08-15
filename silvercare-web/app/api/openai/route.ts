import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const image = body.image;

    if (
      typeof image !== "string" ||
      !image.startsWith("data:image/")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "請提供有效的量測照片。",
        },
        {
          status: 400,
        }
      );
    }

    const supportedImagePattern =
      /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;

    if (
      !supportedImagePattern.test(image)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "目前只支援 JPG、PNG、WEBP 或 GIF 圖片。請重新拍照或上傳。",
        },
        {
          status: 400,
        }
      );
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "你是 SilverCare 的健康量測照片辨識助手。只辨識照片中清楚可見的數值，不猜測、不補值，也不提供醫療診斷。",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
請辨識這張健康量測設備照片。

只辨識照片中清楚可見的數值。

請回傳 JSON：

{
  "systolic": number | null,
  "diastolic": number | null,
  "pulse": number | null,
  "height": number | null,
  "weight": number | null
}

欄位說明：
- systolic：收縮壓，單位 mmHg
- diastolic：舒張壓，單位 mmHg
- pulse：脈搏，單位 bpm
- height：身高，單位 cm
- weight：體重，單位 kg

如果照片沒有清楚顯示某個數值，請填 null。

不要猜測。
不要提供醫療診斷。
只回傳 JSON。
                `.trim(),
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                  detail: "high",
                },
              },
            ],
          },
        ],
      });

    const result =
      completion.choices[0]
        ?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "OpenAI Vision API Error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "";

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage ||
          "AI 辨識失敗，請稍後再試。",
      },
      {
        status: 500,
      }
    );
  }
}