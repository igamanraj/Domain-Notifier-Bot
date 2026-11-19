const IANA_RDAP_URL =
  "https://data.iana.org/rdap/dns.json";

let rdapBootstrap = null;

async function loadRdapBootstrap() {
  if (rdapBootstrap) {
    return rdapBootstrap;
  }

  const response = await fetch(IANA_RDAP_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load IANA RDAP bootstrap: HTTP ${response.status}`,
    );
  }

  rdapBootstrap = await response.json();

  return rdapBootstrap;
}

async function getRdapServer(domain) {
  const bootstrap = await loadRdapBootstrap();

  const tld = domain
    .split(".")
    .pop()
    .toLowerCase();

  for (const service of bootstrap.services) {
    const tlds = service[0];
    const servers = service[1];

    if (tlds.includes(tld)) {
      return servers[0];
    }
  }

  return null;
}

export async function checkDomain(domain) {
  try {
    const rdapServer = await getRdapServer(domain);

    if (!rdapServer) {
      return {
        domain,
        available: null,
        status: "unknown",
        error: `No RDAP server found for .${domain
          .split(".")
          .pop()}`,
      };
    }

    const response = await fetch(
      `${rdapServer}domain/${encodeURIComponent(domain)}`,
    );

    if (response.status === 404) {
      return {
        domain,
        available: true,
        status: "available",
      };
    }

    if (response.ok) {
      return {
        domain,
        available: false,
        status: "registered",
      };
    }

    return {
      domain,
      available: null,
      status: "unknown",
      error: `RDAP returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      domain,
      available: null,
      status: "error",
      error: error.message,
    };
  }
}