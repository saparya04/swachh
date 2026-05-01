import sys, argparse, os, json, base64
from datetime import datetime
from groq import Groq
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, OperationFailure



# ── THEME DETECTION ─────────────────────────────────────────────────────
BEACH_KEYWORDS = {"beach","shore","coast","sea","ocean","bay","marine","coastal","seaside","sand","surf","wave","waterfront"}
PARK_KEYWORDS  = {"park","garden","forest","trail","lake","hill","nature","grove","woods","green","field","meadow","river","mountain","reserve","sanctuary","wetland","valley","sunset"}

def detect_theme(name: str) -> str:
    n = name.lower()
    for kw in BEACH_KEYWORDS:
        if kw in n: return "beach"
    for kw in PARK_KEYWORDS:
        if kw in n: return "park"
    return "beach"

# ── HTML TEMPLATE ───────────────────────────────────────────────────────
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{TITLE} Poster</title>
<link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;700&family=Raleway:ital,wght@1,300&family=EB+Garamond:ital,wght@1,300&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
body{{display:flex;align-items:center;justify-content:center;min-height:100vh;background:{BG_COLOR};font-family:'Nunito',sans-serif}}
.poster{{position:relative;width:520px;height:740px;overflow:hidden;border-radius:20px;
  box-shadow:0 40px 90px rgba(0,0,0,.75);
  background-image:url('{BG_IMG}');background-size:cover;background-position:center top}}
.poster::before{{content:'';position:absolute;inset:0;background:{OVERLAY};z-index:1}}
.top-bar{{position:absolute;top:0;left:0;right:0;height:3px;background:{BAR};z-index:3}}
.badge{{position:absolute;top:22px;left:28px;background:{BADGE_BG};border:1px solid {BADGE_BDR};
  border-radius:20px;padding:5px 14px;font-size:10px;font-weight:700;letter-spacing:3px;
  color:{BADGE_CLR};text-transform:uppercase;z-index:3}}
.content{{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;padding:0 38px 40px}}
.headline{{{HL_FONT};line-height:1;color:#fff;text-shadow:0 3px 24px rgba(0,0,0,.55);margin-bottom:3px}}
.headline span{{color:{ACCENT}}}
.event-title{{font-size:10.5px;font-weight:700;letter-spacing:4.5px;color:{ACCENT};text-transform:uppercase;margin-bottom:13px}}
.divider{{width:48px;height:2px;background:linear-gradient(90deg,{ACCENT},transparent);margin-bottom:14px}}
.invite{{{INV_FONT};font-size:13.5px;line-height:1.76;color:{INV_CLR};margin-bottom:20px}}
.invite p{{margin:0}}
.details{{display:grid;grid-template-columns:1fr 1fr;gap:9px 16px;margin-bottom:20px}}
.detail-item{{display:flex;flex-direction:column;gap:2px}}
.detail-label{{font-size:8px;letter-spacing:2.5px;text-transform:uppercase;color:{ACCENT};opacity:.65}}
.detail-value{{font-size:14px;font-weight:700;color:#fff}}
.volunteers{{display:inline-flex;align-items:center;gap:10px;background:{VOL_BG};border:1px solid {VOL_BDR};
  border-radius:8px;padding:9px 16px;color:{ACCENT};font-size:12px;font-weight:700;letter-spacing:.7px}}
</style>
</head>
<body>
<div class="poster">
  <div class="top-bar"></div>
  <div class="badge">{BADGE_TXT}</div>
  <div class="content">
    <div class="headline">{HL_WORD}<span>.</span></div>
    <div class="event-title">{TITLE}</div>
    <div class="divider"></div>
    <div class="invite">{INVITE}</div>
    <div class="details">
      <div class="detail-item"><span class="detail-label">Date</span><span class="detail-value">{DATE}</span></div>
      <div class="detail-item"><span class="detail-label">Time</span><span class="detail-value">{TIME}</span></div>
      <div class="detail-item" style="grid-column:1/-1">
        <span class="detail-label">Location</span><span class="detail-value">{LOCATION}</span>
      </div>
    </div>
    <div class="volunteers">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      Volunteers Required: {VOLUNTEERS}
    </div>
  </div>
</div>
</body>
</html>
'''

INVITE_LINES = [
    "Join us in our mission to create a cleaner, greener,",
    "and more beautiful environment! We warmly invite you to",
    "participate in our cleanup drive, where we will unite",
    "to protect and preserve our natural spaces.",
]

# ── POSTER GENERATION ───────────────────────────────────────────────────
def generate_poster_html(event: dict):
    title          = event.get("name", "CLEANUP DRIVE").upper()
    event_time     = event.get("time", "10:00 AM")
    event_location = event.get("location", "Mumbai")
    volunteers     = event.get("volunteersRequired", "?")
    raw_date = event.get("date", "")
    try:
        if isinstance(raw_date, str) and raw_date:
            ds = raw_date.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ds) if "T" in ds else datetime.strptime(raw_date[:10], "%Y-%m-%d")
            date_str = dt.strftime("%B %d, %Y")
        else:
            date_str = "Date TBD"
    except Exception:
        date_str = str(raw_date) or "Date TBD"

    

    theme = detect_theme(title)
    print(f"THEME_DETECTED: {theme}  (event: {title!r})")

    if theme == "beach":
        p = dict(
            BG_IMG    = f"data:image/jpeg;base64,{BEACH_B64}",
            BG_COLOR  = "#0a2a4a",
            OVERLAY   = "linear-gradient(to bottom,rgba(10,42,74,.06) 0%,rgba(10,42,74,.10) 35%,rgba(10,42,74,.72) 60%,rgba(10,42,74,.97) 100%)",
            BAR       = "linear-gradient(90deg,transparent,rgba(100,220,255,.6),transparent)",
            BADGE_BG  = "rgba(0,180,255,.18)",
            BADGE_BDR = "rgba(100,220,255,.35)",
            BADGE_CLR = "rgba(180,240,255,.9)",
            BADGE_TXT = "&#127754; Cleanup Drive",
            HL_FONT   = "font-family:'Pacifico',cursive;font-size:64px",
            HL_WORD   = "Beach",
            ACCENT    = "#64dfff",
            INV_FONT  = "font-family:'Raleway',serif;font-style:italic;font-weight:300",
            INV_CLR   = "rgba(210,240,255,.74)",
            VOL_BG    = "rgba(0,180,255,.12)",
            VOL_BDR   = "rgba(100,220,255,.3)",
        )
    else:
        p = dict(
            BG_IMG    = f"data:image/jpeg;base64,{SUNSET_B64}",
            BG_COLOR  = "#1a0f04",
            OVERLAY   = "linear-gradient(to bottom,rgba(26,15,4,.05) 0%,rgba(26,15,4,.10) 30%,rgba(26,15,4,.70) 58%,rgba(26,15,4,.97) 100%)",
            BAR       = "linear-gradient(90deg,transparent,rgba(255,160,50,.55),transparent)",
            BADGE_BG  = "rgba(255,140,0,.15)",
            BADGE_BDR = "rgba(255,160,50,.35)",
            BADGE_CLR = "rgba(255,200,100,.9)",
            BADGE_TXT = "&#127807; Cleanup Drive",
            HL_FONT   = "font-family:'Playfair Display',serif;font-style:italic;font-size:66px",
            HL_WORD   = "Nature",
            ACCENT    = "#ffb347",
            INV_FONT  = "font-family:'EB Garamond',serif;font-style:italic;font-weight:300",
            INV_CLR   = "rgba(255,235,200,.70)",
            VOL_BG    = "rgba(255,140,0,.12)",
            VOL_BDR   = "rgba(255,160,50,.3)",
        )

    invite_html = "".join(f"<p>{line}</p>" for line in INVITE_LINES)
    html = HTML_TEMPLATE.format(
        TITLE=title, DATE=date_str, TIME=event_time,
        LOCATION=event_location, VOLUNTEERS=volunteers,
        INVITE=invite_html, **p
    )

    try:
        os.makedirs("posters", exist_ok=True)
        safe  = "".join(c if c.isalnum() else "_" for c in title)[:30]
        fname = f"poster_{safe}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        path  = os.path.join("posters", fname)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)
        abs_path = os.path.abspath(path)
        print(f"POSTER_CREATED:{abs_path}")
        return abs_path, None
    except Exception as e:
        print(f"POSTER_FAILED:{e}")
        return None, str(e)

# ── CAPTIONS ────────────────────────────────────────────────────────────
def encode_image(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def generate_platform_caption(image_b64: str, platform: str) -> str:
    prompts = {
        "Instagram": ("This is a promotional cleanup event poster. Create a short vibrant Instagram caption. "
                     "Use positive energetic tone. Include 4-6 relevant emojis. "
                     "Highlight community and environment protection. End with 7-10 hashtags."),
        "Facebook":  ("This is a cleanup drive poster. Write an engaging Facebook caption. "
                     "Mention purpose, date, time, place, volunteers needed. "
                     "Add emotional appeal. Encourage joining/sharing. End with a question."),
        "LinkedIn":  ("This is a professional cleanup event poster. Create a polished LinkedIn post. "
                     "Focus on environment, community, sustainability. Include event details. "
                     "Call to action for professionals/students/companies."),
    }
    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[{"role": "user", "content": [
                {"type": "text",      "text": prompts.get(platform, prompts["Instagram"])},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
            ]}],
            temperature=0.7, max_tokens=320, timeout=45,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"[Error - {platform}]: {e}"

# ── MAIN ────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Generate themed HTML poster from MongoDB event")
    parser.add_argument("--event-id", required=True, help="MongoDB _id (24-char hex)")
    args = parser.parse_args()
    print(f"Received event-id: {args.event_id!r}")

    try:
        mongo = MongoClient(MONGO_URI)
        mongo.admin.command("ping")
        print("MongoDB connection OK")
        db  = mongo[DB_NAME]
        col = db[COLLECTION]
        print(f"Collections: {db.list_collection_names()}")
        try:
            event = col.find_one({"_id": ObjectId(args.event_id)})
        except Exception as e:
            print(f"ObjectId failed: {e}"); event = None
        if not event:
            event = col.find_one({"_id": args.event_id})
        if not event:
            print(f"ERROR: No event found with _id = {args.event_id}"); sys.exit(1)
        print("EVENT_FOUND:", json.dumps(event, default=str, indent=2))
    except ConfigurationError as e: print(f"MONGO_CONFIG_ERROR: {e}");    sys.exit(1)
    except OperationFailure  as e: print(f"MONGO_AUTH_ERROR: {e}");       sys.exit(1)
    except Exception         as e: print(f"MONGO_CONNECTION_ERROR: {e}"); sys.exit(1)

    poster_path, error = generate_poster_html(event)
    if error or not poster_path:
        print(f"POSTER_FAILED:{error}"); sys.exit(1)

    caption_image   = None
    screenshot_path = poster_path.replace(".html", ".png")
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page    = browser.new_page(viewport={"width": 520, "height": 740})
            page.goto(f"file:///{poster_path.replace(os.sep, '/')}")
            page.locator(".poster").screenshot(path=screenshot_path)
            browser.close()
        print(f"SCREENSHOT_CREATED:{os.path.abspath(screenshot_path)}")
        caption_image = screenshot_path
    except ImportError:
        print(f"INFO: playwright not installed - skipping screenshot.\n"
              f"      HTML poster saved at: {poster_path}")
    except Exception as e:
        print(f"SCREENSHOT_FAILED:{e}")

    if caption_image and os.path.exists(caption_image):
        try:
            b64 = encode_image(caption_image)
            captions = {
                "Instagram": generate_platform_caption(b64, "Instagram"),
                "Facebook":  generate_platform_caption(b64, "Facebook"),
                "LinkedIn":  generate_platform_caption(b64, "LinkedIn"),
            }
            print("CAPTIONS:")
            print(json.dumps(captions, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"CAPTIONS_FAILED:{e}")

    png_path = os.path.abspath(caption_image) if caption_image and os.path.exists(caption_image) else None
    print("POSTER_OUTPUT:" + json.dumps({"html": os.path.abspath(poster_path), "png": png_path}))

if __name__ == "__main__":
    main()