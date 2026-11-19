export async function getSession(env, userId) {
  const result = await env.DB
    .prepare(
      `
      SELECT *
      FROM user_sessions
      WHERE user_id = ?
      `,
    )
    .bind(String(userId))
    .first();

  return result || null;
}

export async function saveSession(
  env,
  {
    userId,
    username,
    step,
    domain = null,
    status = null,
  },
) {
  const now = new Date().toISOString();

  await env.DB
    .prepare(
      `
      INSERT INTO user_sessions
        (user_id, username, step, domain, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET
        username = excluded.username,
        step = excluded.step,
        domain = excluded.domain,
        status = excluded.status,
        updated_at = excluded.updated_at
      `,
    )
    .bind(
      String(userId),
      username || null,
      step,
      domain,
      status,
      now,
    )
    .run();
}

export async function addWatchedDomain(
  env,
  {
    userId,
    username,
    domain,
    status,
  },
) {
  const now = new Date().toISOString();

  await env.DB
    .prepare(
      `
      INSERT INTO watched_domains
        (
          user_id,
          username,
          domain,
          status,
          notified,
          created_at,
          updated_at
        )
      VALUES (?, ?, ?, ?, 0, ?, ?)

      ON CONFLICT(user_id, domain)
      DO UPDATE SET
        username = excluded.username,
        status = excluded.status,
        notified = 0,
        updated_at = excluded.updated_at
      `,
    )
    .bind(
      String(userId),
      username || null,
      domain,
      status,
      now,
      now,
    )
    .run();
}

export async function getAllWatchedDomains(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT *
      FROM watched_domains
      ORDER BY id ASC
      `,
    )
    .all();

  return result.results || [];
}

export async function updateDomainStatus(
  env,
  userId,
  domain,
  status,
) {
  await env.DB
    .prepare(
      `
      UPDATE watched_domains
      SET
        status = ?,
        updated_at = ?
      WHERE user_id = ?
        AND domain = ?
      `,
    )
    .bind(
      status,
      new Date().toISOString(),
      String(userId),
      domain,
    )
    .run();
}