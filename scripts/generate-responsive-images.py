from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "images" / "projects"
WIDTHS = (480, 768, 1200)
QUALITY = 78

for source in sorted(ROOT.rglob("*")):
    if source.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        continue
    try:
        with Image.open(source) as image:
            image = image.convert("RGB")
            for width in WIDTHS:
                target_width = width
                height = round(image.height * target_width / image.width)
                target = source.with_name(f"{source.stem}-{width}.webp")
                image.resize((target_width, height), Image.Resampling.LANCZOS).save(
                    target, "WEBP", quality=QUALITY, method=6
                )
                print(f"{source} -> {target}")
    except Exception as error:
        print(f"skip {source}: {error}")
