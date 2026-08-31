import pytest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"user_id": 42, "email": "test@fitcast.local"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["user_id"] == 42
    assert decoded["email"] == "test@fitcast.local"

def test_jwt_invalid_token():
    assert decode_access_token("invalid.token.structure") is None
