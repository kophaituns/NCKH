import requests
import json

url = "http://localhost:8003/api/generate-questions"
payload = {
    "keyword": "Marketing Mix",
    "form_type": "assessment",
    "num_questions": 3,
    "workspace_id": "18"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
