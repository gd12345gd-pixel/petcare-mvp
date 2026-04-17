package com.example.petcare.controller;

import com.example.petcare.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.access-url-prefix}")
    private String accessUrlPrefix;

    @PostMapping("/upload-image")
    public Result<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return Result.fail("上传文件不能为空");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Result.fail("仅支持图片上传");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        if (extension.isEmpty()) {
            extension = ".jpg";
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        File dir = new File(uploadDir, datePath);
        if (!dir.exists() && !dir.mkdirs()) {
            return Result.fail("创建上传目录失败");
        }

        String fileName = generateFileName(extension);
        File dest = new File(dir, fileName);

        try {
            file.transferTo(dest);
        } catch (IOException e) {
            return Result.fail("文件保存失败：" + e.getMessage());
        }

        String relativePath = datePath + "/" + fileName;
        String fileUrl = accessUrlPrefix + "/" + relativePath;

        Map<String, Object> data = new HashMap<>();
        data.put("fileName", fileName);
        data.put("url", fileUrl);
        data.put("relativePath", relativePath);
        data.put("size", file.getSize());

        return Result.success(data);
    }

    private String generateFileName(String extension) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return time + "_" + uuid + extension;
    }

    private String getExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }

    @PostMapping("/upload-video")
    public Result<Map<String, Object>> uploadVideo(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return Result.fail("上传文件不能为空");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return Result.fail("仅支持视频上传");
        }

        // 简单限制 50MB，避免本地开发时过大文件把服务打挂
        long maxSize = 50L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            return Result.fail("视频不能超过50MB");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        if (extension.isEmpty()) {
            extension = ".mp4";
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        File dir = new File(uploadDir, datePath);
        if (!dir.exists() && !dir.mkdirs()) {
            return Result.fail("创建上传目录失败");
        }

        String fileName = generateFileName(extension);
        File dest = new File(dir, fileName);

        try {
            file.transferTo(dest);
        } catch (IOException e) {
            return Result.fail("文件保存失败：" + e.getMessage());
        }

        String relativePath = datePath + "/" + fileName;
        String fileUrl = accessUrlPrefix + "/" + relativePath;

        Map<String, Object> data = new HashMap<>();
        data.put("fileName", fileName);
        data.put("url", fileUrl);
        data.put("relativePath", relativePath);
        data.put("size", file.getSize());

        return Result.success(data);
    }
}