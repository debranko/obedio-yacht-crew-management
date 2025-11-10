package com.example.obediowear.data.model

import com.google.gson.annotations.SerializedName

data class Guest(
    @SerializedName("id")
    val id: String,

    @SerializedName("firstName")
    val firstName: String,

    @SerializedName("lastName")
    val lastName: String,

    @SerializedName("preferredName")
    val preferredName: String?,

    @SerializedName("photo")
    val photo: String?
)
