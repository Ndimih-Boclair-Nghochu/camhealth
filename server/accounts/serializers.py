from rest_framework import serializers

from .models import AuditLog, Branch, Role, User


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "city", "phone", "active", "created_at"]


class StaffSerializer(serializers.ModelSerializer):
    """Admin view of a staff member. Matricule + activation status are derived."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "full_name", "phone",
            "email", "role", "role_display", "branch", "branch_name",
            "matricule", "activated", "is_active",
        ]
        read_only_fields = ["username", "matricule", "activated"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class ActivateSerializer(serializers.Serializer):
    """Activate a pending staff or patient account with its matricule."""

    matricule = serializers.CharField()
    password = serializers.CharField(min_length=6)
    username = serializers.CharField(required=False, allow_blank=True)


class RegisterSerializer(serializers.ModelSerializer):
    """Public self-registration. A self-registered person is a PATIENT: a health
    profile is created and linked to their login so they can manage their own
    care (records, appointments, pharmacy). Staff accounts are created inside the
    system by an administrator, not here."""

    password = serializers.CharField(write_only=True, min_length=6)
    sex = serializers.ChoiceField(choices=["M", "F", "O"], required=False, write_only=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "phone", "email", "password", "sex", "date_of_birth"]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def create(self, validated_data):
        from patients.models import Patient

        password = validated_data.pop("password")
        sex = validated_data.pop("sex", "O")
        dob = validated_data.pop("date_of_birth", None)

        user = User(role=Role.PATIENT, **validated_data)
        user.set_password(password)
        user.save()

        Patient.objects.create(
            account=user,
            first_name=user.first_name or user.username,
            last_name=user.last_name or "",
            sex=sex,
            date_of_birth=dob,
            phone=user.phone,
            created_by=user,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "full_name",
            "email", "phone", "role", "role_display", "is_active", "password",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id", "user", "user_name", "action", "model_name",
            "object_id", "description", "ip_address", "timestamp",
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username if obj.user else "system"
