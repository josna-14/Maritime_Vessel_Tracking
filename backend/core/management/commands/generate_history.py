import random
import math
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Vessel, Voyage, VoyageTrack, Port

class Command(BaseCommand):
    help = 'Generates realistic historical tracks for ALL vessels'

    def handle(self, *args, **kwargs):
        self.stdout.write("Generating historical tracks for ALL vessels...")
        
        # ✅ CHANGE: Removed [:10] to process every single vessel
        vessels = Vessel.objects.all()
        
        if not vessels.exists():
            self.stdout.write("No vessels found. Run enrich_vessels first.")
            return

        ports = list(Port.objects.all())
        count = 0
        
        for vessel in vessels:
            # Create Voyage if missing
            voyage, created = Voyage.objects.get_or_create(
                vessel=vessel,
                defaults={
                    'port_from': random.choice(ports) if ports else None,
                    'port_to': random.choice(ports) if ports else None,
                    'status': 'In Transit',
                    'departure_time': timezone.now() - timedelta(days=2),
                    'arrival_time': timezone.now() + timedelta(days=5),
                }
            )

            # Check if tracks already exist to avoid duplicates
            if VoyageTrack.objects.filter(vessel=vessel).exists():
                continue

            # Generate 20 track points (simulated path)
            current_lat = vessel.last_position_lat or 0.0
            current_lon = vessel.last_position_lon or 0.0
            
            if current_lat == 0 and current_lon == 0:
                continue

            for i in range(20):
                time_offset = timedelta(minutes=60 * i)
                timestamp = timezone.now() - time_offset

                # Simple curve math
                lat_offset = (i * 0.05) + (math.sin(i * 0.2) * 0.02)
                lon_offset = (i * 0.05) + (math.cos(i * 0.2) * 0.02)

                VoyageTrack.objects.create(
                    vessel=vessel,
                    latitude=current_lat - lat_offset,
                    longitude=current_lon - lon_offset,
                    speed=random.uniform(10, 18),
                    course=random.uniform(0, 360),
                    timestamp=timestamp
                )
            
            count += 1
            if count % 10 == 0:
                self.stdout.write(f"Processed {count} vessels...")

        self.stdout.write(self.style.SUCCESS(f'Successfully generated history for {count} vessels!'))