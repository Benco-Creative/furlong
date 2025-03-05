
from django.db.models import Prefetch
from django_elasticsearch_dsl import fields
from django_elasticsearch_dsl.registries import registry
from plane.db.models import Project, ProjectMember

from .base import BaseDocument, JsonKeywordField


@registry.register_document
class ProjectDocument(BaseDocument):
    slug = fields.KeywordField(attr="slug")
    active_member_user_ids = fields.ListField(fields.KeywordField())
    is_archived = fields.BooleanField()
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    logo_props = JsonKeywordField(attr="logo_props")

    class Index:
        name = "projects"
        settings = {"number_of_shards": 1, "number_of_replicas": 0}

    class Django:
        model = Project
        fields = [
            "id", "name", "identifier", "archived_at"
        ]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 10000
        related_models = [ProjectMember]
    
    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace").prefetch_related(
            Prefetch(
                "project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True).only("member_id"),
                to_attr="active_members"
            )
        )
    
    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, ProjectMember):
            return related_instance.project
        else:
            qs = self.django.model.objects.none()
        return self.apply_related_to_queryset(qs)

    def prepare_active_member_user_ids(self, instance):
        """
        Data preparation method for active_member_user_ids field
        """
        if hasattr(instance, "active_members"):
            members = instance.active_members
        else:
            members = instance.project_projectmember.filter(
                is_active=True
            ).only("member_id")
        return [member.member_id for member in members]
    
    def prepare_is_archived(self, instance):
        """
        Data preparation method for is_archived field
        """
        return bool(instance.archived_at)
    
    def prepare_workspace_slug(self, instance):
        """
        Data preparation method for workspace_slug field
        """
        return instance.workspace.slug if instance.workspace else None
