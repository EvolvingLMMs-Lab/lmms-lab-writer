# merge_demo.py
# pip install pillow

from PIL import Image, ImageDraw, ImageFilter


def rounded_rect_mask(size, radius):
    """Create an L-mode mask with rounded corners."""
    w, h = size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    return mask


def add_shadow(card_rgba, blur=28, offset=(0, 18), shadow_opacity=140):
    """
    card_rgba: RGBA image (already rounded).
    Returns: RGBA image with shadow baked behind it.
    """
    w, h = card_rgba.size
    ox, oy = offset

    # Shadow canvas (extra space for blur)
    pad = blur * 2 + max(abs(ox), abs(oy)) + 4
    sw, sh = w + pad * 2, h + pad * 2
    shadow = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))

    # Use card alpha as shadow shape
    alpha = card_rgba.split()[-1]
    shadow_shape = Image.new("L", (w, h), 0)
    shadow_shape.paste(alpha, (0, 0))

    # Place shadow (offset inside big canvas)
    shadow_layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    shadow_layer.putalpha(0)
    shadow_color = Image.new("RGBA", (w, h), (0, 0, 0, shadow_opacity))

    x = pad + ox
    y = pad + oy
    shadow_layer.paste(shadow_color, (x, y), mask=shadow_shape)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))

    shadow.alpha_composite(shadow_layer)
    shadow.alpha_composite(card_rgba, (pad, pad))
    return shadow


def fit_to_same_size(img1, img2, target_w, target_h):
    """Resize two images to the exact same size."""
    img1 = img1.resize((target_w, target_h), Image.LANCZOS)
    img2 = img2.resize((target_w, target_h), Image.LANCZOS)
    return img1, img2


def angled_split(light, dark, corner_radius=46, skew=0.12):
    """
    Create an angled-split composite: light on the left, dark on the right.
    The dividing line is a slightly tilted vertical line through the center,
    giving a more polished look than a corner-to-corner diagonal.
    skew: how much the line tilts (fraction of width). 0 = vertical, 0.5 = 45 deg.
    """
    w, h = light.size

    # Start with the dark image as base
    composite = dark.copy().convert("RGBA")

    # Build the mask for the light (left) portion
    # The split line goes from (cx + offset, 0) to (cx - offset, h)
    cx = w / 2
    offset = w * skew / 2
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.polygon([
        (0, 0),
        (int(cx + offset), 0),
        (int(cx - offset), h),
        (0, h),
    ], fill=255)

    # Paste the light image using the angled mask
    composite.paste(light.convert("RGBA"), (0, 0), mask=mask)

    # Apply rounded corners
    corner_mask = rounded_rect_mask((w, h), corner_radius)
    rounded = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rounded.paste(composite, (0, 0), mask=corner_mask)
    return rounded


def main():
    # ---- Inputs ----
    light_path = "imgs/light.png"
    dark_path  = "imgs/dark.png"
    out_path   = "imgs/demo.webp"

    # ---- Style knobs (tweak these mainly) ----
    # Gradient background: top-left color -> bottom-right color
    bg_top    = (30, 30, 40)
    bg_bottom = (18, 18, 24)
    target_height = 900        # Card height; adjust to your screenshot size
    card_scale = 1.0           # Card scale
    corner_radius = 24
    shadow_blur = 16
    shadow_offset = (0, 8)
    shadow_opacity = 80
    padding = 30               # Slight padding around the card
    split_skew = 0.12          # Tilt of the split line (0 = vertical, larger = more tilted)

    # ---- Load ----
    light = Image.open(light_path)
    dark  = Image.open(dark_path)

    # ---- Normalize to same size ----
    aspect_light = light.width / light.height
    aspect_dark  = dark.width / dark.height
    target_aspect = min(aspect_light, aspect_dark)
    target_w = int(target_height * target_aspect)
    light, dark = fit_to_same_size(light, dark, target_w, target_height)

    # Optional: scale down a bit
    def scale(im, s):
        return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

    light = scale(light, card_scale)
    dark  = scale(dark,  card_scale)

    # ---- Create angled split card ----
    card = angled_split(light, dark, corner_radius=corner_radius, skew=split_skew)

    # ---- Add shadow ----
    shadowed = add_shadow(
        card,
        blur=shadow_blur,
        offset=shadow_offset,
        shadow_opacity=shadow_opacity,
    )

    # ---- Compute output canvas size ----
    cw = shadowed.width  + padding * 2
    ch = shadowed.height + padding * 2

    # Create a vertical gradient background
    canvas = Image.new("RGBA", (cw, ch), (*bg_top, 255))
    for y_line in range(ch):
        t = y_line / max(ch - 1, 1)
        r = int(bg_top[0] + (bg_bottom[0] - bg_top[0]) * t)
        g = int(bg_top[1] + (bg_bottom[1] - bg_top[1]) * t)
        b = int(bg_top[2] + (bg_bottom[2] - bg_top[2]) * t)
        ImageDraw.Draw(canvas).line([(0, y_line), (cw, y_line)], fill=(r, g, b, 255))

    # ---- Composite (centered) ----
    x = (cw - shadowed.width)  // 2
    y = (ch - shadowed.height) // 2
    canvas.alpha_composite(shadowed, (x, y))

    # ---- Export ----
    canvas.convert("RGB").save(out_path, quality=95)
    print(f"Saved -> {out_path}")


if __name__ == "__main__":
    main()
