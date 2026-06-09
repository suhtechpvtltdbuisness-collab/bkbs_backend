import os
from io import BytesIO

from PIL import Image, ImageEnhance, ImageOps

MAX_SIDE = int(os.environ.get("OCR_MAX_SIDE", "1280"))
MIN_SIDE = int(os.environ.get("OCR_MIN_SIDE", "480"))
JPEG_QUALITY = int(os.environ.get("OCR_JPEG_QUALITY", "92"))


def preprocess_image_bytes(image_bytes: bytes) -> bytes:
    with Image.open(BytesIO(image_bytes)) as image:
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
        image = _resize(image)
        image = _enhance(image)

        output = BytesIO()
        image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return output.getvalue()


def _resize(image: Image.Image) -> Image.Image:
    width, height = image.size
    longest = max(width, height)

    if longest > MAX_SIDE:
        scale = MAX_SIDE / longest
        new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        width, height = image.size
        longest = max(width, height)

    if longest < MIN_SIDE:
        scale = MIN_SIDE / longest
        new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
        image = image.resize(new_size, Image.Resampling.LANCZOS)

    return image


def _enhance(image: Image.Image) -> Image.Image:
    image = ImageEnhance.Contrast(image).enhance(1.12)
    image = ImageEnhance.Sharpness(image).enhance(1.05)
    return image
