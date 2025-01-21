# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import TeamBaseEndpoint
from plane.db.models import Workspace
from plane.ee.models import TeamSpaceComment, TeamSpaceCommentReaction
from plane.ee.permissions import TeamSpacePermission
from plane.ee.serializers import (
    TeamSpaceCommentSerializer,
    TeamSpaceCommentReactionSerializer,
)
from plane.ee.bgtasks.team_space_activities_task import team_space_activity
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class TeamSpaceCommentEndpoint(TeamBaseEndpoint):

    model = TeamSpaceComment
    permission_classes = [
        TeamSpacePermission,
    ]

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id, pk=None):
        if pk:
            comment = TeamSpaceComment.objects.get(
                workspace__slug=slug, team_space_id=team_space_id, id=pk
            )
            serializer = TeamSpaceCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_200_OK)

        comments = TeamSpaceComment.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).order_by("-created_at")
        serializer = TeamSpaceCommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMS)
    def post(self, request, slug, team_space_id):
        # Get workspace
        workspace = Workspace.objects.get(slug=slug)
        serializer = TeamSpaceCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace, team_space_id=team_space_id, actor=request.user
            )

            team_space_activity.delay(
                type="comment.activity.created",
                slug=slug,
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                team_space_id=str(team_space_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMS)
    def patch(self, request, slug, team_space_id, pk):
        comment = TeamSpaceComment.objects.get(
            workspace__slug=slug, team_space_id=team_space_id, id=pk
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            TeamSpaceCommentSerializer(comment).data,
            cls=DjangoJSONEncoder,
        )

        serializer = TeamSpaceCommentSerializer(
            comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()

            # Send activity
            team_space_activity.delay(
                type="comment.activity.updated",
                slug=slug,
                requested_data=requested_data,
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMS)
    def delete(self, request, slug, team_space_id, pk):
        comment = TeamSpaceComment.objects.get(
            workspace__slug=slug, team_space_id=team_space_id, id=pk
        )
        current_instance = json.dumps(
            TeamSpaceCommentSerializer(comment).data,
            cls=DjangoJSONEncoder,
        )
        comment.delete()
        team_space_activity.delay(
            type="comment.activity.deleted",
            slug=slug,
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            team_space_id=str(team_space_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamSpaceCommentReactionEndpoint(TeamBaseEndpoint):
    serializer_class = TeamSpaceCommentReactionSerializer
    model = TeamSpaceCommentReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(team_space_id=self.kwargs.get("team_space_id"))
            .filter(comment_id=self.kwargs.get("comment_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.TEAMS)
    def post(self, request, slug, team_space_id, comment_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = TeamSpaceCommentReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                team_space_id=team_space_id,
                actor_id=request.user.id,
                comment_id=comment_id,
            )
            team_space_activity.delay(
                type="comment_reaction.activity.created",
                slug=slug,
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                team_space_id=team_space_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMS)
    def delete(self, request, slug, team_space_id, comment_id, reaction_code):
        team_space_comment_reaction = TeamSpaceCommentReaction.objects.get(
            workspace__slug=slug,
            team_space_id=team_space_id,
            comment_id=comment_id,
            reaction=reaction_code,
            actor=request.user,
        )
        team_space_activity.delay(
            type="comment_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            slug=slug,
            team_space_id=team_space_id,
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(team_space_comment_reaction.id),
                    "comment_id": str(comment_id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
        )
        team_space_comment_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
