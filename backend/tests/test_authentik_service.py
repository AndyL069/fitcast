import pytest
from unittest.mock import MagicMock, patch
from app.services.authentik_service import AuthentikService

def test_authentik_build_auth_url():
    service = AuthentikService(
        issuer_url="https://authentik.company.local/application/o/fitcast/",
        client_id="my-client-id",
        client_secret="my-client-secret"
    )

    auth_url = service.build_authorization_url(
        redirect_uri="http://localhost:8000/api/auth/callback/authentik",
        state="test_state_123"
    )
    assert "https://authentik.company.local/application/o/authorize/" in auth_url
    assert "client_id=my-client-id" in auth_url
    assert "state=test_state_123" in auth_url
    assert "response_type=code" in auth_url

@pytest.mark.asyncio
async def test_authentik_exchange_code_for_user():
    service = AuthentikService(
        issuer_url="https://authentik.company.local/application/o/fitcast/",
        client_id="my-client-id",
        client_secret="my-client-secret"
    )

    with patch("httpx.AsyncClient.post") as mock_post, patch("httpx.AsyncClient.get") as mock_get:
        # Mock token response
        mock_post_res = MagicMock()
        mock_post_res.status_code = 200
        mock_post_res.json.return_value = {"access_token": "mock_token_abc"}
        mock_post_res.raise_for_status = MagicMock()
        mock_post.return_value = mock_post_res

        # Mock userinfo response
        mock_get_res = MagicMock()
        mock_get_res.status_code = 200
        mock_get_res.json.return_value = {
            "sub": "auth-sub-999",
            "email": "authentik_user@example.com",
            "name": "Authentik User",
            "picture": "https://avatar.url/pic.jpg"
        }
        mock_get_res.raise_for_status = MagicMock()
        mock_get.return_value = mock_get_res

        user_info = await service.exchange_code_for_user(
            code="mock_code_123",
            redirect_uri="http://localhost:8000/api/auth/callback/authentik"
        )

        assert user_info["sub"] == "auth-sub-999"
        assert user_info["email"] == "authentik_user@example.com"
        assert user_info["name"] == "Authentik User"
