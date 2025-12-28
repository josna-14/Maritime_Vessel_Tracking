from django.db import models
from django.contrib.auth.models import AbstractUser

# -------------------------
# AUTH MODELS
# -------------------------
class RiskZone(models.Model):
    RISK_TYPES = [
        ('WEATHER', 'Weather Risk'),
        ('PIRACY', 'Safety/Piracy Zone'),
        ('CONGESTION', 'High Congestion Area'),
    ]
    name = models.CharField(max_length=100)
    risk_type = models.CharField(max_length=20, choices=RISK_TYPES)
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius_km = models.FloatField(help_text="Radius of the risk zone in km")
    severity = models.CharField(max_length=20, default='Medium') # Low, Medium, High
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "risk_zones"
        managed = True  # Django will create this table for you

    def __str__(self):
        return f"{self.risk_type}: {self.name}"

class User(AbstractUser):
    role = models.CharField(max_length=50, default="user")
    # ✅ ADD THIS LINE to fix the "Field created_at doesn't have a default value" error
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_user"
        managed = True

    def __str__(self):
        return self.username


class AppUser(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100, unique=True)
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    isactive = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"
        managed = False

    def __str__(self):
        return self.username


class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)
    isactive = models.BooleanField(default=True)

    class Meta:
        db_table = "roles"
        managed = False

    def __str__(self):
        return self.role_name


class UserRole(models.Model):
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        db_column="user_id"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column="role_id"
    )
    isactive = models.BooleanField(default=True)

    class Meta:
        db_table = "user_roles"
        managed = False
        unique_together = (("user", "role"),)

    def __str__(self):
        return f"{self.user.username} → {self.role.role_name}"


# -------------------------
# MARITIME CORE MODELS
# -------------------------

class Vessel(models.Model):
    mmsi = models.CharField(max_length=20, unique=True, null=True)
    imo_number = models.CharField(max_length=50, null=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, default="Unknown")
    flag = models.CharField(max_length=100, default="Unknown")
    cargo_type = models.CharField(max_length=100, null=True)
    operator = models.CharField(max_length=255, default="Unknown Operator")
    last_position_lat = models.FloatField(null=True)
    last_position_lon = models.FloatField(null=True)
    speed = models.FloatField(null=True)
    course = models.FloatField(null=True)
    last_update = models.DateTimeField(null=True)

    class Meta:
        db_table = "vessels"
        managed = False

    def __str__(self):
        return self.name


class Port(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True)
    country = models.CharField(max_length=100)
    congestion_score = models.FloatField(null=True)
    avg_wait_time = models.FloatField(null=True)
    arrivals = models.IntegerField(default=0)
    departures = models.IntegerField(default=0)
    last_update = models.DateTimeField(null=True)

    class Meta:
        db_table = "ports"
        managed = False

    def __str__(self):
        return self.name


class Voyage(models.Model):
    vessel = models.ForeignKey(
        Vessel,
        db_column="vessel_id",
        on_delete=models.RESTRICT,
        null=True
    )
    port_from = models.ForeignKey(
        Port,
        db_column="port_from",
        related_name="voyages_from",
        on_delete=models.RESTRICT,
        null=True
    )
    port_to = models.ForeignKey(
        Port,
        db_column="port_to",
        related_name="voyages_to",
        on_delete=models.RESTRICT,
        null=True
    )
    departure_time = models.DateTimeField(null=True)
    arrival_time = models.DateTimeField(null=True)
    status = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "voyages"
        managed = False

    def __str__(self):
        vessel = self.vessel.name if self.vessel else "Unknown Vessel"
        return f"{vessel} ({self.status})"


class VoyageTrack(models.Model):
    vessel = models.ForeignKey(
        Vessel,
        db_column="vessel_id",
        on_delete=models.CASCADE
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(null=True)
    course = models.FloatField(null=True)
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "voyage_tracks"
        managed = False

    def __str__(self):
        return f"{self.vessel.name} @ {self.timestamp}"


class Event(models.Model):
    vessel = models.ForeignKey(
        Vessel,
        db_column="vessel_id",
        on_delete=models.CASCADE,
        null=True
    )
    event_type = models.CharField(max_length=100, null=True)
    location = models.CharField(max_length=255, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(null=True)

    class Meta:
        db_table = "events"
        managed = False

    def __str__(self):
        vessel = self.vessel.name if self.vessel else "Unknown Vessel"
        return f"{self.event_type} - {vessel}"


class Notification(models.Model):
    user = models.ForeignKey(
        AppUser,
        db_column="user_id",
        on_delete=models.CASCADE,
        null=True
    )
    vessel = models.ForeignKey(
        Vessel,
        db_column="vessel_id",
        on_delete=models.SET_NULL,
        null=True
    )
    event = models.ForeignKey(
        Event,
        db_column="event_id",
        on_delete=models.SET_NULL,
        null=True
    )
    message = models.TextField(null=True)
    type = models.CharField(max_length=100, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        managed = False

    def __str__(self):
        return f"{self.type or 'Notification'}"
