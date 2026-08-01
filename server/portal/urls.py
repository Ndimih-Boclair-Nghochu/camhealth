from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DrugOrderViewSet, FacilityView, HospitalPostViewSet, MeAppointmentsView,
    MeProfileView, MeRecordsView, MyLocationView, OnSiteStaffView,
    ShopDrugsView, SymptomCheckView,
)

router = DefaultRouter()
router.register("posts", HospitalPostViewSet, basename="post")
router.register("orders", DrugOrderViewSet, basename="order")

urlpatterns = [
    path("me/profile/", MeProfileView.as_view(), name="me-profile"),
    path("me/records/", MeRecordsView.as_view(), name="me-records"),
    path("me/appointments/", MeAppointmentsView.as_view(), name="me-appointments"),
    path("shop/drugs/", ShopDrugsView.as_view(), name="shop-drugs"),
    path("symptom-check/", SymptomCheckView.as_view(), name="symptom-check"),
    path("facility/", FacilityView.as_view(), name="facility"),
    path("me/location/", MyLocationView.as_view(), name="me-location"),
    path("staff/on-site/", OnSiteStaffView.as_view(), name="staff-on-site"),
] + router.urls
