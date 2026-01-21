import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# 1. Setup Django Environment
# This allows us to access your database models from this script
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Vessel, Port, Voyage, Event, Notification, AppUser

# --- DATA GENERATORS ---

def create_ports():
    print("⚓ Populating Ports...")
    # List of major world ports with approximate locations
    ports_data = [
        {"name": "Port of Shanghai", "country": "China", "location": "31.2304, 121.4737"},
        {"name": "Port of Singapore", "country": "Singapore", "location": "1.290270, 103.851959"},
        {"name": "Port of Rotterdam", "country": "Netherlands", "location": "51.9244, 4.4777"},
        {"name": "Port of Los Angeles", "country": "USA", "location": "33.7288, -118.2620"},
        {"name": "Port of Busan", "country": "South Korea", "location": "35.1046, 129.0432"},
        {"name": "Port of Jebel Ali", "country": "UAE", "location": "24.9857, 55.0275"},
        {"name": "Port of Antwerp", "country": "Belgium", "location": "51.2194, 4.4025"},
        {"name": "Port of Hamburg", "country": "Germany", "location": "53.5488, 9.9872"},
        {"name": "Port of Tanjung Pelepas", "country": "Malaysia", "location": "1.3855, 103.541"},
        {"name": "Port of Valencia", "country": "Spain", "location": "39.4699, -0.3763"},
    ]

    for p in ports_data:
        Port.objects.get_or_create(
            name=p["name"],
            defaults={
                "country": p["country"],
                "location": p["location"],
                "congestion_score": random.uniform(1.0, 10.0),
                "avg_wait_time": random.randint(2, 48), # Hours
                "arrivals": random.randint(100, 5000),
                "departures": random.randint(100, 5000),
                "last_update": timezone.now()
            }
        )
    print(f"✅ Created {len(ports_data)} Ports.")

def create_voyages():
    print("🚢 Generating Voyages...")
    vessels = Vessel.objects.all()
    ports = list(Port.objects.all())

    if not vessels.exists() or not ports:
        print("⚠️ No vessels or ports found! Run the vessel scraper first.")
        return

    for vessel in vessels:
        # Create a random voyage for each vessel
        origin = random.choice(ports)
        destination = random.choice(ports)
        while destination == origin:
            destination = random.choice(ports)

        # Random times
        dept_time = timezone.now() - timedelta(days=random.randint(1, 10))
        arr_time = dept_time + timedelta(days=random.randint(5, 20))
        
        # Calculate status
        status = "In Transit" if arr_time > timezone.now() else "Completed"

        Voyage.objects.get_or_create(
            vessel=vessel,
            defaults={
                "port_from": origin,
                "port_to": destination,
                "departure_time": dept_time,
                "arrival_time": arr_time,
                "status": status
            }
        )
    print(f"Generated voyages for {vessels.count()} vessels.")

def create_events():
    print("🔔 Generating Events & Notifications...")
    vessels = Vessel.objects.all()
    event_types = ["Port Arrival", "Port Departure", "Speed Drop", "Route Deviation", "Bunker Stop"]
    
    # --- FIX START: Get or Create a System User ---
    # We need a user to assign notifications to.
    system_user = AppUser.objects.first()
    if not system_user:
        print("⚠️ No users found. Creating a 'System Admin' user...")
        # Create a dummy user ID=1 (or any ID) if table is empty
        system_user = AppUser.objects.create(
            id=1, 
            username="system_admin", 
            email="admin@maritimeos.com", 
            password="hashed_password_placeholder", 
            role="admin", 
            created_at=timezone.now()
        )
    # --- FIX END ---

    for vessel in vessels:
        # Create 1-2 random events per vessel
        for _ in range(random.randint(1, 2)):
            e_type = random.choice(event_types)
            
            # Create the Event
            event = Event.objects.create(
                vessel=vessel,
                event_type=e_type,
                location=f"{random.uniform(-90,90):.4f}, {random.uniform(-180,180):.4f}",
                details=f"Vessel {vessel.name} reported {e_type} near coordinates."
            )

            # Create the Notification (Assigned to system_user)
            Notification.objects.create(
                vessel=vessel,
                event=event,
                message=f"Alert: {e_type} detected for {vessel.name}",
                type="Alert",
                user=system_user  
            )
    
    print("✅ Generated events and notifications.")
    
if __name__ == "__main__":
    create_ports()
    create_voyages()
    create_events()
    print("🎉 All Data Populated Successfully!")