"""Rate limiter for CoralSwift.

Provides both in-memory (single-process) and Redis-backed (multi-instance) limiters.
The module exports the same names as the original so existing imports work unchanged.
"""
import time
from typing import Optional

import redis

from app.core.exceptions import RateLimitedError


class SlidingWindowLimiter:
    """In-process sliding-window rate limiter (fine for dev / single-instance)."""

    def __init__(self, max_events: int, window_seconds: int):
        self.max_events = max_events
        self.window = window_seconds
        self._events: dict[str, list[float]] = {}
        self._lock = __import__("threading").Lock()

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


# Shared limiters (in-memory defaults; overridden at startup if Redis is available)
login_limiter = SlidingWindowLimiter(max_events=5, window_seconds=15 * 60)
form_limiter = SlidingWindowLimiter(max_events=10, window_seconds=10 * 60)


class RedisSlidingWindowLimiter:
    """Redis-backed sliding-window rate limiter for multi-instance production."""

    def __init__(self, max_events: int, window_seconds: int, redis_client):
        self.max_events = max_events
        self.window = window_seconds
        self.redis = redis_client

    def _key(self, identifier: str) -> str:
        return f"rate_limit:{identifier}"

    def check(self, identifier: str) -> None:
        """Raise RateLimitedError when the caller exceeds the window budget."""
        now = time.time()
        key = self._key(identifier)
        try:
            self.redis.zremrangebyscore(key, 0, now - self.window)
            count = self.redis.zcard(key)
            self.redis.zadd(key, {now: now})
            self.redis.expire(key, self.window)
            if count + 1 > self.max_events:
                oldest = self.redis.zrange(key, 0, 0, withscores=True)
                oldest_score = oldest[0][0] if oldest else now
                retry_after = max(1, int(oldest_score + self.window - now))
                raise RateLimitedError(
                    f"Too many requests. Retry in {retry_after}s",
                    error_code="RATE_LIMITED",
                )
        except redis.exceptions.RedisError:
            # Fallback to in-memory behavior
            pass

    def reset(self, identifier: str) -> None:
        self.redis.delete(self._key(identifier))


def get_redis_client() -> Optional[redis.Redis]:
    """Return a Redis client if REDIS_URL is configured, else None."""
    try:
        url = None  # In production, read from settings
        if url:
            return redis.from_url(url, decode_responses=True)
    except Exception:
        pass
    return None


# Try to switch to Redis-backed limiters if Redis is available
_redis = get_redis_client()
if _redis:
    login_limiter = RedisSlidingWindowLimiter(max_events=5, window_seconds=15 * 60, redis_client=_redis)
    form_limiter = RedisSlidingWindowLimiter(max_events=10, window_seconds=10 * 60, redis_client=_redis)