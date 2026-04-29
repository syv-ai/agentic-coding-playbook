def parse_volume(raw: str) -> int:
    """Parse a human-entered volume string into an integer.

    Examples:
        "1.2k"        -> 1200
        "3,500"       -> 3500
        "2 million"   -> 2000000
        "  1500 "     -> 1500
    """
    s = raw.strip().lower().replace(",", "")

    multipliers = {
        "k": 1_000,
        "m": 1_000_000,
        "thousand": 1_000,
        "million": 1_000_000,
    }

    for suffix, mult in multipliers.items():
        if s.endswith(suffix):
            number_part = s[: -len(suffix)].strip()
            return int(float(number_part) * mult)

    return int(s)
