import {
  getSession,
  saveSession,
  addWatchedDomain,
} from "./database.js";

import { checkDomain } from "./domainChecker.js";

import { sendMessage } from "./telegram.js";

import { checkWatchedDomains } from "./watcher.js";

const DOMAIN_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

function normalizeDomain(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(domain) {
  return DOMAIN_REGEX.test(domain);
}

function domainKeyboard() {
  return {
    keyboard: [
      [
        { text: "🔔 Notify Me" },
        { text: "🔄 Change Domain" },
      ],
    ],
    resize_keyboard: true,
  };
}

async function handleStart(env, message) {
  const userId = message.from.id;

  await saveSession(env, {
    userId,
    username: message.from.username || null,
    step: "waiting_for_domain",
  });

  await sendMessage(
    env,
    userId,
    `👋 Welcome to Domain Notifier!

🌐 This bot helps you monitor domain names.

Enter any domain and I'll check whether it is currently available.

If the domain is unavailable, you can choose to receive a notification when it becomes available.

Let's get started!

🌐 Enter your domain:`,
  );
}

async function handleChangeDomain(env, message) {
  const userId = message.from.id;

  await saveSession(env, {
    userId,
    username: message.from.username || null,
    step: "waiting_for_domain",
  });

  await sendMessage(
    env,
    userId,
    `🔄 Sure!

🌐 Enter another domain:`,
    {
      reply_markup: {
        remove_keyboard: true,
      },
    },
  );
}

async function handleNotifyMe(env, message) {
  const userId = message.from.id;

  const session = await getSession(env, userId);

  if (!session || !session.domain) {
    await sendMessage(
      env,
      userId,
      `❌ No domain selected.

Please use /start and enter a domain.`,
    );

    return;
  }

  if (session.status === "available") {
    await sendMessage(
      env,
      userId,
      `🎉 ${session.domain} is already available!

You don't need a notification for this domain.

What would you like to do?`,
      {
        reply_markup: domainKeyboard(),
      },
    );

    return;
  }

  await addWatchedDomain(env, {
    userId,
    username: message.from.username || null,
    domain: session.domain,
    status: "registered",
  });

  await saveSession(env, {
    userId,
    username: message.from.username || null,
    step: "watching",
    domain: session.domain,
    status: "registered",
  });

  await sendMessage(
    env,
    userId,
    `🔔 Notification enabled!

🌐 Domain:
${session.domain}

I'll monitor this domain and notify you when it becomes available.`,
    {
      reply_markup: {
        remove_keyboard: true,
      },
    },
  );
}

async function handleDomainInput(env, message) {
  const userId = message.from.id;

  const session = await getSession(env, userId);

  if (!session || session.step !== "waiting_for_domain") {
    await sendMessage(
      env,
      userId,
      `🌐 Please use /start to begin.`,
    );

    return;
  }

  const text = message.text.trim();
  const domain = normalizeDomain(text);

  if (!isValidDomain(domain)) {
    await sendMessage(
      env,
      userId,
      `❌ Invalid domain.

Please enter a valid domain.

Example:

amanraidas.dev`,
    );

    return;
  }

  await sendMessage(
    env,
    userId,
    `🔎 Checking:

🌐 ${domain}

⏳ Please wait...`,
  );

  const result = await checkDomain(domain);

  console.log("🔎 Domain result:", result);

  if (
    result.status === "error" ||
    result.status === "unknown"
  ) {
    await sendMessage(
      env,
      userId,
      `⚠️ I couldn't check this domain right now.

Please try again later.`,
    );

    return;
  }

  if (result.available === true) {
    await saveSession(env, {
      userId,
      username: message.from.username || null,
      step: "domain_checked",
      domain,
      status: "available",
    });

    await sendMessage(
      env,
      userId,
      `🎉 Good news!

🌐 ${domain}

The domain appears to be AVAILABLE.

What would you like to do?`,
      {
        reply_markup: domainKeyboard(),
      },
    );

    return;
  }

  await saveSession(env, {
    userId,
    username: message.from.username || null,
    step: "domain_checked",
    domain,
    status: "registered",
  });

  await sendMessage(
    env,
    userId,
    `❌ Domain unavailable.

🌐 ${domain}

This domain is currently registered.

What would you like to do?`,
    {
      reply_markup: domainKeyboard(),
    },
  );
}

async function handleTelegramUpdate(env, update) {
  const message = update.message;

  if (!message || !message.text) {
    return;
  }

  const text = message.text.trim();

  if (text === "/start") {
    await handleStart(env, message);
    return;
  }

  if (text === "🔔 Notify Me") {
    await handleNotifyMe(env, message);
    return;
  }

  if (text === "🔄 Change Domain") {
    await handleChangeDomain(env, message);
    return;
  }

  await handleDomainInput(env, message);
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response(
        "Domain Notifier Worker is running!",
        {
          status: 200,
        },
      );
    }

    try {
      const update = await request.json();

      await handleTelegramUpdate(env, update);

      return new Response("OK");
    } catch (error) {
      console.error("❌ Telegram webhook error:", error);

      return new Response("Internal Server Error", {
        status: 500,
      });
    }
  },

  async scheduled(controller, env) {
    console.log("⏰ Cron triggered!");
    console.log(
      "🕐 Scheduled time:",
      new Date(controller.scheduledTime).toISOString(),
    );
    console.log("📅 Cron:", controller.cron);

    await checkWatchedDomains(env);
  },
};