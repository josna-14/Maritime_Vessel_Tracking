from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, AppUser, Vessel, Port,
    Voyage, VoyageTrack, Event, Notification, RiskZone,Alert
)

# -------------------------
# AUTH SERIALIZERS
# -------------------------

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data.get("username"),
            password=data.get("password")
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User inactive")
        data["user"] = user
        return data


# -------------------------
# MARITIME SERIALIZERS
# -------------------------

class VesselSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vessel
        fields = "__all__"


class PortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = "__all__"


# FIXED VOYAGE SERIALIZER (VERY IMPORTANT)
class VoyageSerializer(serializers.ModelSerializer):
    vessel_name = serializers.ReadOnlyField(source="vessel.name")
    vessel_id = serializers.IntegerField(source="vessel.id", read_only=True)
    origin = serializers.ReadOnlyField(source="port_from.name")
    destination = serializers.ReadOnlyField(source="port_to.name")

    class Meta:
        model = Voyage
        fields = [
            "id",
            "vessel_id",
            "vessel_name",
            "origin",
            "destination",
            "status"
        ]


class VoyageTrackSerializer(serializers.ModelSerializer):
    vessel_name = serializers.ReadOnlyField(source="vessel.name")

    class Meta:
        model = VoyageTrack
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    vessel_name = serializers.ReadOnlyField(source="vessel.name")

    class Meta:
        model = Event
        fields = "__all__"

class RiskZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskZone
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'