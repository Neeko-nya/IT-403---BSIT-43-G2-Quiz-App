from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User,
    Class,
    ClassMembership,
    Quiz,
    Question,
    QuizQuestion,
    Response,
    Grade,
)


# Customize the UserAdmin class to include the role in the list display
class CustomUserAdmin(UserAdmin):
    # Add 'role' to the list of fields to display in the user list view
    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "date_joined",
        "last_login",
    )

    # Include 'role' in the fieldsets for editing user details
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        ("Role", {"fields": ("role",)}),  # Add role to the form
    )

    # Include 'role' in the 'add_fieldsets' for creating new users
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "password1", "password2", "role"),
            },
        ),
    )


# Register the custom UserAdmin for the User model
admin.site.register(User, CustomUserAdmin)

# Register the other models as before
admin.site.register(Class)
admin.site.register(ClassMembership)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(QuizQuestion)
admin.site.register(Response)
admin.site.register(Grade)
