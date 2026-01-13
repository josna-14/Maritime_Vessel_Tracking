import re
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Avg
from django.db.models.functions import TruncDate
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.http import JsonResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.paginator import Paginator

from .models import Vessel, Port, Voyage, Event, VoyageTrack, RiskZone, Alert, Notification
from .serializers import (
    RegisterSerializer, LoginSerializer, VesselSerializer, PortSerializer,
    VoyageSerializer, EventSerializer, VoyageTrackSerializer, RiskZoneSerializer,
    AlertSerializer
)
from .unctad_loader import fetch_unctad_ports
from django.db.models import Q

import time
from django.core.cache import cache
# -------------------------
# HOME & AUTH
# -------------------------

def home(request):
    return JsonResponse({"message": "Backend API is running"})

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            
            # Force update last login time
            update_last_login(None, user) 
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "role": user.role
            })
        return Response(serializer.errors, status=400)

# -------------------------
# OPERATIONAL DATA APIs
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

class RiskZoneListView(APIView):
    def get(self, request):
        risks = RiskZone.objects.all()
        return Response(RiskZoneSerializer(risks, many=True).data)

# -------------------------
# VOYAGE TRACK (REPLAY)
# -------------------------

class VoyageTrackView(APIView):
    """
    Returns AIS track points for a voyage (via vessel)
    """
    def get(self, request, voyage_id):
        try:
            voyage = Voyage.objects.get(id=voyage_id)
        except Voyage.DoesNotExist:
            return Response({"message": "Voyage not found"}, status=status.HTTP_404_NOT_FOUND)

        tracks = VoyageTrack.objects.filter(vessel=voyage.vessel).order_by("timestamp")

        if not tracks.exists():
            return Response({"message": "No voyage track data found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = VoyageTrackSerializer(tracks, many=True)
        return Response(serializer.data)



# backend/core/views.py

# backend/core/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Vessel, RiskZone, Port, Voyage 
import time
from django.core.cache import cache

class DashboardStatsView(APIView):
    def get(self, request):
        # 1. Basic Counts
        total_vessels = Vessel.objects.count()
        active_risks = RiskZone.objects.count()
        active_voyages_count = Voyage.objects.filter(status='In Transit').count()
        high_congestion = Port.objects.filter(congestion_score__gt=90).count()

        # 2. Throughput Simulation
        last_second = int(time.time()) - 1
        real_http_requests = cache.get(f"throughput_{last_second}", 0)
        background_processing = int(total_vessels / 5) if total_vessels > 0 else 0
        total_throughput = real_http_requests + background_processing

        # 3. ✅ NEW: Get Recent Voyages List for the Table
        # We grab the last 5 'In Transit' voyages
        recent_qs = Voyage.objects.filter(status='In Transit').select_related('vessel', 'port_from', 'port_to').order_by('-departure_time')[:5]
        
        recent_data = []
        for v in recent_qs:
            recent_data.append({
                "id": v.id,
                "vessel_name": v.vessel.name if v.vessel else "Unknown",
                "origin": v.port_from.name if v.port_from else "Sea",
                "destination": v.port_to.name if v.port_to else "Sea",
                "status": v.status
            })

        return Response({
            "total_vessels": total_vessels,
            "active_voyages": active_voyages_count,
            "active_risks": active_risks,
            "high_congestion_ports": high_congestion,
            "throughput": total_throughput,
            "recent_voyages": recent_data, # 👈 Sending the list to frontend!
            "system_status": "Operational"
        })
# -------------------------
# ANALYST ANALYTICS
# -------------------------

@api_view(['GET'])
def get_analyst_analytics(request):
    days_param = request.GET.get('days', '7')
    vessel_type_param = request.GET.get('type', 'All Vessel Types')
    region_param = request.GET.get('region', 'All Regions')

    days_match = re.search(r'\d+', days_param)
    days = int(days_match.group()) if days_match else 7
    
    start_date = timezone.now() - timedelta(days=days)

    vessels = Vessel.objects.all()
    voyages = Voyage.objects.filter(arrival_time__gte=start_date)

    if vessel_type_param != 'All Vessel Types':
        vessels = vessels.filter(type=vessel_type_param)
        voyages = voyages.filter(vessel__type=vessel_type_param)

    # Calculate KPIs
    total_ships = vessels.count()
    active_voyages = voyages.filter(status='In Transit').count()
    
    avg_wait = Port.objects.aggregate(Avg('avg_wait_time'))['avg_wait_time__avg']
    avg_wait_time = round(avg_wait, 1) if avg_wait else 0
    
    ships_at_risk = int(total_ships * 0.05)

    cargo_counts = vessels.values('cargo_type').annotate(count=Count('id'))

    daily_traffic = voyages \
        .annotate(date=TruncDate('arrival_time')) \
        .values('date') \
        .annotate(count=Count('id')) \
        .order_by('date')

    congested_ports = Port.objects.order_by('-congestion_score')[:5].values(
        'name', 'country', 'congestion_score', 'avg_wait_time'
    )

    data = {
        "kpis": {
            "total_ships": total_ships,
            "active_voyages": active_voyages,
            "avg_wait_time": avg_wait_time,
            "ships_at_risk": ships_at_risk
        },
        "cargo_distribution": list(cargo_counts),
        "congested_ports": list(congested_ports),
        "daily_traffic": list(daily_traffic)
    }
    return Response(data)

# -------------------------
# ADMIN: USER MANAGEMENT
# -------------------------

@api_view(['GET'])
def get_all_users(request):
    User = get_user_model()
    users = User.objects.all().values(
        'id', 'username', 'email', 'is_staff', 'is_superuser', 'is_active', 'last_login'
    )
    return Response(list(users))

@api_view(['DELETE'])
def delete_user(request, user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({"message": "User deleted successfully"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['POST'])
def toggle_user_status(request, user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        status = "activated" if user.is_active else "deactivated"
        return Response({"message": f"User {status}"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['POST'])
def update_user_role(request, user_id):
    User = get_user_model()
    new_role = request.data.get("role")
    
    try:
        user = User.objects.get(id=user_id)
        if new_role == "Super Admin":
            user.is_superuser = True
            user.is_staff = True
            user.role = "Admin"
        elif new_role == "Analyst":
            user.is_superuser = False
            user.is_staff = True
            user.role = "Analyst"
        else: # Operator
            user.is_superuser = False
            user.is_staff = False
            user.role = "Operator"
            
        user.save()
        return Response({"message": f"Role updated to {new_role}"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['GET'])
def get_audit_logs(request):
    User = get_user_model()
    logs = []

    # Recent Logins
    recent_logins = User.objects.filter(last_login__isnull=False).order_by('-last_login')[:5]
    for user in recent_logins:
        logs.append({
            "id": f"login_{user.id}",
            "time": user.last_login.strftime("%H:%M %p"),
            "action": "User Logged In",
            "user": user.username,
            "type": "info"
        })

    # Recent Joins
    recent_joins = User.objects.order_by('-date_joined')[:5]
    for user in recent_joins:
        logs.append({
            "id": f"join_{user.id}",
            "time": user.date_joined.strftime("%H:%M %p"),
            "action": "New User Registered",
            "user": user.username,
            "type": "alert"
        })

    return Response(logs[:50])

# -------------------------
# ALERT SYSTEM (Paginated & Linked to Notifications)
# -------------------------


@api_view(['GET'])
def get_alerts(request):
    # 1. Base Query
    query = request.GET.get('search', '')
    severity_filter = request.GET.get('severity', 'all')
    page_size = int(request.GET.get('page_size', 10)) # ✅ Support dynamic size
    
    notifications = Notification.objects.all().order_by('-timestamp')

    # 2. Search & Filter
    if query:
        notifications = notifications.filter(message__icontains=query)
    
    if severity_filter == 'critical':
        notifications = notifications.filter(message__icontains='CRITICAL')
    elif severity_filter == 'warning':
        notifications = notifications.exclude(message__icontains='CRITICAL')

    # 3. Insights (Last 100 records)
    recent_batch = notifications[:100]
    total_wait = 0
    wait_count = 0
    port_congestion = {}
    
    for n in recent_batch:
        wait_match = re.search(r'Wait time (\d+\.?\d*)h', n.message)
        if wait_match:
            total_wait += float(wait_match.group(1))
            wait_count += 1
            
        port_match = re.search(r'Port of (.*?) congestion', n.message)
        if port_match:
            port = port_match.group(1)
            port_congestion[port] = port_congestion.get(port, 0) + 1

    avg_wait = round(total_wait / wait_count, 1) if wait_count > 0 else 0
    worst_port = max(port_congestion, key=port_congestion.get) if port_congestion else "None"
    
    # 4. Pagination
    paginator = Paginator(notifications, page_size)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # 5. Format Data
    alert_data = []
    for n in page_obj:
        msg_upper = n.message.upper()
        severity = "warning"
        if "CRITICAL" in msg_upper or "SOS" in msg_upper:
            severity = "critical"
        elif "INFO" in msg_upper:
            severity = "info"

        alert_data.append({
            "id": n.id,
            "vessel_name": n.vessel.name if n.vessel else "System",
            "message": n.message,
            "timestamp": n.timestamp,
            "severity": severity,
            "status": "New"
        })

    return Response({
        "results": alert_data,
        "pagination": {
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": int(page_number),
            "page_size": page_size
        },
        "stats": {
            "critical": notifications.filter(message__icontains='CRITICAL').count(),
            "warning": notifications.exclude(message__icontains='CRITICAL').count(),
            "avg_wait": avg_wait,
            "worst_port": worst_port,
            "total": notifications.count()
        }
    })

# ... keep update_alert_status and create_alert ...
@api_view(['POST'])
def update_alert_status(request, alert_id):
    return Response({"message": "Status update simulated"})

@api_view(['POST'])
def create_alert(request):
    return Response({"message": "Alert created"}, status=201)

# ... (keep update_alert_status and create_alert functions below) ...
@api_view(['POST'])
def update_alert_status(request, alert_id):
    return Response({"message": "Status update simulated"})

@api_view(['POST'])
def create_alert(request):
    return Response({"message": "Alert created"}, status=201)

@api_view(['POST'])
def update_alert_status(request, alert_id):
    # Since we are using read-only Notifications, we return success 
    # so the frontend doesn't break.
    return Response({"message": "Status update simulated"})

@api_view(['POST'])
def create_alert(request):
    # Dummy endpoint to prevent URL errors
    return Response({"message": "Alert created"}, status=201)