import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, ProvidersResponse
from app.config import settings
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from app.services.authentik_service import authentik_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # 1. Try cookie first
    token = request.cookies.get(settings.COOKIE_NAME)

    # 2. Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht authentifiziert. Bitte melde dich an."
        )

    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige oder abgelaufene Sitzung."
        )

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Benutzerkonto nicht gefunden oder deaktiviert."
        )

    return user

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None

def set_auth_cookie(response: Response, user_id: int, email: str):
    token = create_access_token({"user_id": user_id, "email": email})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=False,
        path="/"
    )

def get_redirect_uri(request: Request) -> str:
    if settings.AUTHENTIK_REDIRECT_URI:
        return settings.AUTHENTIK_REDIRECT_URI
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host"))
    return f"{proto}://{host}/api/auth/authentik/callback"

@router.post("/register", response_model=UserResponse)
def register_user(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diese E-Mail-Adresse ist bereits registriert."
        )

    new_user = User(
        email=payload.email.lower(),
        username=payload.username.strip(),
        hashed_password=hash_password(payload.password),
        auth_provider="local",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    set_auth_cookie(response, new_user.id, new_user.email)
    return new_user

@router.post("/login", response_model=UserResponse)
def login_user(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige E-Mail-Adresse oder Passwort."
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige E-Mail-Adresse oder Passwort."
        )

    set_auth_cookie(response, user.id, user.email)
    return user

@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie(key=settings.COOKIE_NAME, path="/")
    return {"message": "Erfolgreich abgemeldet."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/providers", response_model=ProvidersResponse)
def get_auth_providers():
    return ProvidersResponse(authentik_enabled=settings.authentik_enabled)

# ============================
# Authentik OIDC SSO Endpoints
# ============================
@router.get("/authentik/login")
async def authentik_login(request: Request, response: Response):
    if not settings.authentik_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentik ist auf diesem Server nicht konfiguriert."
        )

    state = secrets.token_urlsafe(32)
    redirect_uri = get_redirect_uri(request)
    auth_url = await authentik_service.build_authorization_url(redirect_uri=redirect_uri, state=state)

    resp = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
    resp.set_cookie(
        key="fitcast_oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
        path="/"
    )
    return resp

@router.get("/authentik/callback", name="authentik_callback")
async def authentik_callback(
    request: Request,
    response: Response,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if error or not code:
        return RedirectResponse(url="/?auth_error=" + (error or "missing_code"), status_code=status.HTTP_302_FOUND)

    expected_state = request.cookies.get("fitcast_oauth_state")
    if not expected_state or expected_state != state:
        return RedirectResponse(url="/?auth_error=invalid_state", status_code=status.HTTP_302_FOUND)

    redirect_uri = get_redirect_uri(request)

    try:
        user_info = await authentik_service.exchange_code_for_user(code=code, redirect_uri=redirect_uri)
    except Exception as e:
        print(f"Authentik exchange failed: {e}")
        return RedirectResponse(url="/?auth_error=exchange_failed", status_code=status.HTTP_302_FOUND)

    sub = user_info["sub"]
    email = user_info["email"].lower()
    name = user_info["name"]
    avatar = user_info.get("avatar")

    # Find or create user
    user = db.query(User).filter((User.authentik_sub == sub) | (User.email == email)).first()
    if not user:
        user = User(
            email=email,
            username=name,
            auth_provider="authentik",
            authentik_sub=sub,
            avatar_url=avatar,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.authentik_sub:
            user.authentik_sub = sub
            user.auth_provider = "authentik"
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
        db.commit()
        db.refresh(user)

    redirect_resp = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    set_auth_cookie(redirect_resp, user.id, user.email)
    redirect_resp.delete_cookie(key="fitcast_oauth_state", path="/")
    return redirect_resp
