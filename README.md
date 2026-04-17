# 宠物上门喂养 MVP

包含：
- backend：Java 17 + Spring Boot 3 + JPA + MySQL
- frontend：微信小程序原生版

## 1. 初始化数据库
```bash
mysql -uroot -p < backend/src/main/resources/init.sql
```

## 2. 启动后端
先修改 `backend/src/main/resources/application.yml` 的数据库配置，再执行：
```bash
cd backend
mvn spring-boot:run
```


如果报错：java和maven版本不匹配，请执行：
解决办法
方案一：当前终端临时切到 JDK 17

先在 PowerShell 里执行：

$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn -v

如果输出里的 Java version 变成 17，再运行：

cd D:\project_wsl\petcare-mvp\backend
mvn spring-boot:run

## 3. 启动小程序
1. 微信开发者工具导入 `frontend`
2. 修改 `frontend/utils/request.js` 的 `BASE_URL`
3. 编译运行
