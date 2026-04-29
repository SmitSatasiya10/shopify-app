import { authenticate } from "../shopify.server";

export const action = async ({ request }: any) => {
  await authenticate.admin(request);

  const { productName } = await request.json();

  const hfToken = process.env.HUGGING_FACE_TOKEN;

  const fallback = {
    suggestion: `Premium ${productName} - crafted for quality.`,
  };

  if (!hfToken) return new Response(JSON.stringify(fallback));

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Write a short catchy product description (max 12 words): ${productName}`,
        }),
      }
    );

    const text = await response.text(); // ALWAYS read as text first

    let data: any;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("⚠️ HF returned non-JSON:", text.slice(0, 200));
      return new Response(JSON.stringify(fallback));
    }

    const suggestion =
      data?.[0]?.generated_text || fallback.suggestion;

    return new Response(JSON.stringify({ suggestion }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("❌ HF crash:", err);
    return new Response(JSON.stringify(fallback));
  }
};