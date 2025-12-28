from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse

from .models import Vessel, Port, Voyage, Event, VoyageTrack
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    VesselSerializer,
    PortSerializer,
    VoyageSerializer,
    EventSerializer,
    VoyageTrackSerializer,
)

# ... existing imports ...
from .models import RiskZone 
from .serializers import RiskZoneSerializer # <--- Import Serializer
from .unctad_loader import fetch_unctad_ports # <--- Import the loader

class RiskZoneListView(APIView):
    def get(self, request):
        risks = RiskZone.objects.all()
        return Response(RiskZoneSerializer(risks, many=True).data)

class DashboardStatsView(APIView):
    def get(self, request):
        # OPTIONAL: Trigger the data loader on refresh (for demo purposes)
        # In production, use Celery or a Cron job.
        fetch_unctad_ports() 

        return Response({
            "total_vessels": Vessel.objects.count(),
            "active_voyages": Voyage.objects.filter(status="In Transit").count(),
            "ports_monitored": Port.objects.count(),
            "recent_events": Event.objects.count(),
            
            # Add Congestion Stats for the Dashboard
            "high_congestion_ports": Port.objects.filter(congestion_score__gt=80).count(),
            "active_risks": RiskZone.objects.count(),
            
            "recent_voyages": VoyageSerializer(
                Voyage.objects.order_by("-departure_time")[:5],
                many=True
            ).data
        })


# -------------------------
# HOME
# -------------------------

def home(request):
    return JsonResponse({"message": "Backend API is running"})

# -------------------------
# AUTH
# -------------------------

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)


# In backend/core/views.py

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            
            # ✅ UPDATE: Return the role and username so Frontend can save them
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "role": user.role  # <--- CRITICAL: Sending role to frontend
            })
        return Response(serializer.errors, status=400)

# -------------------------
# DATA APIs
# -------------------------

class VesselListView(APIView):
    def get(self, request):
        vessels = Vessel.objects.all()
        return Response({
            "count": vessels.count(),
            "vessels": VesselSerializer(vessels, many=True).data
        })


class PortListView(APIView):
    def get(self, request):
        ports = Port.objects.all()
        return Response(PortSerializer(ports, many=True).data)


class VoyageListView(APIView):
    def get(self, request):
        voyages = Voyage.objects.order_by("-departure_time")[:10]
        return Response(VoyageSerializer(voyages, many=True).data)


class EventListView(APIView):
    def get(self, request):
        events = Event.objects.order_by("-timestamp")[:20]
        return Response(EventSerializer(events, many=True).data)

# -------------------------
# VOYAGE TRACK (REPLAY)
# -------------------------

class VoyageTrackView(APIView):
    """
    Returns AIS track points for a voyage (via vessel)
    """
    def get(self, request, voyage_id):

        # 1. Get voyage
        try:
            voyage = Voyage.objects.get(id=voyage_id)
        except Voyage.DoesNotExist:
            return Response(
                {"message": "Voyage not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Get AIS track using vessel from voyage
        tracks = (
            VoyageTrack.objects
            .filter(vessel=voyage.vessel)
            .order_by("timestamp")
        )

        if not tracks.exists():
            return Response(
                {"message": "No voyage track data found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = VoyageTrackSerializer(tracks, many=True)
        return Response(serializer.data)
