package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

data class CrewMember(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("position")
    val position: String,

    @SerializedName("status")
    val status: DutyStatus = DutyStatus.OFF_DUTY,

    @SerializedName("photo")
    val photo: String? = null
)

enum class DutyStatus {
    @SerializedName("on-duty")
    ON_DUTY,
    @SerializedName("off-duty")
    OFF_DUTY,
    @SerializedName("busy")
    BUSY,
    @SerializedName("break")
    ON_BREAK
}
