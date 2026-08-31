import io
import pytest
from fastapi.testclient import TestClient

def test_register_and_get_me(client: TestClient):
    payload = {
        "email": "anna@example.com",
        "username": "Anna",
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["email"] == "anna@example.com"
    assert data["username"] == "Anna"
    assert "fitcast_session" in res.cookies

    # Test /api/auth/me with cookie
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "anna@example.com"

def test_duplicate_registration(client: TestClient):
    payload = {
        "email": "duplicate@example.com",
        "username": "User1",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 200

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "bereits registriert" in res2.json()["detail"].lower() or "bereits" in res2.json()["detail"].lower()

def test_login_and_logout(client: TestClient):
    # Register user
    client.post("/api/auth/register", json={
        "email": "max@example.com",
        "username": "Max",
        "password": "CorrectPassword"
    })
    client.cookies.clear()

    # Attempt wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": "max@example.com",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # Successful login
    good_login = client.post("/api/auth/login", json={
        "email": "max@example.com",
        "password": "CorrectPassword"
    })
    assert good_login.status_code == 200
    assert "fitcast_session" in good_login.cookies

    # Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    # /api/auth/me should now fail
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 401

def test_user_wardrobe_isolation(client: TestClient):
    # User 1
    reg1 = client.post("/api/auth/register", json={
        "email": "user1@example.com",
        "username": "UserOne",
        "password": "Password123!"
    })
    assert reg1.status_code == 200

    # Upload item for user 1
    dummy_img = io.BytesIO(b"fake image data")
    upload_res = client.post(
        "/api/items",
        data={"category": "top", "name": "User 1 Special Shirt", "warmth_level": "3"},
        files={"image": ("shirt.jpg", dummy_img, "image/jpeg")}
    )
    assert upload_res.status_code == 200
    item_data = upload_res.json()
    assert item_data["user_id"] is not None

    # User 2
    client.cookies.clear()
    reg2 = client.post("/api/auth/register", json={
        "email": "user2@example.com",
        "username": "UserTwo",
        "password": "Password123!"
    })
    assert reg2.status_code == 200

    # User 2 lists items
    items_res = client.get("/api/items")
    assert items_res.status_code == 200
    items = items_res.json()
    assert len(items) == 0  # Should NOT see User 1's shirt!
