"""Generates a deterministic 5,000-line synthetic log file at `sample.log`.

Run once before the workshop. The output is committed; no need to regenerate.
"""

from __future__ import annotations

import datetime as dt
import random
from pathlib import Path

LINES = 5_000
SEED = 42

ERROR_MESSAGES = [
    "DB connection refused",
    "DB connection refused (retry 1)",
    "DB connection refused (retry 2)",
    "Timeout waiting for upstream service",
    "Timeout waiting for upstream service after 3000ms",
    "Cache miss exceeded threshold",
    "Auth token expired",
    "Auth token invalid",
    "Rate limit exceeded for client",
]

WARN_MESSAGES = [
    "Slow query detected",
    "Retrying failed request",
    "Cache miss",
    "Backoff applied for client",
]

INFO_MESSAGES = [
    "Request started",
    "Request completed in {latency}ms",
    "Healthcheck OK",
    "Cache hit",
]


def synth():
    rng = random.Random(SEED)
    start = dt.datetime(2026, 4, 28, 9, 0, 0)
    out: list[str] = []

    for i in range(LINES):
        ts = start + dt.timedelta(seconds=i * rng.randint(1, 4))
        if i % 1377 == 0:
            ts_str = ts.strftime("%Y-%m-%dT%H:%M:%S+02:00")
        else:
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")

        request_id = f"req-{rng.randint(1000, 9999)}"

        roll = rng.random()
        if roll < 0.02:
            msg = rng.choice(ERROR_MESSAGES)
            line = f"[{ts_str}] [ERROR] [{request_id}] {msg}"
        elif roll < 0.10:
            msg = rng.choice(WARN_MESSAGES)
            line = f"[{ts_str}] [WARN] [{request_id}] {msg}"
        else:
            template = rng.choice(INFO_MESSAGES)
            if "{latency}" in template:
                latency = rng.randint(5, 1500)
                if rng.random() < 0.005:
                    latency = rng.randint(5000, 15000)
                msg = template.format(latency=latency)
            else:
                msg = template
            line = f"[{ts_str}] [INFO] [{request_id}] {msg}"

        if rng.random() < 0.0015:
            line = line.replace("[INFO] ", "")
        if rng.random() < 0.0008:
            line = "Caught exception: error parsing user input"

        out.append(line)

    Path(__file__).parent.joinpath("sample.log").write_text("\n".join(out) + "\n")


if __name__ == "__main__":
    synth()
