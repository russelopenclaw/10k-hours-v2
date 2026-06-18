#!/usr/bin/env python3
"""Helper to query Supabase DB. Reads .env.local for credentials.
Usage: python3 db.py "table?select=*&filter=eq.value"
"""
import os, sys, json, requests
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env.local'))

url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

if len(sys.argv) < 2:
    print("Usage: python3 db.py <query>")
    print("  python3 db.py 'profiles?select=id,email&limit=5'")
    print("  python3 db.py --insert <table> <json_data>")
    print("  python3 db.py --delete <table> <filter>")
    sys.exit(1)

if sys.argv[1] == '--insert':
    table = sys.argv[2]
    data = json.loads(sys.argv[3])
    r = requests.post(f"{url}/rest/v1/{table}", json=data, headers=headers)
    print(f"Status: {r.status_code}")
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(f"(no body, status {r.status_code})")
elif sys.argv[1] == '--delete':
    table = sys.argv[2]
    filter_str = sys.argv[3]
    h = {**headers, 'Prefer': 'return=representation'}
    r = requests.delete(f"{url}/rest/v1/{table}?{filter_str}", headers=h)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
else:
    query = sys.argv[1]
    r = requests.get(f"{url}/rest/v1/{query}", headers=headers)
    print(json.dumps(r.json(), indent=2))