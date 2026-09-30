"""Unit: sliding-window rate limiter."""
import pytest

from app.core.exceptions import RateLimitedError
from app.core.rate_limit import SlidingWindowLimiter


def test_allows_under_limit():
    limiter = SlidingWindowLimiter(max_events=3, window_seconds=60)
    limiter.check("ip1"); limiter.check("ip1"); limiter.check("ip1")  # no raise


def test_blocks_over_limit():
    limiter = SlidingWindowLimiter(max_events=2, window_seconds=60)
    limiter.check("ip2"); limiter.check("ip2")
    with pytest.raises(RateLimitedError):
        limiter.check("ip2")


def test_keys_are_isolated():
    limiter = SlidingWindowLimiter(max_events=1, window_seconds=60)
    limiter.check("a")
    limiter.check("b")  # different key → allowed


def test_reset_clears():
    limiter = SlidingWindowLimiter(max_events=1, window_seconds=60)
    limiter.check("a")
    limiter.reset("a")
    limiter.check("a")  # no raise
