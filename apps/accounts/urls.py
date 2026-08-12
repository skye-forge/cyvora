from django.urls import path

from .views import LoginView, MeView, RefreshTokenView, RegisterView, ResendOtpView, VerifyOtpView

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("otp/verify/", VerifyOtpView.as_view(), name="auth-otp-verify"),
    path("otp/resend/", ResendOtpView.as_view(), name="auth-otp-resend"),
    path("refresh/", RefreshTokenView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
]
