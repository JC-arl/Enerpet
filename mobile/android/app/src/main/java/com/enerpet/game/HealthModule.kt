package com.enerpet.game

import com.facebook.react.bridge.*
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.*
import java.time.*
import java.time.temporal.ChronoUnit
import android.app.Activity
import android.content.Intent
import android.os.Build

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
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode == PERMISSION_REQUEST_CODE) {
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val granted = client.permissionController.getGrantedPermissions()
                        val hasAllPermissions = granted.containsAll(permissions)
                        withContext(Dispatchers.Main) {
                            permissionPromise?.resolve(hasAllPermissions)
                            permissionPromise = null
                        }
                    } catch (e: Exception) {
                        withContext(Dispatchers.Main) {
                            permissionPromise?.reject("PERMISSION_ERROR", e)
                            permissionPromise = null
                        }
                    }
                }
            }
        }

        override fun onNewIntent(intent: Intent) {}
    }

    init {
        reactApplicationContext.addActivityEventListener(activityEventListener)
    }

    override fun getName() = "HealthModule"

    // 🔹 권한 요청
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

                    val ACTION_MANAGE_HEALTH_PERMISSIONS =
                        "android.health.connect.action.MANAGE_HEALTH_PERMISSIONS"

                    val intent = if (Build.VERSION.SDK_INT >= 34) {
                        Intent(ACTION_MANAGE_HEALTH_PERMISSIONS).apply {
                            putExtra(Intent.EXTRA_PACKAGE_NAME, reactApplicationContext.packageName)
                        }
                    } else {
                        Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
                    }

                    try {
                        activity.startActivityForResult(intent, PERMISSION_REQUEST_CODE)
                    } catch (e: Exception) {
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

    // 🔹 권한 확인
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

    // 🔹 오늘의 건강 데이터 읽기
    @ReactMethod
    fun getTodayHealthData(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    promise.reject("PERMISSION_ERROR", "필요한 권한이 부여되지 않았습니다")
                    return@launch
                }

                // ✅ 한국 시간 기준 오늘 자정~현재
                val now = Instant.now()
                val startOfDay = LocalDate.now()
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant()

                android.util.Log.d("HealthModule", "==========================================")
                android.util.Log.d("HealthModule", "🕐 조회 시작 시간(로컬): $startOfDay")
                android.util.Log.d("HealthModule", "🕐 현재 시간: $now")

                // 👣 걸음 수
                val stepsRes = client.readRecords(
                    ReadRecordsRequest(
                        StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                )

                android.util.Log.d("HealthModule", "👣 걸음 수 레코드 개수: ${stepsRes.records.size}")
                if (stepsRes.records.isEmpty()) {
                    android.util.Log.w("HealthModule", "⚠️ 걸음 수 레코드가 비어있습니다!")
                } else {
                    stepsRes.records.forEachIndexed { index, record ->
                        android.util.Log.d("HealthModule", "  레코드 #$index:")
                        android.util.Log.d("HealthModule", "    count: ${record.count}")
                        android.util.Log.d("HealthModule", "    startTime: ${record.startTime}")
                        android.util.Log.d("HealthModule", "    endTime: ${record.endTime}")
                        android.util.Log.d("HealthModule", "    source: ${record.metadata.dataOrigin.packageName}")
                    }
                }
                val steps = stepsRes.records.sumOf { it.count }.toInt()
                android.util.Log.d("HealthModule", "👣 총 걸음 수: $steps")

                // ❤️ 심박수
                val hrRes = client.readRecords(
                    ReadRecordsRequest(
                        HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                )
                val avgBpm = if (hrRes.records.isNotEmpty()) {
                    hrRes.records.flatMap { it.samples }.map { it.beatsPerMinute }.average()
                } else 0.0
                android.util.Log.d("HealthModule", "❤️ 평균 심박수: $avgBpm")

                // 🔥 총 칼로리
                val calRes = client.readRecords(
                    ReadRecordsRequest(
                        TotalCaloriesBurnedRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                )
                val calories = calRes.records.sumOf { it.energy.inKilocalories }
                android.util.Log.d("HealthModule", "🔥 총 칼로리: $calories")

                // 📏 이동 거리
                val distRes = client.readRecords(
                    ReadRecordsRequest(
                        DistanceRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                )
                val distance = distRes.records.sumOf { it.distance.inMeters }
                android.util.Log.d("HealthModule", "📏 총 거리: $distance")

                // 💪 활동 칼로리
                val actRes = client.readRecords(
                    ReadRecordsRequest(
                        ActiveCaloriesBurnedRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                )
                val activeCalories = actRes.records.sumOf { it.energy.inKilocalories }

                android.util.Log.d("HealthModule", "==========================================")
                android.util.Log.d("HealthModule", "📊 최종 결과:")
                android.util.Log.d("HealthModule", "  걸음 수: $steps")
                android.util.Log.d("HealthModule", "  심박수: $avgBpm")
                android.util.Log.d("HealthModule", "  칼로리: $calories")
                android.util.Log.d("HealthModule", "  거리: $distance")
                android.util.Log.d("HealthModule", "  활동칼로리: $activeCalories")
                android.util.Log.d("HealthModule", "==========================================")

                val result = Arguments.createMap().apply {
                    putInt("steps", steps)
                    putDouble("heartRate", avgBpm)
                    putDouble("calories", calories)
                    putDouble("distance", distance)
                    putDouble("activeCalories", activeCalories)
                }

                promise.resolve(result)

            } catch (e: Exception) {
                android.util.Log.e("HealthModule", "❌ 에러 발생", e)
                promise.reject("HEALTH_ERROR", e)
            }
        }
    }
}
