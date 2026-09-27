/**
 *
 * @flow
 */

import isCloudflareIp from './cloudflareip';
import logger from '../core/logger';
import { USE_XREALIP } from '../core/config';

function isTrustedProxy(ip: string): boolean {
  if (
    !ip ||
    ip === '::ffff:127.0.0.1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.') ||
    ip.startsWith('192.168.') ||
    isCloudflareIp(ip)
  ) {
    return true;
  }
  return false;
}

export function getHostFromRequest(req): ?string {
  const { headers } = req;
  const host = headers['x-forwarded-host'] || headers.host;
  const proto = headers['x-forwarded-proto'] || 'http';

  return `${proto}://${host}`;
}

export async function getIPFromRequest(req): ?string {
  const { socket, connection, headers } = req;
  const conip = connection ? connection.remoteAddress : socket.remoteAddress;

  if (USE_XREALIP && headers['x-real-ip']) {
    return headers['x-real-ip'];
  }

  // Cloudflare doğrudan IP kontrolü
  if (headers['cf-connecting-ip']) {
    return headers['cf-connecting-ip'];
  }

  // Render ve Genel Reverse Proxy (X-Forwarded-For) kontrolü
  if (headers && headers['x-forwarded-for']) {
    const forwardedFor = headers['x-forwarded-for'];
    const ipList = forwardedFor.split(',').map((str) => str.trim());
    // İstemcinin gerçek IP adresi dizinin ilk elemanıdır
    return ipList[0] || conip;
  }

  return conip;
}

export function getIPv6Subnet(ip: string): string {
  if (ip && ip.includes(':')) {
    const ipv6sub = `${ip.split(':').slice(0, 4).join(':')}:0000:0000:0000:0000`;
    return ipv6sub;
  }
  return ip;
}
