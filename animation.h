
#pragma once

#include <glm/glm.hpp>

enum Easing {
    LINEAR,
    EASE_IN,
    EASE_OUT,
    EASE_INOUT
};

struct Keyframe {
    glm::vec3 position;
    glm::vec3 rotation;
    float scale;
    glm::vec3 forward;
    glm::vec3 control;
    float time;
    Easing easingMode;
    bool isLinear;
};

struct Transform {
    glm::vec3 position;
    glm::mat4 rotation;
    float scale;
};

Transform updateSpaceship(float currentTime);
Transform updateEnemy(float currentTime);