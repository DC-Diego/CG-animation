
#include "Animation.h"

#include <vector>
#include <algorithm>
#include <cmath>

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

#define EPSILON 0.0001f

// ============================================================
// SPACESHIP KEYFRAMES
// ============================================================

static const float SPACESHIP_BASE_SCALE = 0.3f;

static const std::vector<Keyframe> SP_KEYFRAMES = {

    // Position, Rotation, Scale, Forward, Control, Time, Easing, Linear

    {  glm::vec3(0, 0, 0),
        glm::vec3(0, 0, 0),
        SPACESHIP_BASE_SCALE,
        glm::vec3(0),
        glm::vec3(5, 5, 5),
        2.0f,
        EASE_IN,
        false
    },

    {
        glm::vec3(0, 0, 10),
        glm::vec3(0, 0, 0),
        SPACESHIP_BASE_SCALE,
        glm::vec3(0),
        glm::vec3(-2.5f, -2, 10),
        6.0f,
        LINEAR,
        false
    },

    {
        glm::vec3(-5, 0, 10),
        glm::vec3(0, 0, 0),
        SPACESHIP_BASE_SCALE,
        glm::vec3(0),
        glm::vec3(0, 2, 5),
        9.0f,
        LINEAR,
        false
    },

    {
        glm::vec3(-5, 0, 0),
        glm::vec3(0, 0, 0),
        SPACESHIP_BASE_SCALE,
        glm::vec3(0),
        glm::vec3(2.5f, 5, 2),
        12.0f,
        LINEAR,
        false
    },

    {
        glm::vec3(0, 2, 4),
        glm::vec3(0, 0, 0),
        SPACESHIP_BASE_SCALE,
        glm::vec3(-2.5,-3,2),
        glm::vec3(0, 5, 0),
        15.0f,
        EASE_OUT,
        false
    }
};


// ============================================================
// EASING
// ============================================================

static float applyEasing(float t, Easing easing)
{
    switch (easing) {

        case LINEAR:
            return t;

        case EASE_IN:
            return t * t;

        case EASE_OUT:
            return 1.0f - (1.0f - t) * (1.0f - t);

        case EASE_INOUT:
            return t * t * (3.0f - 2.0f * t);
    }

    return t;
}


// ============================================================
// INTERPOLATION
// ============================================================

static glm::vec3 interpolate(glm::vec3 u, glm::vec3 v,glm::vec3 control,float t) {
    float a = 1.0f - t;
    return u * a * a + control * 2.0f * a * t + v * t * t;
}


// ============================================================
// BEZIER TANGENT
// ============================================================

static glm::vec3 bezierTangent(glm::vec3 u,glm::vec3 v,
    glm::vec3 control, float t) {
    return
        2.0f * (1.0f - t) * (control - u) +
        2.0f * t * (v - control);
}


// ============================================================
// ROTATION
// ============================================================

static glm::mat4 findRotation(glm::vec3 f, bool minusZ)
{
    if (glm::length(f) < EPSILON)
        return glm::mat4(1.0f);

    f = glm::normalize(f);

    float Oy = glm::degrees(atan2(f.x, f.z));

    glm::mat4 Ry = glm::rotate(
        glm::mat4(1.0f),
        glm::radians(-Oy),
        glm::vec3(0, 1, 0)
    );

    glm::vec3 U = glm::vec3(
        Ry * glm::vec4(f, 0.0f)
    );

    float Ox = glm::degrees(atan2(U.y, U.z));

    if (minusZ)
        Oy += 180.0f;

    glm::mat4 R =
        glm::rotate(
            glm::mat4(1.0f),
            glm::radians(Oy),
            glm::vec3(0, 1, 0)
        ) *
        glm::rotate(
            glm::mat4(1.0f),
            glm::radians(Ox),
            glm::vec3(1, 0, 0)
        );

    return R;
}


// ============================================================
// KEYFRAME HANDLER
// ============================================================

static Transform keyFrameHandler(
    const std::vector<Keyframe>& keyframes,
    float currentTime,
    bool minusZ
) {

    const int count = static_cast<int>(keyframes.size());

    // Empty array
    if (count == 0) {
        return {
            glm::vec3(0),
            glm::mat4(1.0f),
            1.0f
        };
    }

    // Single keyframe
    if (count == 1) {
        const Keyframe& a = keyframes[0];

        return {
            a.position,
            glm::mat4(1.0f),
            a.scale
        };
    }

    // Find active keyframe segment
    int t = 0;

    while (
        t < count - 1 &&
        currentTime >= keyframes[t + 1].time
    ) {
        t++;
    }

    // ========================================================
    // AFTER LAST KEYFRAME
    // ========================================================

    if (t >= count - 1) {

        const Keyframe& a = keyframes[count - 1];

        glm::vec3 forward = a.forward;

        if (glm::length(forward) < EPSILON) {
            forward = a.position -
                      keyframes[count - 2].position;
        }

        glm::mat4 R = findRotation(forward, minusZ);

        R =
            glm::rotate(
                glm::mat4(1.0f),
                glm::radians(a.rotation.x),
                glm::vec3(1, 0, 0)
            ) *
            glm::rotate(
                glm::mat4(1.0f),
                glm::radians(a.rotation.y),
                glm::vec3(0, 1, 0)
            ) *
            glm::rotate(
                glm::mat4(1.0f),
                glm::radians(a.rotation.z),
                glm::vec3(0, 0, 1)
            ) *
            R;

        return {
            a.position,
            R,
            a.scale
        };
    }


    // ========================================================
    // ACTIVE SEGMENT
    // ========================================================

    const Keyframe& a = keyframes[t];
    const Keyframe& b = keyframes[t + 1];

    // Raw interpolation parameter
    float rawU = glm::clamp(
        (currentTime - a.time) / (b.time - a.time),
        0.0f,
        1.0f
    );

    // Apply easing to position interpolation
    float u = applyEasing(rawU, a.easingMode);


    // ========================================================
    // POSITION
    // ========================================================

    glm::vec3 position;

    if (a.isLinear) {

        position = glm::mix(
            a.position,
            b.position,
            u
        );

    } else {

        position = interpolate(
            a.position,
            b.position,
            a.control,
            u
        );
    }


    // ========================================================
    // FORWARD DIRECTION
    // ========================================================

    glm::vec3 forward;

    if (
        glm::length(a.forward) > EPSILON &&
        glm::length(b.forward) > EPSILON
    ) {

        forward = glm::mix(
            a.forward,
            b.forward,
            u
        );

    } else if (a.isLinear) {

        forward = b.position - a.position;

    } else {

        // Tangent of the Bezier curve.
        // Use rawU because the tangent is derived from
        // the original curve parameter.

        forward = bezierTangent(
            a.position,
            b.position,
            a.control,
            rawU
        );
    }

    // Fallback for degenerate tangent
    if (glm::length(forward) < EPSILON)
        forward = b.position - a.position;

    if (glm::length(forward) < EPSILON)
        forward = glm::vec3(0, 0, 1);


    // ========================================================
    // ROTATION AND SCALE
    // ========================================================

    glm::vec3 rotation = glm::mix(
        a.rotation,
        b.rotation,
        u
    );

    float scale = glm::mix(
        a.scale,
        b.scale,
        u
    );

    glm::mat4 R = findRotation(forward, minusZ);

    R =
        glm::rotate(
            glm::mat4(1.0f),
            glm::radians(rotation.x),
            glm::vec3(1, 0, 0)
        ) *
        glm::rotate(
            glm::mat4(1.0f),
            glm::radians(rotation.y),
            glm::vec3(0, 1, 0)
        ) *
        glm::rotate(
            glm::mat4(1.0f),
            glm::radians(rotation.z),
            glm::vec3(0, 0, 1)
        ) *
        R;


    return {
        position,
        R,
        scale
    };
}


// ============================================================
// PUBLIC ANIMATION INTERFACE
// ============================================================

Transform updateSpaceship(float currentTime)
{
    return keyFrameHandler(
        SP_KEYFRAMES,
        currentTime,
        true
    );
}
