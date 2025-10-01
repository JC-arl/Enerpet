package com.enerpet.game

import com.facebook.react.bridge.*
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.*
import java.time.Instant
import java.time.temporal.ChronoUnit
import android.app.Activity
import android.content.Intent
import android.os.Build
import android.health.connect.HealthConnectManager

class HealthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val client: HealthConnectClient = HealthConnectClient.getOrCreate(reactContext)
    
    private var permissionPromise: Promise? = null
    private val PERMISSION_REQUEST_CODE = 1001

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
    )

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            requestCode: Int,
            resultCode: Int,
            data: Intent
        ) {
            if (requestCode == PERMISSION_REQUEST_CODE) {
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val granted = client.permissionController.getGrantedPermissions()
                        val hasAllPermissions = granted.containsAll(permissions)
                        
                        CoroutineScope(Dispatchers.Main).launch {
                            permissionPromise?.resolve(hasAllPermissions)
                            permissionPromise = null
                        }
                    } catch (e: Exception) {
                        CoroutineScope(Dispatchers.Main).launch {
                            permissionPromise?.reject("PERMISSION_ERROR", e)
                            permissionPromise = null
                        }
                    }
                }
            }
        }

        override fun onNewIntent(intent: Intent) {
            // Health Connect에서는 특별한 처리가 필요하지 않음
        }
    }

    init {
        reactApplicationContext.addActivityEventListener(activityEventListener)
    }

    override fun getName() = "HealthModule"

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(permissions)) {
                    promise.resolve(true)
                    return@launch
                }

                val activity = getCurrentActivity()
                if (activity != null) {
                    permissionPromise = promise
                    
                    // ✅ Android 버전에 따른 다른 인텐트 사용
                    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        // Android 14+ (API 34+)
                        Intent(HealthConnectManager.ACTION_MANAGE_HEALTH_PERMISSIONS).apply {
                            putExtra(Intent.EXTRA_PACKAGE_NAME, reactApplicationContext.packageName)
                        }
                    } else {
                        // Android 13 이하
                        Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
                    }
                    
                    try {
                        activity.startActivityForResult(intent, PERMISSION_REQUEST_CODE)
                    } catch (e: Exception) {
                        // 인텐트 실행 실패 시 일반 설정으로 이동
                        val fallbackIntent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
                        try {
                            activity.startActivityForResult(fallbackIntent, PERMISSION_REQUEST_CODE)
                        } catch (e2: Exception) {
                            promise.reject("PERMISSION_ERROR", "Health Connect 설정을 열 수 없습니다: ${e2.message}")
                        }
                    }
                } else {
                    promise.reject("PERMISSION_ERROR", "현재 액티비티가 없습니다")
                }
            } catch (e: Exception) {
                promise.reject("PERMISSION_ERROR", e)
            }
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                promise.resolve(granted.containsAll(permissions))
            } catch (e: Exception) {
                promise.reject("PERMISSION_ERROR", e)
            }
        }
    }

    @ReactMethod
    fun getTodayHealthData(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    promise.reject("PERMISSION_ERROR", "필요한 권한이 부여되지 않았습니다")
                    return@launch
                }

                val now = Instant.now()
                val startOfDay = now.truncatedTo(ChronoUnit.DAYS)

                val stepsRes = client.readRecords(
                    ReadRecordsRequest(StepsRecord::class, timeRangeFilter = TimeRangeFilter.after(startOfDay))
                )
                val steps = stepsRes.records.sumOf { it.count }.toInt()

                val hrRes = client.readRecords(
                    ReadRecordsRequest(HeartRateRecord::class, timeRangeFilter = TimeRangeFilter.after(startOfDay))
                )
                val avgBpm = if (hrRes.records.isNotEmpty()) {
                    hrRes.records.flatMap { it.samples }.map { it.beatsPerMinute }.average()
                } else 0.0

                val calRes = client.readRecords(
                    ReadRecordsRequest(TotalCaloriesBurnedRecord::class, timeRangeFilter = TimeRangeFilter.after(startOfDay))
                )
                val calories = calRes.records.sumOf { it.energy.inKilocalories }

                val distRes = client.readRecords(
                    ReadRecordsRequest(DistanceRecord::class, timeRangeFilter = TimeRangeFilter.after(startOfDay))
                )
                val distance = distRes.records.sumOf { it.distance.inMeters }

                val actRes = client.readRecords(
                    ReadRecordsRequest(ActiveCaloriesBurnedRecord::class, timeRangeFilter = TimeRangeFilter.after(startOfDay))
                )
                val activeCalories = actRes.records.sumOf { it.energy.inKilocalories }

                val result = Arguments.createMap().apply {
                    putInt("steps", steps)
                    putDouble("heartRate", avgBpm)
                    putDouble("calories", calories)
                    putDouble("distance", distance)
                    putDouble("activeCalories", activeCalories)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("HEALTH_ERROR", e)
            }
        }
    }
}
