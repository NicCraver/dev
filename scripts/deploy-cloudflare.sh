#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.deploy ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.deploy
  set +a
fi

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in .env.deploy}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID in .env.deploy}"
: "${CF_ROOT_DOMAIN:?Set CF_ROOT_DOMAIN in .env.deploy (e.g. example.com)}"

CF_SUBDOMAIN="${CF_SUBDOMAIN:-mt-dev}"
CF_PAGES_PROJECT="${CF_PAGES_PROJECT:-mt-dev}"
# Strip https:// and trailing slashes from common misconfiguration
CF_ROOT_DOMAIN="${CF_ROOT_DOMAIN#https://}"
CF_ROOT_DOMAIN="${CF_ROOT_DOMAIN#http://}"
CF_ROOT_DOMAIN="${CF_ROOT_DOMAIN%/}"
FULL_DOMAIN="${CF_SUBDOMAIN}.${CF_ROOT_DOMAIN}"

export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

export PATH="${HOME}/.vite-plus/bin:${PATH}"

WRANGLER=(vp exec wrangler)

echo "==> Build"
vp run build

echo "==> Ensure Pages project: ${CF_PAGES_PROJECT}"
if ! "${WRANGLER[@]}" pages project list 2>/dev/null | grep -q "${CF_PAGES_PROJECT}"; then
  "${WRANGLER[@]}" pages project create "${CF_PAGES_PROJECT}" --production-branch=main
fi

echo "==> Deploy dist -> Cloudflare Pages"
DEPLOY_LOG="$(mktemp)"
"${WRANGLER[@]}" pages deploy dist \
  --project-name="${CF_PAGES_PROJECT}" \
  --branch=main \
  --commit-dirty=true 2>&1 | tee "${DEPLOY_LOG}"
DEPLOY_URL="$(grep -oE 'https://[a-f0-9]+\.[^ ]+\.pages\.dev' "${DEPLOY_LOG}" | tail -1 || true)"
rm -f "${DEPLOY_LOG}"
echo "    Preview: ${DEPLOY_URL:-https://${CF_PAGES_PROJECT}.pages.dev}"

echo "==> Custom domain: ${FULL_DOMAIN}"
DOMAIN_EXISTS="$(
  curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains" \
    | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); const n='${FULL_DOMAIN}'; process.stdout.write((j.result||[]).some(d=>d.name===n)?'yes':'')"
)"
if [[ "${DOMAIN_EXISTS}" != "yes" ]]; then
  curl -fsS -X POST \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"name\":\"${FULL_DOMAIN}\"}" \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains" >/dev/null
  echo "    Added Pages custom domain"
else
  echo "    Pages custom domain already configured"
fi

echo "==> DNS (CNAME -> Pages) if zone is in this account"
ZONE_ID="${CF_ZONE_ID:-}"
if [[ -z "${ZONE_ID}" ]]; then
  ZONE_ID="$(
    curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      "https://api.cloudflare.com/client/v4/zones?name=${CF_ROOT_DOMAIN}" \
      | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(j.result?.[0]?.id||'')"
  )"
fi

if [[ -n "${ZONE_ID}" ]]; then
  RECORD_NAME="${CF_SUBDOMAIN}"
  EXISTING="$(
    curl -fsS -G -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      --data-urlencode "name=${FULL_DOMAIN}" \
      --data-urlencode "type=CNAME" \
      "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
      | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.result?.[0]?.id||'')"
  )"
  PAYLOAD="$(node -e "
    console.log(JSON.stringify({
      type: 'CNAME',
      name: '${RECORD_NAME}',
      content: '${CF_PAGES_PROJECT}.pages.dev',
      proxied: true,
      ttl: 1
    }))
  ")"
  if [[ -n "${EXISTING}" ]]; then
    curl -fsS -X PUT \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "${PAYLOAD}" \
      "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${EXISTING}" >/dev/null
    echo "    Updated DNS record ${FULL_DOMAIN}"
  else
    curl -fsS -X POST \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "${PAYLOAD}" \
      "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" >/dev/null
    echo "    Created DNS record ${FULL_DOMAIN} -> ${CF_PAGES_PROJECT}.pages.dev"
  fi
else
  echo "    WARN: Could not resolve zone id; add CNAME ${CF_SUBDOMAIN} -> ${CF_PAGES_PROJECT}.pages.dev manually"
fi

echo ""
echo "Done."
echo "  Production URL: https://${FULL_DOMAIN}"
echo "  Pages project:  ${CF_PAGES_PROJECT}"
