
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>

#include "Shader.h"

#include <iostream>
#include <string>
#include <filesystem>
#include <cstdio>
#include "Animation.h"
#include <glm/gtc/type_ptr.hpp>

// ============================================================
// CONFIGURATION
// ============================================================
/*
constexpr unsigned int SCR_WIDTH = 800;
constexpr unsigned int SCR_HEIGHT = 600;
*/
constexpr unsigned int SCR_WIDTH = 1360;
constexpr unsigned int SCR_HEIGHT = 768;
// ============================================================
// GLOBAL STATE
// ============================================================

double lastTime = 0.0;
double lt = 0.0;
double fps = 0.0;

int nbFrames = 0;

char title_string[100];

// ============================================================
// FUNCTION DECLARATIONS
// ============================================================

void framebuffer_size_callback(
    GLFWwindow* window,
    int width,
    int height
);

void processInput(
    GLFWwindow* window,
    double* mouse,
    bool* shouldDraw,
    bool* press
);

// ============================================================
// FULLSCREEN QUAD
// ============================================================

float vertices[] = {

    // Position          // Color             // Texture coordinates

     1.0f,  1.0f, 0.0f,  1.0f, 0.0f, 0.0f,   1.0f, 1.0f,
     1.0f, -1.0f, 0.0f,  0.0f, 1.0f, 0.0f,   1.0f, 0.0f,
    -1.0f, -1.0f, 0.0f,  0.0f, 0.0f, 1.0f,   0.0f, 0.0f,
    -1.0f,  1.0f, 0.0f,  1.0f, 1.0f, 0.0f,   0.0f, 1.0f
};

unsigned int indices[] = {
    0, 1, 3,
    1, 2, 3
};

// ============================================================
// INPUT
// ============================================================

void processInput(
    GLFWwindow* window,
    double* mouse,
    bool* shouldDraw,
    bool* press
)
{
    // ESC closes the window
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
    {
        glfwSetWindowShouldClose(window, true);
    }

    // Mouse position
    glfwGetCursorPos(window, &mouse[0], &mouse[1]);

    // Mouse buttons
    mouse[2] = 0.0;
    mouse[3] = 0.0;

    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_LEFT) == GLFW_PRESS)
        mouse[2] = 1.0;

    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_RIGHT) == GLFW_PRESS)
        mouse[3] = 1.0;

    // Convert Y coordinate
    int width, height;

    glfwGetFramebufferSize(window, &width, &height);

    mouse[1] = height - mouse[1];

    // SPACE toggles rendering
    if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS && !(*press))
    {
        *shouldDraw = !(*shouldDraw);

        lt = glfwGetTime();

        *press = true;
    }

    if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_RELEASE)
    {
        *press = false;
    }
}

// ============================================================
// WINDOW RESIZE CALLBACK
// ============================================================

void framebuffer_size_callback(
    GLFWwindow* window,
    int width,
    int height
)
{
    (void)window;

    glViewport(0, 0, width, height);

    std::cout << "Window resized: "
              << width << " x " << height << '\n';
}

// ============================================================
// MAIN
// ============================================================

int main()
{
    std::cout << "C++ version: " << __cplusplus << '\n';

    // --------------------------------------------------------
    // PROJECT PATHS
    // --------------------------------------------------------

    namespace fs = std::filesystem;

    // run.bat must execute the program from the project root.
    const fs::path projectPath = fs::current_path();

    const fs::path shaderDirectory = projectPath / "Shaders";

    const fs::path vertexPath =
        shaderDirectory / "VertexShader.vs";

    const fs::path fragmentPath =
        shaderDirectory / "Image.frag";

    const fs::path commonPath =
        shaderDirectory / "common.incl";

    // Check shader files before initializing OpenGL
    std::cout << "\n--- SHADER FILES ---\n";

    std::cout << "Project:  " << projectPath.string() << '\n';
    std::cout << "Vertex:   " << vertexPath.string() << '\n';
    std::cout << "Fragment: " << fragmentPath.string() << '\n';
    std::cout << "Common:   " << commonPath.string() << '\n';

    if (!fs::exists(vertexPath))
    {
        std::cerr << "\nERROR: Vertex shader not found!\n";
        return -1;
    }

    if (!fs::exists(fragmentPath))
    {
        std::cerr << "\nERROR: Fragment shader not found!\n";
        return -1;
    }

    if (!fs::exists(commonPath))
    {
        std::cerr << "\nERROR: Common shader not found!\n";
        return -1;
    }

    // Convert paths to strings for Shader constructor
    const std::string vertexShaderPath = vertexPath.string();
    const std::string fragmentShaderPath = fragmentPath.string();
    const std::string commonShaderPath = commonPath.string();

    // --------------------------------------------------------
    // GLFW INITIALIZATION
    // --------------------------------------------------------

    if (!glfwInit())
    {
        std::cerr << "ERROR: Failed to initialize GLFW!\n";
        return -1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);

    glfwWindowHint(
        GLFW_OPENGL_PROFILE,
        GLFW_OPENGL_CORE_PROFILE
    );

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // --------------------------------------------------------
    // WINDOW CREATION
    // --------------------------------------------------------

    GLFWwindow* window = glfwCreateWindow(
        SCR_WIDTH,
        SCR_HEIGHT,
        "RayMarching Luz",
        nullptr,
        nullptr
    );

    if (window == nullptr)
    {
        std::cerr << "ERROR: Failed to create GLFW window!\n";

        glfwTerminate();

        return -1;
    }

    glfwMakeContextCurrent(window);

    glfwSetFramebufferSizeCallback(
        window,
        framebuffer_size_callback
    );

    glfwSwapInterval(0);

    // --------------------------------------------------------
    // GLAD INITIALIZATION
    // --------------------------------------------------------

    if (!gladLoadGLLoader(
        (GLADloadproc)glfwGetProcAddress
    ))
    {
        std::cerr << "ERROR: Failed to initialize GLAD!\n";

        glfwDestroyWindow(window);
        glfwTerminate();

        return -1;
    }

    std::cout << "\n--- OPENGL ---\n";

    std::cout << "Vendor: "
              << glGetString(GL_VENDOR) << '\n';

    std::cout << "Renderer: "
              << glGetString(GL_RENDERER) << '\n';

    std::cout << "Version: "
              << glGetString(GL_VERSION) << '\n';

    // --------------------------------------------------------
    // VIEWPORT
    // --------------------------------------------------------

    int framebufferWidth;
    int framebufferHeight;

    glfwGetFramebufferSize(
        window,
        &framebufferWidth,
        &framebufferHeight
    );

    glViewport(
        0,
        0,
        framebufferWidth,
        framebufferHeight
    );

    // --------------------------------------------------------
    // SHADER
    // --------------------------------------------------------

    std::cout << "\n--- LOADING SHADER ---\n";

    Shader Imageprogram(
        commonShaderPath.c_str(),
        vertexShaderPath.c_str(),
        fragmentShaderPath.c_str()
    );

    if (Imageprogram.ID == 0)
    {
        std::cerr << "ERROR: Shader program could not be created!\n";

        glfwDestroyWindow(window);
        glfwTerminate();

        return -1;
    }
    // --------------------------------------------------------
    // SPACESHIP UNIFORMS
    // --------------------------------------------------------

    GLint spaceshipPositionLoc = glGetUniformLocation(Imageprogram.ID, "spaceship_position");
    GLint spaceshipRotationLoc = glGetUniformLocation(Imageprogram.ID, "spaceship_rotation");
    GLint spaceshipScaleLoc = glGetUniformLocation(Imageprogram.ID, "spaceship_scale");

    GLint enemyPositionLoc = glGetUniformLocation(Imageprogram.ID, "enemy_position");
    GLint enemyRotationLoc = glGetUniformLocation(Imageprogram.ID, "enemy_rotation");
    GLint enemyScaleLoc = glGetUniformLocation(Imageprogram.ID, "enemy_scale");




    // --------------------------------------------------------
    // VERTEX ARRAY / BUFFERS
    // --------------------------------------------------------

    unsigned int VAO;
    unsigned int VBO;
    unsigned int EBO;

    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    // Vertex buffer
    glBindBuffer(GL_ARRAY_BUFFER, VBO);

    glBufferData(
        GL_ARRAY_BUFFER,
        sizeof(vertices),
        vertices,
        GL_STATIC_DRAW
    );

    // Index buffer
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);

    glBufferData(
        GL_ELEMENT_ARRAY_BUFFER,
        sizeof(indices),
        indices,
        GL_STATIC_DRAW
    );

    // Position attribute
    glVertexAttribPointer(
        0,
        3,
        GL_FLOAT,
        GL_FALSE,
        8 * sizeof(float),
        (void*)0
    );

    glEnableVertexAttribArray(0);

    // Color attribute
    glVertexAttribPointer(
        1,
        3,
        GL_FLOAT,
        GL_FALSE,
        8 * sizeof(float),
        (void*)(3 * sizeof(float))
    );

    glEnableVertexAttribArray(1);

    // Texture coordinate attribute
    glVertexAttribPointer(
        2,
        2,
        GL_FLOAT,
        GL_FALSE,
        8 * sizeof(float),
        (void*)(6 * sizeof(float))
    );

    glEnableVertexAttribArray(2);

    glBindVertexArray(0);

    // --------------------------------------------------------
    // RENDER CONFIGURATION
    // --------------------------------------------------------

    glm::vec2 resolution(
        static_cast<float>(SCR_WIDTH),
        static_cast<float>(SCR_HEIGHT)
    );

    double mouse[4] = {
        0.0, 0.0, 0.0, 0.0
    };

    bool shouldDraw = false;
    bool press = false;

    int frame = 0;

    // --------------------------------------------------------
    // INITIAL SHADER CONFIGURATION
    // --------------------------------------------------------

    Imageprogram.use();

    Imageprogram.setVec2(
        "iResolution",
        resolution
    );

    // --------------------------------------------------------
    // RENDER LOOP
    // --------------------------------------------------------

    std::cout << "\n--- RENDER LOOP ---\n";
    std::cout << "Press SPACE to start/pause rendering.\n";
    std::cout << "Press ESC to close.\n";

    while (!glfwWindowShouldClose(window))
    {
        const float currentTime =
            static_cast<float>(glfwGetTime());

        // Input
        processInput(
            window,
            mouse,
            &shouldDraw,
            &press
        );

        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        if (shouldDraw)
        {
            glBindFramebuffer(GL_FRAMEBUFFER, 0);

            glClearColor(
                0.0f,
                0.0f,
                0.0f,
                1.0f
            );

            glClear(GL_COLOR_BUFFER_BIT);

            Imageprogram.use();

            glBindVertexArray(VAO);

            Imageprogram.setVec2(
                "iResolution",
                resolution
            );

            Imageprogram.setFloat(
                "iTime",
                currentTime
            );

            Imageprogram.setVec4(
                "iMouse",
                mouse
            );

            Transform spaceship = updateSpaceship(currentTime);
            Transform enemy = updateEnemy( fmod(currentTime, 5.0f));

            glUniform3fv( spaceshipPositionLoc, 1,glm::value_ptr(spaceship.position) );
            glUniformMatrix4fv( spaceshipRotationLoc,1,GL_FALSE,glm::value_ptr(spaceship.rotation) );
            glUniform1f( spaceshipScaleLoc, spaceship.scale);

            glUniform3fv( enemyPositionLoc, 1,glm::value_ptr(enemy.position) );
            glUniformMatrix4fv( enemyRotationLoc,1,GL_FALSE,glm::value_ptr(enemy.rotation) );
            glUniform1f( enemyScaleLoc, enemy.scale);



            glDrawElements(
                GL_TRIANGLES,
                6,
                GL_UNSIGNED_INT,
                nullptr
            );

            glBindVertexArray(0);

            // ------------------------------------------------
            // FPS
            // ------------------------------------------------

            const double now = glfwGetTime();

            const double elapsed = now - lt;

            if (elapsed >= 0.1)
            {
                fps = nbFrames / elapsed;

                std::snprintf(
                    title_string,
                    sizeof(title_string),
                    "RayMarching Luz - FPS: %d",
                    static_cast<int>(fps)
                );

                glfwSetWindowTitle(
                    window,
                    title_string
                );

                lt = now;
                nbFrames = 0;
            }

            nbFrames++;
            frame++;
        }

        // ----------------------------------------------------
        // PRESENTATION
        // ----------------------------------------------------

        glfwSwapBuffers(window);

        glfwPollEvents();
    }

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    glDeleteVertexArrays(1, &VAO);

    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);

    glfwDestroyWindow(window);

    glfwTerminate();

    std::cout << "\nApplication closed.\n";

    return 0;
}
