import requests
import json
import sys

def test_flow():
    url = "http://localhost:8000/api/generate-questions"
    payload = {
        "keyword": "Sự hài lòng của khách hàng về VinFast",
        "num_questions": 5,
        "offset": 0
    }
    
    print(f"--- TESTING FLOW: Terminal -> AI Server ({url}) ---")
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Success: Yes" if data.get('success') or data.get('questions') else "Success: No")
            questions = data.get('questions', [])
            print(f"Questions received: {len(questions)}")
            for i, q in enumerate(questions[:3]):
                print(f"  {i+1}. {q.get('question')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_flow()
