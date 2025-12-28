from django.apps import AppConfig
import threading

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # Prevent double execution (Django reloads twice)
        import os
        if os.environ.get("RUN_MAIN") != "true":
            return

        try:
            from core.ais_fetcher import run_enrichment_loop
            thread = threading.Thread(
                target=run_enrichment_loop,
                daemon=True
            )
            thread.start()
            print("🚀 Vessel enrichment thread started")
        except Exception as e:
            print("❌ Enrichment startup error:", e)
