from django.urls import path
from authentication import views

urlpatterns = [
    path("", views.frontend, name="home"),
    path("health", views.health, name="health"),
    path("login", views.login, name="login"),
    path("auth/callback", views.callback, name="callback"),
    path("api/account", views.account, name="account"),
    path("api/logout", views.logout, name="logout"),
    path("api/unlink", views.unlink, name="unlink"),
]
