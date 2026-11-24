
#ifndef SHADER_H
#define SHADER_H

#include <glad/glad.h>
#include <glm/glm.hpp>

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <stdexcept>

class Shader
{
public:
    unsigned int ID = 0;

    Shader(const char* commonPath,
           const char* vertexPath,
           const char* fragmentPath)
    {
        std::string commonCode;
        std::string vertexCode;
        std::string fragmentCode;

        try
        {
            // Abre os arquivos
            std::ifstream vShaderFile(vertexPath);
            std::ifstream fShaderFile(fragmentPath);
            std::ifstream cShaderFile(commonPath);

            // Verifica os arquivos individualmente
            if (!vShaderFile.is_open())
                throw std::runtime_error(
                    std::string("Nao foi possivel abrir Vertex Shader: ") + vertexPath
                );

            if (!fShaderFile.is_open())
                throw std::runtime_error(
                    std::string("Nao foi possivel abrir Fragment Shader: ") + fragmentPath
                );

            if (!cShaderFile.is_open())
                throw std::runtime_error(
                    std::string("Nao foi possivel abrir Common Shader: ") + commonPath
                );

            // Lê os arquivos
            std::stringstream vStream;
            std::stringstream fStream;
            std::stringstream cStream;

            vStream << vShaderFile.rdbuf();
            fStream << fShaderFile.rdbuf();
            cStream << cShaderFile.rdbuf();

            vertexCode = vStream.str();
            fragmentCode = cStream.str() + "\n" + fStream.str();

            std::cout << "[SHADER] Arquivos carregados:\n";
            std::cout << "  Vertex:   " << vertexPath << '\n';
            std::cout << "  Fragment: " << fragmentPath << '\n';
            std::cout << "  Common:   " << commonPath << '\n';
        }
        catch (const std::exception& e)
        {
            std::cerr << "\n[SHADER FILE ERROR]\n"
                      << e.what() << '\n';
            return;
        }

        if (vertexCode.empty() || fragmentCode.empty())
        {
            std::cerr << "[SHADER ERROR] Arquivo de shader vazio.\n";
            return;
        }

        // Compila Vertex Shader
        const char* vShaderCode = vertexCode.c_str();

        unsigned int vertex = glCreateShader(GL_VERTEX_SHADER);

        glShaderSource(vertex, 1, &vShaderCode, nullptr);
        glCompileShader(vertex);

        if (!checkCompileErrors(vertex, "VERTEX"))
        {
            glDeleteShader(vertex);
            return;
        }

        // Compila Fragment Shader
        const char* fShaderCode = fragmentCode.c_str();

        unsigned int fragment = glCreateShader(GL_FRAGMENT_SHADER);

        glShaderSource(fragment, 1, &fShaderCode, nullptr);
        glCompileShader(fragment);

        if (!checkCompileErrors(fragment, "FRAGMENT"))
        {
            glDeleteShader(vertex);
            glDeleteShader(fragment);
            return;
        }

        // Cria o programa
        ID = glCreateProgram();

        glAttachShader(ID, vertex);
        glAttachShader(ID, fragment);

        glLinkProgram(ID);

        if (!checkProgramErrors(ID))
        {
            glDeleteShader(vertex);
            glDeleteShader(fragment);
            glDeleteProgram(ID);
            ID = 0;
            return;
        }

        glDeleteShader(vertex);
        glDeleteShader(fragment);

        std::cout << "[SHADER] Programa compilado com sucesso!\n";
    }

    void use()
    {
        if (ID != 0)
            glUseProgram(ID);
    }

    void setBool(const std::string& name, bool value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value);
    }

    void setInt(const std::string& name, int value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    }

    void setFloat(const std::string& name, float value) const
    {
        glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
    }

    void setSampler(const std::string& name, unsigned int pos) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), pos);
    }

    void setVec4(const std::string& name, double value[]) const
    {
        glUniform4f(
            glGetUniformLocation(ID, name.c_str()),
            (float)value[0],
            (float)value[1],
            (float)value[2],
            (float)value[3]
        );
    }

    void setVec2(const std::string& name, double value[]) const
    {
        glUniform2f(
            glGetUniformLocation(ID, name.c_str()),
            (float)value[0],
            (float)value[1]
        );
    }

    void setVec2(const std::string& name, glm::vec2 v) const
    {
        glUniform2f(
            glGetUniformLocation(ID, name.c_str()),
            v.x,
            v.y
        );
    }

private:

    bool checkCompileErrors(unsigned int shader, const std::string& type)
    {
        int success;
        char infoLog[1024];

        glGetShaderiv(shader, GL_COMPILE_STATUS, &success);

        if (!success)
        {
            glGetShaderInfoLog(shader, 1024, nullptr, infoLog);

            std::cerr << "\n[SHADER COMPILATION ERROR: "
                      << type << "]\n"
                      << infoLog << '\n';

            return false;
        }

        return true;
    }

    bool checkProgramErrors(unsigned int program)
    {
        int success;
        char infoLog[1024];

        glGetProgramiv(program, GL_LINK_STATUS, &success);

        if (!success)
        {
            glGetProgramInfoLog(program, 1024, nullptr, infoLog);

            std::cerr << "\n[PROGRAM LINKING ERROR]\n"
                      << infoLog << '\n';

            return false;
        }

        return true;
    }
};

#endif
