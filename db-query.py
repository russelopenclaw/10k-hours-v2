#!/usr/bin/env python3
"""Quick Supabase DB query helper. Reads .env.local for credentials."""
import os, sys, json, requests
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env.local'))

url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

query = sys.argv[1]
r = requests.get(f"{url}/rest/v1/{query}", headers=headers)
print(json.dumps(r.json(), indent=2))