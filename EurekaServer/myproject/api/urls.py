# api/urls.py
from django.urls import path
from .views import api  # Import the NinjaAPI instance from views

urlpatterns = [
    path(
        "", api.urls
    ),  # Directly include all the routes from the NinjaAPI instance
]
