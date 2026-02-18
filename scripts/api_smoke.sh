#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:5001}
EMAIL=${EMAIL:-}
USER_NAME=${USER_NAME:-}
PASSWORD=${PASSWORD:-Password1!}
NEW_PASSWORD=${NEW_PASSWORD:-Password2!}

if [ -z "$EMAIL" ]; then
  TS=$(date +%s)
  EMAIL="demo+${TS}@example.com"
  USER_NAME="demo${TS}"
fi

header() { echo "\n=== $* ==="; }
request() {
  local method=$1; shift
  local url=$1; shift
  curl -s -w "\nHTTP:%{http_code}\n" -H "Content-Type: application/json" "$@" -X "$method" "$url"
}

header "Register"
request POST "$API_BASE/api/auth/register" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"confirmPassword\":\"$PASSWORD\",\"userName\":\"$USER_NAME\"}"

header "Login"
LOGIN_JSON=$(curl -s -H "Content-Type: application/json" -X POST "$API_BASE/api/auth/login" -d "{\"emailOrUsername\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN_JSON"
TOKEN=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('token',''))" "$LOGIN_JSON")
if [ -z "$TOKEN" ]; then echo "Login failed"; exit 1; fi

header "Me"
request GET "$API_BASE/api/auth/me" -H "Authorization: Bearer $TOKEN"

header "Create patient"
request POST "$API_BASE/api/patients" -H "Authorization: Bearer $TOKEN" -d '{"name":"Test Patient","notes":"Note"}'

header "List patients"
request GET "$API_BASE/api/patients" -H "Authorization: Bearer $TOKEN"

PATIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/patients" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[-1].get('id','') if d else '')")

if [ -n "$PATIENT_ID" ]; then
  header "Add measurement"
  request POST "$API_BASE/api/patients/$PATIENT_ID/measurements" -H "Authorization: Bearer $TOKEN" -d '{"type":"PEF","value":400,"recordedAt":"2024-01-01T10:00:00Z"}'

  header "List measurements"
  request GET "$API_BASE/api/patients/$PATIENT_ID/measurements" -H "Authorization: Bearer $TOKEN"

  header "Add symptom"
  request POST "$API_BASE/api/patients/$PATIENT_ID/symptoms" -H "Authorization: Bearer $TOKEN" -d '{"severity":3,"description":"Cough","recordedAt":"2024-01-01T11:00:00Z","triggerTag":"pollen"}'

  header "List symptoms"
  request GET "$API_BASE/api/patients/$PATIENT_ID/symptoms" -H "Authorization: Bearer $TOKEN"

  header "Add trigger"
  request POST "$API_BASE/api/patients/$PATIENT_ID/triggers" -H "Authorization: Bearer $TOKEN" -d '{"name":"Pollen","notes":"High grass","recordedAt":"2024-01-01T10:30:00Z"}'

  header "List triggers"
  request GET "$API_BASE/api/patients/$PATIENT_ID/triggers" -H "Authorization: Bearer $TOKEN"

  header "Add medication"
  request POST "$API_BASE/api/patients/$PATIENT_ID/medications" -H "Authorization: Bearer $TOKEN" -d '{"name":"Salbutamol","dosage":"2 puffs","schedule":"PRN"}'

  header "List medications"
  request GET "$API_BASE/api/patients/$PATIENT_ID/medications" -H "Authorization: Bearer $TOKEN"

  header "Alerts"
  request GET "$API_BASE/api/alerts/patient/$PATIENT_ID?lat=52.2&lon=21.0" -H "Authorization: Bearer $TOKEN"

  header "Report PDF"
  curl -s -o /tmp/report.pdf -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer $TOKEN" "$API_BASE/api/reports/patients/$PATIENT_ID/full/pdf"
fi

header "Change password"
request POST "$API_BASE/api/auth/change-password" -H "Authorization: Bearer $TOKEN" -d "{\"currentPassword\":\"$PASSWORD\",\"newPassword\":\"$NEW_PASSWORD\"}"

header "Logout"
request POST "$API_BASE/api/auth/logout" -H "Authorization: Bearer $TOKEN"

header "Access after logout (should 401)"
request GET "$API_BASE/api/patients" -H "Authorization: Bearer $TOKEN"
