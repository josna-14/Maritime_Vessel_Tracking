from django.urls import path
from .views import (
    home,
    RegisterView,
    LoginView,
    VesselListView,
    PortListView,
    VoyageListView,
    EventListView,
    VoyageTrackView,
    RiskZoneListView,
    DashboardStatsView,
    
)

urlpatterns = [
    path("", home),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("vessels/", VesselListView.as_view()),
    path("ports/", PortListView.as_view()),
    path("voyages/", VoyageListView.as_view()),
    path("events/", EventListView.as_view()),
    path("voyage-track/<int:voyage_id>/", VoyageTrackView.as_view()),
    path("dashboard/", DashboardStatsView.as_view()),
    path("risks/", RiskZoneListView.as_view()),


]
