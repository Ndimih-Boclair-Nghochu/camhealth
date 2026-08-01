from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from common.models import generate_code
from common.permissions import IsAdmin

from .models import AuditLog, Branch, Role, User
from .serializers import (
    ActivateSerializer, AuditLogSerializer, BranchSerializer,
    RegisterSerializer, StaffSerializer, UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """Public endpoint: create an account and receive JWT tokens immediately."""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class IsAdminRole(permissions.BasePermission):
    """Only administrators may manage staff accounts or read the audit trail."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == "ADMIN"))


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name")
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]


class BranchViewSet(viewsets.ModelViewSet):
    """Hospital branches — managed by an administrator."""

    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]


class StaffViewSet(viewsets.ModelViewSet):
    """Admin creates staff (any role, any branch). Each new staff gets a
    matricule and stays unactivated until they claim the account with it."""

    serializer_class = StaffSerializer
    permission_classes = [IsAdmin]
    # Restrict detail lookups to UUIDs so /staff/on-site/ (portal) isn't captured.
    lookup_value_regex = "[0-9a-fA-F-]{36}"

    def get_queryset(self):
        return User.objects.exclude(role=Role.PATIENT).select_related("branch").order_by("first_name", "last_name")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        matricule = generate_code(User, "matricule", "STF")
        user = User(
            username=matricule,
            matricule=matricule,
            activated=False,
            is_active=True,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            role=data.get("role") or Role.RECEPTIONIST,
            branch=data.get("branch"),
        )
        user.set_unusable_password()  # cannot log in until activated
        user.save()
        return Response(StaffSerializer(user).data, status=201)


class ActivateView(APIView):
    """Public: activate a pending staff or patient account using its matricule."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        matricule = serializer.validated_data["matricule"].strip().upper()
        password = serializer.validated_data["password"]
        username = (serializer.validated_data.get("username") or "").strip()

        # 1) Staff account created by an admin
        staff = User.objects.filter(matricule=matricule, activated=False).first()
        if staff:
            if username:
                if User.objects.filter(username__iexact=username).exclude(pk=staff.pk).exists():
                    return Response({"detail": "That username is already taken."}, status=400)
                staff.username = username
            staff.set_password(password)
            staff.activated = True
            staff.is_active = True
            staff.save()
            return self._issue(staff)

        # 2) Patient registered in person by staff
        from patients.models import Patient

        patient = Patient.objects.filter(activation_code=matricule, account__isnull=True).first()
        if patient:
            uname = username or patient.patient_code
            if User.objects.filter(username__iexact=uname).exists():
                return Response({"detail": "Please choose a username."}, status=400)
            user = User(
                username=uname, first_name=patient.first_name, last_name=patient.last_name,
                role=Role.PATIENT, phone=patient.phone, activated=True,
            )
            user.set_password(password)
            user.save()
            patient.account = user
            patient.save()
            return self._issue(user)

        return Response({"detail": "Invalid or already-used activation code."}, status=400)

    def _issue(self, user):
        refresh = RefreshToken.for_user(user)
        return Response(
            {"user": UserSerializer(user).data, "access": str(refresh.access_token), "refresh": str(refresh)}
        )
