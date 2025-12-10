from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Vessel, Port, Voyage, Event, Notification

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'role')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('username', 'email')
    ordering = ('username',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(Vessel)
admin.site.register(Port)
admin.site.register(Voyage)
admin.site.register(Event)
admin.site.register(Notification)
