from django.urls import path
from partner_login import views

urlpatterns = [
    path("", views.home, name="home"),
    path("health", views.health, name="health"),
    path("login", views.login, name="login"),
    path("auth/callback", views.callback, name="callback"),
    path("account", views.account, name="account"),
    path("logout", views.logout, name="logout"),
    path("unlink", views.unlink, name="unlink"),
]
