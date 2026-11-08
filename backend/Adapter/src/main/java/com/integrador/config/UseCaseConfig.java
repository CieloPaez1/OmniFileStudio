package com.integrador.config;

import filemanager.input.*;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;
import filemanager.usecase.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.input.CreateProjectInput;
import project.input.DeleteProjectInput;
import project.input.FindProjectInput;
import project.input.UpdateProjectInput;
import project.output.ProjectOutPut;
import project.usecase.CreateProjectUseCase;
import project.usecase.DeleteProjectUseCase;
import project.usecase.FindProjectUseCase;
import project.usecase.UpdateProjectUseCase;
import task.input.CreateTaskInput;
import task.input.DeleteTaskInput;
import task.input.FindTaskInput;
import task.input.UpdateTaskInput;
import task.output.TaskOutPut;
import task.usecase.CreateTaskUseCase;
import task.usecase.DeleteTaskUseCase;
import task.usecase.FindTaskUseCase;
import task.usecase.UpdateTaskUseCase;
import user.input.LoginUserInput;
import user.input.RegisterUserInput;
import user.output.UserOutPut;
import user.usecase.LoginUserUseCase;
import user.usecase.RegisterUserUseCase;

import java.time.Clock;

@Configuration
public class UseCaseConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }

    @Bean
    public CreateProjectInput createProject(ProjectOutPut projectOutPut) {
        return new CreateProjectUseCase(projectOutPut);
    }

    @Bean
    public DeleteProjectInput deleteProject(
            ProjectOutPut projectOutPut,
            TaskOutPut taskOutPut
    ) {
        return new DeleteProjectUseCase(projectOutPut, taskOutPut);
    }

    @Bean
    public CreateTaskInput createTask(
            TaskOutPut taskOutPut,
            ProjectOutPut projectOutPut,
            Clock clock
    ) {
        return new CreateTaskUseCase(taskOutPut, projectOutPut, clock);
    }

    @Bean
    public DeleteTaskInput deleteTask(TaskOutPut taskOutPut) {
        return new DeleteTaskUseCase(taskOutPut);
    }

    @Bean
    public UpdateProjectInput updateProject(ProjectOutPut projectOutPut) {
        return new UpdateProjectUseCase(projectOutPut);
    }

    @Bean
    public UpdateTaskInput updateTask(
            TaskOutPut taskOutPut,
            ProjectOutPut projectOutPut,
            Clock clock
    ) {
        return new UpdateTaskUseCase(taskOutPut, projectOutPut, clock);
    }

    @Bean
    public FindTaskInput findTask(
            TaskOutPut taskOutPut,
            ProjectOutPut projectOutPut
    ) {
        return new FindTaskUseCase(taskOutPut, projectOutPut);
    }

    @Bean
    public FindProjectInput findProjects(ProjectOutPut projectOutPut) {
        return new FindProjectUseCase(projectOutPut);
    }

    @Bean
    public RegisterUserInput registerUser(UserOutPut userOutPut) {
        return new RegisterUserUseCase(userOutPut);
    }

    @Bean
    public LoginUserInput loginUser(UserOutPut userOutPut) {
        return new LoginUserUseCase(userOutPut);
    }

    // ==================== CASOS DE USO GESTOR Y CONVERSOR DE ARCHIVOS ====================

    @Bean
    public UploadFileInput uploadFileInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new UploadFileUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public FindFilesInput findFilesInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new FindFilesUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public DeleteFileInput deleteFileInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new DeleteFileUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public ConvertFileInput convertFileInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new ConvertFileUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public CreatePdfFromPhotosInput createPdfFromPhotosInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new CreatePdfFromPhotosUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public MergePdfsInput mergePdfsInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new MergePdfsUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public SplitPdfInput splitPdfInput(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        return new SplitPdfUseCase(fileRepository, fileProcessor);
    }

    @Bean
    public CommandLineRunner seedDefaultAdminUser(UserOutPut userOutPut, RegisterUserInput registerUserInput) {
        return args -> {
            if (!userOutPut.existsByEmail("admin@proyectos.com")) {
                registerUserInput.register(
                        "Administrador General",
                        "admin@proyectos.com",
                        "admin123",
                        "Administrador"
                );
            }
        };
    }
}
