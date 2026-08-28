import requests
from PIL import Image
from io import BytesIO

urls = [
    "https://downrangeco.com/img/photos/law.jpg",
    "https://downrangeco.com/img/photos/news.jpg",
    "https://downrangeco.com/img/photos/rifle.jpg",
    "https://downrangeco.com/img/photos/training.jpg",
    "https://downrangeco.com/img/photos/hunting.jpg",
]

for url in urls:
    try:
        r = requests.get(url, timeout=15)
        img = Image.open(BytesIO(r.content))
        w, h = img.size
        ratio = w / h
        safe = "SAFE" if 0.8 <= ratio <= 1.91 else "UNSAFE FOR INSTAGRAM"
        print(f"{url}: {w}x{h} ratio={ratio:.2f} {safe}")
    except Exception as e:
        print(f"{url}: ERROR {e}")
