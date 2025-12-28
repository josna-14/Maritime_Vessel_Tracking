import asyncio
import websockets
import json
import os
import sys
import django
from asgiref.sync import sync_to_async
from django.utils import timezone

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from core.models import Vessel

# ==============================
# CONFIG
# ==============================
API_KEY = "fdc4a66852d00d880ef8565286774912c0d0c625"
BOUNDING_BOX = [[[-90, -180], [90, 180]]]  # whole world

# ==============================
# DB UPDATE FUNCTION
# ==============================
@sync_to_async
def update_vessel_in_db(mmsi, ship_name, lat, lon, speed, course):
    try:
        vessel, created = Vessel.objects.get_or_create(
            mmsi=str(mmsi),
            defaults={
                "name": ship_name or f"VESSEL-{mmsi}",
                "last_position_lat": lat,
                "last_position_lon": lon,
                "speed": speed,
                "course": course,
                "last_update": timezone.now(),
            }
        )

        if not created:
            vessel.name = ship_name or vessel.name
            vessel.last_position_lat = lat
            vessel.last_position_lon = lon
            vessel.speed = speed
            vessel.course = course
            vessel.last_update = timezone.now()
            vessel.save()

        return True

    except Exception as e:
        print(f"❌ DB Error for MMSI {mmsi}: {e}")
        return False


# ==============================
# AIS STREAM
# ==============================
async def connect_ais_stream():
    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        await websocket.send(json.dumps({
            "APIKey": API_KEY,
            "BoundingBoxes": BOUNDING_BOX,
            "FilterMessageTypes": ["PositionReport"]
        }))

        print("📡 Connected to Live AIS Stream... Waiting for ships...")

        async for message_json in websocket:
            try:
                message = json.loads(message_json)

                if message.get("MessageType") != "PositionReport":
                    continue

                ais = message["Message"]["PositionReport"]
                meta = message.get("MetaData", {})

                # ✅ SAFE extraction
                mmsi = ais.get("MMSI")
                lat = ais.get("Latitude")
                lon = ais.get("Longitude")
                speed = ais.get("Sog", 0)
                course = ais.get("Cog", 0)
                ship_name = meta.get("ShipName", "").strip()

                # ❗ skip invalid data
                if not mmsi or lat is None or lon is None:
                    continue

                await update_vessel_in_db(
                mmsi=ais.get("MMSI"),
                ship_name=meta.get("ShipName"),
                lat=ais.get("Latitude"),
                lon=ais.get("Longitude"),
                speed=ais.get("Sog"),
                course=ais.get("Cog"),
             )


            except Exception as e:
                print(f"⚠️ Stream Error: {e}")

# ==============================
# ENTRY POINT
# ==============================
if __name__ == "__main__":
    try:
        asyncio.run(connect_ais_stream())
    except KeyboardInterrupt:
        print("🛑 AIS Stream stopped.")
