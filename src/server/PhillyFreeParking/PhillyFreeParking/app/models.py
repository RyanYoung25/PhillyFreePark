"""
Definition of models.
"""

from django.db import models

# Create your models here.


class Parking(models.Model):
    """This is a model for our parking object"""
    id = models.IntegerField(primary_key=True)
    start_lat = models.FloatField(default=0.0)
    start_long = models.FloatField(default=0.0)
    end_lat = models.FloatField(default=0.0)
    end_long = models.FloatField(default=0.0)
    start_cross = models.CharField(max_length=200)
    end_cross = models.CharField(max_length=200)
    category = models.CharField(max_length=200)
    price = models.FloatField(default=0.0) 
    verified = models.IntegerField(default=0)
    date_added = models.DateTimeField('date added')
    duration = models.FloatField(default=0.0)