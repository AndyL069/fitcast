import urllib.parse
from typing import Dict, Any, Optional
import httpx
from app.config import settings

class AuthentikService:
    def __init__(
        self,
        issuer_url: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        internal_url: Optional[str] = None
    ):
        self.issuer_url = (issuer_url or settings.AUTHENTIK_ISSUER_URL).rstrip("/")
        self.client_id = client_id or settings.AUTHENTIK_CLIENT_ID
        self.client_secret = client_secret or settings.AUTHENTIK_CLIENT_SECRET
        self.internal_url = (internal_url or settings.AUTHENTIK_INTERNAL_URL or "").rstrip("/")
        self._oidc_config: Optional[Dict[str, Any]] = None

    def _get_browser_base_url(self) -> str:
        if not self.issuer_url:
            return ""
        parsed = urllib.parse.urlparse(self.issuer_url)
        return f"{parsed.scheme}://{parsed.netloc}"

    def _get_backend_base_url(self) -> str:
        if self.internal_url:
            parsed = urllib.parse.urlparse(self.internal_url)
            return f"{parsed.scheme}://{parsed.netloc}"
        return self._get_browser_base_url()

    def build_authorization_url(self, redirect_uri: str, state: str) -> str:
        base_url = self._get_browser_base_url()
        auth_endpoint = f"{base_url}/application/o/authorize/"

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            "state": state
        }
        query_string = urllib.parse.urlencode(params)
        return f"{auth_endpoint}?{query_string}"

    async def exchange_code_for_user(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        backend_base = self._get_backend_base_url()
        token_endpoint = f"{backend_base}/application/o/token/"
        userinfo_endpoint = f"{backend_base}/application/o/userinfo/"

        # 1. Exchange code for access token
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }

        # Send with Basic Auth + Body for maximum OAuth2/OIDC compatibility
        auth = (self.client_id, self.client_secret) if self.client_secret else None

        try:
            async with httpx.AsyncClient(timeout=12.0, verify=False) as client:
                token_res = await client.post(token_endpoint, data=data, auth=auth)
                if token_res.status_code != 200:
                    err_msg = f"HTTP {token_res.status_code} from Authentik: {token_res.text}"
                    print(f"Authentik token exchange error: {err_msg}")
                    raise RuntimeError(err_msg)

                token_data = token_res.json()
                access_token = token_data.get("access_token")

                if not access_token:
                    raise ValueError(f"Kein Access Token in der Server-Antwort: {token_data}")

                # 2. Fetch UserInfo
                headers = {"Authorization": f"Bearer {access_token}"}
                user_res = await client.get(userinfo_endpoint, headers=headers)
                if user_res.status_code != 200:
                    err_msg = f"HTTP {user_res.status_code} from Authentik UserInfo: {user_res.text}"
                    print(f"Authentik userinfo error: {err_msg}")
                    raise RuntimeError(err_msg)

                user_info = user_res.json()
        except httpx.ConnectError as e:
            raise RuntimeError(f"Verbindungsfehler zu {backend_base}: Der FitCast-Container kann den Server nicht erreichen ({e}).")
        except httpx.TimeoutException as e:
            raise RuntimeError(f"Timeout bei Anfrage an {backend_base} ({e}).")

        email = user_info.get("email") or f"{user_info.get('sub')}@authentik.local"
        name = user_info.get("name") or user_info.get("preferred_username") or email.split("@")[0]
        sub = str(user_info.get("sub", ""))
        avatar = user_info.get("picture")

        return {
            "sub": sub,
            "email": email,
            "name": name,
            "avatar": avatar
        }

authentik_service = AuthentikService()
