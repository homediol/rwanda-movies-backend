import asyncio
import schedule
import time
from datetime import datetime
from data_bot.main import DataBot

class Scheduler:
    def __init__(self):
        self.bot = DataBot()
    
    async def initialize(self):
        await self.bot.initialize()
    
    async def daily_update(self):
        """Run daily data synchronization"""
        print(f"Starting daily update at {datetime.now()}")
        try:
            await self.bot.run_daily_sync()
            print("Daily update completed successfully")
        except Exception as e:
            print(f"Daily update failed: {e}")
    
    async def hourly_fixtures_update(self):
        """Update fixtures every hour"""
        print(f"Starting hourly fixtures update at {datetime.now()}")
        try:
            await self.bot.sync_fixtures()
            print("Hourly fixtures update completed")
        except Exception as e:
            print(f"Hourly fixtures update failed: {e}")
    
    def run_scheduler(self):
        """Run the scheduler"""
        # Schedule daily full sync at 6 AM
        schedule.every().day.at("06:00").do(
            lambda: asyncio.run(self.daily_update())
        )
        
        # Schedule hourly fixture updates
        schedule.every().hour.do(
            lambda: asyncio.run(self.hourly_fixtures_update())
        )
        
        print("Scheduler started. Waiting for scheduled tasks...")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

async def main():
    scheduler = Scheduler()
    await scheduler.initialize()
    scheduler.run_scheduler()

if __name__ == "__main__":
    asyncio.run(main())