"""Create a square Windows icon from the redesigned dashboard logo."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 128
BACKGROUND = (3, 10, 26, 255)
ROOT = Path(__file__).resolve().parents[1]


def decode_logo(path: Path) -> tuple[int, int, list[bytearray]]:
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Dashboard logo is not a PNG image: {path}")

    width = height = bit_depth = color_type = interlace = None
    compressed = bytearray()
    offset = 8
    while offset < len(data):
        length = struct.unpack_from(">I", data, offset)[0]
        kind = data[offset + 4 : offset + 8]
        chunk = data[offset + 8 : offset + 8 + length]
        offset += length + 12
        if kind == b"IHDR":
            width, height, bit_depth, color_type, compression, filtering, interlace = struct.unpack(
                ">IIBBBBB", chunk
            )
            if compression != 0 or filtering != 0:
                raise ValueError("Unsupported PNG compression or filter method")
        elif kind == b"IDAT":
            compressed.extend(chunk)
        elif kind == b"IEND":
            break

    if bit_depth != 8 or color_type != 6 or interlace != 0:
        raise ValueError("Dashboard logo must be a non-interlaced 8-bit RGBA PNG")
    assert width is not None and height is not None

    stride = width * 4
    decoded = zlib.decompress(compressed)
    rows: list[bytearray] = []
    cursor = 0
    for _ in range(height):
        filter_type = decoded[cursor]
        cursor += 1
        row = bytearray(decoded[cursor : cursor + stride])
        cursor += stride
        previous = rows[-1] if rows else bytearray(stride)
        for index in range(stride):
            left = row[index - 4] if index >= 4 else 0
            above = previous[index]
            upper_left = previous[index - 4] if index >= 4 else 0
            if filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = above
            elif filter_type == 3:
                predictor = (left + above) // 2
            elif filter_type == 4:
                estimate = left + above - upper_left
                distances = (abs(estimate - left), abs(estimate - above), abs(estimate - upper_left))
                predictor = (left, above, upper_left)[distances.index(min(distances))]
            elif filter_type == 0:
                predictor = 0
            else:
                raise ValueError(f"Unsupported PNG row filter: {filter_type}")
            row[index] = (row[index] + predictor) & 0xFF
        rows.append(row)
    if cursor != len(decoded):
        raise ValueError("Unexpected trailing data in dashboard logo PNG")
    return width, height, rows


def png_chunk(kind: bytes, content: bytes) -> bytes:
    return (
        struct.pack(">I", len(content))
        + kind
        + content
        + struct.pack(">I", zlib.crc32(kind + content) & 0xFFFFFFFF)
    )


def make_icon_png() -> bytes:
    logo_path = ROOT / "orbitpilot" / "static" / "dashboard-logo.png"
    width, height, logo = decode_logo(logo_path)
    if width > SIZE or height > SIZE:
        raise ValueError(f"Dashboard logo dimensions exceed {SIZE}x{SIZE}: {width}x{height}")

    canvas = bytearray(BACKGROUND * (SIZE * SIZE))
    origin_x = (SIZE - width) // 2
    origin_y = (SIZE - height) // 2
    for y, row in enumerate(logo):
        for x in range(width):
            source = row[x * 4 : x * 4 + 4]
            alpha = source[3]
            target_index = ((origin_y + y) * SIZE + origin_x + x) * 4
            inverse_alpha = 255 - alpha
            for channel in range(3):
                canvas[target_index + channel] = (
                    source[channel] * alpha + BACKGROUND[channel] * inverse_alpha + 127
                ) // 255
            canvas[target_index + 3] = 255

    scanlines = b"".join(
        b"\0" + canvas[y * SIZE * 4 : (y + 1) * SIZE * 4] for y in range(SIZE)
    )
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">2I5B", SIZE, SIZE, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(scanlines, 9))
        + png_chunk(b"IEND", b"")
    )


def main() -> None:
    png = make_icon_png()
    icon = (
        struct.pack("<HHH", 0, 1, 1)
        + struct.pack("<BBBBHHII", SIZE, SIZE, 0, 0, 1, 32, len(png), 22)
        + png
    )
    destination = ROOT / "assets" / "OrbitPilotAI.ico"
    destination.write_bytes(icon)
    print(f"Created {destination}")


if __name__ == "__main__":
    main()
