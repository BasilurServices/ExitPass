import time
import requests
import subprocess
import json

# Configure your Google Apps Script Web App URL here
# Example: "https://script.google.com/macros/s/AKfycby.../exec"
API_URL = "https://script.google.com/macros/s/AKfycbzEDRC9Rq4EB2d-iO78-VNkm4rX018oXK9Di2jh7C11doV_dub3x2zSvd_2efANJPrB/exec"

def send_sms(phone_number, message):
    """
    Sends SMS using the local Huawei E3372 GSM modem via Gammu.
    """
    try:
        # Command: gammu sendsms TEXT <phone_number> -text "<message>"
        cmd = ["gammu", "sendsms", "TEXT", phone_number, "-text", message]
        print(f"Executing: {' '.join(cmd)}")
        
        # Run gammu command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ SMS sent successfully to {phone_number}")
            return True
        else:
            print(f"❌ Failed to send SMS to {phone_number}.")
            print(f"Output: {result.stdout}")
            print(f"Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Gammu is not installed or not found in system PATH.")
        return False
    except Exception as e:
        print(f"❌ Error executing gammu: {e}")
        return False

def main():
    if API_URL == "YOUR_APPS_SCRIPT_WEB_APP_URL":
        print("⚠️ Please configure your API_URL in the script before running.")
        return

    print("🚀 Starting Basilur Exit Pass SMS Polling Gateway...")
    print("Gateway will poll the queue every 5 seconds.")
    
    while True:
        try:
            # 1. Fetch pending SMS from Google Apps Script Backend
            response = requests.post(API_URL, json={"action": "getPendingSMS"}, allow_redirects=True, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    messages = data.get("messages", [])
                    
                    if messages:
                        print(f"📥 Found {len(messages)} pending SMS message(s).")
                    
                    for msg in messages:
                        idx = msg["id"]
                        phone = msg["phone_number"]
                        text = msg["message"]
                        
                        # 2. Send SMS using the gammu command
                        success = send_sms(phone, text)
                        
                        # 3 & 4. Update status based on success/failure
                        new_status = "SENT" if success else "FAILED"
                        
                        update_resp = requests.post(API_URL, json={
                            "action": "updateSMSStatus",
                            "id": idx,
                            "status": new_status
                        }, allow_redirects=True, timeout=15)
                        
                        if update_resp.status_code == 200 and update_resp.json().get("success"):
                            print(f"🔄 Updated SMS {idx} status to {new_status} in Google Sheets.")
                        else:
                            print(f"⚠️ Failed to update status in Google Sheets for SMS {idx}.")
                        
                        # 5. Wait 3 seconds between SMS sends to prevent modem overload
                        time.sleep(3)
                else:
                    error_msg = data.get("error", "Unknown backend error")
                    print(f"⚠️ Error fetching from backend: {error_msg}")
            else:
                print(f"⚠️ HTTP Error: {response.status_code}")
                
            # Wait 5 seconds before pulling again (gateway polls every 5s)
            time.sleep(5)
            
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error querying API: {e}")
            time.sleep(5)
        except Exception as e:
            print(f"⚠️ Unexpected error in loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
