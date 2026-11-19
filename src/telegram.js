const TELEGRAM_API = (token) =>
  `https://api.telegram.org/bot${token}`;

export async function sendMessage(env, chatId, text, options = {}) {
  const response = await fetch(
    `${TELEGRAM_API(env.TELEGRAM_BOT_TOKEN)}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Telegram API error ${response.status}: ${errorText}`,
    );
  }

  return response.json();
}