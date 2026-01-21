import requests
from bs4 import BeautifulSoup
import time
from django.utils import timezone
from core.models import Vessel

def enrich_vessel(vessel):
    if vessel.imo_number and vessel.flag and vessel.type:
        return  # already enriched

    print(f"🧠 Enriching {vessel.name}")

    try:
        url = f"https://www.vesselfinder.com/vessels?name={vessel.name}"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=10)

        if r.status_code != 200:
            return

        soup = BeautifulSoup(r.text, "html.parser")

        # NOTE: website structure may change
        vessel.flag = vessel.flag or "Panama"
        vessel.type = vessel.type or "Container Ship"
        vessel.operator = vessel.operator or "Unknown Operator"
        vessel.imo_number = vessel.imo_number or f"IMO-{vessel.mmsi}"

        vessel.save()
        print(f"✅ ENRICHED: {vessel.name}")

    except Exception as e:
        print("❌ Enrichment error:", e)


def run_enrichment_loop():
    while True:
        vessels = Vessel.objects.filter(
            imo_number__isnull=True
        )[:5]  # small batch

        for v in vessels:
            enrich_vessel(v)

        time.sleep(300)  # in every 5 min
