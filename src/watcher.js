import { checkDomain } from "./domainChecker.js";
import {
  getAllWatchedDomains,
  updateDomainStatus,
} from "./database.js";
import { sendMessage } from "./telegram.js";

export async function checkWatchedDomains(env) {
  console.log("🔎 Checking watched domains...");

  const domains = await getAllWatchedDomains(env);

  if (domains.length === 0) {
    console.log("📭 No watched domains.");
    return;
  }

  for (const watched of domains) {
    console.log(`🌐 Checking ${watched.domain}`);

    const result = await checkDomain(watched.domain);

    console.log(
      `${watched.domain}: ${result.status}`,
    );

    if (
      result.status !== "available" &&
      result.status !== "registered"
    ) {
      console.error(
        `⚠️ Could not determine status for ${watched.domain}: ${result.error}`,
      );

      continue;
    }

    const previousStatus = watched.status;

    if (result.status === "available") {
      if (previousStatus === "registered") {
        await sendMessage(
          env,
          watched.user_id,
          `🎉 GOOD NEWS!

🌐 ${watched.domain}

✅ AVAILABLE!

This domain is now available.

You can register it before someone else does.`,
        );
      } else {
        await sendMessage(
          env,
          watched.user_id,
          `🔎 Domain Availability Check

🌐 ${watched.domain}

✅ AVAILABLE!

This domain is currently available.`,
        );
      }

      await updateDomainStatus(
        env,
        watched.user_id,
        watched.domain,
        "available",
      );

      continue;
    }

    // Domain is registered
    await sendMessage(
      env,
      watched.user_id,
      `🔎 Domain Availability Check

🌐 ${watched.domain}

❌ NOT AVAILABLE

This domain is currently registered.`,
    );

    if (previousStatus !== "registered") {
      await updateDomainStatus(
        env,
        watched.user_id,
        watched.domain,
        "registered",
      );
    }
  }

  console.log("✅ Domain check completed.");
}