import google.oauth2.id_token
from google.auth.transport import requests
from django.contrib.auth import get_user_model
from django.conf import settings
from allauth.socialaccount.models import SocialAccount
from django.db import transaction

# Assuming that the custom User model has fields like 'first_name', 'last_name', 'role', etc.
User = get_user_model()


def authenticate_google_user(token):
    try:
        # Verify the Google token using Google's OAuth2 API
        request = requests.Request()
        id_info = google.oauth2.id_token.verify_oauth2_token(
            token, request, settings.GOOGLE_CLIENT_ID
        )

        # Ensure the token is valid and contains required information
        if id_info.get("email_verified"):
            # Retrieve the user info from Google
            email = id_info.get("email")
            first_name = id_info.get("given_name", "")
            last_name = id_info.get("family_name", "")
            picture = id_info.get("picture", "")

            # Using Django's get_or_create to either retrieve the existing user or create a new one
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": "student",  # Default role, you can adjust based on your business logic
                },
            )

            # Optionally update user details if it's an existing user
            if not created:
                user.first_name = first_name
                user.last_name = last_name
                user.save()

            # Create or update the social account associated with the Google login
            with transaction.atomic():
                # Attempt to fetch the existing social account linked with this email
                social_account = SocialAccount.objects.filter(
                    user=user, provider="google"
                ).first()

                if not social_account:
                    # If no existing social account, create a new one
                    social_account = SocialAccount.objects.create(
                        user=user,
                        provider="google",
                        uid=id_info.get("sub"),  # Google User ID
                        extra_data=id_info,  # Store full info received from Google
                    )
                else:
                    # Optionally update the social account info if needed
                    social_account.extra_data = id_info
                    social_account.save()

            return user
        else:
            return None
    except ValueError as e:
        # Token is invalid or expired
        return None
