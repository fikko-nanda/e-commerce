import uuid
from django.db import models
from django.conf import settings

class Store(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PENDING_REVIEW = 'pending_review', 'Pending Review'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='store')
    store_name = models.CharField(max_length=100, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    logo = models.ImageField(upload_to='stores/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_REVIEW)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.store_name} - {self.status}"