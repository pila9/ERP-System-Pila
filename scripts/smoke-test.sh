#!/usr/bin/env bash
# End-to-end smoke test of the ERP API. Run after `make up`.
#
#   ./scripts/smoke-test.sh [BASE_URL]
#
# Exercises: login -> dashboard -> catalogue CRUD -> sales order lifecycle
# (create/confirm/ship/invoice/pay) -> purchase order + goods receipt -> reports.

set -euo pipefail

BASE="${1:-http://localhost:8080}/api"
PASS="password"
FAILURES=0
TOKEN=""

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red() { printf '\033[31m%s\033[0m\n' "$1"; }

section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# call <method> <path> [json_body] -> body on stdout
call() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" "$BASE$path" -H 'Accept: application/json')
  [ -n "$TOKEN" ] && args+=(-H "Authorization: Bearer $TOKEN")
  if [ -n "$body" ]; then
    args+=(-H 'Content-Type: application/json' -d "$body")
  fi
  curl "${args[@]}"
}

# expect <label> <json> <jq-ish python expression using variable `d`>
expect() {
  local label="$1" json="$2" expr="$3"
  if JSON="$json" python3 -c "
import json, os, sys
d = json.loads(os.environ['JSON']) if os.environ['JSON'].strip() else {}
sys.exit(0 if bool($expr) else 1)
" 2>/dev/null; then
    green "  PASS  $label"
  else
    red   "  FAIL  $label"
    echo "        -> $(echo "$json" | head -c 400)"
    FAILURES=$((FAILURES + 1))
  fi
}

section "1. Authentication"
LOGIN=$(call POST /auth/login "{\"email\":\"admin@erp.test\",\"password\":\"$PASS\"}")
expect "admin can sign in" "$LOGIN" "'token' in d and d['user']['role']['slug'] == 'admin'"
TOKEN=$(echo "$LOGIN" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))')
[ -n "$TOKEN" ] || { red "could not obtain a token - is the stack running?"; exit 1; }

BAD=$(call POST /auth/login "{\"email\":\"admin@erp.test\",\"password\":\"wrong\"}")
expect "wrong password is rejected" "$BAD" "'message' in d"

ME=$(call GET /auth/me)
expect "GET /auth/me returns the profile" "$ME" "d['data']['email'] == 'admin@erp.test'"

section "2. Dashboard"
DASH=$(call GET /dashboard)
expect "dashboard KPIs present" "$DASH" "'sales_total' in d['data']['kpis']"
expect "dashboard has a sales trend" "$DASH" "len(d['data']['sales_trend']) == 6"

section "3. Catalogue"
CATS=$(call GET "/categories?per_page=100")
expect "categories are seeded" "$CATS" "len(d['data']) >= 5"

CAT_ID=$(echo "$CATS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"][0]["id"])')

NEW_PRODUCT=$(call POST /products "{\"name\":\"Smoke Test Widget\",\"category_id\":$CAT_ID,\"cost_price\":10,\"sale_price\":25,\"tax_rate\":10,\"reorder_level\":5,\"track_inventory\":true,\"opening_quantity\":100}")
expect "product created" "$NEW_PRODUCT" "'id' in d['data']"
PRODUCT_ID=$(echo "$NEW_PRODUCT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
expect "opening stock was applied" "$NEW_PRODUCT" "d['data']['total_stock'] == 100"

UPDATED=$(call PUT "/products/$PRODUCT_ID" '{"name":"Smoke Test Widget v2","sale_price":30}')
expect "product updated" "$UPDATED" "d['data']['name'].endswith('v2')"

WAREHOUSES=$(call GET "/warehouses?per_page=100")
# opening stock always lands in the default warehouse, so pin the test to it
WAREHOUSE_ID=$(echo "$WAREHOUSES" | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print(next((w["id"] for w in d if w.get("is_default")), d[0]["id"]))')

section "4. Inventory"
LEVELS=$(call GET "/stock/levels?product_id=$PRODUCT_ID")
expect "stock level exists for the new product" "$LEVELS" "len(d['data']) == 1"

ADJ=$(call POST /stock/adjustments "{\"product_id\":$PRODUCT_ID,\"warehouse_id\":$WAREHOUSE_ID,\"quantity\":80,\"note\":\"smoke test\"}")
expect "stock adjustment applied" "$ADJ" "'id' in d['data']"

CHECK=$(call GET "/stock/levels?product_id=$PRODUCT_ID")
expect "adjustment changed the balance to 80" "$CHECK" "abs(d['data'][0]['quantity'] - 80) < 0.001"

W2=$(echo "$WAREHOUSES" | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print(next((w["id"] for w in d if w["id"] != '"$WAREHOUSE_ID"'), '"$WAREHOUSE_ID"'))')
if [ "$W2" != "$WAREHOUSE_ID" ]; then
  TR=$(call POST /stock/transfers "{\"product_id\":$PRODUCT_ID,\"from_warehouse_id\":$WAREHOUSE_ID,\"to_warehouse_id\":$W2,\"quantity\":20}")
  expect "inter-warehouse transfer created two movements" "$TR" "'out' in d['data'] and 'in' in d['data']"
fi

MOVES=$(call GET "/stock/movements?product_id=$PRODUCT_ID")
expect "movement ledger recorded the changes" "$MOVES" "len(d['data']) >= 2"

section "5. Sales order lifecycle"
CUST=$(call POST /customers "{\"name\":\"Smoke Test Customer\",\"email\":\"smoke.$RANDOM@example.test\"}")
expect "customer created" "$CUST" "'id' in d['data']"
CUSTOMER_ID=$(echo "$CUST" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')

ORDER=$(call POST /sales-orders "{\"customer_id\":$CUSTOMER_ID,\"warehouse_id\":$WAREHOUSE_ID,\"items\":[{\"product_id\":$PRODUCT_ID,\"quantity\":2,\"unit_price\":30,\"tax_rate\":10}]}")
expect "sales order created as draft" "$ORDER" "d['data']['status'] == 'draft'"
ORDER_ID=$(echo "$ORDER" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
expect "order total = 2*30 + 10% tax = 66" "$ORDER" "abs(d['data']['grand_total'] - 66.0) < 0.01"

CONFIRMED=$(call POST "/sales-orders/$ORDER_ID/confirm")
expect "order confirmed and stock reserved" "$CONFIRMED" "d['data']['status'] == 'confirmed'"

SHIPPED=$(call POST "/sales-orders/$ORDER_ID/ship")
expect "order shipped" "$SHIPPED" "d['data']['status'] == 'shipped'"

INVOICE=$(call POST "/sales-orders/$ORDER_ID/invoice")
expect "invoice generated from the order" "$INVOICE" "d['data']['status'] in ('sent','partial','paid')"
INVOICE_ID=$(echo "$INVOICE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')

PARTIAL=$(call POST "/invoices/$INVOICE_ID/payments" '{"amount":20,"method":"bank_transfer","reference":"SMOKE-1"}')
expect "partial payment recorded" "$PARTIAL" "'id' in d['data']"

STATE=$(call GET "/invoices/$INVOICE_ID")
expect "invoice is now partly paid" "$STATE" "d['data']['status'] == 'partial'"
expect "balance due is 46" "$STATE" "abs(d['data']['balance_due'] - 46.0) < 0.01"

OVERPAY=$(call POST "/invoices/$INVOICE_ID/payments" '{"amount":9999,"method":"cash"}')
expect "overpayment is rejected" "$OVERPAY" "'message' in d"

REMAINING=$(call POST "/invoices/$INVOICE_ID/payments" '{"amount":46,"method":"card"}')
expect "final payment accepted" "$REMAINING" "'id' in d['data']"

PAID=$(call GET "/invoices/$INVOICE_ID")
expect "invoice is now paid" "$PAID" "d['data']['status'] == 'paid'"

call POST "/sales-orders/$ORDER_ID/complete" > /dev/null
DONE=$(call GET "/sales-orders/$ORDER_ID")
expect "order completed" "$DONE" "d['data']['status'] == 'completed'"

section "6. Purchasing"
SUP=$(call POST /suppliers '{"name":"Smoke Test Supplier"}')
expect "supplier created" "$SUP" "'id' in d['data']"
SUP_ID=$(echo "$SUP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')

PO=$(call POST /purchase-orders "{\"supplier_id\":$SUP_ID,\"warehouse_id\":$WAREHOUSE_ID,\"items\":[{\"product_id\":$PRODUCT_ID,\"quantity\":40,\"unit_price\":9}]}")
expect "purchase order created" "$PO" "d['data']['status'] == 'draft'"
PO_ID=$(echo "$PO" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
PO_ITEM=$(echo "$PO" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["items"][0]["id"])')

PLACED=$(call POST "/purchase-orders/$PO_ID/place")
expect "purchase order placed" "$PLACED" "d['data']['status'] == 'ordered'"

RECEIVED=$(call POST "/purchase-orders/$PO_ID/receive" "{\"items\":[{\"item_id\":$PO_ITEM,\"quantity\":15}]}")
expect "partial receipt sets status to partial" "$RECEIVED" "d['data']['status'] == 'partial'"
expect "received quantity tracked" "$RECEIVED" "abs(d['data']['items'][0]['received_quantity'] - 15) < 0.001"

AFTER_RECEIPT=$(call GET "/stock/levels?product_id=$PRODUCT_ID")
# stock-take set the balance to 80, then -20 transferred out, -2 shipped, +15 received
expect "goods receipt increased stock" "$AFTER_RECEIPT" "any(abs(l['quantity'] - 73) < 0.001 for l in d['data'])"

RECEIVED2=$(call POST "/purchase-orders/$PO_ID/receive" "{\"items\":[{\"item_id\":$PO_ITEM,\"quantity\":25}]}")
expect "completing the receipt sets status to received" "$RECEIVED2" "d['data']['status'] == 'received'"

section "7. Business rules"
BAD_QTY=$(call POST /sales-orders "{\"customer_id\":$CUSTOMER_ID,\"items\":[{\"product_id\":$PRODUCT_ID,\"quantity\":0}]}")
expect "zero quantity order rejected" "$BAD_QTY" "'errors' in d"

DUP=$(call POST /sales-orders "{\"customer_id\":$CUSTOMER_ID,\"items\":[{\"product_id\":$PRODUCT_ID,\"quantity\":1},{\"product_id\":$PRODUCT_ID,\"quantity\":1}]}")
expect "duplicate product line rejected" "$DUP" "'message' in d"

OVER_RECEIVE=$(call POST "/purchase-orders/$PO_ID/receive" "{\"items\":[{\"item_id\":$PO_ITEM,\"quantity\":5}]}")
expect "receiving more than ordered rejected" "$OVER_RECEIVE" "'message' in d"

NO_AUTH=$(curl -s "$BASE/products" -H 'Accept: application/json')
expect "unauthenticated request is rejected" "$NO_AUTH" "'message' in d"

section "8. Reports"
for report in sales-summary top-products sales-by-customer stock-valuation low-stock receivables payables stock-movements profit-loss; do
  BODY=$(call GET "/reports/$report")
  expect "GET /reports/$report" "$BODY" "'data' in d"
done

section "9. Administration"
ROLES=$(call GET /roles)
expect "roles are seeded" "$ROLES" "len(d['data']) >= 5"

PERMS=$(call GET /roles/permissions)
expect "permission catalogue returned" "$PERMS" "'products.view' in d['data']['all']"

NEW_USER=$(call POST /users '{"name":"Smoke Tester","email":"smoke.user@example.test","password":"password123","role_id":1}')
expect "user created" "$NEW_USER" "'id' in d['data']"
USER_ID=$(echo "$NEW_USER" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
call DELETE "/users/$USER_ID" > /dev/null

section "10. Cleanup"
call DELETE "/sales-orders/$ORDER_ID" > /dev/null 2>&1 || true
call DELETE "/products/$PRODUCT_ID" > /dev/null 2>&1 || true
call DELETE "/customers/$CUSTOMER_ID" > /dev/null 2>&1 || true
call DELETE "/suppliers/$SUP_ID" > /dev/null 2>&1 || true
green "  cleanup attempted (documents with history are intentionally kept)"

echo
if [ "$FAILURES" -eq 0 ]; then
  green "==============================================="
  green " ALL SMOKE TESTS PASSED"
  green "==============================================="
  exit 0
else
  red "==============================================="
  red " $FAILURES CHECK(S) FAILED"
  red "==============================================="
  exit 1
fi