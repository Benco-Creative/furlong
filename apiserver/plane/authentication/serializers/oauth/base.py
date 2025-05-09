from rest_framework import serializers
from lxml import html
from plane.authentication.serializers.base import BaseSerializer
from plane.authentication.models.oauth import (
    Application,
    AccessToken,
    Grant,
    RefreshToken,
    IDToken,
    ApplicationOwner,
    WorkspaceAppInstallation,
    ApplicationCategory,
)


class ApplicationSerializer(BaseSerializer):
    is_owned = serializers.BooleanField(read_only=True)
    is_installed = serializers.BooleanField(read_only=True)
    logo_url = serializers.CharField(read_only=True)
    class Meta:
        model = Application
        fields = "__all__"

    def validate(self, data):
        try:
            if data.get("description_html", None) is not None:
                parsed = html.fromstring(data["description_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["description_html"] = parsed_str
            
            return data
        except Exception:
            raise serializers.ValidationError("Invalid HTML passed")


class AccessTokenSerializer(BaseSerializer):
    class Meta:
        model = AccessToken
        fields = "__all__"


class GrantSerializer(BaseSerializer):
    class Meta:
        model = Grant
        fields = "__all__"


class RefreshTokenSerializer(BaseSerializer):
    class Meta:
        model = RefreshToken
        fields = "__all__"


class IDTokenSerializer(BaseSerializer):
    class Meta:
        model = IDToken
        fields = "__all__"


class WorkspaceAppInstallationSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceAppInstallation
        fields = "__all__"


class ApplicationOwnerSerializer(BaseSerializer):
    class Meta:
        model = ApplicationOwner
        fields = "__all__"


class ApplicationCategorySerializer(BaseSerializer):
    class Meta:
        model = ApplicationCategory
        fields = "__all__"
