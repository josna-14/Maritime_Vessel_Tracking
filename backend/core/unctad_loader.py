import random
from django.utils import timezone
from core.models import Port, Notification, RiskZone, AppUser

def fetch_unctad_ports():
    """
    Simulates fetching trade/congestion stats, updates Ports,
    and creates notifications linked to a system user.
    """
    print("Simulating UNCTAD Data Stream...")
    
    # 1. FIX: Get a valid user from the database to assign alerts to
    # We use AppUser because your SQL maps the 'users' table to the AppUser model
    system_user = AppUser.objects.first()
    
    # If no user exists, we cannot create notifications due to DB constraints
    if not system_user:
        print("CRITICAL WARNING: No users found in 'users' table. Notifications skipped to prevent crash.")
    
    ports = Port.objects.all()
    
    for port in ports:
        # Simulate data updates
        new_congestion = random.randint(10, 95)
        new_wait_time = round(random.uniform(2.5, 72.0), 1)
        
        port.congestion_score = new_congestion
        port.avg_wait_time = new_wait_time
        port.last_update = timezone.now()
        port.save()

        # Check for High Congestion (Task 3)
        if new_congestion > 85:
            # Create Map Overlay (Risk Zone)
            RiskZone.objects.get_or_create(
                name=f"Congestion: {port.name}",
                defaults={
                    'risk_type': 'CONGESTION',
                    'latitude': 0.0, # ideally fetch real lat/lon from Port model
                    'longitude': 0.0,
                    'radius_km': 20,
                    'severity': 'High',
                    'description': f"Critical congestion at {port.name}"
                }
            )
            
            # Create Notification ONLY if we have a user
            if system_user:
                Notification.objects.create(
                    user=system_user,  # <--- This fixes the IntegrityError
                    vessel=None,       
                    event=None,
                    message=f"CRITICAL: {port.name} congestion at {new_congestion}%. Wait time {new_wait_time}h.",
                    type="Congestion Alert",
                    timestamp=timezone.now()
                )

    print("UNCTAD Data Integrated and Notifications Processed.")