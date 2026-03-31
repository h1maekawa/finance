/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-id",
};

interface GmailToken {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. ユーザー特定 (X-User-Id または Auth Header)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    const xUserId = req.headers.get("x-user-id");

    if (xUserId && authHeader === `Bearer ${supabaseServiceKey}`) {
      // Cron / Service Role からの呼び出し
      userId = xUserId;
    } else if (authHeader) {
      // Supabase Auth JWT からユーザーを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. トークン情報の取得
    const { data: tokenData, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Gmail token not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let { access_token, refresh_token, expires_at } = tokenData as GmailToken;

    // 3. 必要に応じてトークンをリフレッシュ
    const isExpired = new Date(expires_at).getTime() < Date.now() + 60000; // 1分前にリフレッシュ
    if (isExpired && refresh_token) {
      console.log("Refreshing Google access token for user:", userId);
      try {
        const refreshed = await refreshGoogleToken(refresh_token);
        access_token = refreshed.access_token;
        expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

        // 新しいトークンを保存
        await supabase.from("gmail_tokens").update({
          access_token,
          expires_at,
        }).eq("user_id", userId);
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
        return new Response(JSON.stringify({ error: "Failed to refresh Gmail access" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. Gmail APIでメール取得 (直近7日間)
    const query = [
      "from:statement@vpass.ne.jp subject:ご利用のお知らせ【三井住友カード】",
      "from:info@mail.rakuten-card.co.jp subject:カード利用のお知らせ(本人ご利用分)",
    ].join(" OR ") + " newer_than:7d";

    const fetchMessages = async (q: string) => {
      const res = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      return res.json();
    };

    const messagesRes = await fetchMessages(query);
    if (!messagesRes.messages) {
      return new Response(JSON.stringify({ count: 0, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. 各メールの解析と登録
    const results = [];
    for (const msg of messagesRes.messages) {
      const detailRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const detail = await detailRes.json();
      
      const { data: existingLog } = await supabase
        .from("email_import_logs")
        .select("id")
        .eq("gmail_message_id", msg.id)
        .maybeSingle();

      if (existingLog) continue;

      let body = "";
      if (detail.payload.parts) {
        body = detail.payload.parts
          .map((p: any) => (p.body.data ? atob(p.body.data.replace(/-/g, "+").replace(/_/g, "/")) : ""))
          .join("");
      } else if (detail.payload.body.data) {
        body = atob(detail.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      }

      const subject = detail.payload.headers.find((h: any) => h.name === "Subject")?.value || "";
      let parsed: { date: string, amount: number, merchant: string, card: string } | null = null;

      if (subject.includes("三井住友カード")) {
        const dateMatch = body.match(/([0-9]{4})\/([0-9]{2})\/([0-9]{2})/);
        const merchantAmountMatch = body.match(/(.+?)（.+?）[\t　 ]*([0-9,]+)円/);
        if (dateMatch && merchantAmountMatch) {
          parsed = {
            date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
            merchant: merchantAmountMatch[1].trim(),
            amount: parseInt(merchantAmountMatch[2].replace(/,/g, ""), 10),
            card: "三井住友カード"
          };
        }
      } else if (subject.includes("楽天カード")) {
        const dateMatch = body.match(/([0-9]{4})年([0-9]{2})月([0-9]{2})日/);
        const merchantMatch = body.match(/ご利用店名[：:]\s*(.+)/);
        const amountMatch = body.match(/ご利用金額[：:]\s*([0-9,]+)円/);
        if (dateMatch && merchantMatch && amountMatch) {
          parsed = {
            date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
            merchant: merchantMatch[1].trim(),
            amount: parseInt(amountMatch[1].replace(/,/g, ""), 10),
            card: "楽天カード"
          };
        }
      }

      if (parsed) {
        const categoryMapping: Record<string, string[]> = {
          "食費": ["スーパー", "コンビニ", "マクドナルド", "すき家", "セブン", "ファミマ", "ローソン"],
          "交通費": ["電車", "バス", "タクシー", "SUICA"],
          "買物": ["Amazon", "楽天", "ユニクロ"],
        };

        let categoryName = "日用品";
        for (const [cat, keywords] of Object.entries(categoryMapping)) {
          if (keywords.some(k => parsed!.merchant.includes(k))) {
            categoryName = cat;
            break;
          }
        }

        const { data: memberData } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", userId)
          .single();

        if (memberData) {
          const householdId = memberData.household_id;
          const { data: catData } = await supabase
            .from("categories")
            .select("id")
            .eq("household_id", householdId)
            .eq("name", categoryName)
            .maybeSingle();
          
          const categoryId = catData?.id || (await supabase.from("categories").select("id").eq("household_id", householdId).eq("name", "日用品").single()).data?.id;

          const { data: cardData } = await supabase
            .from("credit_cards")
            .select("id")
            .eq("household_id", householdId)
            .ilike("card_name", `%${parsed.card}%`)
            .maybeSingle();

          const { data: transData, error: transError } = await supabase
            .from("transactions")
            .insert({
              household_id: householdId,
              user_id: userId,
              category_id: categoryId,
              kind: "expense",
              amount: parsed.amount,
              transaction_date: parsed.date,
              note: `[Gmail取込] ${parsed.merchant}`,
              credit_card_id: cardData?.id || null
            })
            .select().single();

          if (!transError) {
            await supabase.from("email_import_logs").insert({
              household_id: householdId,
              user_id: userId,
              gmail_message_id: msg.id,
              card_type: parsed.card.includes("楽天") ? "rakuten" : "smbc",
              transaction_date: parsed.date,
              store_name: parsed.merchant,
              amount: parsed.amount,
              category_id: categoryId,
              credit_card_id: cardData?.id || null,
              transaction_id: transData.id,
              status: "imported"
            });
            results.push({ id: msg.id, status: "success", merchant: parsed.merchant });
          }
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Function execution failed:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
