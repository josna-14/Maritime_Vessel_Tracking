from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    role = models.CharField(max_length=50, default="user")

    class Meta:
        db_table = "core_user"
        managed = True   # Django manages only this table

class AppUser(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=100)
    email = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=50, null=True)
    created_at = models.DateTimeField()

    class Meta:
        db_table = "users"
        managed = False   # MySQL table, Django doesn't modify

    def __str__(self):
        return self.username


class Vessel(models.Model):
    imo_number = models.CharField(max_length=50, null=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, null=True)
    flag = models.CharField(max_length=100, null=True)
    cargo_type = models.CharField(max_length=100, null=True)
    operator = models.CharField(max_length=255, null=True)
    last_position_lat = models.FloatField(null=True)
    last_position_lon = models.FloatField(null=True)
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
        on_delete=models.RESTRICT
    )
    port_from = models.ForeignKey(
        Port,
        db_column="port_from",
        related_name="voyages_from",
        on_delete=models.RESTRICT
    )
    port_to = models.ForeignKey(
        Port,
        db_column="port_to",
        related_name="voyages_to",
        on_delete=models.RESTRICT
    )
    departure_time = models.DateTimeField(null=True)
    arrival_time = models.DateTimeField(null=True)
    status = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "voyages"
        managed = False

    def __str__(self):
        return f"{self.vessel.name} ({self.status})"



class Event(models.Model):
    vessel = models.ForeignKey(
        Vessel,
        db_column="vessel_id",
        on_delete=models.CASCADE
    )
    event_type = models.CharField(max_length=100, null=True)
    location = models.CharField(max_length=255, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(null=True)

    class Meta:
        db_table = "events"
        managed = False

    def __str__(self):
        return f"{self.event_type} - {self.vessel.name}"


class Notification(models.Model):
    user = models.ForeignKey(
        AppUser,
        db_column="user_id",
        on_delete=models.CASCADE
    )
    vessel = models.ForeignKey(
        Vessel,
        null=True,
        db_column="vessel_id",
        on_delete=models.SET_NULL
    )
    event = models.ForeignKey(
        Event,
        null=True,
        db_column="event_id",
        on_delete=models.SET_NULL
    )
    message = models.TextField(null=True)
    type = models.CharField(max_length=100, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        managed = False

    def __str__(self):
        return f"{self.type} - {self.user.username}"
