"""Tiny fake market-data library. Deterministic, no network calls."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass
class Quote:
    symbol: str
    price: float
    volume: int
    timestamp: int  # unix seconds


_SYMBOLS = ["DKK1", "DKK2", "EUR1", "EUR2", "GAS1", "PWR1", "PWR2"]


def fetch_quotes(symbol: str, count: int = 10, seed: int = 42) -> list[Quote]:
    """Generate a deterministic series of fake quotes for `symbol`."""
    if symbol not in _SYMBOLS:
        raise ValueError(f"unknown symbol: {symbol!r} (try one of {_SYMBOLS})")
    rng = random.Random((symbol, seed))
    base = 100 + rng.random() * 50
    return [
        Quote(
            symbol=symbol,
            price=round(base + math.sin(i / 3) * 5 + rng.random() * 2, 2),
            volume=int(1000 + rng.random() * 5000),
            timestamp=1_700_000_000 + i * 60,
        )
        for i in range(count)
    ]


def list_symbols() -> list[str]:
    return list(_SYMBOLS)


def filter_by_volume(quotes: list[Quote], min_volume: int) -> list[Quote]:
    return [q for q in quotes if q.volume >= min_volume]


def summarize_quotes(quotes: list[Quote]) -> dict:
    if not quotes:
        return {"count": 0}
    prices = [q.price for q in quotes]
    return {
        "count": len(quotes),
        "symbol": quotes[0].symbol,
        "mean_price": round(sum(prices) / len(prices), 4),
        "min_price": min(prices),
        "max_price": max(prices),
        "total_volume": sum(q.volume for q in quotes),
    }


def detect_outliers(quotes: list[Quote], z_threshold: float = 2.0) -> list[Quote]:
    if len(quotes) < 2:
        return []
    prices = [q.price for q in quotes]
    mean = sum(prices) / len(prices)
    var = sum((p - mean) ** 2 for p in prices) / len(prices)
    sd = math.sqrt(var)
    if sd == 0:
        return []
    return [q for q in quotes if abs(q.price - mean) / sd >= z_threshold]
