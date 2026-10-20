// Supabase Edge Function — studio-style product photo for a vendor product listing.
// Port of the Base44 backend function `generate_product_image` (same request/response contract):
//   request  { product_name: string, image_url?: string }  ->  response { url: string }
//
// Deploy:  supabase functions deploy generate-product-image
// Secret:  supabase secrets set OPENAI_API_KEY=sk-...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "OPENAI_API_KEY is not set" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const productName = typeof body.product_name === "string" ? body.product_name.slice(0, 200).trim() : "";
    if (!productName) return json({ error: "product_name is required" }, 400);

    const imageUrl =
      typeof body.image_url === "string" && body.image_url.startsWith("https://")
        ? body.image_url.slice(0, 2000)
        : "";

    const prompt =
      `Professional studio product photograph of a ${productName}, placed on a clean white podium with ` +
      `soft even studio lighting, subtle natural shadow, minimalist light grey background, high-end ` +
      `commercial e-commerce product photography, sharp focus, crisp details, centered composition, 4k quality`;

    let apiRes: Response;
    if (imageUrl) {
      const reference = await fetch(imageUrl);
      if (!reference.ok) return json({ error: "Could not read the reference image" }, 400);
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("prompt", prompt);
      form.append("size", "1024x1024");
      form.append("image", new File([await reference.blob()], "reference.png", { type: "image/png" }));
      apiRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      apiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", n: 1 }),
      });
    }

    const payload = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok) return json({ error: payload?.error?.message ?? "Image generation failed" }, 502);

    const first = payload?.data?.[0];
    let bytes: Uint8Array;
    if (first?.b64_json) {
      bytes = Uint8Array.from(atob(first.b64_json), (c) => c.charCodeAt(0));
    } else if (first?.url) {
      const img = await fetch(first.url);
      if (!img.ok) return json({ error: "Could not download the generated image" }, 502);
      bytes = new Uint8Array(await img.arrayBuffer());
    } else {
      return json({ error: "No image returned" }, 502);
    }

    const path = `${user.id}/products/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, bytes, { contentType: "image/png" });
    if (uploadError) return json({ error: uploadError.message }, 500);

    const { data: publicUrl } = supabase.storage.from("media").getPublicUrl(path);
    return json({ url: publicUrl.publicUrl });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});