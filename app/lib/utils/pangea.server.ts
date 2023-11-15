import {
  EmbargoService,
  IPIntelService,
  Intel,
  PangeaConfig,
  URLIntelService,
  UserIntelService,
} from "pangea-node-sdk";
import { env } from "./env.server";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { redirect } from "@remix-run/node";
import { sha256 } from "hash.js";

const pangeaConfig = new PangeaConfig({ domain: env.PANGEA_DOMAIN });

export async function checkIpAddress(request: Request) {
  const ipAddress = getClientIPAddress(request);
  if (!ipAddress) {
    return null;
  }

  const [isEmbargoed, isBadIpAddree] = await Promise.all([
    isFromEmbargoedCountryImpl(ipAddress),
    isReputedIpAddress(ipAddress),
  ]);

  if (isEmbargoed) {
    throw redirect("/embargoed");
  }

  if (isBadIpAddree) {
    throw redirect("/badIpAddress");
  }
}

async function isFromEmbargoedCountryImpl(ipAdress: string) {
  const embargo = new EmbargoService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  const res = await embargo.ipCheck(ipAdress);
  const sanctions = res.result.sanctions;

  return Boolean(sanctions.length);
}

async function isReputedIpAddress(ipAddress: string) {
  const ipIntel = new IPIntelService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  const res = await ipIntel.reputation(ipAddress);
  const score = res.result.data.score;

  return score < 90;
}

export async function isPasswordBreached(password: string) {
  const hash = sha256().update(password).digest("hex");

  return isPasswordBreachedImpl(hash);
}

async function isPasswordBreachedImpl(hash: string) {
  const userIntel = new UserIntelService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  const firstFive = hash.substring(0, 5);

  const res = await userIntel.passwordBreached(
    Intel.HashType.SHA256,
    firstFive,
    {
      provider: "spycloud",
    },
  );
  const isBreached = res.result.data.found_in_breach;

  return isBreached;
}

export async function verifyUrlisGood(url: string) {
  const urlIntel = new URLIntelService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  const res = await urlIntel.reputation(url);

  const isConsideredHarmfull = res.result.data.score > 90;

  return !isConsideredHarmfull;
}
