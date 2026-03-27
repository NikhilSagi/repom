from functools import lru_cache
from src.frontend.call_agent import AgentCaller

@lru_cache()
def get_agent_caller():
    """
    Dependency to get a singleton AgentCaller instance.
    """
    return AgentCaller()
