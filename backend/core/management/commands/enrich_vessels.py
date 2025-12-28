import random
from django.core.management.base import BaseCommand
from core.models import Vessel

class Command(BaseCommand):
    help = 'Enriches vessel data with realistic dummy values where data is missing'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting vessel enrichment...")
        
        # Real maritime data lists for simulation
        flags = ['Panama', 'Liberia', 'Marshall Islands', 'Singapore', 'Malta', 'Bahamas']
        types = ['Bulk Carrier', 'Container Ship', 'Oil Tanker', 'General Cargo', 'LNG Carrier']
        operators = ['Maersk Line', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'Evergreen Marine', 'ONE Network']

        # Get all vessels
        vessels = Vessel.objects.all()
        
        updated_count = 0

        for v in vessels:
            changed = False
            
            # Fix "Unknown" or missing Type
            if not v.type or "Unknown" in v.type:
                v.type = random.choice(types)
                changed = True
                
            # Fix "Unknown" or missing Flag
            if not v.flag or "Unknown" in v.flag:
                v.flag = random.choice(flags)
                changed = True
                
            # Fix "Unknown" Operator
            if not v.operator or "Unknown" in v.operator:
                v.operator = random.choice(operators)
                changed = True
                
            # Fix IMO Number (Generate random 7-digit if missing/invalid)
            if not v.imo_number or "None" in str(v.imo_number):
                v.imo_number = f"IMO-{random.randint(9000000, 9999999)}"
                changed = True

            # Save only if we updated something
            if changed:
                v.save()
                updated_count += 1
                self.stdout.write(f"Updated {v.name} -> {v.type} ({v.flag})")

        self.stdout.write(self.style.SUCCESS(f'Successfully enriched {updated_count} vessels!'))