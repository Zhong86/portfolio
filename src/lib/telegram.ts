export async function sendTelegramMessage(text: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return "Telegram is not configured on the server.";
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Telegram send failed:", res.status, errBody);
      return "Failed to deliver the message to Billy.";
    }
    return "Message delivered to Billy.";
  } catch (err) {
    console.error("Telegram send error:", err);
    return "Failed to deliver the message to Billy.";
  }
}

function errorResponse(message: string) {
  return new Response(message, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

