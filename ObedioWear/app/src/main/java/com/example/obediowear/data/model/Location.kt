package com.example.obediowear.data.model

import com.google.gson.annotations.SerializedName

data class Location(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("floor")
    val floor: String?,

    @SerializedName("image")
    val image: String?
)
