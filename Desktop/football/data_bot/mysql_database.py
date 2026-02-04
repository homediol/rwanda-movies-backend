import aiomysql
import asyncio
from typing import Optional, List, Dict, Any
from config.settings import Config
import urllib.parse

class MySQLManager:
    def __init__(self):
        self.pool: Optional[aiomysql.Pool] = None
        self._parse_database_url()
    
    def _parse_database_url(self):
        """Parse MySQL connection URL"""
        url = urllib.parse.urlparse(Config.DATABASE_URL)
        self.host = url.hostname or 'localhost'
        self.port = url.port or 3306
        self.user = url.username or 'root'
        self.password = url.password or ''
        self.database = url.path.lstrip('/') or 'football_db'
    
    async def connect(self):
        self.pool = await aiomysql.create_pool(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            db=self.database,
            minsize=1,
            maxsize=10,
            autocommit=True
        )
    
    async def close(self):
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
    
    async def execute(self, query: str, *args) -> int:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query, args)
                return cursor.rowcount
    
    async def fetch(self, query: str, *args) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, args)
                return await cursor.fetchall()
    
    async def fetchrow(self, query: str, *args) -> Optional[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, args)
                return await cursor.fetchone()