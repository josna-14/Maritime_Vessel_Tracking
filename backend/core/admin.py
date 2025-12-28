from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, UserRole, AppUser, Vessel, Port, Voyage, Event, Notification

# --- Django System User (core_user) ---
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )

admin.site.register(User, CustomUserAdmin)

# --- Role Management (New Tables) ---
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_name', 'isactive')
    list_filter = ('isactive',)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'isactive')
    list_filter = ('role', 'isactive')


@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'isactive', 'created_at') 
    search_fields = ('username', 'email')

@admin.register(Vessel)
class VesselAdmin(admin.ModelAdmin):
    list_display = ('name', 'imo_number', 'type', 'flag', 'operator')
    search_fields = ('name', 'imo_number')

@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'congestion_score')

@admin.register(Voyage)
class VoyageAdmin(admin.ModelAdmin):
    list_display = ('vessel', 'port_from', 'port_to', 'status')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('vessel', 'event_type', 'location', 'timestamp') 
    list_filter = ('event_type',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'vessel', 'timestamp')