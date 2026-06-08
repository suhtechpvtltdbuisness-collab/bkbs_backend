import os
from io import BytesIO

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

MAX_SIDE = int(os.environ.get("OCR_MAX_SIDE", "1920"))
MIN_SIDE = int(os.environ.get("OCR_MIN_SIDE", "640"))
JPEG_QUALITY = int(os.environ.get("OCR_JPEG_QUALITY", "95"))


def preprocess_image_bytes(image_bytes: bytes) -> bytes:
    variants = preprocess_variants(image_bytes)
    return variants[0]


def preprocess_variants(image_bytes: bytes) -> list[bytes]:
    with Image.open(BytesIO(image_bytes)) as image:
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
        image = _auto_crop_to_content(image)
        image = _resize(image)

        outputs = [
            _encode(_enhance(image, contrast=1.12, sharpness=1.08, brightness=1.0)),
            _encode(_enhance(image, contrast=1.28, sharpness=1.18, brightness=1.04)),
            _encode(_enhance(image, contrast=1.35, sharpness=1.22, brightness=0.96)),
        ]

        gray_variant = ImageOps.autocontrast(
            image.convert("L"),
            cutoff=1,
        ).convert("RGB")
        gray_variant = ImageEnhance.Sharpness(gray_variant).enhance(1.15)
        outputs.append(_encode(gray_variant))

        return outputs


def _auto_crop_to_content(image: Image.Image) -> Image.Image:
    gray = np.array(image.convert("L"))
    mask = (gray < 242) & (gray > 18)

    if not mask.any():
        return image

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    y_indices = np.where(rows)[0]
    x_indices = np.where(cols)[0]

    if y_indices.size == 0 or x_indices.size == 0:
        return image

    y0, y1 = int(y_indices[0]), int(y_indices[-1])
    x0, x1 = int(x_indices[0]), int(x_indices[-1])

    pad_y = max(8, int((y1 - y0) * 0.02))
    pad_x = max(8, int((x1 - x0) * 0.02))

    width, height = image.size
    left = max(0, x0 - pad_x)
    top = max(0, y0 - pad_y)
    right = min(width, x1 + pad_x + 1)
    bottom = min(height, y1 + pad_y + 1)

    cropped = image.crop((left, top, right, bottom))
    crop_width, crop_height = cropped.size

    if crop_width < width * 0.35 or crop_height < height * 0.35:
        return image

    return cropped


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


def _enhance(
    image: Image.Image,
    *,
    contrast: float,
    sharpness: float,
    brightness: float,
) -> Image.Image:
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Sharpness(image).enhance(sharpness)
    return image.filter(ImageFilter.MedianFilter(size=3))


def _encode(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return output.getvalue()
