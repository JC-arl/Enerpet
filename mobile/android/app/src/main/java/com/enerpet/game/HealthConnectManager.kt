package com.enerpet.game

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class HealthConnectManager(private val context: Context) {
    val healthConnectClient = HealthConnectClient.getOrCreate(context)

    val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
    )

    suspend fun readHeartRates(): List<HeartRateRecord> {
        val now = Instant.now()
        val todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()

        val request = ReadRecordsRequest(
            recordType = HeartRateRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        )
        return healthConnectClient.readRecords(request).records
    }

    suspend fun readStepCounts(): List<StepsRecord> {
        val now = Instant.now()
        val todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()

        val request = ReadRecordsRequest(
            recordType = StepsRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        )
        return healthConnectClient.readRecords(request).records
    }

    suspend fun readCaloriesBurned(): List<TotalCaloriesBurnedRecord> {
        val now = Instant.now()
        val todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()

        val request = ReadRecordsRequest(
            recordType = TotalCaloriesBurnedRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        )
        return healthConnectClient.readRecords(request).records
    }

    suspend fun readDistanceWalked(): List<DistanceRecord> {
        val now = Instant.now()
        val todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()

        val request = ReadRecordsRequest(
            recordType = DistanceRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        )
        return healthConnectClient.readRecords(request).records
    }

    suspend fun readActiveCaloriesBurned(): List<ActiveCaloriesBurnedRecord> {
        val now = Instant.now()
        val todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()

        val request = ReadRecordsRequest(
            recordType = ActiveCaloriesBurnedRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        )

        return healthConnectClient.readRecords(request).records
    }
}