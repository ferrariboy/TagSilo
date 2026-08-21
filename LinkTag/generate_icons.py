import os
import zlib
import struct

def create_png(width, height, color_func):
    """
    Creates a valid PNG image byte buffer with specified width, height, and color generator function.
    color_func takes (x, y) and returns (r, g, b, a).
    """
    # Raw RGBA image data
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None) for each scanline
        for x in range(width):
            r, g, b, a = color_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    # Compress image data
    compressed_data = zlib.compress(raw_data)
    
    # Helper to construct PNG chunks
    def chunk(chunk_type, data):
        length = len(data)
        checksum = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', checksum)
    
    # PNG Header
    header = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk: width, height, bit_depth=8, color_type=6 (RGBA), compression=0, filter=0, interlace=0
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = chunk(b'IHDR', ihdr)
    
    # IDAT chunk
    idat_chunk = chunk(b'IDAT', compressed_data)
    
    # IEND chunk
    iend_chunk = chunk(b'IEND', b'')
    
    return header + ihdr_chunk + idat_chunk + iend_chunk

def icon_color(x, y, w, h):
    # Normalized coordinates (-1 to 1)
    cx, cy = (x / (w - 1)) * 2 - 1, (y / (h - 1)) * 2 - 1
    dist_sq = cx*cx + cy*cy
    
    # Background: dark charcoal slate gradient (#0f172a to #1e293b)
    # Rounded box corners
    corner_r = 0.25
    abs_x, abs_y = abs(cx), abs(cy)
    if abs_x > (1 - corner_r) and abs_y > (1 - corner_r):
        corner_dist = ((abs_x - (1 - corner_r))**2 + (abs_y - (1 - corner_r))**2)**0.5
        if corner_dist > corner_r:
            return (0, 0, 0, 0)  # Transparent corners
            
    # Base background color (#0f172a)
    bg_r, bg_g, bg_b = 15, 23, 42
    
    # Glowing Cobalt accent (#2563eb / #3b82f6)
    # Draw a stylized tag / link icon symbol
    # Center circle / pill shape
    is_tag = False
    
    # Draw link/tag diagonal emblem
    # Check if inside tag emblem polygon / shape
    px, py = cx + cy * 0.2, cy - cx * 0.2
    if -0.4 <= px <= 0.4 and -0.4 <= py <= 0.4:
        # Tag hole or body
        if (px - 0.2)**2 + (py - 0.2)**2 < 0.03:
            # Tag hole
            is_tag = False
        else:
            is_tag = True
            
    if is_tag:
        # Vibrant Cobalt Blue (#3b82f6)
        return (59, 130, 246, 255)
    else:
        # Subtle glowing gradient from top-left
        glow = max(0, 1 - dist_sq * 0.6)
        r = int(bg_r + glow * 20)
        g = int(bg_g + glow * 30)
        b = int(bg_b + glow * 60)
        return (r, g, b, 255)

def main():
    os.makedirs('icons', exist_ok=True)
    sizes = [16, 48, 128]
    for size in sizes:
        png_bytes = create_png(size, size, icon_color)
        filepath = os.path.join('icons', f'icon-{size}.png')
        with open(filepath, 'wb') as f:
            f.write(png_bytes)
        print(f"Generated {filepath} ({size}x{size})")

if __name__ == '__main__':
    main()
