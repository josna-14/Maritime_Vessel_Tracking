from django.urls import path
from .views import home, RegisterView, LoginView

urlpatterns = [
    path('', home, name='home'),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
]
