#!/usr/bin/env python3
"""
Generate DMG installer background image for LMMs-Lab Writer
Style: Neo-brutalism + Pixel Dot Matrix
Colors: Monochrome only (black, white, grays)
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Dimensions
WIDTH = 660
HEIGHT = 400

# Colors (monochrome only - from design system)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BORDER = (229, 229, 229)
MUTED = (102, 102, 102)
LIGHT_GRAY = (245, 245, 245)

def generate_dmg_background(output_path):
    """Generate the DMG background image"""
    
    # Create image
    img = Image.new('RGB', (WIDTH, HEIGHT), WHITE)
    draw = ImageDraw.Draw(img)

    # 1. PIXEL DOT MATRIX BACKGROUND
    # Create subtle dot pattern across entire background
    dot_spacing = 12
    dot_size = 1
    for y in range(0, HEIGHT, dot_spacing):
        for x in range(0, WIDTH, dot_spacing):
            # Vary dot intensity slightly for texture
            if (x + y) % 24 == 0:
                draw.ellipse([x, y, x + dot_size, y + dot_size], fill=BORDER)

    # 2. MAIN CONTENT AREA - Neo-brutalist frame
    # Bold black border frame
    frame_thickness = 3
    draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline=BLACK, width=frame_thickness)

    # 3. ICON POSITIONS (where macOS will place icons)
    app_icon_x = 180
    app_icon_y = 220
    apps_folder_x = 480
    apps_folder_y = 220

    # Draw placeholder circles for icon positions (subtle guides)
    icon_radius = 50
    # Left circle (app icon area)
    draw.ellipse([app_icon_x - icon_radius, app_icon_y - icon_radius, 
                  app_icon_x + icon_radius, app_icon_y + icon_radius], 
                 outline=BORDER, width=2)

    # Right circle (Applications folder area)
    draw.ellipse([apps_folder_x - icon_radius, apps_folder_y - icon_radius, 
                  apps_folder_x + icon_radius, apps_folder_y + icon_radius], 
                 outline=BORDER, width=2)

    # 4. ARROW - Bold neo-brutalist arrow pointing right
    arrow_y = app_icon_y
    arrow_start_x = app_icon_x + 70
    arrow_end_x = apps_folder_x - 70
    arrow_thickness = 8

    # Arrow shaft
    draw.rectangle([arrow_start_x, arrow_y - arrow_thickness//2, 
                    arrow_end_x, arrow_y + arrow_thickness//2], fill=BLACK)

    # Arrow head (triangle)
    arrow_head_size = 20
    arrow_points = [
        (arrow_end_x, arrow_y),
        (arrow_end_x - arrow_head_size, arrow_y - arrow_head_size),
        (arrow_end_x - arrow_head_size, arrow_y + arrow_head_size)
    ]
    draw.polygon(arrow_points, fill=BLACK)

    # 5. TEXT - "DRAG TO APPLICATIONS"
    # Try to use system font, fallback to default
    try:
        # Try common macOS monospace fonts
        font_large = ImageFont.truetype("/System/Library/Fonts/Monaco.dfont", 24)
        font_small = ImageFont.truetype("/System/Library/Fonts/Monaco.dfont", 14)
    except:
        try:
            font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()

    # Main instruction text
    main_text = "DRAG TO APPLICATIONS"
    # Get text bbox for centering
    bbox = draw.textbbox((0, 0), main_text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = 80

    # Draw text with offset shadow for neo-brutalist effect
    shadow_offset = 3
    draw.text((text_x + shadow_offset, text_y + shadow_offset), main_text, fill=BORDER, font=font_large)
    draw.text((text_x, text_y), main_text, fill=BLACK, font=font_large)

    # 6. BRAND ELEMENT - "LMMs-Lab Writer" at bottom
    brand_text = "LMMs-Lab Writer"
    bbox = draw.textbbox((0, 0), brand_text, font=font_small)
    brand_width = bbox[2] - bbox[0]
    brand_x = (WIDTH - brand_width) // 2
    brand_y = HEIGHT - 60

    draw.text((brand_x, brand_y), brand_text, fill=MUTED, font=font_small)

    # 7. DECORATIVE ELEMENTS - Corner brackets (neo-brutalist style)
    bracket_size = 15
    bracket_thickness = 3

    # Top-left corner
    draw.line([25, 25, 25 + bracket_size, 25], fill=BLACK, width=bracket_thickness)
    draw.line([25, 25, 25, 25 + bracket_size], fill=BLACK, width=bracket_thickness)

    # Top-right corner
    draw.line([WIDTH - 25, 25, WIDTH - 25 - bracket_size, 25], fill=BLACK, width=bracket_thickness)
    draw.line([WIDTH - 25, 25, WIDTH - 25, 25 + bracket_size], fill=BLACK, width=bracket_thickness)

    # Bottom-left corner
    draw.line([25, HEIGHT - 25, 25 + bracket_size, HEIGHT - 25], fill=BLACK, width=bracket_thickness)
    draw.line([25, HEIGHT - 25, 25, HEIGHT - 25 - bracket_size], fill=BLACK, width=bracket_thickness)

    # Bottom-right corner
    draw.line([WIDTH - 25, HEIGHT - 25, WIDTH - 25 - bracket_size, HEIGHT - 25], fill=BLACK, width=bracket_thickness)
    draw.line([WIDTH - 25, HEIGHT - 25, WIDTH - 25, HEIGHT - 25 - bracket_size], fill=BLACK, width=bracket_thickness)

    # 8. BARCODE-STYLE ACCENT (brand element)
    # Small barcode pattern at top center
    barcode_x = WIDTH // 2 - 40
    barcode_y = 40
    bar_widths = [3, 2, 4, 2, 3, 5, 2, 4, 3, 2, 5, 3]
    bar_height = 15
    current_x = barcode_x

    for width in bar_widths:
        draw.rectangle([current_x, barcode_y, current_x + width, barcode_y + bar_height], fill=BLACK)
        current_x += width + 2

    # Save image
    img.save(output_path, 'PNG')
    return output_path


if __name__ == "__main__":
    # Get project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_path = os.path.join(project_root, 'apps/desktop/src-tauri/dmg-background.png')
    
    # Generate image
    result = generate_dmg_background(output_path)
    
    print(f"✓ DMG background saved to: {result}")
    print(f"  Dimensions: {WIDTH}x{HEIGHT}")
    print(f"  Style: Neo-brutalism + Pixel Dot Matrix")
    print(f"  Colors: Monochrome (black, white, grays)")
