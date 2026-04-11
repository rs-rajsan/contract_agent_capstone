import sys
import os
# Add backend to path
sys.path.append(os.getcwd())

from backend.shared.utils.logger import get_logger

logger = get_logger("test_logger")
logger.info("Test log to verify schema hardening")
