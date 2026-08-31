import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from PIL import Image

from app.main import app
from app.database import Base, get_db

# Setup test DB with StaticPool for in-memory SQLite shared across threads
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def create_sample_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='blue')
    image.save(file, 'jpeg')
    file.seek(0)
    return file

def test_create_item_with_upload(client):
    img_file = create_sample_image()
    response = client.post(
        "/api/items",
        data={
            "category": "top",
            "name": "Blue Cotton Shirt",
            "color": "blue",
            "pattern": "solid",
            "fabric": "cotton",
            "warmth_level": 2,
            "formality": "smart_casual",
            "waterproof": "false"
        },
        files={"image": ("shirt.jpg", img_file, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Blue Cotton Shirt"
    assert data["category"] == "top"
    assert data["image_url"].startswith("/uploads/")

def test_list_items_and_filter(client):
    # Add a top and a pants item
    img1 = create_sample_image()
    client.post(
        "/api/items",
        data={"category": "top", "name": "Striped Tee", "warmth_level": 2},
        files={"image": ("tee.jpg", img1, "image/jpeg")}
    )
    img2 = create_sample_image()
    client.post(
        "/api/items",
        data={"category": "pants", "name": "Dark Chinos", "warmth_level": 3},
        files={"image": ("chinos.jpg", img2, "image/jpeg")}
    )

    # Get all items
    resp_all = client.get("/api/items")
    assert resp_all.status_code == 200
    assert len(resp_all.json()) == 2

    # Filter tops
    resp_tops = client.get("/api/items?category=top")
    assert resp_tops.status_code == 200
    assert len(resp_tops.json()) == 1
    assert resp_tops.json()[0]["name"] == "Striped Tee"

def test_delete_item(client):
    img = create_sample_image()
    create_resp = client.post(
        "/api/items",
        data={"category": "shoes", "name": "Running Shoes", "warmth_level": 2},
        files={"image": ("shoes.jpg", img, "image/jpeg")}
    )
    item_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/items/{item_id}")
    assert del_resp.status_code == 200

    get_resp = client.get(f"/api/items/{item_id}")
    assert get_resp.status_code == 404
