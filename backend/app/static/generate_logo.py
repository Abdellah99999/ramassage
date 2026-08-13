from PIL import Image, ImageDraw, ImageFont

def generate_logo():
    # 200x200 image with transparent background
    img = Image.new('RGBA', (200, 200), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Coordinates of the triangle: Top, Bottom Right, Bottom Left
    triangle_points = [(100, 20), (180, 180), (20, 180)]
    
    # Draw navy blue triangle
    draw.polygon(triangle_points, fill=(27, 42, 74, 255)) # #1B2A4A
    
    # Draw a diagonal red route line from bottom-left to bottom-right curve
    # Let's draw an arc or curve line
    draw.arc([10, 100, 190, 240], start=180, end=360, fill=(192, 57, 43, 255), width=8) # #C0392B
    
    # Draw H.E.S text in white
    # Let's draw simple lines for letters if font is not found, or use default font
    try:
        # Try to load default font
        font = ImageFont.load_default(size=24)
        draw.text((100, 150), "H.E.S", fill=(255, 255, 255, 255), font=font, anchor="mm")
    except Exception:
        # Fallback text draw
        draw.text((100, 150), "H.E.S", fill=(255, 255, 255, 255), anchor="mm")
        
    img.save('logo.png')
    print("Logo généré avec succès.")

if __name__ == '__main__':
    generate_logo()
