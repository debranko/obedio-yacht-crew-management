package com.example.obediowear.data.model

import com.google.gson.annotations.SerializedName

data class CrewMember(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("position")
    val position: String,

    @SerializedName("status")
    val status: String? = null  // "on-duty", "off-duty", "on-leave", etc.
)
