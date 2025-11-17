idf_component_register(
    SRCS "lis3dhtr.c"
    INCLUDE_DIRS "include"
    REQUIRES driver esp_driver_i2c
)
