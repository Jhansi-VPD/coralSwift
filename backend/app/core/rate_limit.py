"""In-process sliding-window rate limiter.

Per-instance limiter (fine for single-process dev / small deployments).
For multi-instance production, back this with Redis — the interface stays the same.
"""
import threading
import time

from app.core.exceptions import RateLimitedError


class SlidingWindowLimiter:
    def __init__(self, max_events: int, window_seconds: int):
        self.max_events = max_events
        self.window = window_seconds
        self._events: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        """Raise RateLimitedError when the caller exceeds the window budget."""
        now = time.time()
        with self._lock:
            stamps = [t for t in self._events.get(key, []) if now - t < self.window]
            if len(stamps) >= self.max_events:
                retry_after = max(1, int(stamps[0] + self.window - now))
                raise RateLimitedError(
                    f"Too many requests. Retry in {retry_after}s",
                    error_code="RATE_LIMITED",
                )
            stamps.append(now)
            self._events[key] = stamps

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)


# Shared limiters
login_limiter = SlidingWindowLimiter(max_events=5, window_seconds=15 * 60)
form_limiter = SlidingWindowLimiter(max_events=10, window_seconds=10 * 60)
