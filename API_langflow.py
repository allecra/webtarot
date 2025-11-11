import requests
import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = "http://localhost:7860/api/v1/run/eaa8dfa7-2bfb-4dc1-98fd-b110b2e71994"  # The complete API endpoint URL for this flow

# Request payload configuration
payload = {
    "output_type": "chat",
    "input_type": "chat",
    "input_value": "hello world!"
}
payload["session_id"] = str(uuid.uuid4())

# Headers configuration
headers = {
    "Content-Type": "application/json",
    "x-api-key": os.environ.get("LANGFLOW_API_KEY", ""),  # Get API key from environment
}

try:
    # Send API request
    response = requests.request("POST", url, json=payload, headers=headers)
    response.raise_for_status()  # Raise exception for bad status codes

    # Print response
    print(response.text)

except requests.exceptions.RequestException as e:
    print(f"Error making API request: {e}")
except ValueError as e:
    print(f"Error parsing response: {e}")