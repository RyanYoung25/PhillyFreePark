#!/usr/bin/env python 

#From online tutorial 

from django.forms import widgets
from rest_framework import serializers
from app.models import Parking


class ParkingSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    start_lat = serializers.FloatField(required=True)
    start_long = serializers.FloatField(required=True)
    end_lat = serializers.FloatField(required=True)
    end_long = serializers.FloatField(required=True)
    start_cross = serializers.CharField(max_length=200)
    end_cross = serializers.CharField(max_length=200)
    category = serializers.CharField(max_length=200)
    price = serializers.FloatField(required=False) 
    verified = serializers.IntegerField(required=True)
    date_added = serializers.DateTimeField('date added')
    duration = serializers.FloatField(required=False)

    def create(self, validated_data):
        """
        Create and return a new `Parking` instance, given the validated data.
        """
        return Parking.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update and return an existing `Parking` instance, given the validated data.
        """
        instance.id = validated_data.get('id', instance.id)
        instance.start_lat = validated_data.get('start_lat', instance.start_lat)
        instance.start_long = validated_data.get('start_long', instance.start_long)
        instance.end_lat = validated_data.get('end_lat', instance.end_lat)
        instance.end_long = validated_data.get('end_long', instance.end_long)
        instance.start_cross = validated_data.get('start_cross', instance.start_cross)
        instance.end_cross = validated_data.get('end_cross', instance.end_cross)
        instance.category = validated_data.get('category', instance.category)
        instance.price = validated_data.get('price', instance.price)
        instance.verified = validated_data.get('verified', instance.verified)
        instance.date_added = validated_data.get('date_added', instance.date_added)
        instance.duration = validated_data.get('duration', instance.duration)
        instance.save()
        return instance