import json
import os
from datetime import datetime
from typing import Dict, List, Any

class JSONStorage:
    def __init__(self, base_path: str = "data"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
    
    def save_data(self, data: Dict[str, Any], filename: str = None):
        """Save data to JSON file with timestamp"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"football_data_{timestamp}.json"
        
        filepath = os.path.join(self.base_path, filename)
        
        # Add metadata
        data_with_meta = {
            "timestamp": datetime.now().isoformat(),
            "data_sources": ["API-Football", "Football-Data.org", "Odds-API"],
            "data": data
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data_with_meta, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"Data saved to: {filepath}")
        return filepath
    
    def load_data(self, filename: str) -> Dict[str, Any]:
        """Load data from JSON file"""
        filepath = os.path.join(self.base_path, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def append_to_master_file(self, data: Dict[str, Any]):
        """Append data to master JSON file"""
        master_file = os.path.join(self.base_path, "master_football_data.json")
        
        # Load existing data or create new
        if os.path.exists(master_file):
            with open(master_file, 'r', encoding='utf-8') as f:
                master_data = json.load(f)
        else:
            master_data = {"entries": []}
        
        # Add new entry
        entry = {
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        master_data["entries"].append(entry)
        
        # Save updated master file
        with open(master_file, 'w', encoding='utf-8') as f:
            json.dump(master_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"Data appended to master file: {master_file}")
        return master_file