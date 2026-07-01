#!/usr/bin/env python3
"""
Comprehensive backend tests for EditVault API.
Tests all 10 flows as specified in the review request.
"""

import os
import sys
import requests
from datetime import datetime
from pathlib import Path

# Read backend URL from frontend/.env
env_path = Path("/app/frontend/.env")
BACKEND_URL = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BACKEND_URL = line.split("=", 1)[1].strip()
                break

if not BACKEND_URL:
    print("ERROR: Could not find REACT_APP_BACKEND_URL in /app/frontend/.env")
    sys.exit(1)

BASE_URL = f"{BACKEND_URL}/api"
print(f"Testing backend at: {BASE_URL}\n")

# Test state
admin_token = None
admin_profile = None
client_token = None
client_profile = None
test_client_id = None
test_video_id = None
test_expense_id = None
test_bill_id = None
test_admin_id = None

# Test results tracking
passed = 0
failed = 0
test_results = []

def log_test(name, success, details=""):
    global passed, failed
    if success:
        passed += 1
        status = "✅ PASS"
    else:
        failed += 1
        status = "❌ FAIL"
    msg = f"{status}: {name}"
    if details:
        msg += f" - {details}"
    print(msg)
    test_results.append({"name": name, "success": success, "details": details})

def test_health():
    """Flow 1: Health check"""
    print("\n=== Flow 1: Health Check ===")
    try:
        resp = requests.get(f"{BASE_URL}/", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "message" in data:
                log_test("GET /api/ returns 200 with message", True, f"message='{data['message']}'")
            else:
                log_test("GET /api/ returns 200 with message", False, "No 'message' field in response")
        else:
            log_test("GET /api/ returns 200", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/ health check", False, str(e))

def test_auth():
    """Flow 2: Authentication"""
    global admin_token, admin_profile, client_token, client_profile
    print("\n=== Flow 2: Authentication ===")
    
    # 2a: Valid admin login
    try:
        resp = requests.post(f"{BASE_URL}/login", json={"username": "admin", "password": "admin123"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "token" in data and "profile" in data:
                admin_token = data["token"]
                admin_profile = data["profile"]
                if admin_profile.get("role") == "admin":
                    log_test("POST /api/login with admin credentials", True, f"role={admin_profile['role']}")
                else:
                    log_test("POST /api/login with admin credentials", False, f"Expected role=admin, got {admin_profile.get('role')}")
            else:
                log_test("POST /api/login with admin credentials", False, "Missing token or profile")
        else:
            log_test("POST /api/login with admin credentials", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/login with admin credentials", False, str(e))
    
    # 2b: Invalid password
    try:
        resp = requests.post(f"{BASE_URL}/login", json={"username": "admin", "password": "wrong"}, timeout=10)
        if resp.status_code == 401:
            log_test("POST /api/login with wrong password returns 401", True)
        else:
            log_test("POST /api/login with wrong password returns 401", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("POST /api/login with wrong password", False, str(e))
    
    # 2c: GET /api/me without auth
    try:
        resp = requests.get(f"{BASE_URL}/me", timeout=10)
        if resp.status_code == 401:
            log_test("GET /api/me without Authorization returns 401", True)
        else:
            log_test("GET /api/me without Authorization returns 401", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/me without Authorization", False, str(e))
    
    # 2d: GET /api/me with token
    if admin_token:
        try:
            resp = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "role" in data and data["role"] == "admin":
                    log_test("GET /api/me with Bearer token returns profile", True, f"username={data.get('username')}")
                else:
                    log_test("GET /api/me with Bearer token returns profile", False, "Invalid profile data")
            else:
                log_test("GET /api/me with Bearer token", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("GET /api/me with Bearer token", False, str(e))

def test_clients():
    """Flow 3: Clients CRUD and operations"""
    global test_client_id, client_token, client_profile
    print("\n=== Flow 3: Clients ===")
    
    if not admin_token:
        log_test("Clients tests", False, "No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 3a: Create client
    try:
        client_data = {
            "name": "Acme Co",
            "username": "acmeco",
            "password": "acme123",
            "monthlyFee": 5000
        }
        resp = requests.post(f"{BASE_URL}/clients", json=client_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test_client_id = data.get("id")
            if test_client_id and data.get("name") == "Acme Co":
                log_test("POST /api/clients creates client", True, f"id={test_client_id}")
            else:
                log_test("POST /api/clients creates client", False, "Invalid response data")
        else:
            log_test("POST /api/clients creates client", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/clients creates client", False, str(e))
    
    # 3b: List clients
    try:
        resp = requests.get(f"{BASE_URL}/clients", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and any(c.get("id") == test_client_id for c in data):
                log_test("GET /api/clients contains new client", True, f"Found {len(data)} clients")
            else:
                log_test("GET /api/clients contains new client", False, "Client not found in list")
        else:
            log_test("GET /api/clients", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/clients", False, str(e))
    
    # 3c: Update client name
    if test_client_id:
        try:
            resp = requests.put(f"{BASE_URL}/clients/{test_client_id}", json={"name": "Acme Corporation"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("name") == "Acme Corporation":
                    log_test("PUT /api/clients/{id} updates name", True)
                else:
                    log_test("PUT /api/clients/{id} updates name", False, f"Name is {data.get('name')}")
            else:
                log_test("PUT /api/clients/{id} updates name", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("PUT /api/clients/{id} updates name", False, str(e))
    
    # 3d: Change username and verify old login fails, new login works
    if test_client_id:
        try:
            # Change username to acmeco2
            resp = requests.put(f"{BASE_URL}/clients/{test_client_id}", json={"username": "acmeco2"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                # Try login with old username
                resp_old = requests.post(f"{BASE_URL}/login", json={"username": "acmeco", "password": "acme123"}, timeout=10)
                # Try login with new username
                resp_new = requests.post(f"{BASE_URL}/login", json={"username": "acmeco2", "password": "acme123"}, timeout=10)
                
                if resp_old.status_code == 401 and resp_new.status_code == 200:
                    client_token = resp_new.json().get("token")
                    client_profile = resp_new.json().get("profile")
                    log_test("Username change: old login fails, new login works", True)
                else:
                    log_test("Username change: old login fails, new login works", False, 
                            f"Old: {resp_old.status_code}, New: {resp_new.status_code}")
            else:
                log_test("PUT /api/clients/{id} changes username", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("Username change test", False, str(e))
    
    # 3e: Change password and verify new login works
    if test_client_id:
        try:
            resp = requests.put(f"{BASE_URL}/clients/{test_client_id}", json={"password": "newpass"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                # Try login with new password
                resp_login = requests.post(f"{BASE_URL}/login", json={"username": "acmeco2", "password": "newpass"}, timeout=10)
                if resp_login.status_code == 200:
                    # Verify admin token still works
                    resp_me = requests.get(f"{BASE_URL}/me", headers=headers, timeout=10)
                    if resp_me.status_code == 200:
                        log_test("Password change: new login works, admin token unaffected", True)
                    else:
                        log_test("Password change: admin token check", False, f"Admin token got {resp_me.status_code}")
                else:
                    log_test("Password change: new login", False, f"Got {resp_login.status_code}")
            else:
                log_test("PUT /api/clients/{id} changes password", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("Password change test", False, str(e))
    
    # 3f: Move client (test both directions)
    if test_client_id:
        try:
            resp_down = requests.post(f"{BASE_URL}/clients/{test_client_id}/move?direction=1", headers=headers, timeout=10)
            resp_up = requests.post(f"{BASE_URL}/clients/{test_client_id}/move?direction=-1", headers=headers, timeout=10)
            if resp_down.status_code == 200 and resp_up.status_code == 200:
                log_test("POST /api/clients/{id}/move with direction=1 and -1", True)
            else:
                log_test("POST /api/clients/{id}/move", False, f"Down: {resp_down.status_code}, Up: {resp_up.status_code}")
        except Exception as e:
            log_test("POST /api/clients/{id}/move", False, str(e))
    
    # 3g: Delete client (save for last)
    # We'll delete after other tests that need the client

def test_videos():
    """Flow 4: Videos CRUD"""
    global test_video_id
    print("\n=== Flow 4: Videos ===")
    
    if not admin_token or not test_client_id:
        log_test("Videos tests", False, "Missing admin token or client ID")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    now = datetime.now()
    
    # Create video
    try:
        video_data = {
            "client_id": test_client_id,
            "name": "Reel 1",
            "year": now.year,
            "month": now.month,
            "amount": 100
        }
        resp = requests.post(f"{BASE_URL}/videos", json=video_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test_video_id = data.get("id")
            if test_video_id:
                log_test("POST /api/videos creates video", True, f"id={test_video_id}")
            else:
                log_test("POST /api/videos creates video", False, "No ID in response")
        else:
            log_test("POST /api/videos creates video", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/videos creates video", False, str(e))
    
    # List videos
    if test_video_id:
        try:
            resp = requests.get(f"{BASE_URL}/videos?client_id={test_client_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and any(v.get("id") == test_video_id for v in data):
                    log_test("GET /api/videos?client_id=... contains video", True)
                else:
                    log_test("GET /api/videos?client_id=... contains video", False, "Video not found")
            else:
                log_test("GET /api/videos", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("GET /api/videos", False, str(e))
    
    # Update video status
    if test_video_id:
        try:
            resp = requests.put(f"{BASE_URL}/videos/{test_video_id}", json={"editor_status": "Done"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("editor_status") == "Done":
                    log_test("PUT /api/videos/{id} updates editor_status", True)
                else:
                    log_test("PUT /api/videos/{id} updates editor_status", False, f"Status is {data.get('editor_status')}")
            else:
                log_test("PUT /api/videos/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("PUT /api/videos/{id}", False, str(e))
    
    # Add correction note
    if test_video_id:
        try:
            resp = requests.post(f"{BASE_URL}/videos/{test_video_id}/corrections", 
                               json={"note": "tighten intro", "from": "client"}, 
                               headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "id" in data and data.get("note") == "tighten intro":
                    log_test("POST /api/videos/{id}/corrections adds note", True)
                else:
                    log_test("POST /api/videos/{id}/corrections", False, "Invalid response")
            else:
                log_test("POST /api/videos/{id}/corrections", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("POST /api/videos/{id}/corrections", False, str(e))
    
    # Delete video
    if test_video_id:
        try:
            resp = requests.delete(f"{BASE_URL}/videos/{test_video_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                log_test("DELETE /api/videos/{id}", True)
                test_video_id = None  # Clear for later tests
            else:
                log_test("DELETE /api/videos/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("DELETE /api/videos/{id}", False, str(e))

def test_expenses():
    """Flow 5: Expenses CRUD"""
    global test_expense_id
    print("\n=== Flow 5: Expenses ===")
    
    if not admin_token or not test_client_id:
        log_test("Expenses tests", False, "Missing admin token or client ID")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    now = datetime.now()
    
    # Create expense
    try:
        expense_data = {
            "client_id": test_client_id,
            "date": now.strftime("%Y-%m-%d"),
            "description": "Test expense",
            "amount": 500,
            "status": "Unpaid",
            "year": now.year,
            "month": now.month
        }
        resp = requests.post(f"{BASE_URL}/expenses", json=expense_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test_expense_id = data.get("id")
            if test_expense_id:
                log_test("POST /api/expenses creates expense", True, f"id={test_expense_id}")
            else:
                log_test("POST /api/expenses", False, "No ID in response")
        else:
            log_test("POST /api/expenses", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/expenses", False, str(e))
    
    # List expenses
    if test_expense_id:
        try:
            resp = requests.get(f"{BASE_URL}/expenses?client_id={test_client_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and any(e.get("id") == test_expense_id for e in data):
                    log_test("GET /api/expenses contains expense", True)
                else:
                    log_test("GET /api/expenses", False, "Expense not found")
            else:
                log_test("GET /api/expenses", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("GET /api/expenses", False, str(e))
    
    # Update expense
    if test_expense_id:
        try:
            resp = requests.put(f"{BASE_URL}/expenses/{test_expense_id}", json={"status": "Paid"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Paid":
                    log_test("PUT /api/expenses/{id} updates status", True)
                else:
                    log_test("PUT /api/expenses/{id}", False, f"Status is {data.get('status')}")
            else:
                log_test("PUT /api/expenses/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("PUT /api/expenses/{id}", False, str(e))
    
    # Delete expense
    if test_expense_id:
        try:
            resp = requests.delete(f"{BASE_URL}/expenses/{test_expense_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                log_test("DELETE /api/expenses/{id}", True)
            else:
                log_test("DELETE /api/expenses/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("DELETE /api/expenses/{id}", False, str(e))

def test_bills():
    """Flow 6: Bills with upsert and invoice numbering"""
    global test_bill_id
    print("\n=== Flow 6: Bills ===")
    
    if not admin_token or not test_client_id:
        log_test("Bills tests", False, "Missing admin token or client ID")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    now = datetime.now()
    
    # Create first bill
    bill_data = {
        "client_id": test_client_id,
        "year": now.year,
        "month": now.month,
        "subtotal": 1000,
        "discount": 100,
        "tax": 90,
        "status": "Pending"
    }
    
    try:
        resp1 = requests.post(f"{BASE_URL}/bills", json=bill_data, headers=headers, timeout=10)
        if resp1.status_code == 200:
            data1 = resp1.json()
            test_bill_id = data1.get("id")
            invoice_no_1 = data1.get("invoice_no")
            
            # Second POST for same (client, year, month) should upsert
            bill_data["subtotal"] = 1200
            resp2 = requests.post(f"{BASE_URL}/bills", json=bill_data, headers=headers, timeout=10)
            if resp2.status_code == 200:
                data2 = resp2.json()
                if data2.get("id") == test_bill_id and data2.get("subtotal") == 1200:
                    log_test("POST /api/bills upserts by (client, year, month)", True, f"Updated subtotal to 1200")
                else:
                    log_test("POST /api/bills upsert", False, f"Expected same ID and subtotal=1200")
            else:
                log_test("POST /api/bills upsert", False, f"Second POST got {resp2.status_code}")
            
            # Test invoice number increment with different month
            bill_data["month"] = (now.month % 12) + 1
            resp3 = requests.post(f"{BASE_URL}/bills", json=bill_data, headers=headers, timeout=10)
            if resp3.status_code == 200:
                data3 = resp3.json()
                invoice_no_2 = data3.get("invoice_no")
                if invoice_no_1 and invoice_no_2 and invoice_no_1 != invoice_no_2:
                    log_test("Invoice numbers increment for different bills", True, 
                            f"{invoice_no_1} -> {invoice_no_2}")
                else:
                    log_test("Invoice numbers increment", False, f"Got {invoice_no_1} and {invoice_no_2}")
            else:
                log_test("Invoice number increment test", False, f"Got {resp3.status_code}")
        else:
            log_test("POST /api/bills", False, f"Got {resp1.status_code}: {resp1.text}")
    except Exception as e:
        log_test("POST /api/bills", False, str(e))
    
    # GET bill by ID
    if test_bill_id:
        try:
            resp = requests.get(f"{BASE_URL}/bills/{test_bill_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                log_test("GET /api/bills/{id}", True)
            else:
                log_test("GET /api/bills/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("GET /api/bills/{id}", False, str(e))
    
    # Update bill status
    if test_bill_id:
        try:
            resp = requests.put(f"{BASE_URL}/bills/{test_bill_id}", json={"status": "Paid"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Paid":
                    log_test("PUT /api/bills/{id} changes status to Paid", True)
                else:
                    log_test("PUT /api/bills/{id}", False, f"Status is {data.get('status')}")
            else:
                log_test("PUT /api/bills/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("PUT /api/bills/{id}", False, str(e))

def test_company_settings():
    """Flow 7: Company Settings"""
    print("\n=== Flow 7: Company Settings ===")
    
    if not admin_token:
        log_test("Company settings tests", False, "No admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # GET settings
    try:
        resp = requests.get(f"{BASE_URL}/settings/company", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            log_test("GET /api/settings/company returns doc", True, f"Keys: {list(data.keys())}")
        else:
            log_test("GET /api/settings/company", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("GET /api/settings/company", False, str(e))
    
    # PUT settings
    try:
        settings_data = {
            "name": "EditVault Studio",
            "invoice_prefix": "EV"
        }
        resp = requests.put(f"{BASE_URL}/settings/company", json=settings_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("name") == "EditVault Studio" and data.get("invoice_prefix") == "EV":
                log_test("PUT /api/settings/company updates settings", True)
            else:
                log_test("PUT /api/settings/company", False, f"Data mismatch: {data}")
        else:
            log_test("PUT /api/settings/company", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("PUT /api/settings/company", False, str(e))

def test_admins():
    """Flow 8: Admins CRUD"""
    global test_admin_id
    print("\n=== Flow 8: Admins ===")
    
    if not admin_token:
        log_test("Admins tests", False, "No admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create admin
    try:
        admin_data = {
            "username": "admin2",
            "password": "pw12345",
            "full_name": "Admin Two"
        }
        resp = requests.post(f"{BASE_URL}/admins", json=admin_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test_admin_id = data.get("id")
            if test_admin_id:
                log_test("POST /api/admins creates admin", True, f"id={test_admin_id}")
            else:
                log_test("POST /api/admins", False, "No ID in response")
        else:
            log_test("POST /api/admins", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/admins", False, str(e))
    
    # Login as new admin and get token
    new_admin_token = None
    if test_admin_id:
        try:
            resp = requests.post(f"{BASE_URL}/login", json={"username": "admin2", "password": "pw12345"}, timeout=10)
            if resp.status_code == 200:
                new_admin_token = resp.json().get("token")
        except:
            pass
    
    # Update admin (rename) - this should bump password_version
    if test_admin_id and new_admin_token:
        try:
            resp = requests.put(f"{BASE_URL}/admins/{test_admin_id}", json={"full_name": "Admin Two Updated"}, headers=headers, timeout=10)
            if resp.status_code == 200:
                # Try using old token - should fail due to password_version bump
                # Actually, renaming full_name doesn't bump pv, only username/password does
                # Let's change username instead
                resp2 = requests.put(f"{BASE_URL}/admins/{test_admin_id}", json={"username": "admin2_renamed"}, headers=headers, timeout=10)
                if resp2.status_code == 200:
                    # Now old token should be invalid
                    resp_me = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {new_admin_token}"}, timeout=10)
                    if resp_me.status_code == 401:
                        log_test("PUT /api/admins/{id} username change invalidates old token", True)
                    else:
                        log_test("PUT /api/admins/{id} token invalidation", False, f"Old token still works: {resp_me.status_code}")
                else:
                    log_test("PUT /api/admins/{id} username change", False, f"Got {resp2.status_code}")
            else:
                log_test("PUT /api/admins/{id}", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("PUT /api/admins/{id}", False, str(e))
    
    # Test delete restrictions
    if test_admin_id:
        try:
            # Try to delete self (should fail)
            resp_self = requests.delete(f"{BASE_URL}/admins/{admin_profile['id']}", headers=headers, timeout=10)
            
            # Delete the test admin (should succeed)
            resp_other = requests.delete(f"{BASE_URL}/admins/{test_admin_id}", headers=headers, timeout=10)
            
            if resp_self.status_code == 400 and resp_other.status_code == 200:
                log_test("DELETE /api/admins/{id} - cannot delete self, can delete others", True)
            else:
                log_test("DELETE /api/admins/{id} restrictions", False, 
                        f"Self: {resp_self.status_code}, Other: {resp_other.status_code}")
        except Exception as e:
            log_test("DELETE /api/admins/{id}", False, str(e))

def test_client_role_restrictions():
    """Flow 9: Client role restrictions"""
    print("\n=== Flow 9: Client Role Restrictions ===")
    
    if not test_client_id:
        log_test("Client role tests", False, "No test client available")
        return
    
    # Login as client
    try:
        resp = requests.post(f"{BASE_URL}/login", json={"username": "acmeco2", "password": "newpass"}, timeout=10)
        if resp.status_code == 200:
            client_token_local = resp.json().get("token")
            client_headers = {"Authorization": f"Bearer {client_token_local}"}
            
            # Test 1: GET /api/clients only returns that client
            try:
                resp = requests.get(f"{BASE_URL}/clients", headers=client_headers, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) == 1 and data[0].get("id") == test_client_id:
                        log_test("Client GET /api/clients returns only their client", True)
                    else:
                        log_test("Client GET /api/clients", False, f"Got {len(data)} clients")
                else:
                    log_test("Client GET /api/clients", False, f"Got {resp.status_code}")
            except Exception as e:
                log_test("Client GET /api/clients", False, str(e))
            
            # Create a video for testing
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            now = datetime.now()
            video_data = {
                "client_id": test_client_id,
                "name": "Client Test Video",
                "year": now.year,
                "month": now.month,
                "amount": 200
            }
            resp_create = requests.post(f"{BASE_URL}/videos", json=video_data, headers=admin_headers, timeout=10)
            if resp_create.status_code == 200:
                client_video_id = resp_create.json().get("id")
                
                # Test 2: GET /api/videos returns only their videos
                try:
                    resp = requests.get(f"{BASE_URL}/videos", headers=client_headers, timeout=10)
                    if resp.status_code == 200:
                        data = resp.json()
                        if isinstance(data, list) and all(v.get("client_id") == test_client_id for v in data):
                            log_test("Client GET /api/videos returns only their videos", True, f"Found {len(data)} videos")
                        else:
                            log_test("Client GET /api/videos", False, "Found videos from other clients")
                    else:
                        log_test("Client GET /api/videos", False, f"Got {resp.status_code}")
                except Exception as e:
                    log_test("Client GET /api/videos", False, str(e))
                
                # Test 3: PUT /api/videos/{id} - amount should NOT change
                try:
                    resp = requests.put(f"{BASE_URL}/videos/{client_video_id}", 
                                      json={"amount": 999}, 
                                      headers=client_headers, timeout=10)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("amount") == 200:  # Should still be original amount
                            log_test("Client PUT /api/videos/{id} - amount field ignored", True)
                        else:
                            log_test("Client PUT /api/videos/{id} - amount field", False, 
                                   f"Amount changed to {data.get('amount')}")
                    else:
                        log_test("Client PUT /api/videos/{id}", False, f"Got {resp.status_code}")
                except Exception as e:
                    log_test("Client PUT /api/videos/{id}", False, str(e))
                
                # Test 4: DELETE /api/videos/{id} should return 403
                try:
                    resp = requests.delete(f"{BASE_URL}/videos/{client_video_id}", headers=client_headers, timeout=10)
                    if resp.status_code == 403:
                        log_test("Client DELETE /api/videos/{id} returns 403", True)
                    else:
                        log_test("Client DELETE /api/videos/{id}", False, f"Got {resp.status_code}")
                except Exception as e:
                    log_test("Client DELETE /api/videos/{id}", False, str(e))
        else:
            log_test("Client login for role tests", False, f"Got {resp.status_code}")
    except Exception as e:
        log_test("Client role restrictions", False, str(e))

def test_uploads():
    """Flow 10: Uploads"""
    print("\n=== Flow 10: Uploads ===")
    
    if not admin_token:
        log_test("Uploads tests", False, "No admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a test file
    test_file_content = b"Test file content for upload"
    
    try:
        files = {"file": ("test.txt", test_file_content, "text/plain")}
        resp = requests.post(f"{BASE_URL}/uploads", files=files, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            filename = data.get("filename")
            if filename and "url" in data:
                log_test("POST /api/uploads with auth works", True, f"filename={filename}")
                
                # Test GET without auth
                try:
                    resp_get = requests.get(f"{BASE_URL}/uploads/{filename}", timeout=10)
                    if resp_get.status_code == 200:
                        log_test("GET /api/uploads/{name} works without auth", True)
                    else:
                        log_test("GET /api/uploads/{name}", False, f"Got {resp_get.status_code}")
                except Exception as e:
                    log_test("GET /api/uploads/{name}", False, str(e))
            else:
                log_test("POST /api/uploads", False, "Missing filename or url in response")
        else:
            log_test("POST /api/uploads", False, f"Got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_test("POST /api/uploads", False, str(e))

def cleanup():
    """Clean up test data"""
    print("\n=== Cleanup ===")
    
    if not admin_token:
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Delete test client (this will cascade delete videos)
    if test_client_id:
        try:
            resp = requests.delete(f"{BASE_URL}/clients/{test_client_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                log_test("Cleanup: DELETE test client", True)
            else:
                log_test("Cleanup: DELETE test client", False, f"Got {resp.status_code}")
        except Exception as e:
            log_test("Cleanup: DELETE test client", False, str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total tests: {passed + failed}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success rate: {(passed/(passed+failed)*100):.1f}%")
    print("="*60)
    
    if failed > 0:
        print("\nFailed tests:")
        for result in test_results:
            if not result["success"]:
                print(f"  ❌ {result['name']}")
                if result["details"]:
                    print(f"     {result['details']}")

if __name__ == "__main__":
    print("Starting comprehensive EditVault backend tests...\n")
    
    test_health()
    test_auth()
    test_clients()
    test_videos()
    test_expenses()
    test_bills()
    test_company_settings()
    test_admins()
    test_client_role_restrictions()
    test_uploads()
    cleanup()
    
    print_summary()
    
    sys.exit(0 if failed == 0 else 1)
