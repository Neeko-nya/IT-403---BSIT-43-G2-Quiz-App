# middleware.py in your Django app (e.g., 'myapp')


class CrossOriginHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the response from the view
        response = self.get_response(request)

        # Add COOP and COEP headers to the response
        response["Cross-Origin-Opener-Policy"] = "same-origin"
        response["Cross-Origin-Embedder-Policy"] = "require-corp"
        response["Cross-Origin-Resource-Policy"] = "same-origin"  # CORP header

        return response
