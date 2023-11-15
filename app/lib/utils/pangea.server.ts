import {
  AuditService,
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
import { LRUCache } from "lru-cache";
import { cachified, CacheEntry } from "cachified";
import * as hash from "hash.js";

const sha256 = hash.sha256;

export const lruCache = new LRUCache<string, CacheEntry>({ max: 10000 });

const pangeaConfig = new PangeaConfig({ domain: env.PANGEA_DOMAIN });

export async function checkIpAddress(request: Request) {
  const ipAddress = getClientIPAddress(request);
  if (!ipAddress) {
    return null;
  }

  const [isEmbargoed, isGoodIpAddree] = await Promise.all([
    isFromEmbargoedCountryImpl(ipAddress),
    isReputedIpAddress(ipAddress),
  ]);

  if (isEmbargoed) {
    throw redirect("/embargoed");
  }

  if (!isGoodIpAddree) {
    throw redirect("/badIpAddress");
  }
}

async function isFromEmbargoedCountryImpl(ipAdress: string) {
  return cachified({
    key: `embargo-${ipAdress}`,
    cache: lruCache,
    async getFreshValue() {
      const embargo = new EmbargoService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
      const res = await embargo.ipCheck(ipAdress);
      const sanctions = res.result.sanctions;

      return Boolean(sanctions.length);
    },
  });
}

async function isReputedIpAddress(ipAddress: string) {
  return cachified({
    key: `ipaddress-reputation-${ipAddress}`,
    cache: lruCache,
    async getFreshValue() {
      const ipIntel = new IPIntelService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
      const res = await ipIntel.reputation(ipAddress);
      const score = res.result.data.score;

      return score < 90;
    },
  });
}

export async function isPasswordBreached(password: string) {
  return false;
  const hash = sha256().update(password).digest("hex");

  return isPasswordBreachedImpl(hash);
}

async function isPasswordBreachedImpl(hash: string) {
  return cachified({
    key: `password-breach-${hash}`,
    cache: lruCache,
    async getFreshValue() {
      const userIntel = new UserIntelService(
        env.PANGEA_AUTHN_TOKEN,
        pangeaConfig,
      );
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
    },
  });
}

export async function verifyUrlisGood(url: string) {
  return cachified({
    key: `url-reputation-${url}`,
    cache: lruCache,
    async getFreshValue() {
      const urlIntel = new URLIntelService(
        env.PANGEA_AUTHN_TOKEN,
        pangeaConfig,
      );
      const res = await urlIntel.reputation(url);

      const isConsideredHarmfull = res.result.data.score > 90;

      return !isConsideredHarmfull;
    },
  });
}

export async function storeBuyingCredit({
  userId,
  newCredit,
  oldCredit,
}: {
  userId: string;
  oldCredit: number;
  newCredit: number;
}) {
  const auditLog = new AuditService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  await auditLog.log({
    action: "buy_credit",
    actor: userId,
    target: "credits",
    old: oldCredit.toString(),
    new: newCredit.toString(),
    message: "User brought credits",
    timestamp: new Date().toISOString(),
  });
}

export async function storeWithdrawingCredit({
  newCredit,
  oldCredit,
  userId,
}: {
  userId: string;
  oldCredit: number;
  newCredit: number;
}) {
  const auditLog = new AuditService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  await auditLog.log({
    action: "buy_credit",
    actor: userId,
    target: "credits",
    old: oldCredit.toString(),
    new: newCredit.toString(),
    message: "User withdrawed credits",
    timestamp: new Date().toISOString(),
  });
}

export async function storeRewardingCredit({
  newCredit,
  oldCredit,
  userId,
}: {
  userId: string;
  oldCredit: number;
  newCredit: number;
}) {
  const auditLog = new AuditService(env.PANGEA_AUTHN_TOKEN, pangeaConfig);
  await auditLog.log({
    action: "buy_credit",
    actor: userId,
    target: "credits",
    old: oldCredit.toString(),
    new: newCredit.toString(),
    message: "User was rewarded with credits",
    timestamp: new Date().toISOString(),
  });
}
