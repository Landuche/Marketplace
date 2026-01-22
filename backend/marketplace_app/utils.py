from PIL import Image
from django.core.exceptions import ValidationError


def validate_image(image):
    size_limit = 5
    if image.size > size_limit * 1024 * 1024:
        raise ValidationError(f"Image exceeds max size ({size_limit}MB).")

    try:
        with Image.open(image) as img:
            img.verify()
            if img.format.lower() not in ["jpeg", "jpg", "png", "webp"]:
                raise ValidationError("Unsupported format.")
    except (IOError, SyntaxError):
        raise ValidationError("Invalid image.")

    image.seek(0)
