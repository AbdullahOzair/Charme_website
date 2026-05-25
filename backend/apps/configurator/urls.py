# backend/apps/configurator/urls.py
from django.urls import path
from .views import GenerateDesignView, AnalyzeImageView

urlpatterns = [
    path('generate/',       GenerateDesignView.as_view(),  name='generate-design'),
    path('analyze-image/',  AnalyzeImageView.as_view(),    name='analyze-image'),
]
