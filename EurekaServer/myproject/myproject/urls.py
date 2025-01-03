from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),  # Django admin panel
    path("api/", include("api.urls")),  # Include all API-related routes
    path(
        "auth/", include("allauth.urls")
    ),  # Include allauth's routes (login, signup, social auth)
]
