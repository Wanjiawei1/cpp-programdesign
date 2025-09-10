package com.sky.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * C端用户登录
 */
@Data
public class UserLoginDTO implements Serializable {

    private String code;
    
    private UserInfo userInfo;
    
    @Data
    public static class UserInfo implements Serializable {
        private String nickName;
        private String avatarUrl;
        private Integer gender;
    }

}
