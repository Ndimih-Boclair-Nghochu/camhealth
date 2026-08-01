from rest_framework import serializers

from .models import AuditLog, Role, User


class RegisterSerializer(serializers.ModelSerializer):
    """Public self-registration. The first account a person creates is an
    administrator of their own workspace, with full access to every service."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "phone", "email", "password", "role"]
        extra_kwargs = {"role": {"required": False}}

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("role", Role.ADMIN)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
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
