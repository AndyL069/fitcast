import urllib.parse
from typing import Dict, Any, Optional
import httpx
from app.config import settings

class AuthentikService:
    def __init__(
        self,
        issuer_url: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None
    ):
        self.issuer_url = (issuer_url or settings.AUTHENTIK_ISSUER_URL).rstrip("/")
        self.client_id = client_id or settings.AUTHENTIK_CLIENT_ID
        self.client_secret = client_secret or settings.AUTHENTIK_CLIENT_SECRET
        self._oidc_config: Optional[Dict[str, Any]] = None

    def _get_base_url(self) -> str:
        parsed = urllib.parse.urlparse(self.issuer_url)
        return f"{parsed.scheme}://{parsed.netloc}"

    async def get_oidc_config(self) -> Dict[str, Any]:
        if self._oidc_config:
            return self._oidc_config

        base_url = self._get_base_url()
        
        # Try both the full issuer discovery and the root discovery
        discovery_urls = [
            f"{self.issuer_url}/.well-known/openid-configuration",
            f"{base_url}/.well-known/openid-configuration"
        ]

        for url in discovery_urls:
            try:
                async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        self._oidc_config = res.json()
                        return self._oidc_config
            except Exception as e:
                print(f"OIDC discovery at {url} failed: {e}")

        # Correct Authentik standard fallback endpoints based on root domain
        self._oidc_config = {
            "authorization_endpoint": f"{base_url}/application/o/authorize/",
            "token_endpoint": f"{base_url}/application/o/token/",
            "userinfo_endpoint": f"{base_url}/application/o/userinfo/"
        }
        return self._oidc_config

    async def build_authorization_url(self, redirect_uri: str, state: str) -> str:
        config = await self.get_oidc_config()
        base_url = self._get_base_url()
        auth_endpoint = config.get("authorization_endpoint", f"{base_url}/application/o/authorize/")

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            "state": state
        }
        query_string = urllib.parse.urlencode(params)
        delimiter = "&" if "?" in auth_endpoint else "?"
        return f"{auth_endpoint}{delimiter}{query_string}"

    async def exchange_code_for_user(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        config = await self.get_oidc_config()
        base_url = self._get_base_url()
        token_endpoint = config.get("token_endpoint", f"{base_url}/application/o/token/")
        userinfo_endpoint = config.get("userinfo_endpoint", f"{base_url}/application/o/userinfo/")

        # 1. Exchange code for access token
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }

        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            token_res = await client.post(token_endpoint, data=data)
            token_res.raise_for_status()
            token_data = token_res.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise ValueError("No access token returned from Authentik")

            # 2. Fetch UserInfo
            headers = {"Authorization": f"Bearer {access_token}"}
            user_res = await client.get(userinfo_endpoint, headers=headers)
            user_res.raise_for_status()
            user_info = user_res.json()

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
