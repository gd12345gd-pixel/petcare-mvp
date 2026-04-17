package com.example.petcare.controller;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;

/**
 * 本地手动验证 JDBC 连通性（非 Spring Bean，需单独运行 main）。
 */
public class DbConnectTest {

    public static void main(String[] args) {
        String url =
            "jdbc:mysql://8.146.237.74:3306/petcare_mvp?useUnicode=true&characterEncoding=UTF-8"
                + "&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
                + "&connectTimeout=5000&socketTimeout=60000";
        String username = "petcare";
        String password = "960925jing";

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(url, username, password);
            System.out.println("连接成功");

            DatabaseMetaData metaData = conn.getMetaData();
            System.out.println("DB URL: " + metaData.getURL());
            System.out.println("DB User: " + metaData.getUserName());
            System.out.println("DB Product: " + metaData.getDatabaseProductName());
            System.out.println("DB Version: " + metaData.getDatabaseProductVersion());

            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
