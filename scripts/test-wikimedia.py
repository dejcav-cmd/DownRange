#!/usr/bin/env python3
import subprocess, os, time

urls = {
    "mossberg_500": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mossberg_500.jpg/1280px-Mossberg_500.jpg",
    "glock_17_gen4": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Glock_17_gen4_2.jpg/1280px-Glock_17_gen4_2.jpg",
    "ar15_carbine": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "supreme_court": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "usmc_training": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "glock19": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Glock_19_9mm.jpg/1280px-Glock_19_9mm.jpg",
}

user_agents = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Wget/1.20.3",
    "curl/7.68.0",
]

print("Testing Wikimedia download methods:", flush=True)
for name, url in urls.items():
    for ua in user_agents:
        tmp = f"/tmp/test_{name}.jpg"
        result = subprocess.run([
            "curl", "-L", "-s", "-o", tmp, "-w", "%{http_code}",
            "-H", f"User-Agent: {ua}",
            "--max-time", "15", url
        ], capture_output=True, text=True)
        code = result.stdout.strip()
        size = os.path.getsize(tmp) if os.path.exists(tmp) else 0
        if size > 10000:
            print(f"  WORKS: {name} | UA={ua[:30]} | HTTP {code} | {size//1024}KB", flush=True)
            break
        else:
            print(f"  FAIL:  {name} | UA={ua[:30]} | HTTP {code} | {size}B", flush=True)
        time.sleep(0.3)
