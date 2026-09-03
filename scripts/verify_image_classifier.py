import base64
import json
import os
import urllib.error
import urllib.request

from PIL import Image, ImageDraw

ADMIN_KEY = os.environ["ADMIN_KEY"]

# Build a synthetic flat vector-style illustration (icon-like, dark bg,
# flat-color shapes with anti-aliased edges — similar structure to the
# "scales of justice" graphic from the bug report).
img = Image.new("RGB", (1200, 630), (12, 10, 16))
draw = ImageDraw.Draw(img)
draw.line([(600, 100), (600, 400)], fill=(201, 164, 74), width=8)
draw.line([(450, 150), (750, 150)], fill=(201, 164, 74), width=8)
draw.ellipse([(420, 200), (480, 240)], outline=(201, 164, 74), width=4)
draw.ellipse([(720, 200), (780, 240)], outline=(201, 164, 74), width=4)
draw.polygon([(450, 480), (850, 480), (700, 350)], fill=(139, 94, 52))
img.save("/tmp/test_illustration.png")

with open("/tmp/test_illustration.png", "rb") as f:
    illo_b64 = base64.b64encode(f.read()).decode()

payload = {
    "tests": [
        {"label": "real_photo_military_jpg", "url": "https://downrangeco.com/img/photos/military.jpg"},
        {"label": "real_photo_suppressor_jpg", "url": "https://downrangeco.com/img/photos/suppressor.jpg"},
        {"label": "synthetic_vector_illustration", "base64": illo_b64, "contentType": "image/png"},
    ]
}

req = urllib.request.Request(
    "https://downrangeco.com/api/admin/test-image-classify",
    data=json.dumps(payload).encode(),
    method="POST",
    headers={"Content-Type": "application/json", "x-admin-key": ADMIN_KEY},
)
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
except urllib.error.HTTPError as e:
    result = {"ok": False, "http_error": e.code, "body": e.read().decode(errors="replace")[:2000]}
except Exception as e:
    result = {"ok": False, "error": f"{type(e).__name__}: {e}"}

with open("docs/image_classify_test_result.json", "w") as f:
    json.dump(result, f, indent=2)

print(json.dumps(result, indent=2))
