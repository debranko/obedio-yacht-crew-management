package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

data class Location(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("name")
    val name: String = "",

    @SerializedName("type")
    val type: String = "",

    @SerializedName("floor")
    val floor: String? = null,

    @SerializedName("image")
    val image: String? = null,

    @SerializedName("doNotDisturb")
    val doNotDisturb: Boolean = false,

    @SerializedName("dndActivatedAt")
    val dndActivatedAt: String? = null
)
