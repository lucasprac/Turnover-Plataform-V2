"""
Supabase Client Initialization

Provides a configured Supabase client for authentication operations.
"""
from supabase import create_client, Client
from config import settings


def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    
    Returns:
        Client: Configured Supabase client
        
    Raises:
        ValueError: If Supabase URL or key is not configured
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError(
            "Supabase URL and ANON_KEY must be set in environment variables. "
            "Copy .env.example to .env and fill in your Supabase credentials."
        )
    
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin_client() -> Client:
    """
    Create a Supabase client with service role key for admin operations.
    
    Returns:
        Client: Supabase client with admin privileges
        
    Raises:
        ValueError: If service role key is not configured
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "Supabase URL and SERVICE_ROLE_KEY must be set for admin operations."
        )
    
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# Lazy-loaded client instance
_client: Client | None = None


def get_client() -> Client:
    """Get or create the default Supabase client."""
    global _client
    if _client is None:
        _client = get_supabase_client()
    return _client
