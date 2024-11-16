# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel
from plane.utils.html_processor import strip_tags


class Initiative(BaseModel):
    class StatusContext(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        ON_HOLD = "ON_HOLD", "On Hold"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        DONE = "DONE", "Done"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    description_html = models.TextField(blank=True, null=True)
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    lead = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="initiatives_lead",
        blank=True,
        null=True,
    )
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=100,
        choices=StatusContext.choices,
        default=StatusContext.PLANNED,
    )

    class Meta:
        db_table = "initiatives"
        verbose_name = "Initiative"
        verbose_name_plural = "Initiatives"


class InitiativeProject(BaseModel):
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_projects",
        null=True,
        blank=True,
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["initiative", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["initiative", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="initiative_project_unique_initiative_project_when_deleted_at_null",
            )
        ]
        db_table = "initiative_projects"
        verbose_name = "Initiative Project"
        verbose_name_plural = "Initiative Projects"

    def __str__(self):
        return f"{self.initiative.name} {self.project.name}"


class InitiativeLabel(BaseModel):
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="labels",
    )
    label = models.ForeignKey(
        "db.Label",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_labels",
        null=True,
        blank=True,
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["initiative", "label", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["initiative", "label"],
                condition=models.Q(deleted_at__isnull=True),
                name="initiative_label_unique_when_deleted_at_null",
            )
        ]
        db_table = "initiative_labels"
        verbose_name = "Initiative Label"
        verbose_name_plural = "Initiative Labels"

    def __str__(self):
        return f"{self.initiative.name} {self.label.name}"


class InitiativeLink(BaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="initiative_link",
    )
    metadata = models.JSONField(default=dict)
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_links",
    )

    class Meta:
        verbose_name = "Initiative Link"
        verbose_name_plural = "Initiative Links"
        db_table = "initiative_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.initiative.name} {self.url}"


class InitiativeReaction(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_reactions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiative_reactions",
    )
    initiative = models.ForeignKey(
        Initiative,
        on_delete=models.CASCADE,
        related_name="initiative_reactions",
    )
    reaction = models.CharField(max_length=20)

    class Meta:
        unique_together = ["initiative", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["initiative", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="initiative_reaction_unique_initiative_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Initiative Reaction"
        verbose_name_plural = "Initiative Reactions"
        db_table = "initiative_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.initiative.name} {self.actor.email}"


class InitiativeComment(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_comments",
    )
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="initiative_comments",
    )
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiative_comments",
        null=True,
    )
    access = models.CharField(
        choices=(
            ("INTERNAL", "INTERNAL"),
            ("EXTERNAL", "EXTERNAL"),
        ),
        default="INTERNAL",
        max_length=100,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        self.comment_stripped = (
            strip_tags(self.comment_html) if self.comment_html != "" else ""
        )
        return super(InitiativeComment, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Initiative Comment"
        verbose_name_plural = "Initiative Comments"
        db_table = "initiative_comments"
        ordering = ("-created_at",)

    def __str__(self):
        """Return initiative of the comment"""
        return str(self.initiative)


class InitiativeCommentReaction(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_comment_reactions",
    )
    reaction = models.CharField(max_length=255)
    comment = models.ForeignKey(
        "ee.InitiativeComment",
        on_delete=models.CASCADE,
        related_name="initiative_reactions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiative_comment_reactions",
    )

    class Meta:
        verbose_name = "Initiative Comment Reaction"
        verbose_name_plural = "Initiative Comment Reactions"
        db_table = "initiative_comment_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.comment} {self.actor.email}"


class InitiativeActivity(BaseModel):
    initiative = models.ForeignKey(
        Initiative,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiative_activity",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiative_activities",
    )
    verb = models.CharField(
        max_length=255, verbose_name="Action", default="created"
    )
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(
        verbose_name="Old Value", blank=True, null=True
    )
    new_value = models.TextField(
        verbose_name="New Value", blank=True, null=True
    )
    comment = models.TextField(verbose_name="Comment", blank=True)
    initiative_comment = models.ForeignKey(
        "ee.InitiativeComment",
        on_delete=models.SET_NULL,
        related_name="initiative_comment",
        null=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiative_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Initiative Activity"
        verbose_name_plural = "Initiative Activities"
        db_table = "initiative_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return initiative of the activity"""
        return str(self.initiative)


class InitiativeUserProperty(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiative_user_properties",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiative_property_user",
    )
    filters = models.JSONField(default=dict)
    display_filters = models.JSONField(default=dict)
    display_properties = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Initiative User Property"
        verbose_name_plural = "Initiative User Properties"
        db_table = "initiative_user_properties"
        ordering = ("-created_at",)
        unique_together = ["user", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="Initiative_user_property_unique_user_workspace_when_deleted_at_null",
            )
        ]

    def __str__(self):
        """Return properties status of the initiative"""
        return str(self.user)
